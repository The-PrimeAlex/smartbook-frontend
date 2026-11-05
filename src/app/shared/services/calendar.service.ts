import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';

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

  // BookingController uses @RequestMapping("/api/v1").
  private readonly apiBaseUrl = '/api';

  getMyBookings(): Observable<unknown> {
    return this.http.get<unknown>(
      `${this.apiBaseUrl}/v1/bookings/me`,
    );
  }

  getGoogleEvents(
    from: string,
    to: string,
  ): Observable<GoogleCalendarEventDto[]> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    return this.http.get<GoogleCalendarEventDto[]>(
      `${this.apiBaseUrl}/v1/calendar/events`,
      {
        params,
      },
    );
  }

  connectGoogleCalendar(): Observable<{
    authorizationUrl: string;
  }> {
    return this.http.get<{ authorizationUrl: string }>(
      `${this.apiBaseUrl}/v1/calendar/integrations/google/connect`,
    );
  }

  syncBookings(): Observable<BookingSyncResult> {
    return this.http.post<BookingSyncResult>(
      `${this.apiBaseUrl}/v1/calendar/sync-bookings`,
      {},
    );
  }
}
