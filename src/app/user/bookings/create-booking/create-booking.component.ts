import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { finalize } from 'rxjs';
import {
  LucideAlertCircle,
  LucideAlertTriangle,
  LucideArrowDown,
  LucideArrowRight,
  LucideCalendar,
  LucideCalendarCheck,
  LucideCheck,
  LucideCheckCircle,
  LucideChevronDown,
  LucideCircleHelp,
  LucideClipboardList,
  LucideClock,
  LucideFileText,
  LucideLightbulb,
  LucideMonitor,
  LucideTimer,
  LucideUser,
  LucideX,
  LucideXCircle,
} from '@lucide/angular';

import { BookingService } from '../../../shared/services/booking.service';
import { MeetingRoom } from '../../../shared/models/room.model';
import { RoomService } from '../../../shared/services/room.service';
import {
  PageBannerComponent,
  IconComponent,
  DatePickerComponent,
  TimePickerComponent,
} from '../../../shared/ui';

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,

    PageBannerComponent,
    IconComponent,
    DatePickerComponent,
    TimePickerComponent,
  ],
  templateUrl: './create-booking.component.html',
  styleUrl: './create-booking.component.css',
})
export class CreateBookingComponent implements OnInit {
  private readonly bookingService = inject(
    BookingService,
  );
  private readonly roomService =
    inject(RoomService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(
    ChangeDetectorRef,
  );

  readonly LucideAlertCircle = LucideAlertCircle;
  readonly LucideAlertTriangle =
    LucideAlertTriangle;
  readonly LucideArrowDown = LucideArrowDown;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideCalendarCheck =
    LucideCalendarCheck;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideCircleHelp = LucideCircleHelp;
  readonly LucideClipboardList =
    LucideClipboardList;
  readonly LucideClock = LucideClock;
  readonly LucideFileText = LucideFileText;
  readonly LucideLightbulb = LucideLightbulb;
  readonly LucideMonitor = LucideMonitor;
  readonly LucideTimer = LucideTimer;
  readonly LucideUser = LucideUser;
  readonly LucideX = LucideX;
  readonly LucideXCircle = LucideXCircle;

  rooms: MeetingRoom[] = [];
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

  // Conflict modal state
  showConflictModal = false;
  conflictType = '';
  conflictRoomName = '';
  conflictUserName = '';
  conflictStart = '';
  conflictEnd = '';
  conflictAvailableFrom = '';
  conflictCooldownMinutes: number | null = null;

  ngOnInit(): void {
    this.loadRooms();

    // Pre-select room if navigated from Find Rooms
    this.route.queryParams.subscribe((params) => {
      const roomId = params['roomId'];
      if (roomId) {
        this.roomId = roomId;
      }
    });
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

    this.roomService
      .getRooms()
      .pipe(
        finalize(
          () => (this.loadingRooms = false),
        ),
      )
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms.filter(
            (room) => room.status === 'ACTIVE',
          );

          if (this.rooms.length === 0) {
            this.errorMessage =
              'No active rooms are available. Please check back later.';
          }
        },
        error: () => {
          this.errorMessage =
            'Unable to load rooms. Please try again.';
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
    if (!date || !time) return null;
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
    if (!start || !end || end <= start) return 0;
    return Math.round(
      (end.getTime() - start.getTime()) / 60000,
    );
  }

  get durationLabel(): string {
    const minutes = this.durationMinutes;
    if (minutes <= 0) return 'Not set';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${minutes} minutes`;
    if (remainingMinutes === 0)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours}h ${remainingMinutes}m`;
  }

  get selectedRoom() {
    return this.rooms.find(
      (room) => room.roomId === this.roomId,
    );
  }

  get estimatedTotal(): number {
    const rate = this.selectedRoom?.hourlyRate;
    if (!rate || this.durationMinutes <= 0)
      return 0;
    return rate * (this.durationMinutes / 60);
  }

  get estimatedTotalFormatted(): string {
    if (this.estimatedTotal === 0) return '—';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(this.estimatedTotal);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.conflictMessage = '';
  }

  submitBooking(): void {
    // Guard against double submission
    if (this.saving) return;

    // Validate first before clearing messages
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

    // All validation passed — now clear messages and submit
    this.clearMessages();
    this.saving = true;

    const booking = {
      roomId: this.roomId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose: `${this.meetingTitle.trim()} — ${this.purpose.trim()}`,
    };

    this.bookingService
      .createBooking(booking)
      .pipe(
        finalize(() => {
          // Always stop the spinner when the request completes (success or error)
          this.saving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.successMessage =
            'Your booking has been submitted successfully.';

          // Navigate to upcoming bookings after a short delay so the success message is visible
          setTimeout(() => {
            this.router.navigate([
              '/app/bookings/upcoming',
            ]);
          }, 1500);
        },
        error: (error: any) => {
          console.log(
            'Booking error received:',
            error,
          );
          this.saving = false;

          // If the request was cancelled (e.g., navigation away), ignore it
          if (error?.name === 'HttpFailure' && error?.status === 0) {
            return;
          }

          if (error?.status === 401) {
            // Token expired or invalid — the auth interceptor will handle the redirect
            this.clearMessages();
            this.errorMessage =
              'Your session has expired. Please log in again.';
            return;
          }

          if (error?.status === 409) {
            console.log(
              '409 conflict detected, body:',
              error?.error,
            );
            this.clearMessages();
            const body = error?.error;

            // Check if we got structured conflict info from the backend
            if (
              body &&
              typeof body === 'object' &&
              body.conflictType
            ) {
              this.conflictType =
                body.conflictType || '';
              this.conflictRoomName =
                body.roomName || '';
              this.conflictUserName =
                body.conflictingUserName ||
                'another user';
              this.conflictStart =
                body.conflictingStart || '';
              this.conflictEnd =
                body.conflictingEnd || '';
              this.conflictAvailableFrom =
                body.availableFrom || '';
              this.conflictCooldownMinutes =
                body.cooldownMinutes ?? null;
              this.conflictMessage =
                body.message ||
                'This time slot is already booked.';
              console.log(
                'Setting showConflictModal = true',
              );
              this.showConflictModal = true;
              console.log(
                'showConflictModal is now:',
                this.showConflictModal,
              );
              this.cdr.detectChanges();
            } else {
              // Fallback for plain text error
              const message =
                (typeof body === 'string'
                  ? body
                  : (body?.message ?? '')) || '';
              this.conflictMessage =
                message ||
                'This time slot is already booked. Please choose a different time.';
              // Scroll the alert into view so the user sees it
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
            }
          } else if (error?.status === 403) {
            this.clearMessages();
            const body = error?.error;
            // Check if this is a password change required error
            if (
              typeof body === 'object' &&
              body !== null &&
              (body as Record<string, string>)[
                'error'
              ] === 'password_change_required'
            ) {
              this.errorMessage =
                'You need to change your password before making bookings. Redirecting...';
            } else {
              this.errorMessage =
                'Request blocked due to a security check. Please refresh the page and try again.';
            }
          } else if (error?.status === 0) {
            this.clearMessages();
            this.errorMessage =
              'Cannot reach the server. Make sure the backend is running.';
          } else {
            this.clearMessages();
            const body = error?.error;
            const message =
              (typeof body === 'string'
                ? body
                : (body?.message ?? '')) || '';
            this.errorMessage =
              message ||
              'Unable to create the booking. Please try again.';
          }
        },
      });
  }

  goToUpcoming(): void {
    this.router.navigate([
      '/app/bookings/upcoming',
    ]);
  }

  closeConflictModal(): void {
    this.showConflictModal = false;
  }

  get conflictTitle(): string {
    switch (this.conflictType) {
      case 'OVERLAP':
        return 'Room Already Booked';
      case 'BUFFER':
        return 'Buffer Time Required';
      case 'COOLDOWN':
        return 'Room in Cooldown';
      default:
        return 'Booking Conflict';
    }
  }

  get conflictIconDescription(): string {
    switch (this.conflictType) {
      case 'OVERLAP':
        return 'This room has an overlapping booking during your requested time.';
      case 'BUFFER':
        return 'A minimum gap is required between bookings for room cleanup.';
      case 'COOLDOWN':
        return 'This room is currently in use and needs cooldown time before the next booking.';
      default:
        return 'This time slot is unavailable.';
    }
  }
}
