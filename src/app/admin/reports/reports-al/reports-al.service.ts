import {
  Injectable,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OccupancyReportAl {
  roomId: string | null;
  roomName: string | null;
  totalBookings: number | null;
  checkedInBookings: number | null;
  noShowBookings: number | null;
  occupancyRate: number | null;
  totalHoursBooked: number | null;
  totalHoursUsed: number | null;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface BookingReportAl {
  bookingId: string | null;
  roomName: string | null;
  bookerName: string | null;
  purpose: string | null;
  bookingStatus: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualDurationMinutes: number | null;
  overrunMinutes: number | null;
}

export interface RevenueReportAl {
  bookingId: string | null;
  roomName: string | null;
  bookerName: string | null;
  purpose: string | null;
  bookedHourlyRate: number | null;
  durationMinutes: number | null;
  overrunMinutes: number | null;
  overrunMultiplier: number | null;
  overrunCharge: number | null;
  cancellationFee: number | null;
  noShowFee: number | null;
  incidentFee: number | null;
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  billStatus: string | null;
  currency: string | null;
  issuedAt: string | null;
  paidAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReportsAlService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/admin/reports';

  getOccupancyReports(): Observable<
    OccupancyReportAl[]
  > {
    return this.http.get<OccupancyReportAl[]>(
      `${this.apiUrl}/occupancy`,
    );
  }

  getBookingReports(): Observable<
    BookingReportAl[]
  > {
    return this.http.get<BookingReportAl[]>(
      `${this.apiUrl}/bookings`,
    );
  }

  getRevenueReports(): Observable<
    RevenueReportAl[]
  > {
    return this.http.get<RevenueReportAl[]>(
      `${this.apiUrl}/revenue`,
    );
  }
}
