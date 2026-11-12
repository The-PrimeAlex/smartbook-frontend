import {
  CurrencyPipe,
  DatePipe,
} from '@angular/common';
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
  LucideRefreshCw,
} from '@lucide/angular';

import {
  Booking,
  BookingStatus,
} from '../../../shared/models/booking.model';
import { BookingService } from '../../../shared/services/booking.service';
import {
  PageBannerComponent,
  StatCardComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  IconComponent,
  type BadgeVariant,
} from '../../../shared/ui';
import {
  getBookingBadgeVariant,
  getBookingStatusLabel,
  getErrorMessage,
} from '../../../shared/directives';

@Component({
  selector: 'app-cancelled-bookings',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    PageBannerComponent,
    StatCardComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    IconComponent,
  ],
  templateUrl:
    './cancelled-bookings.component.html',
  styleUrl: './cancelled-bookings.component.css',
})
export class CancelledBookingsComponent implements OnInit {
  private readonly bookingService = inject(
    BookingService,
  );

  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly cancelledBookings = computed(() =>
    this.bookings().filter(
      (b) => b.bookingStatus === 'CANCELLED',
    ),
  );

  readonly totalCount = computed(
    () => this.cancelledBookings().length,
  );

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.bookingService
      .getMyBookings()
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (bookings) =>
          this.bookings.set(bookings),
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              'Unable to load your cancelled bookings.',
            ),
          );
        },
      });
  }

  statusLabel = getBookingStatusLabel;

  private getErrorMessage = getErrorMessage;

  readonly LucideCalendar = LucideCalendar;
  readonly LucideBan = LucideBan;
  readonly LucideRefreshCw = LucideRefreshCw;

  getBadgeVariant = getBookingBadgeVariant;
}
