import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';

import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  ChangePasswordRequest,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly accessTokenState = signal<string | null>(
    null,
  );
  private readonly currentUserState =
    signal<CurrentUser | null>(null);
  private refreshInFlight$: Observable<AuthResponse> | null =
    null;

  // Visual & Reactive Anchors
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(
    () => this.accessTokenState() !== null,
  );

  readonly accessToken$ = toObservable(
    this.accessTokenState,
  );

  private readonly httpOptions = { withCredentials: true };


  getAccessToken(): string | null {
    return this.accessTokenState();
  }

  hasRole(role: string): boolean {
    return (
      this.currentUserState()?.roles.includes(role) ?? false
    );
  }

  /** Ensures the backend drops the CSRF cookie *before* transmitting the credentials */
  login(
    credentials: LoginRequest,
  ): Observable<CurrentUser> {
    return this.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.post<AuthResponse>(
          '/api/v1/auth/login',
          {
            email: credentials.email,
            password: credentials.password,
          },
          this.httpOptions,
        ),
      ),
      tap((response) => {
        this.applyAuthResponse(response);
        // Clear any auto-logout session-expired flag on successful login
        sessionStorage.removeItem(
          'smartbook-session-expired',
        );
      }),
      map((response) => response.user),
      catchError((error) => {
        this.clearLocalAuth();
        return throwError(() => error);
      }),
    );
  }

  /** Main entry guard method checking local cache first */
  restoreSession(): Observable<boolean> {
    // If the session was expired by auto-logout, don't restore
    if (
      sessionStorage.getItem(
        'smartbook-session-expired',
      ) === 'true'
    ) {
      this.clearLocalAuth();
      return of(false);
    }
    if (this.isAuthenticated()) return of(true);

    return this.refreshAccessToken().pipe(
      map(() => true),
      catchError(() => {
        this.clearLocalAuth();
        return of(false);
      }),
    );
  }

  /** Single execution token synchronization path */

  refreshAccessToken(): Observable<AuthResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.ensureCsrfToken().pipe(
        switchMap(() =>
          this.http.post<AuthResponse>(
            '/api/v1/auth/refresh',
            {},
            this.httpOptions,
          ),
        ),
        tap((response) => this.applyAuthResponse(response)),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.refreshInFlight$;
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(
        '/api/v1/auth/logout',
        {},
        this.httpOptions,
      )
      .pipe(
        catchError((error) => throwError(() => error)),
        finalize(() => this.clearLocalAuth()),
      );
  }

  changePassword(
    request: ChangePasswordRequest,
  ): Observable<void> {
    return this.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.post<void>(
          '/api/v1/auth/change-password',
          request,
          this.httpOptions,
        ),
      ),
    );
  }

  clearLocalAuth(): void {
    this.accessTokenState.set(null);
    this.currentUserState.set(null);
  }

  /**
   * Optimized CSRF checker. Only hits the network if the browser
   * does not already possess the XSRF token cookie.
   */

  public ensureCsrfToken(): Observable<void> {
    const hasCsrfCookie = document.cookie
      .split(';')
      .some((cookie) =>
        cookie.trim().startsWith('XSRF-TOKEN='),
      );

    if (hasCsrfCookie) {
      return of(void 0);
    }

    return this.http
      .get('/api/v1/auth/csrf', {
        responseType: 'text',
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  private applyAuthResponse(response: AuthResponse): void {
    this.accessTokenState.set(response.accessToken);
    this.currentUserState.set(response.user);
  }

}
