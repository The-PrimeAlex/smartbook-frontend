import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Guard to prevent infinite redirect loops when the user must change their password.
 * Once we've redirected, suppress further password_change_required interceptions.
 */
let passwordChangeRedirected = false;

const API_PREFIX = environment.apiUrl.replace(/\/api\/v1$/, '');

const AUTH_ENDPOINTS = [
  `${environment.apiUrl}/auth/login`,
  `${environment.apiUrl}/auth/refresh`,
  `${environment.apiUrl}/auth/logout`,
  `${environment.apiUrl}/auth/csrf`,
  `${environment.apiUrl}/auth/change-password`,
];

const MUTATING_METHODS = new Set([
  'post',
  'put',
  'patch',
  'delete',
]);

/**
 * Read the CSRF token value.
 * For cross-origin requests (production), reads from AuthService memory store.
 * For same-origin requests (local dev), reads from document.cookie.
 */
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

export const authInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Only intercept requests using the API route.
  if (!request.url.startsWith(API_PREFIX)) {
    return next(request);
  }

  const isAuthEndpoint = AUTH_ENDPOINTS.some(
    (path) =>
      request.url === path ||
      request.url.startsWith(`${path}?`),
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

      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !token ||
        isAuthEndpoint
      ) {
        return throwError(() => error);
      }

      // Refresh once, then retry the original request.
      return authService.refreshAccessToken().pipe(
        // Handle refresh failures separately from retry failures.
        catchError((refreshError: unknown) => {
          if (
            refreshError instanceof HttpErrorResponse &&
            refreshError.status === 401
          ) {
            authService.clearLocalAuth();
            // Reset the password change flag so it can intercept again after re-login
            passwordChangeRedirected = false;
          }

          // If refresh returns 403 password_change_required, redirect to change password
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
        }),

        switchMap(() => {
          const refreshedToken =
            authService.getAccessToken();

          if (!refreshedToken) {
            return throwError(() => error);
          }

          const retryHeaders: Record<string, string> = {
            Authorization: `Bearer ${refreshedToken}`,
          };

          // Include CSRF token on mutating requests, just like the original request.
          if (
            MUTATING_METHODS.has(
              request.method.toLowerCase(),
            )
          ) {
            const csrfToken = readCsrfToken(authService);
            if (csrfToken) {
              retryHeaders['X-XSRF-TOKEN'] = csrfToken;
            }
          }

          const retryRequest = request.clone({
            withCredentials: true,
            setHeaders: retryHeaders,
          });

          return next(retryRequest);
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
