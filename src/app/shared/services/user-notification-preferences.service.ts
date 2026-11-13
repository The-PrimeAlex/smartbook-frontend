import {
  Injectable,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

export interface UserNotificationPreferences {
  booking_confirmation: boolean;
  send_reminders: boolean;
  noshow_notification: boolean;
  overrun_notification: boolean;
  invoice_email: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserNotificationPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/v1/notifications/me/preferences';

  /**
   * Get the authenticated user's notification preferences.
   * Seeds defaults (all enabled) if no preferences exist yet.
   */
  getPreferences(): Observable<UserNotificationPreferences> {
    return this.http
      .get<Record<string, boolean>>(this.baseUrl)
      .pipe(
        map((raw) => ({
          booking_confirmation:
            raw['booking_confirmation'] ?? true,
          send_reminders:
            raw['send_reminders'] ?? true,
          noshow_notification:
            raw['noshow_notification'] ?? true,
          overrun_notification:
            raw['overrun_notification'] ?? true,
          invoice_email:
            raw['invoice_email'] ?? true,
        })),
      );
  }

  /**
   * Update a single notification preference.
   */
  updatePreference(
    key: string,
    enabled: boolean,
  ): Observable<void> {
    return this.authService
      .ensureCsrfToken()
      .pipe(
        switchMap(() =>
          this.http.patch<void>(
            this.baseUrl,
            {},
            {
              params: { key, enabled: String(enabled) },
            },
          ),
        ),
      );
  }

  /**
   * Bulk update notification preferences.
   */
  bulkUpdatePreferences(
    preferences: UserNotificationPreferences,
  ): Observable<void> {
    return this.authService
      .ensureCsrfToken()
      .pipe(
        switchMap(() =>
          this.http.patch<void>(
            `${this.baseUrl}/bulk`,
            preferences,
          ),
        ),
      );
  }
}
