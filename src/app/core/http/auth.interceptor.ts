import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  delay,
  finalize,
  switchMap,
  throwError,
} from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Guard to prevent infinite redirect loops when the user must change their password.
 * Once we've redirected, suppress further password_change_required interceptions.
 */
let passwordChangeRedirected = false;

/**
 * Timestamp of the last successful login.
 * Used to create a grace period after login where transient 401 errors on /me
 * are ignored — the Neon database may still be waking up from auto-pause,
 * causing the first /me request to fail even though the login succeeded.
 */
let lastLoginTimestamp = 0;
const LOGIN_GRACE_PERIOD_MS = 10_000; // 10 seconds

const ME_ENDPOINT = '/api/v1/auth/me';

/**
 * API prefix for matching intercepted requests.
 * In production, requests use relative paths (/api/v1) proxied by Cloudflare Pages,
 * so we always check for the relative /api prefix regardless of the environment.apiUrl value.
 */
const API_PREFIX = '/api';

/**
 * Auth endpoint paths for checking if a request should skip the auth token.
 * Uses relative paths since all services use relative paths in production.
 * AuthService uses environment.apiUrl (full Azure URL), so we also check
 * against the full URL patterns in isAuthEndpoint.
 */
const AUTH_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/csrf',
  '/api/v1/auth/change-password',
];

const MUTATING_METHODS = new Set([
  'post',
  'put',
  'patch',
  'delete',
]);

/**
 * Guard to prevent multiple concurrent refresh+retry cycles.
 * When one request triggers a token refresh, all other pending 401s
 * must wait for that refresh to complete instead of each triggering
 * their own refresh attempt — this prevents infinite retry loops.
 */
let refreshInProgress = false;

/**
 * Safety timeout (in ms) to reset refreshInProgress if the retry
 * pipeline hangs without completing. This prevents the flag from
 * staying true forever and blocking all subsequent 401 handling.
 */
const REFRESH_TIMEOUT_MS = 15_000;
let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Read the CSRF token value.
 * For cross-origin requests (production), reads from AuthService memory store.
 * For same-origin requests (local dev), reads from document.cookie.
 */
function readCsrfToken(
  authService: AuthService,
): string | null {
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
    const [name, ...rest] = cookie
      .trim()
      .split('=');
    if (name === 'XSRF-TOKEN') {
      return rest.join('=');
    }
  }
  return null;
}

export const authInterceptor: HttpInterceptorFn =
  (request, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Only intercept requests using the API route.
    // Requests may use relative paths (/api/v1) via Cloudflare Pages proxy,
    // or full Azure URLs (https://smartbook-api-.../api/v1) from AuthService.
    if (!request.url.includes('/api/v1')) {
      return next(request);
    }

    const isAuthEndpoint = AUTH_ENDPOINTS.some(
      (path) =>
        request.url === path ||
        request.url.startsWith(`${path}?`),
    ) || (
      // AuthService uses full Azure URLs for auth endpoints in production.
      // Check if the request URL ends with an auth endpoint path.
      AUTH_ENDPOINTS.some((path) =>
        request.url.endsWith(path) ||
        request.url.startsWith(`${path}?`),
      )
    );

    const headers: Record<string, string> = {};

    // Attach the in-memory access token to protected API requests.
    const token = authService.getAccessToken();
    if (token && !isAuthEndpoint) {
      headers['Authorization'] =
        `Bearer ${token}`;
    }

    // Attach the CSRF token header on mutating requests so the backend
    // Spring Security CSRF filter accepts the request.
    if (
      MUTATING_METHODS.has(
        request.method.toLowerCase(),
      )
    ) {
      const csrfToken =
        readCsrfToken(authService);
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
        refreshError instanceof
          HttpErrorResponse &&
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
        refreshError instanceof
          HttpErrorResponse &&
        refreshError.status === 403 &&
        !passwordChangeRedirected
      ) {
        const body = refreshError.error;
        const isPasswordChangeRequired =
          (typeof body === 'string' &&
            body.includes(
              'password_change_required',
            )) ||
          (typeof body === 'object' &&
            body !== null &&
            ((
              body as Record<string, string>
            )['code'] ===
              'password_change_required' ||
              (
                body as Record<string, string>
              )['error'] ===
                'password_change_required'));

        if (isPasswordChangeRequired) {
          passwordChangeRedirected = true;
          authService.clearLocalAuth();
          setTimeout(() => {
            void router.navigate(
              ['/change-password'],
              {
                replaceUrl: true,
              },
            );
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
              body.includes(
                'password_change_required',
              )) ||
            (typeof body === 'object' &&
              body !== null &&
              (body as Record<string, string>)[
                'error'
              ] === 'password_change_required');

          if (isPasswordChangeRequired) {
            passwordChangeRedirected = true;
            authService.clearLocalAuth();
            // Use setTimeout to avoid "expression changed" errors during change detection
            setTimeout(() => {
              void router.navigate(
                ['/change-password'],
                {
                  replaceUrl: true,
                },
              );
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
        return authService
          .refreshAccessToken()
          .pipe(
            catchError((refreshError: unknown) => {
              // First refresh failed — retry once after a delay for Neon wake-up.
              return authService
                .refreshAccessToken()
                .pipe(
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
              const refreshedToken =
                authService.getAccessToken();

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
              if (
                MUTATING_METHODS.has(
                  request.method.toLowerCase(),
                )
              ) {
                const csrfToken =
                  readCsrfToken(authService);
                if (csrfToken) {
                  retryHeaders['X-XSRF-TOKEN'] =
                    csrfToken;
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
                    retryError instanceof
                      HttpErrorResponse &&
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

/**
 * Reset the password change redirect guard.
 * Call this after a successful login or password change so the interceptor
 * can catch password_change_required again on a future session if needed.
 */
export function resetPasswordChangeRedirected(): void {
  passwordChangeRedirected = false;
}

/**
 * Call this after a successful login to start the grace period.
 * During the grace period, 401 errors on /me are ignored to prevent
 * immediate logout when the Neon database is waking up from auto-pause.
 */
export function setLastLoginTimestamp(): void {
  lastLoginTimestamp = Date.now();
}
