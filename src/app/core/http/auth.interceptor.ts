import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const AUTH_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/csrf',
];

const MUTATING_METHODS = new Set([
  'post',
  'put',
  'patch',
  'delete',
]);

/**
 * Read the XSRF-TOKEN cookie value from the browser.
 */
function readCsrfCookie(): string | null {
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

  // Only intercept requests using the relative API route.
  if (!request.url.startsWith('/api/')) {
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
    const csrfToken = readCsrfCookie();
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
            const csrfToken = readCsrfCookie();
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
