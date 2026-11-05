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
  LucideCalendar,
  LucideCheckCircle2,
  LucideRefreshCw,
  LucideXCircle,
} from '@lucide/angular';

import {
  Booking,
  BookingStatus,
} from '../../../shared/models/booking.model';
import { BookingService } from '../../../shared/services/booking.service';
import {
  IconComponent,
  StatusBadgeComponent,
  StatCardComponent,
  EmptyStateComponent,
  FormFieldComponent,
  FilterGroupComponent,
  SearchBoxComponent,
  PageBannerComponent,
  type BadgeVariant,
} from '../../../shared/ui';
import {
  getBookingBadgeVariant,
  getBookingStatusLabel,
  getErrorMessage,
} from '../../../shared/directives';

const HISTORY_STATUSES: readonly BookingStatus[] = [
  'COMPLETED',
  'NO_SHOW',
];

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    IconComponent,
    StatusBadgeComponent,
    StatCardComponent,
    EmptyStateComponent,
    FormFieldComponent,
    FilterGroupComponent,
    SearchBoxComponent,
    PageBannerComponent,
  ],
  templateUrl: './booking-history.component.html',
  styleUrl: './booking-history.component.css',
})
export class BookingHistoryComponent implements OnInit {
  readonly LucideCalendar = LucideCalendar;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideXCircle = LucideXCircle;

  private readonly bookingService = inject(BookingService);

  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly historyBookings = computed(() =>
    this.bookings().filter((b) =>
      HISTORY_STATUSES.includes(b.bookingStatus),
    ),
  );

  readonly totalCount = computed(
    () => this.historyBookings().length,
  );
  readonly completedCount = computed(
    () =>
      this.historyBookings().filter(
        (b) => b.bookingStatus === 'COMPLETED',
      ).length,
  );
  readonly noShowCount = computed(
    () =>
      this.historyBookings().filter(
        (b) => b.bookingStatus === 'NO_SHOW',
      ).length,
  );

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.bookingService
      .getMyBookings()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (bookings) => this.bookings.set(bookings),
        error: (error: unknown) => {
          this.errorMessage.set(
            this.getErrorMessage(
              error,
              'Unable to load your booking history.',
            ),
          );
        },
      });
  }

  statusLabel = getBookingStatusLabel;

  private getErrorMessage = getErrorMessage;

  getBadgeVariant = getBookingBadgeVariant;
}
