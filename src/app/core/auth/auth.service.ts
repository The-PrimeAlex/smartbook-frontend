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
import { resetPasswordChangeRedirected } from '../http/auth.interceptor';

const LS_ACCESS_TOKEN = 'smartbook_access_token';
const LS_USER = 'smartbook_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly accessTokenState = signal<
    string | null
  >(null);
  private readonly currentUserState =
    signal<CurrentUser | null>(null);
  private refreshInFlight$: Observable<AuthResponse> | null =
    null;

  // CSRF token in memory for cross-origin requests
  private csrfToken = signal<string | null>(null);

  // Visual & Reactive Anchors
  readonly currentUser =
    this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(
    () => this.accessTokenState() !== null,
  );

  readonly accessToken$ = toObservable(
    this.accessTokenState,
  );

  private readonly httpOptions = {
    withCredentials: true,
  };

  getAccessToken(): string | null {
    return this.accessTokenState();
  }

  hasRole(role: string): boolean {
    return (
      this.currentUserState()?.roles.includes(
        role,
      ) ?? false
    );
  }

  // Fetches CSRF cookie before sending credentials
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
        // Reset the password change redirect guard so the interceptor
        // can catch password_change_required again if needed
        resetPasswordChangeRedirected();
      }),
      map((response) => response.user),
      catchError((error) => {
        this.clearLocalAuth();
        return throwError(() => error);
      }),
    );
  }

  // Restores session from localStorage; fetches CSRF lazily in prod
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
      // CSRF fetch failure doesn't clear the session — user has a valid token.
      // Mutating requests will fetch CSRF lazily via ensureCsrfToken().
      if (environment.production) {
        this.ensureCsrfToken().subscribe({
          error: () => {
            // CSRF fetch failed — session still valid for GET requests
          },
        });
      }
      return of(true);
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

  // shareReplay ensures only one refresh request runs at a time
  refreshAccessToken(): Observable<AuthResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ =
        this.ensureCsrfToken().pipe(
          switchMap(() =>
            this.http.post<AuthResponse>(
              '/api/v1/auth/refresh',
              {},
              this.httpOptions,
            ),
          ),
          tap((response) =>
            this.applyAuthResponse(response),
          ),
          finalize(() => {
            this.refreshInFlight$ = null;
          }),
          shareReplay({
            bufferSize: 1,
            refCount: false,
          }),
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
        catchError((error) =>
          throwError(() => error),
        ),
        finalize(() => this.clearLocalAuth()),
      );
  }

  changePassword(
    request: ChangePasswordRequest,
  ): Observable<AuthResponse> {
    return this.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.post<AuthResponse>(
          '/api/v1/auth/change-password',
          request,
          this.httpOptions,
        ),
      ),
      tap((response) =>
        this.applyAuthResponse(response),
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

  // Returns the stored CSRF token for the interceptor to attach
  getCsrfToken(): string | null {
    return this.csrfToken();
  }

  // Always fetches fresh CSRF in prod because backend rotates on every request.
  // In dev (same-origin), reuses the cookie if it exists.
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

    // Always fetch fresh token in prod — backend rotates on every request.
    // Use relative path so CSRF cookie matches the Cloudflare Pages proxy domain.
    return this.http
      .get<{ token: string }>(
        '/api/v1/auth/csrf',
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((response) => {
          // Store the token in memory for cross-origin use
          this.csrfToken.set(response.token);
        }),
        map(() => void 0),
      );
  }

  applyAuthResponse(
    response: AuthResponse,
  ): void {
    this.accessTokenState.set(
      response.accessToken,
    );
    this.currentUserState.set(response.user);
    // Persist to localStorage so page refresh restores the session
    localStorage.setItem(
      LS_ACCESS_TOKEN,
      response.accessToken,
    );
    localStorage.setItem(
      LS_USER,
      JSON.stringify(response.user),
    );
  }

  // Reads token and user from localStorage to survive page refresh
  private restoreFromLocalStorage(): boolean {
    const token = localStorage.getItem(
      LS_ACCESS_TOKEN,
    );
    const userJson =
      localStorage.getItem(LS_USER);
    if (token && userJson) {
      try {
        const user = JSON.parse(
          userJson,
        ) as CurrentUser;
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
