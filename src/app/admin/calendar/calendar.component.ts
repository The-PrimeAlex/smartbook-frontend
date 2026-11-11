import { DatePipe } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { LucideCalendar } from '@lucide/angular';
import { finalize } from 'rxjs';
import {
  BookingSyncResult,
  CalendarService,
  GoogleCalendarEventDto,
} from '../../shared/services/calendar.service';
import {
  CalendarBooking,
  extractBookingArray,
  formatSyncResult,
  getErrorMessage,
  mapGoogleEvent,
  mapSmartBookBooking,
} from './util/calendar-booking-mapper';
import {
  dateKey,
  formatTime12Hour,
  nextMonthDate,
  nextWeekDate,
  parseDate,
  previousMonthDate,
  previousWeekDate,
  startOfDay,
  timeKey,
} from './util/calendar-date-utils';
import { EmptyStateComponent } from '../../shared/ui';

type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled';
type RoomType =
  | 'All Rooms'
  | 'Boardroom'
  | 'Meeting Room'
  | 'Video Suite';

interface CalendarDay {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent implements OnInit {
  readonly LucideCalendar = LucideCalendar;
  private readonly calendarService =
    inject(CalendarService);

  @Input() isAdmin = false;
  @Input() customerId = '';

  readonly googleConnecting = signal(false);
  readonly googleConnectionMessage = signal('');
  readonly googleConnectionError = signal('');

  readonly googleEventsLoading = signal(false);
  readonly googleEventsError = signal('');
  readonly googleEvents = signal<CalendarBooking[]>([]);

  readonly bookingsLoading = signal(false);
  readonly bookingsError = signal('');
  readonly smartBookBookings = signal<CalendarBooking[]>(
    [],
  );

  readonly googleSyncing = signal(false);
  readonly googleSyncMessage = signal('');
  readonly googleSyncError = signal('');

  readonly googleDisconnecting = signal(false);
  readonly googleDisconnectMessage = signal('');
  readonly googleDisconnectError = signal('');

  readonly roomTypes: RoomType[] = [
    'All Rooms',
    'Boardroom',
    'Meeting Room',
    'Video Suite',
  ];

  readonly selectedDate = signal(startOfDay(new Date()));
  readonly selectedRoomType = signal<RoomType>('All Rooms');

  readonly bookings = computed<CalendarBooking[]>(() => {
    const combined = [
      ...this.smartBookBookings(),
      ...this.googleEvents(),
    ];

    return combined.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return a.startTime.localeCompare(b.startTime);
    });
  });

  readonly visibleBookings = computed(() => {
    const roomType = this.selectedRoomType();

    return this.bookings().filter((booking) => {
      return (
        roomType === 'All Rooms' ||
        booking.roomType === roomType
      );
    });
  });

  readonly monthDays = computed<CalendarDay[]>(() => {
    const selected = this.selectedDate();
    const firstOfMonth = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      1,
    );

    const gridStart = new Date(firstOfMonth);
    const weekday = (gridStart.getDay() + 6) % 7;

    gridStart.setDate(gridStart.getDate() - weekday);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);

      return {
        date,
        key: dateKey(date),
        isCurrentMonth:
          date.getMonth() === selected.getMonth(),
        isToday: dateKey(date) === dateKey(new Date()),
        isSelected: dateKey(date) === dateKey(selected),
      };
    });
  });

  readonly weekDays = computed<CalendarDay[]>(() => {
    const selected = this.selectedDate();
    const start = startOfDay(selected);
    const weekday = (start.getDay() + 6) % 7;

    start.setDate(start.getDate() - weekday);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      return {
        date,
        key: dateKey(date),
        isCurrentMonth:
          date.getMonth() ===
          this.selectedDate().getMonth(),
        isToday: dateKey(date) === dateKey(new Date()),
        isSelected:
          dateKey(date) === dateKey(this.selectedDate()),
      };
    });
  });

  readonly dayBookings = computed(() => {
    const key = dateKey(this.selectedDate());

    return this.visibleBookings().filter(
      (booking) => booking.date === key,
    );
  });

  readonly monthTitle = computed(() =>
    this.selectedDate().toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly weekTitle = computed(() => {
    const days = this.weekDays();

    if (!days.length) {
      return '';
    }

    const first = days[0].date;
    const last = days[days.length - 1].date;

    const firstLabel = first.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    const lastLabel = last.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${firstLabel} – ${lastLabel}`;
  });

  readonly selectedDateTitle = computed(() =>
    this.selectedDate().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  );

  readonly totalBookings = computed(
    () => this.visibleBookings().length,
  );

  readonly todayBookings = computed(() => {
    const today = dateKey(new Date());

    return this.visibleBookings().filter(
      (booking) => booking.date === today,
    ).length;
  });

  readonly confirmedBookings = computed(
    () =>
      this.visibleBookings().filter(
        (booking) => booking.status === 'Confirmed',
      ).length,
  );

  readonly pendingBookings = computed(
    () =>
      this.visibleBookings().filter(
        (booking) => booking.status === 'Pending',
      ).length,
  );

  ngOnInit(): void {
    this.loadSmartBookBookings();
    this.loadGoogleEvents();
  }

  loadSmartBookBookings(): void {
    this.bookingsLoading.set(true);
    this.bookingsError.set('');

    this.calendarService
      .getMyBookings()
      .pipe(finalize(() => this.bookingsLoading.set(false)))
      .subscribe({
        next: (response: unknown) => {
          const rows = extractBookingArray(response);
          this.smartBookBookings.set(
            rows
              .map((booking, index) =>
                mapSmartBookBooking(booking, index),
              )
              .filter(
                (booking): booking is CalendarBooking =>
                  booking !== null,
              ),
          );
        },
        error: (error: unknown) => {
          this.bookingsError.set(
            getErrorMessage(
              error,
              'Could not load SmartBook bookings. Check the bookings API URL.',
            ),
          );
        },
      });
  }

  loadGoogleEvents(): void {
    const days = this.monthDays();

    if (!days.length) {
      return;
    }

    const fromDate = days[0].date;
    const lastDate = days[days.length - 1].date;
    const toDate = new Date(lastDate);
    toDate.setDate(toDate.getDate() + 1);

    this.googleEventsLoading.set(true);
    this.googleEventsError.set('');
    this.googleConnectionMessage.set('');

    this.calendarService
      .getGoogleEvents(
        fromDate.toISOString(),
        toDate.toISOString(),
      )
      .pipe(
        finalize(() => this.googleEventsLoading.set(false)),
      )
      .subscribe({
        next: (events: GoogleCalendarEventDto[]) => {
          const mapped = (events ?? [])
            .map((event) => mapGoogleEvent(event))
            .filter(
              (booking): booking is CalendarBooking =>
                booking !== null,
            );

          this.googleEvents.set(mapped);
          this.googleConnectionMessage.set(
            `${mapped.length} Google Calendar ${mapped.length === 1 ? 'event' : 'events'} loaded.`,
          );
        },
        error: (error: unknown) => {
          this.googleEventsError.set(
            getErrorMessage(
              error,
              'Could not load Google Calendar events. Connect your Google Calendar and try again.',
            ),
          );
        },
      });
  }

  connectGoogleCalendar(): void {
    this.googleConnecting.set(true);
    this.googleConnectionError.set('');
    this.googleConnectionMessage.set('');

    this.calendarService
      .connectGoogleCalendar()
      .pipe(
        finalize(() => this.googleConnecting.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.authorizationUrl) {
            this.googleConnectionError.set(
              'The server did not return a Google authorization URL.',
            );
            return;
          }

          window.location.assign(response.authorizationUrl);
        },
        error: (error: unknown) => {
          this.googleConnectionError.set(
            getErrorMessage(
              error,
              'Could not start Google Calendar connection.',
            ),
          );
        },
      });
  }

  syncBookingsToGoogleCalendar(): void {
    this.googleSyncing.set(true);
    this.googleSyncError.set('');
    this.googleSyncMessage.set('');

    this.calendarService
      .syncBookings()
      .pipe(finalize(() => this.googleSyncing.set(false)))
      .subscribe({
        next: (result: BookingSyncResult) => {
          this.googleSyncMessage.set(
            formatSyncResult(result),
          );

          this.loadSmartBookBookings();
          this.loadGoogleEvents();
        },
        error: (error: unknown) => {
          this.googleSyncError.set(
            getErrorMessage(
              error,
              'Could not sync SmartBook bookings to Google Calendar.',
            ),
          );
        },
      });
  }

  disconnectGoogleCalendar(): void {
    this.googleDisconnecting.set(true);
    this.googleDisconnectError.set('');
    this.googleDisconnectMessage.set('');

    this.calendarService
      .disconnectGoogleCalendar()
      .pipe(finalize(() => this.googleDisconnecting.set(false)))
      .subscribe({
        next: (response) => {
          this.googleDisconnectMessage.set(
            response?.message ?? 'Google Calendar disconnected.',
          );
          this.googleEvents.set([]);
          this.googleEventsError.set('');
          setTimeout(() => this.googleDisconnectMessage.set(''), 5000);
        },
        error: (error: unknown) => {
          this.googleDisconnectError.set(
            getErrorMessage(
              error,
              'Could not disconnect Google Calendar.',
            ),
          );
        },
      });
  }

  selectDate(date: Date): void {
    this.selectedDate.set(startOfDay(date));
  }

  selectRoomType(roomType: RoomType): void {
    this.selectedRoomType.set(roomType);
  }

  goToToday(): void {
    this.selectedDate.set(startOfDay(new Date()));
  }

  previousMonth(): void {
    this.selectedDate.set(
      previousMonthDate(this.selectedDate()),
    );
  }

  nextMonth(): void {
    this.selectedDate.set(
      nextMonthDate(this.selectedDate()),
    );
  }

  previousWeek(): void {
    this.selectedDate.set(
      previousWeekDate(this.selectedDate()),
    );
  }

  nextWeek(): void {
    this.selectedDate.set(
      nextWeekDate(this.selectedDate()),
    );
  }

  bookingsForDate(date: Date): CalendarBooking[] {
    const key = dateKey(date);

    return this.visibleBookings().filter(
      (booking) => booking.date === key,
    );
  }

  trackBooking(
    _index: number,
    booking: CalendarBooking,
  ): string {
    return `${booking.source}-${booking.id}`;
  }

  trackDay(_index: number, day: CalendarDay): string {
    return day.key;
  }

  formatTime(time: string): string {
    return formatTime12Hour(time);
  }
}
