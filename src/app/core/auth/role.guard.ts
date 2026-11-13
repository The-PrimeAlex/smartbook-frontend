import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';
import { map, of } from 'rxjs';

import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (
  route,
  state,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as
    string[] | undefined;

  if (!requiredRoles?.length) {
    return of(true);
  }

  // If session was expired by auto-logout, redirect immediately
  if (
    sessionStorage.getItem('smartbook-session-expired') === 'true'
  ) {
    return of(router.createUrlTree(['/login']));
  }

  // If we have a token in memory, just check roles
  if (authService.getAccessToken()) {
    const hasRequiredRole = requiredRoles.some(
      (role) => authService.hasRole(role),
    );
    return of(
      hasRequiredRole
        ? true
        : router.createUrlTree(['/forbidden']),
    );
  }

  // No token in memory — try to restore from localStorage
  return authService.restoreSession().pipe(
    map((authenticated) => {
      if (!authenticated) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        });
      }

      const hasRequiredRole = requiredRoles.some(
        (role) => authService.hasRole(role),
      );

      return hasRequiredRole
        ? true
        : router.createUrlTree(['/forbidden']);
    }),
  );
};
