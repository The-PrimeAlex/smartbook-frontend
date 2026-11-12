import {
  Injectable,
  inject,
} from '@angular/core';
import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GoogleCalendarEventDto {
  id: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  htmlLink: string | null;
  status: string | null;
  start: string;
  end: string;
  allDay: boolean;
}

export interface BookingSyncResult {
  totalBookings?: number;
  created?: number;
  alreadySynced?: number;
  skipped?: number;
  failed?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private readonly http = inject(HttpClient);

  private readonly apiBaseUrl =
    environment.apiUrl;

  getMyBookings(): Observable<unknown> {
    return this.http.get<unknown>(
      `${this.apiBaseUrl}/bookings/me`,
    );
  }

  getGoogleEvents(
    from: string,
    to: string,
  ): Observable<GoogleCalendarEventDto[]> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    return this.http.get<
      GoogleCalendarEventDto[]
    >(`${this.apiBaseUrl}/calendar/events`, {
      params,
    });
  }

  connectGoogleCalendar(): Observable<{
    authorizationUrl: string;
  }> {
    return this.http.get<{
      authorizationUrl: string;
    }>(
      `${this.apiBaseUrl}/calendar/integrations/google/connect`,
    );
  }

  syncBookings(): Observable<BookingSyncResult> {
    return this.http.post<BookingSyncResult>(
      `${this.apiBaseUrl}/calendar/sync-bookings`,
      {},
    );
  }

  disconnectGoogleCalendar(): Observable<{
    message: string;
  }> {
    return this.http.delete<{ message: string }>(
      `${this.apiBaseUrl}/calendar/integrations/google`,
    );
  }
}
