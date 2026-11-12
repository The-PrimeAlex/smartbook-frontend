export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Booking {
  bookingId: string;
  startTime: string;
  endTime: string;
  bookedHourlyRate: number | null;
  bookingStatus: BookingStatus;
  purpose: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  userEmail: string;
  cancelHoursBeforeFree: number;
  cancelFee: number;
}

export interface CreateBookingRequest {
  roomId: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

export interface UpdateBookingStatusRequest {
  bookingStatus: BookingStatus;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface BookingStatusUpdate {
  bookingId: string;
  bookingStatus: BookingStatus;
}

export const BOOKING_STATUSES: readonly BookingStatus[] =
  [
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ];
