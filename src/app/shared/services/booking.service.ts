import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  inject,
} from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import {
  Booking,
  CancelBookingRequest,
  CreateBookingRequest,
  UpdateBookingStatusRequest,
} from '../models/booking.model';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = '/api/v1';
  private readonly adminBookingsUrl = `${this.apiUrl}/admin/bookings`;
  private readonly userBookingsUrl = `${this.apiUrl}/bookings`;

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      this.adminBookingsUrl,
    );
  }

  getPendingBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.adminBookingsUrl}/pending`,
    );
  }

  getBookingHistory(): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.adminBookingsUrl}/history`,
    );
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.userBookingsUrl}/me`,
    );
  }

  /**
   * Get bookings for a specific room within a date range (default: today to +7 days).
   * Used by the Find a Room page to display a schedule timeline.
   */
  getRoomSchedule(
    roomId: string,
  ): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.userBookingsUrl}/room/${encodeURIComponent(roomId)}/schedule`,
    );
  }

  getBooking(
    bookingId: string,
  ): Observable<Booking> {
    return this.http.get<Booking>(
      `${this.userBookingsUrl}/${encodeURIComponent(bookingId)}`,
    );
  }

  createBooking(
    request: CreateBookingRequest,
  ): Observable<Booking> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.post<Booking>(
          this.userBookingsUrl,
          request,
        ),
      ),
    );
  }

  /**
   * Owner: confirm a pending booking or check in to a confirmed booking.
   */
  updateBookingStatus(
    bookingId: string,
    request: UpdateBookingStatusRequest,
  ): Observable<Booking> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.patch<Booking>(
          `${this.userBookingsUrl}/${encodeURIComponent(bookingId)}/status`,
          request,
        ),
      ),
    );
  }

  /**
   * Owner: cancel their own booking.
   */
  cancelBooking(
    bookingId: string,
    request: CancelBookingRequest,
  ): Observable<Booking> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.patch<Booking>(
          `${this.userBookingsUrl}/${encodeURIComponent(bookingId)}/cancel`,
          request,
        ),
      ),
    );
  }


  checkoutBooking(
    bookingId: string,
  ): Observable<Booking> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.patch<Booking>(
          `${this.userBookingsUrl}/${encodeURIComponent(bookingId)}/checkout`,
          {},
        ),
      ),
    );
  }
}
