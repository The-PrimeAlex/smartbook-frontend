import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

export interface UserNotificationPreferences {
  send_reminders: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserNotificationPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/v1/notifications/me/preferences';

  // Get the authenticated user's notification preferences
  getPreferences(): Observable<UserNotificationPreferences> {
    return this.http.get<Record<string, boolean>>(this.baseUrl).pipe(
      map((raw) => ({
        send_reminders: raw['send_reminders'] ?? true,
      })),
    );
  }

  // Update a single notification preference
  updatePreference(key: string, enabled: boolean): Observable<void> {
    return this.authService.ensureCsrfToken().pipe(
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

  // Bulk update notification preferences
  bulkUpdatePreferences(
    preferences: UserNotificationPreferences,
  ): Observable<void> {
    return this.authService
      .ensureCsrfToken()
      .pipe(
        switchMap(() =>
          this.http.patch<void>(`${this.baseUrl}/bulk`, preferences),
        ),
      );
  }
}
