import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';


export interface PasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private readonly http = inject(HttpClient);

  private readonly authEndpoint = `${environment.apiUrl}/auth`;
  private readonly httpOptions = { withCredentials: true };

  requestPasswordReset(
    request: PasswordResetRequest,
  ): Observable<void> {
    return this.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.post<void>(
          `${this.authEndpoint}/forgot-password`,
          request,
          this.httpOptions,
        ),
      ),
    );
  }

  resetPassword(
    request: ResetPasswordRequest,
  ): Observable<void> {
    return this.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.post<void>(
          `${this.authEndpoint}/reset-password`,
          request,
          this.httpOptions,
        ),
      ),
    );
  }

  private ensureCsrfToken(): Observable<void> {
    const hasCsrfCookie = document.cookie
      .split(';')
      .some((cookie) =>
        cookie.trim().startsWith('XSRF-TOKEN='),
      );

    if (hasCsrfCookie) {
      return of(void 0);
    }

    return this.http
      .get(`${this.authEndpoint}/csrf`, {
        ...this.httpOptions,
        responseType: 'text',
      })
      .pipe(
        map(() => void 0),
        catchError((error) => throwError(() => error)),
      );
  }
}
