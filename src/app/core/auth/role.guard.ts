import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as
    string[] | undefined;

  if (!requiredRoles?.length) {
    return of(true);
  }

  const sessionCheck$ = authService.getAccessToken()
    ? of(true)
    : authService.restoreSession();

  return sessionCheck$.pipe(
    map((authenticated) => {
      if (!authenticated) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        });
      }

      const hasRequiredRole = requiredRoles.some((role) =>
        authService.hasRole(role),
      );

      return hasRequiredRole
        ? true
        : router.createUrlTree(['/forbidden']);
    }),
  );
};
