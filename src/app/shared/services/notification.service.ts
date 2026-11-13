import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  inject,
} from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { map, mergeMap } from 'rxjs';

import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/notifications/me';

  getNotifications(
    unreadOnly = false,
  ): Observable<Notification[]> {
    return this.http.get<Notification[]>(
      this.apiUrl,
      {
        params: { unreadOnly },
      },
    );
  }

  markAsRead(
    notificationId: string,
  ): Observable<void> {
    return this.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.post<void>(
          `${this.apiUrl}/${encodeURIComponent(notificationId)}/read`,
          null,
        ),
      ),
    );
  }

  markAllAsRead(): Observable<void> {
    return this.getNotifications(true).pipe(
      mergeMap((notifications) => {
        if (notifications.length === 0) {
          return of(void 0);
        }
        const marks = notifications.map((n) =>
          this.http.post<void>(
            `${this.apiUrl}/${encodeURIComponent(n.notificationId)}/read`,
            null,
          ),
        );
        // Run all mark-as-read requests in parallel and return when all complete
        let combined: Observable<void> =
          of(void 0);
        marks.forEach((req) => {
          combined = combined.pipe(
            mergeMap(() => req),
          );
        });
        return combined;
      }),
    );
  }

  private ensureCsrfToken(): Observable<void> {
    const hasCsrfCookie =
      typeof document !== 'undefined' &&
      document.cookie
        .split(';')
        .some((cookie) =>
          cookie.trim().startsWith('XSRF-TOKEN='),
        );

    if (hasCsrfCookie) {
      return of(void 0);
    }

    return this.http
      .get(`/api/v1/auth/csrf`, {
        responseType: 'text',
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }
}
