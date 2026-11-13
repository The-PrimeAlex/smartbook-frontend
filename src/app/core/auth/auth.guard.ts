import {
  CanActivateFn,
  CanMatchFn,
  Route,
  Router,
} from '@angular/router';
import { inject } from '@angular/core';
import { map, of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Restores the session from localStorage synchronously before any guard
 * checks the in-memory token. On page refresh, Angular recreates the
 * AuthService with null signals, so we must repopulate them from localStorage
 * before the CanMatch guard runs — otherwise the guard sees no token and
 * redirects to /login before restoreSession() ever gets a chance.
 */
let sessionRestoredFromLocalStorage = false;
export function restoreSessionOnce(authService: AuthService): void {
  if (sessionRestoredFromLocalStorage) return;
  sessionRestoredFromLocalStorage = true;

  // If the session was expired by auto-logout, clear everything
  if (sessionStorage.getItem('smartbook-session-expired') === 'true') {
    authService.clearLocalAuth();
    return;
  }

  const token = localStorage.getItem('smartbook_access_token');
  const userJson = localStorage.getItem('smartbook_user');
  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      authService.applyAuthResponse({
        accessToken: token,
        tokenType: 'Bearer',
        expiresAt: '',
        user,
      });
    } catch {
      authService.clearLocalAuth();
    }
  }
}

/**
 * Shared logic for checking authentication and roles.
 * Used by both authGuard (CanActivate) and authMatchGuard (CanMatch).
 */
function checkAuth(authService: AuthService, router: Router, route: Route, stateUrl: string): boolean | import('@angular/router').UrlTree {
  // If the session was expired by auto-logout, redirect to login immediately
  if (
    sessionStorage.getItem(
      'smartbook-session-expired',
    ) === 'true'
  ) {
    return router.createUrlTree(['/login']);
  }

  const requiredRoles =
    (route.data?.['roles'] as string[] | undefined) ?? [];

  // Check if we have a valid access token in memory
  if (!authService.getAccessToken()) {
    // No token in memory — user is not authenticated
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: stateUrl },
      queryParamsHandling: 'merge',
    });
  }

  // Check roles if required
  if (
    requiredRoles.length &&
    !requiredRoles.some((role) =>
      authService.hasRole(role),
    )
  ) {
    return router.createUrlTree(['/forbidden']);
  }

  return true;
}

/**
 * CanMatch guard — runs BEFORE CanActivate and before lazy-loading child routes.
 * Prevents unauthenticated users from even starting to load protected route trees.
 * This eliminates the flash of loading content before redirect.
 */
export const authMatchGuard: CanMatchFn = (
  route,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Restore session from localStorage before checking the token.
  // On page refresh, Angular recreates AuthService with null signals,
  // so we must repopulate them before the guard checks for a token.
  restoreSessionOnce(authService);

  const result = checkAuth(authService, router, route, router.url);
  return result === true ? of(true) : of(result);
};

/**
 * CanActivate guard — runs after CanMatch, validates the full session.
 * Restores session from localStorage if needed, then checks auth and roles.
 */
export const authGuard: CanActivateFn = (
  route,
  state,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Restore session from localStorage before checking the token.
  restoreSessionOnce(authService);

  // If the session was expired by auto-logout, redirect to login immediately
  if (
    sessionStorage.getItem(
      'smartbook-session-expired',
    ) === 'true'
  ) {
    return of(router.createUrlTree(['/login']));
  }

  // If we already have a token in memory (from CanMatch or previous navigation),
  // just check roles and return quickly
  if (authService.getAccessToken()) {
    const requiredRoles =
      (route.data?.['roles'] as string[] | undefined) ?? [];

    if (
      requiredRoles.length &&
      !requiredRoles.some((role) =>
        authService.hasRole(role),
      )
    ) {
      return of(router.createUrlTree(['/forbidden']));
    }
    return of(true);
  }

  // No token in memory — try to restore from localStorage or refresh
  return authService.restoreSession().pipe(
    map((authenticated) => {
      if (!authenticated) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
          queryParamsHandling: 'merge',
        });
      }

      const requiredRoles =
        (route.data?.['roles'] as string[] | undefined) ?? [];

      if (
        requiredRoles.length &&
        !requiredRoles.some((role) =>
          authService.hasRole(role),
        )
      ) {
        return router.createUrlTree(['/forbidden']);
      }

      return true;
    }),
  );
};
