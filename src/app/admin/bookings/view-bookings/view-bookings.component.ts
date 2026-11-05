import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import {
  LucideBan,
  LucideCalendar,
  LucideCheckCircle,
  LucideCheckCircle2,
  LucideClock,
  LucideRefreshCw,
  LucideUser,
  LucideXCircle,
} from '@lucide/angular';

import {
  Booking,
  BookingStatus,
  CancelBookingRequest,
  UpdateBookingStatusRequest,
} from '../../../shared/models/booking.model';
import { BookingService } from '../../../shared/services/booking.service';
import {
  IconComponent,
  StatusBadgeComponent,
  EmptyStateComponent,
  PageBannerComponent,
  type BadgeVariant,
} from '../../../shared/ui';
import {
  getBookingBadgeVariant,
  getBookingStatusLabel,
  getErrorMessage,
} from '../../../shared/directives';

type BookingFilter = 'ALL' | BookingStatus;

@Component({
  selector: 'app-view-bookings',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    IconComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PageBannerComponent,
  ],
  templateUrl: './view-bookings.component.html',
  styleUrl: './view-bookings.component.css',
})
export class ViewBookingsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  readonly LucideBan = LucideBan;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideClock = LucideClock;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideUser = LucideUser;
  readonly LucideXCircle = LucideXCircle;

  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly processingBookingIds = signal<string[]>([]);
  readonly selectedFilter = signal<BookingFilter>('ALL');

  readonly filters: {
    label: string;
    value: BookingFilter;
  }[] = [
    { label: 'All bookings', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Checked In', value: 'CHECKED_IN' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'No Show', value: 'NO_SHOW' },
  ];

  readonly filteredBookings = computed(() => {
    const filter = this.selectedFilter();
    const allBookings = this.bookings();

    return filter === 'ALL'
      ? allBookings
      : allBookings.filter(
          (booking) => booking.bookingStatus === filter,
        );
  });

  readonly totalBookings = computed(
    () => this.bookings().length,
  );

  readonly pendingCount = computed(
    () =>
      this.bookings().filter(
        (booking) => booking.bookingStatus === 'PENDING',
      ).length,
  );

  readonly activeCount = computed(
    () =>
      this.bookings().filter(
        (booking) =>
          booking.bookingStatus === 'CONFIRMED' ||
          booking.bookingStatus === 'CHECKED_IN',
      ).length,
  );

  readonly completedCount = computed(
    () =>
      this.bookings().filter(
        (booking) => booking.bookingStatus === 'COMPLETED',
      ).length,
  );

  readonly noShowCount = computed(
    () =>
      this.bookings().filter(
        (booking) => booking.bookingStatus === 'NO_SHOW',
      ).length,
  );

  readonly cancelledCount = computed(
    () =>
      this.bookings().filter(
        (booking) => booking.bookingStatus === 'CANCELLED',
      ).length,
  );

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.clearMessages();

    this.bookingService
      .getAllBookings()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (bookings) => this.bookings.set(bookings),
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              'Unable to load bookings.',
            ),
          );
        },
      });
  }

  setFilter(filter: BookingFilter): void {
    this.selectedFilter.set(filter);
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

  // Admins can cancel pending and confirmed bookings.
  canCancel(booking: Booking): boolean {
    return (
      booking.bookingStatus === 'PENDING' ||
      booking.bookingStatus === 'CONFIRMED'
    );
  }

  confirmBooking(booking: Booking): void {
    if (
      !this.canConfirm(booking) ||
      this.isProcessing(booking.bookingId)
    ) {
      return;
    }

    this.updateBookingStatus(
      booking,
      { bookingStatus: 'CONFIRMED' },
      'Booking confirmed successfully.',
    );
  }

  checkInBooking(booking: Booking): void {
    if (
      !this.canCheckIn(booking) ||
      this.isProcessing(booking.bookingId)
    ) {
      return;
    }

    this.updateBookingStatus(
      booking,
      { bookingStatus: 'CHECKED_IN' },
      'Check-in completed successfully.',
    );
  }

  checkOutBooking(booking: Booking): void {
    if (
      !this.canCheckOut(booking) ||
      this.isProcessing(booking.bookingId)
    ) {
      return;
    }

    this.startProcessing(booking.bookingId);
    this.clearMessages();

    this.bookingService
      .checkoutBooking(booking.bookingId)
      .pipe(
        finalize(() =>
          this.stopProcessing(booking.bookingId),
        ),
      )
      .subscribe({
        next: (updatedBooking) => {
          // A successful checkout must display the booking as COMPLETED.
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
              'Unable to check out this booking. Please try again.',
            ),
          );
        },
      });
  }

  cancelBooking(booking: Booking): void {
    if (
      !this.canCancel(booking) ||
      this.isProcessing(booking.bookingId)
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel the booking for ${booking.roomName}?`,
    );

    if (!confirmed) {
      return;
    }

    const reason = window.prompt(
      'Enter a reason for cancelling this booking:',
      'Cancelled by user',
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      this.errorMessage.set(
        'Please provide a cancellation reason.',
      );
      return;
    }

    const request: CancelBookingRequest = {
      reason: reason.trim(),
    };

    this.startProcessing(booking.bookingId);
    this.clearMessages();

    this.bookingService
      .cancelBooking(booking.bookingId, request)
      .pipe(
        finalize(() =>
          this.stopProcessing(booking.bookingId),
        ),
      )
      .subscribe({
        next: (updatedBooking) => {
          this.replaceBooking(updatedBooking);
          this.successMessage.set(
            'Booking cancelled successfully.',
          );
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              'Unable to cancel this booking. Please try again.',
            ),
          );
        },
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
      .pipe(
        finalize(() =>
          this.stopProcessing(booking.bookingId),
        ),
      )
      .subscribe({
        next: (updatedBooking) => {
          this.replaceBooking(updatedBooking);
          this.successMessage.set(successText);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              'Unable to update this booking. Please try again.',
            ),
          );
        },
      });
  }

  private replaceBooking(updatedBooking: Booking): void {
    this.bookings.update((currentBookings) =>
      currentBookings.map((booking) =>
        booking.bookingId === updatedBooking.bookingId
          ? updatedBooking
          : booking,
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
