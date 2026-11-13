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
import { environment } from '../../../environments/environment';

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

const ME_ENDPOINT = `${environment.apiUrl}/auth/me`;

const API_PREFIX = environment.apiUrl.replace(
  /\/api\/v1$/,
  '',
);

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
 * Custom header used to mark requests that have already been retried
 * after a token refresh. If a retried request still returns 401, the
 * interceptor will not attempt another refresh+retry cycle — this prevents
 * infinite loops when the backend consistently rejects the token.
 */
const RETRY_HEADER = 'X-SmartBook-Retried';

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
          request.url.startsWith(ME_ENDPOINT + '?');

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

        // If this request was already retried after a token refresh, do not retry again.
        // This prevents infinite loops when the backend consistently rejects the token.
        const alreadyRetried = request.headers.has(RETRY_HEADER);

        if (
          !(error instanceof HttpErrorResponse) ||
          error.status !== 401 ||
          !token ||
          isAuthEndpoint ||
          alreadyRetried
        ) {
          return throwError(() => error);
        }

        // Refresh once, then retry the original request.
        // If the refresh fails (e.g., Neon database sleeping), retry once after a short delay
        // to give the database time to wake up before logging out the user.
        return authService
          .refreshAccessToken()
          .pipe(
            catchError(
              (refreshError: unknown) => {
                // First refresh failed — retry once after a delay to allow the Neon database
                // to wake up from auto-pause. This prevents users from being logged out
                // when the database is temporarily sleeping.
                return authService
                  .refreshAccessToken()
                  .pipe(
                    delay(3000),
                    catchError((retryError: unknown) => {
                      // Second refresh also failed — handle the error normally
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

                      if (
                        retryError instanceof
                          HttpErrorResponse &&
                        retryError.status === 403 &&
                        !passwordChangeRedirected
                      ) {
                        const body = retryError.error;
                        const isPasswordChangeRequired =
                          (typeof body === 'string' &&
                            body.includes(
                              'password_change_required',
                            )) ||
                          (typeof body === 'object' &&
                            body !== null &&
                            ((
                              body as Record<
                                string,
                                string
                              >
                            )['code'] ===
                              'password_change_required' ||
                              (
                                body as Record<
                                  string,
                                  string
                                >
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

                      return throwError(
                        () => retryError,
                      );
                    }),
                  );
              },
            ),

            switchMap(() => {
              const refreshedToken =
                authService.getAccessToken();

              if (!refreshedToken) {
                return throwError(() => error);
              }

              const retryHeaders: Record<
                string,
                string
              > = {
                Authorization: `Bearer ${refreshedToken}`,
                [RETRY_HEADER]: 'true',
              };

              // Include CSRF token on mutating requests, just like the original request.
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

/**
 * Call this after a successful login to start the grace period.
 * During the grace period, 401 errors on /me are ignored to prevent
 * immediate logout when the Neon database is waking up from auto-pause.
 */
export function setLastLoginTimestamp(): void {
  lastLoginTimestamp = Date.now();
}
