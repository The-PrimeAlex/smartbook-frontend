import {
  inject,
  Injectable,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

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
  private readonly authService =
    inject(AuthService);

  private readonly authEndpoint = `${environment.apiUrl}/auth`;
  private readonly httpOptions = {
    withCredentials: true,
  };

  requestPasswordReset(
    request: PasswordResetRequest,
  ): Observable<void> {
    return this.authService
      .ensureCsrfToken()
      .pipe(
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
    return this.authService
      .ensureCsrfToken()
      .pipe(
        switchMap(() =>
          this.http.post<void>(
            `${this.authEndpoint}/reset-password`,
            request,
            this.httpOptions,
          ),
        ),
      );
  }
}
