import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, delay, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

// Prevents infinite redirect loops when password change is required
let passwordChangeRedirected = false;

// Grace period after login: ignore /me 401s while Neon DB wakes up
let lastLoginTimestamp = 0;
const LOGIN_GRACE_PERIOD_MS = 10_000;

const ME_ENDPOINT = '/api/v1/auth/me';

// Relative /api prefix matches both proxied and direct requests
const API_PREFIX = '/api';

// Auth endpoints skip the Bearer token; AuthService uses full URLs in prod
const AUTH_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/csrf',
];

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// Prevents multiple concurrent refresh+retry cycles
let refreshInProgress = false;

// Safety timeout resets refreshInProgress if the retry pipeline hangs
const REFRESH_TIMEOUT_MS = 15_000;
let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Cross-origin: read from memory store. Same-origin: read from cookie.
function readCsrfToken(authService: AuthService): string | null {
  // Try memory store first (works for cross-origin)
  const storedToken = authService.getCsrfToken();
  if (storedToken) {
    return storedToken;
  }
  // Fallback to cookie (works for same-origin local dev)
  if (typeof document === 'undefined') {
    return null;
  }
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return rest.join('=');
    }
  }
  return null;
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Only intercept requests using the API route.
  // Requests may use relative paths (/api/v1) via Cloudflare Pages proxy,
  // or full Azure URLs (https://smartbook-api-.../api/v1) from AuthService.
  if (!request.url.includes('/api/v1')) {
    return next(request);
  }

  const isAuthEndpoint =
    AUTH_ENDPOINTS.some(
      (path) => request.url === path || request.url.startsWith(`${path}?`),
    ) ||
    // AuthService uses full Azure URLs for auth endpoints in production.
    // Check if the request URL ends with an auth endpoint path.
    AUTH_ENDPOINTS.some(
      (path) =>
        request.url.endsWith(path) || request.url.startsWith(`${path}?`),
    );

  const headers: Record<string, string> = {};

  // Attach the in-memory access token to protected API requests.
  const token = authService.getAccessToken();
  if (token && !isAuthEndpoint) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach the CSRF token header on mutating requests so the backend
  // Spring Security CSRF filter accepts the request.
  if (MUTATING_METHODS.has(request.method.toLowerCase())) {
    const csrfToken = readCsrfToken(authService);
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  const authenticatedRequest = request.clone({
    withCredentials: true,
    setHeaders: headers,
  });

  function handleRefreshFailure(
    refreshError: unknown,
  ): ReturnType<typeof throwError> {
    if (
      refreshError instanceof HttpErrorResponse &&
      refreshError.status === 401
    ) {
      authService.clearLocalAuth();
      passwordChangeRedirected = false;
      setTimeout(() => {
        void router.navigate(['/login'], {
          replaceUrl: true,
        });
      });
    }

    if (
      refreshError instanceof HttpErrorResponse &&
      refreshError.status === 403 &&
      !passwordChangeRedirected
    ) {
      const body = refreshError.error;
      const isPasswordChangeRequired =
        (typeof body === 'string' &&
          body.includes('password_change_required')) ||
        (typeof body === 'object' &&
          body !== null &&
          ((body as Record<string, string>)['code'] ===
            'password_change_required' ||
            (body as Record<string, string>)['error'] ===
              'password_change_required'));

      if (isPasswordChangeRequired) {
        passwordChangeRedirected = true;
        authService.clearLocalAuth();
        setTimeout(() => {
          void router.navigate(['/change-password'], {
            replaceUrl: true,
          });
        });
      }
    }

    return throwError(() => refreshError);
  }

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      // Handle 403 password_change_required — redirect user to change password
      if (
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        !passwordChangeRedirected &&
        !isAuthEndpoint
      ) {
        const body = error.error;
        const isPasswordChangeRequired =
          (typeof body === 'string' &&
            body.includes('password_change_required')) ||
          (typeof body === 'object' &&
            body !== null &&
            (body as Record<string, string>)['error'] ===
              'password_change_required');

        if (isPasswordChangeRequired) {
          passwordChangeRedirected = true;
          authService.clearLocalAuth();
          // Use setTimeout to avoid "expression changed" errors during change detection
          setTimeout(() => {
            void router.navigate(['/change-password'], {
              replaceUrl: true,
            });
          });
          return throwError(() => error);
        }

        // Handle other 403 errors (CSRF, access denied) - log for debugging
        console.warn(
          '403 Forbidden on',
          request.method,
          request.url,
          'body:',
          body,
        );
      }

      // During the grace period after login, ignore 401 on /me — the Neon database
      // may still be waking up from auto-pause. The login just succeeded, so the token
      // is valid; the /me endpoint simply couldn't reach the database yet.
      const now = Date.now();
      const withinGracePeriod =
        now - lastLoginTimestamp < LOGIN_GRACE_PERIOD_MS;
      const isMeEndpoint =
        request.url === ME_ENDPOINT ||
        request.url.startsWith(ME_ENDPOINT + '?') ||
        request.url.endsWith('/auth/me') ||
        request.url.endsWith('/auth/me?');

      if (
        withinGracePeriod &&
        isMeEndpoint &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        // Silently fail — the component will retry or the user can refresh.
        // Do NOT trigger the refresh+logout cascade.
        return throwError(() => error);
      }

      // Only handle 401 on protected endpoints with a valid token.
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !token ||
        isAuthEndpoint
      ) {
        return throwError(() => error);
      }

      // If a refresh+retry is already in progress, do not start another one.
      // Multiple requests may fail with 401 at the same time (e.g., schedule
      // requests for all rooms), but only one token refresh is needed.
      // Subsequent requests will use the refreshed token automatically.
      if (refreshInProgress) {
        return throwError(() => error);
      }

      // Mark that a refresh is in progress so other pending 401s skip the retry.
      refreshInProgress = true;

      // Set a safety timeout to reset the flag if the retry pipeline hangs.
      // This prevents the flag from staying true forever and blocking all
      // subsequent requests when the backend is unresponsive.
      if (refreshTimeoutId !== null) {
        clearTimeout(refreshTimeoutId);
      }
      refreshTimeoutId = setTimeout(() => {
        refreshInProgress = false;
        refreshTimeoutId = null;
      }, REFRESH_TIMEOUT_MS);

      // Refresh the token, then retry the original request.
      // If the refresh fails (e.g., Neon database sleeping), retry once after
      // a short delay to give the database time to wake up.
      return authService.refreshAccessToken().pipe(
        catchError((refreshError: unknown) => {
          // First refresh failed — retry once after a delay for Neon wake-up.
          return authService.refreshAccessToken().pipe(
            delay(3000),
            catchError((retryError: unknown) => {
              // Reset the flag so future 401s can trigger a new refresh.
              refreshInProgress = false;
              if (refreshTimeoutId !== null) {
                clearTimeout(refreshTimeoutId);
                refreshTimeoutId = null;
              }
              return handleRefreshFailure(retryError);
            }),
          );
        }),
        switchMap(() => {
          const refreshedToken = authService.getAccessToken();

          if (!refreshedToken) {
            refreshInProgress = false;
            if (refreshTimeoutId !== null) {
              clearTimeout(refreshTimeoutId);
              refreshTimeoutId = null;
            }
            return throwError(() => error);
          }

          const retryHeaders: Record<string, string> = {
            Authorization: `Bearer ${refreshedToken}`,
          };

          // Include CSRF token on mutating requests.
          if (MUTATING_METHODS.has(request.method.toLowerCase())) {
            const csrfToken = readCsrfToken(authService);
            if (csrfToken) {
              retryHeaders['X-XSRF-TOKEN'] = csrfToken;
            }
          }

          const retryRequest = request.clone({
            withCredentials: true,
            setHeaders: retryHeaders,
          });

          return next(retryRequest).pipe(
            finalize(() => {
              // Reset the flag after the retry completes (success or failure).
              refreshInProgress = false;
              if (refreshTimeoutId !== null) {
                clearTimeout(refreshTimeoutId);
                refreshTimeoutId = null;
              }
            }),
            catchError((retryError: unknown) => {
              // Reset the flag if the retry itself fails.
              refreshInProgress = false;
              if (refreshTimeoutId !== null) {
                clearTimeout(refreshTimeoutId);
                refreshTimeoutId = null;
              }
              // If the retry still gets 401, the token is truly invalid — log out.
              if (
                retryError instanceof HttpErrorResponse &&
                retryError.status === 401
              ) {
                authService.clearLocalAuth();
                passwordChangeRedirected = false;
                setTimeout(() => {
                  void router.navigate(['/login'], {
                    replaceUrl: true,
                  });
                });
              }
              return throwError(() => retryError);
            }),
          );
        }),
      );
    }),
  );
};

// Reset password change redirect guard after successful login
export function resetPasswordChangeRedirected(): void {
  passwordChangeRedirected = false;
}

// Set login timestamp to start the grace period for /me 401s
export function setLastLoginTimestamp(): void {
  lastLoginTimestamp = Date.now();
}
