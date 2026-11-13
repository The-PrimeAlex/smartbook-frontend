import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { createLogger } from '../../../shared/services/logger.service';
import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { finalize, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import {
  LucideArrowDown,
  LucideArrowRight,
  LucideCalendar,
  LucideCalendarCheck,
  LucideChevronDown,
  LucideCircleHelp,
  LucideClock,
  LucideFileText,
  LucideMonitor,
} from '@lucide/angular';

import {
  PageBannerComponent,
  IconComponent,
} from '../../../shared/ui';

interface Room {
  roomId: string;
  roomName: string;
  roomType: string;
  capacity: number;
  hourlyRate: number;
  status: string;
  description?: string;
}

interface BookingResponse {
  message?: string;
}

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,

    PageBannerComponent,
    IconComponent,
  ],
  templateUrl: './create-booking.component.html',
  styleUrl: './create-booking.component.css',
})
export class CreateBookingComponent implements OnInit {
  private readonly log = createLogger(
    'CreateBooking',
  );
  private readonly http = inject(HttpClient);

  readonly LucideArrowDown = LucideArrowDown;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideCalendarCheck =
    LucideCalendarCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideCircleHelp = LucideCircleHelp;
  readonly LucideClock = LucideClock;
  readonly LucideFileText = LucideFileText;
  readonly LucideMonitor = LucideMonitor;

  rooms: Room[] = [];
  loadingRooms = false;
  saving = false;

  meetingTitle = '';
  purpose = '';
  roomId = '';

  startDate = this.getToday();
  endDate = this.getToday();
  startTime = this.getNextHour();
  endTime = this.addHours(this.startTime, 1);

  successMessage = '';
  errorMessage = '';
  conflictMessage = '';

  ngOnInit(): void {
    this.loadRooms();
  }

  get today(): string {
    return this.getToday();
  }

  private getToday(): string {
    return this.formatDate(new Date());
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1,
    ).padStart(2, '0');
    const day = String(date.getDate()).padStart(
      2,
      '0',
    );

    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    const hours = String(
      date.getHours(),
    ).padStart(2, '0');
    const minutes = String(
      date.getMinutes(),
    ).padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  private getNextHour(): string {
    const date = new Date();
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + 1);

    return this.formatTime(date);
  }

  private addHours(
    time: string,
    hoursToAdd: number,
  ): string {
    const [hours, minutes] = time
      .split(':')
      .map(Number);
    const date = new Date();

    date.setHours(
      hours + hoursToAdd,
      minutes,
      0,
      0,
    );

    return this.formatTime(date);
  }

  loadRooms(): void {
    this.loadingRooms = true;
    this.errorMessage = '';

    this.http
      .get<Room[] | { content: Room[] }>(
        '/api/v1/rooms',
      )
      .pipe(
        finalize(
          () => (this.loadingRooms = false),
        ),
      )
      .subscribe({
        next: (response) => {
          const roomList = Array.isArray(response)
            ? response
            : (response.content ?? []);

          this.rooms = roomList.filter(
            (room) =>
              !room.status ||
              room.status === 'ACTIVE',
          );

          if (this.rooms.length === 0) {
            this.errorMessage =
              'No active rooms are available. Please check your room records.';
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.status === 401
              ? 'Your session has expired. Please sign in again.'
              : error.status === 403
                ? 'You do not have permission to load rooms.'
                : 'Unable to load rooms. Please try again.';

          this.log.error(
            'Failed to load rooms:',
            error,
          );
        },
      });
  }

  onStartDateChange(): void {
    if (this.endDate < this.startDate) {
      this.endDate = this.startDate;
    }

    this.clearMessages();
  }

  onStartTimeChange(): void {
    this.clearMessages();
  }

  onEndDateChange(): void {
    this.clearMessages();
  }

  onEndTimeChange(): void {
    this.clearMessages();
  }

  private combineDateAndTime(
    date: string,
    time: string,
  ): Date | null {
    if (!date || !time) {
      return null;
    }

    const result = new Date(`${date}T${time}:00`);

    return Number.isNaN(result.getTime())
      ? null
      : result;
  }

  get startDateTime(): Date | null {
    return this.combineDateAndTime(
      this.startDate,
      this.startTime,
    );
  }

  get endDateTime(): Date | null {
    return this.combineDateAndTime(
      this.endDate,
      this.endTime,
    );
  }

  get invalidDateRange(): boolean {
    const start = this.startDateTime;
    const end = this.endDateTime;

    return (
      !!start &&
      !!end &&
      end.getTime() <= start.getTime()
    );
  }

  get startIsInPast(): boolean {
    const start = this.startDateTime;

    return (
      !!start && start.getTime() <= Date.now()
    );
  }

  get durationMinutes(): number {
    const start = this.startDateTime;
    const end = this.endDateTime;

    if (!start || !end || end <= start) {
      return 0;
    }

    return Math.round(
      (end.getTime() - start.getTime()) / 60000,
    );
  }

  get durationLabel(): string {
    const minutes = this.durationMinutes;

    if (minutes <= 0) {
      return 'Not set';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${minutes} minutes`;
    }

    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  get selectedRoom(): Room | undefined {
    return this.rooms.find(
      (room) => room.roomId === this.roomId,
    );
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.conflictMessage = '';
  }

  submitBooking(): void {
    if (this.saving) {
      return;
    }

    this.clearMessages();

    if (!this.roomId) {
      this.errorMessage =
        'Please select a meeting room.';
      return;
    }

    if (!this.meetingTitle.trim()) {
      this.errorMessage =
        'Please enter a meeting title.';
      return;
    }

    if (!this.purpose.trim()) {
      this.errorMessage =
        'Please describe the purpose of the meeting.';
      return;
    }

    if (
      !this.startDate ||
      !this.startTime ||
      !this.endDate ||
      !this.endTime
    ) {
      this.errorMessage =
        'Please select both the start and end dates and times.';
      return;
    }

    const start = this.startDateTime;
    const end = this.endDateTime;

    if (!start || !end) {
      this.errorMessage =
        'Please enter valid dates and times.';
      return;
    }

    if (start.getTime() <= Date.now()) {
      this.errorMessage =
        'The meeting start date and time must be in the future.';
      return;
    }

    if (end.getTime() <= start.getTime()) {
      this.errorMessage =
        'The end date and time must be later than the start date and time.';
      return;
    }

    const booking = {
      roomId: this.roomId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose: `${this.meetingTitle.trim()} — ${this.purpose.trim()}`,
    };

    this.saving = true;

    this.http
      .get<unknown>(
        '/api/v1/auth/csrf',
      )
      .pipe(
        switchMap(() =>
          this.http.post<BookingResponse>(
            '/api/v1/bookings',
            booking,
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.successMessage =
            'Your booking has been submitted successfully.';

          this.meetingTitle = '';
          this.purpose = '';
          this.roomId = '';

          this.startDate = this.getToday();
          this.endDate = this.getToday();
          this.startTime = this.getNextHour();
          this.endTime = this.addHours(
            this.startTime,
            1,
          );
        },
        error: (error: HttpErrorResponse) => {
          this.saving = false;
          if (error.status === 401) {
            this.clearMessages();
            this.errorMessage =
              'Your session has expired. Please sign in again.';
          } else if (error.status === 403) {
            this.clearMessages();
            this.errorMessage =
              'Request blocked. Please refresh the page and try again.';
          } else if (error.status === 409) {
            this.clearMessages();
            const body = error?.error;
            const message =
              (typeof body === 'string'
                ? body
                : (body?.message ?? '')) || '';
            this.conflictMessage =
              message ||
              'This time slot is already booked. Please choose a different time.';
            setTimeout(() => {
              const el = document.querySelector(
                '.conflict-alert',
              );
              if (el)
                el.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
            }, 50);
          } else if (error.status === 0) {
            this.clearMessages();
            this.errorMessage =
              'Cannot reach the server. Make sure the backend is running.';
          } else {
            this.clearMessages();
            this.errorMessage =
              error.error?.message ||
              `Unable to create the booking (HTTP ${error.status}). Please try again.`;
          }
        },
      });
  }
}
