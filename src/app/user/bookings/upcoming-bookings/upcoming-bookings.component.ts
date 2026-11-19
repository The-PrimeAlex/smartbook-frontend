import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import {
  LucideCalendar,
  LucideCheckCircle,
  LucideChevronDown,
  LucideClock,
  LucideEye,
  LucideHome,
  LucideRefreshCw,
} from '@lucide/angular';

import {
  Booking,
  BookingStatus,
  CancelBookingRequest,
  UpdateBookingStatusRequest,
} from '../../../shared/models/booking.model';
import { BookingService } from '../../../shared/services/booking.service';
import {
  PageBannerComponent,
  StatCardComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  CancelBookingModalComponent,
  IconComponent,
  type BadgeVariant,
  type CancelBookingModalData,
} from '../../../shared/ui';
import {
  getBookingBadgeVariant,
  getBookingStatusLabel,
  getErrorMessage,
} from '../../../shared/directives';

const UPCOMING_STATUSES: readonly BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
];

@Component({
  selector: 'app-upcoming-bookings',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    PageBannerComponent,
    StatCardComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    CancelBookingModalComponent,
    IconComponent,
  ],
  templateUrl: './upcoming-bookings.component.html',
  styleUrl: './upcoming-bookings.component.css',
})
export class UpcomingBookingsComponent implements OnInit, OnDestroy {
  readonly LucideCalendar = LucideCalendar;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideClock = LucideClock;
  readonly LucideEye = LucideEye;
  readonly LucideHome = LucideHome;
  readonly LucideRefreshCw = LucideRefreshCw;

  readonly statsCollapsed = signal(true);

  toggleStatsCollapsed(): void {
    this.statsCollapsed.update((v) => !v);
  }

  private readonly bookingService = inject(BookingService);

  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly processingBookingIds = signal<string[]>([]);

  // Cancel booking modal
  readonly showCancelModal = signal(false);
  readonly cancelModalData = signal<CancelBookingModalData | null>(null);

  private refreshInterval: any = null;

  // Auto-refresh bookings every 30 seconds so auto-check-in updates appear in real-time
  private autoRefreshEffect = effect(() => {
    if (!this.loading()) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  });

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => {
      this.loadBookings();
    }, 30000); // 30 seconds
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  readonly upcomingBookings = computed(() =>
    this.bookings().filter((b) => UPCOMING_STATUSES.includes(b.bookingStatus)),
  );

  readonly totalCount = computed(() => this.upcomingBookings().length);
  readonly pendingCount = computed(
    () =>
      this.upcomingBookings().filter((b) => b.bookingStatus === 'PENDING')
        .length,
  );
  readonly confirmedCount = computed(
    () =>
      this.upcomingBookings().filter((b) => b.bookingStatus === 'CONFIRMED')
        .length,
  );
  readonly checkedInCount = computed(
    () =>
      this.upcomingBookings().filter((b) => b.bookingStatus === 'CHECKED_IN')
        .length,
  );

  ngOnInit(): void {
    this.loadBookings();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.clearMessages();

    this.bookingService
      .getMyBookings()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (bookings) => this.bookings.set(bookings),
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "We couldn't load your bookings. Please try again in a moment.",
            ),
          );
        },
      });
  }

  isProcessing(bookingId: string): boolean {
    return this.processingBookingIds().includes(bookingId);
  }

  canConfirm(booking: Booking): boolean {
    return booking.bookingStatus === 'PENDING';
  }

  canCheckIn(booking: Booking): boolean {
    return booking.bookingStatus === 'CONFIRMED';
  }

  canCheckOut(booking: Booking): boolean {
    return booking.bookingStatus === 'CHECKED_IN';
  }

  canCancel(booking: Booking): boolean {
    // Allow cancellation before check-in (PENDING or CONFIRMED)
    return (
      booking.bookingStatus === 'PENDING' ||
      booking.bookingStatus === 'CONFIRMED'
    );
  }

  confirmBooking(booking: Booking): void {
    if (!this.canConfirm(booking) || this.isProcessing(booking.bookingId))
      return;

    this.updateBookingStatus(
      booking,
      { bookingStatus: 'CONFIRMED' },
      'Booking confirmed successfully.',
    );
  }

  checkInBooking(booking: Booking): void {
    if (!this.canCheckIn(booking) || this.isProcessing(booking.bookingId))
      return;

    this.updateBookingStatus(
      booking,
      { bookingStatus: 'CHECKED_IN' },
      'Check-in completed successfully.',
    );
  }

  checkOutBooking(booking: Booking): void {
    if (!this.canCheckOut(booking) || this.isProcessing(booking.bookingId))
      return;

    this.startProcessing(booking.bookingId);
    this.clearMessages();

    this.bookingService
      .checkoutBooking(booking.bookingId)
      .pipe(finalize(() => this.stopProcessing(booking.bookingId)))
      .subscribe({
        next: (updatedBooking) => {
          this.replaceBooking({
            ...updatedBooking,
            bookingStatus: 'COMPLETED',
          });
          this.successMessage.set(
            `Checkout completed successfully for ${booking.roomName}.`,
          );
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "We couldn't check out this booking. Please try again in a moment.",
            ),
          );
        },
      });
  }

  cancelBooking(booking: Booking): void {
    if (!this.canCancel(booking) || this.isProcessing(booking.bookingId))
      return;

    // Use the admin-configured cancellation settings from the booking
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const freeCancellationHours = booking.cancelHoursBeforeFree ?? 2;
    const cancelFee = booking.cancelFee ?? 0;
    const freeCancellationEnd = new Date(
      startTime.getTime() - freeCancellationHours * 60 * 60 * 1000,
    );
    const hasFee = now > freeCancellationEnd && cancelFee > 0;

    const feeAmount = hasFee
      ? `KSh ${cancelFee.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
      : '';

    this.cancelModalData.set({
      roomName: booking.roomName,
      startTime: this.formatDateTime(booking.startTime),
      endTime: this.formatDateTime(booking.endTime),
      hasFee,
      feeAmount,
      freeCancellationHours,
    });
    this.showCancelModal.set(true);
  }

  confirmCancelBooking(reason: string): void {
    const data = this.cancelModalData();
    if (!data) return;

    // Find the booking being cancelled
    const booking = this.bookings().find((b) => b.roomName === data.roomName);
    if (!booking) return;

    this.showCancelModal.set(false);
    this.startProcessing(booking.bookingId);
    this.clearMessages();

    this.bookingService
      .cancelBooking(booking.bookingId, {
        reason: reason.trim(),
      })
      .pipe(finalize(() => this.stopProcessing(booking.bookingId)))
      .subscribe({
        next: (updatedBooking) => {
          this.replaceBooking(updatedBooking);
          this.successMessage.set('Booking cancelled successfully.');
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "We couldn't cancel this booking. Please try again in a moment.",
            ),
          );
        },
      });
  }

  dismissCancelModal(): void {
    this.showCancelModal.set(false);
    this.cancelModalData.set(null);
  }

  private formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  statusLabel = getBookingStatusLabel;

  private updateBookingStatus(
    booking: Booking,
    request: UpdateBookingStatusRequest,
    successText: string,
  ): void {
    this.startProcessing(booking.bookingId);
    this.clearMessages();

    this.bookingService
      .updateBookingStatus(booking.bookingId, request)
      .pipe(finalize(() => this.stopProcessing(booking.bookingId)))
      .subscribe({
        next: (updatedBooking) => {
          this.replaceBooking(updatedBooking);
          this.successMessage.set(successText);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              "We couldn't update this booking. Please try again in a moment.",
            ),
          );
        },
      });
  }

  private replaceBooking(updatedBooking: Booking): void {
    this.bookings.update((current) =>
      current.map((b) =>
        b.bookingId === updatedBooking.bookingId ? updatedBooking : b,
      ),
    );
  }

  private startProcessing(bookingId: string): void {
    this.processingBookingIds.update((ids) =>
      ids.includes(bookingId) ? ids : [...ids, bookingId],
    );
  }

  private stopProcessing(bookingId: string): void {
    this.processingBookingIds.update((ids) =>
      ids.filter((id) => id !== bookingId),
    );
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private getErrorMessage = getErrorMessage;

  getBadgeVariant = getBookingBadgeVariant;
}
