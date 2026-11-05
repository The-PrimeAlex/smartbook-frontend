import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles =
    (route.data['roles'] as string[] | undefined) ?? [];

  // If the session was expired by auto-logout, redirect to login immediately
  // Do NOT clear the flag so repeated back-button presses are always caught
  if (
    sessionStorage.getItem('smartbook-session-expired') ===
    'true'
  ) {
    return router.createUrlTree(['/login']);
  }

  const sessionCheck$ = authService.getAccessToken()
    ? of(true)
    : authService.restoreSession();

  return sessionCheck$.pipe(
    map((authenticated) => {
      if (!authenticated) {
        // Use replaceUrl: true so the current page is replaced with login in history.
        // This prevents the back button from bouncing between login and the protected page.
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
          queryParamsHandling: 'merge',
        });
      }

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
