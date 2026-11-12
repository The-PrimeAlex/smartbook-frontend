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
import { environment } from '../../../environments/environment';

const LS_ACCESS_TOKEN = 'smartbook_access_token';
const LS_USER = 'smartbook_user';

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

  /** CSRF token stored in memory for cross-origin requests. */
  private csrfToken = signal<string | null>(null);

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
          `${environment.apiUrl}/auth/login`,
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

  /** Main entry guard method checking localStorage first */
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
    // Restore from localStorage first (survives page refresh)
    if (this.restoreFromLocalStorage()) {
      // After restoring from localStorage, fetch a fresh CSRF token for cross-origin requests
      // The in-memory CSRF token is lost on page refresh, so we need to get a new one
      return this.ensureCsrfToken().pipe(
        map(() => true),
        catchError(() => {
          // If CSRF fetch fails, the session might still be valid for GET requests
          // but POST requests will fail - clear the session to force re-login
          this.clearLocalAuth();
          return of(false);
        }),
      );
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
            `${environment.apiUrl}/auth/refresh`,
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
        `${environment.apiUrl}/auth/logout`,
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
          `${environment.apiUrl}/auth/change-password`,
          request,
          this.httpOptions,
        ),
      ),
    );
  }

  clearLocalAuth(): void {
    this.accessTokenState.set(null);
    this.currentUserState.set(null);
    this.csrfToken.set(null);
    localStorage.removeItem(LS_ACCESS_TOKEN);
    localStorage.removeItem(LS_USER);
  }

  /**
   * Returns the stored CSRF token for cross-origin requests.
   */
  getCsrfToken(): string | null {
    return this.csrfToken();
  }

  /**
   * Fetches and stores the CSRF token.
   * For same-origin (local dev), the cookie is available in document.cookie.
   * For cross-origin (production), the token is stored in memory.
   */
  public ensureCsrfToken(): Observable<void> {
    // For same-origin, check if cookie already exists
    if (!environment.production) {
      const hasCsrfCookie = document.cookie
        .split(';')
        .some((cookie) =>
          cookie.trim().startsWith('XSRF-TOKEN='),
        );
      if (hasCsrfCookie) {
        return of(void 0);
      }
    }

    // For cross-origin, check if we already have a stored token
    if (environment.production && this.csrfToken() !== null) {
      return of(void 0);
    }

    return this.http
      .get<{ token: string }>(`${environment.apiUrl}/auth/csrf`, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          // Store the token in memory for cross-origin use
          this.csrfToken.set(response.token);
        }),
        map(() => void 0),
      );
  }

  private applyAuthResponse(response: AuthResponse): void {
    this.accessTokenState.set(response.accessToken);
    this.currentUserState.set(response.user);
    // Persist to localStorage so page refresh restores the session
    localStorage.setItem(LS_ACCESS_TOKEN, response.accessToken);
    localStorage.setItem(LS_USER, JSON.stringify(response.user));
  }

  /** Restore session from localStorage on page load */
  private restoreFromLocalStorage(): boolean {
    const token = localStorage.getItem(LS_ACCESS_TOKEN);
    const userJson = localStorage.getItem(LS_USER);
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as CurrentUser;
        this.accessTokenState.set(token);
        this.currentUserState.set(user);
        return true;
      } catch {
        this.clearLocalAuth();
      }
    }
    return false;
  }
}
