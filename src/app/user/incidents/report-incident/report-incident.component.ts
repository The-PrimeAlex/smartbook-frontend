import {
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import { Router } from '@angular/router';
import { BookingService } from '../../../shared/services/booking.service';
import {
  CreateIncidentRequest,
  IncidentsService,
} from '../../../shared/services/incidents.service';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  LucideCalendar,
  LucideCheckCircle,
  LucideClock,
  LucideFileText,
  LucideHome,
  LucideLoader,
  LucideTriangleAlert,
  LucideXCircle,
  LucideZap,
} from '@lucide/angular';
import {
  PageBannerComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  type BadgeVariant,
} from '../../../shared/ui';
import { getBookingBadgeVariant } from '../../../shared/directives';

interface CheckedInRoom {
  roomId: string;
  roomName: string;
  purpose: string;
  startTime: string;
  endTime: string;
  bookingStatus: string;
}

const INCIDENT_TYPES = [
  {
    value: 'EQUIPMENT_DAMAGE',
    label: 'Equipment Damage',
  },
  { value: 'ROOM_DAMAGE', label: 'Room Damage' },
  { value: 'OTHER', label: 'Other' },
];

@Component({
  selector: 'app-report-incident',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,

    PageBannerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    IconComponent,
  ],
  templateUrl: './report-incident.component.html',
  styleUrl: './report-incident.component.css',
})
export class ReportIncidentComponent implements OnInit {
  readonly incidentTypes = INCIDENT_TYPES;
  checkedInRooms = signal<CheckedInRoom[]>([]);
  selectedRoom = signal<CheckedInRoom | null>(
    null,
  );
  selectedRoomId = signal<string>('');
  incidentType = signal<string>('');
  description = signal<string>('');
  loading = signal(true);
  saving = signal(false);
  success = signal(false);
  error = signal('');

  readonly LucideCalendar = LucideCalendar;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideClock = LucideClock;
  readonly LucideFileText = LucideFileText;
  readonly LucideHome = LucideHome;
  readonly LucideLoader = LucideLoader;
  readonly LucideTriangleAlert =
    LucideTriangleAlert;
  readonly LucideXCircle = LucideXCircle;
  readonly LucideZap = LucideZap;

  getBadgeVariant = getBookingBadgeVariant;

  constructor(
    private bookingService: BookingService,
    private incidentsService: IncidentsService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCheckedInBookings();
  }

  loadCheckedInBookings(): void {
    this.loading.set(true);
    this.bookingService
      .getMyBookings()
      .subscribe({
        next: (bookings) => {
          const eligible = bookings
            .filter(
              (b) =>
                b.bookingStatus ===
                  'CHECKED_IN' ||
                b.bookingStatus === 'COMPLETED',
            )
            .map((b) => ({
              roomId: b.roomId,
              roomName: b.roomName,
              purpose: b.purpose,
              startTime: b.startTime,
              endTime: b.endTime,
              bookingStatus: b.bookingStatus,
            }));
          this.checkedInRooms.set(eligible);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  selectRoom(room: CheckedInRoom): void {
    this.selectedRoom.set(room);
    this.selectedRoomId.set(room.roomId);
  }

  submitIncident(): void {
    if (
      !this.selectedRoomId() ||
      !this.incidentType() ||
      !this.description()
    ) {
      this.error.set(
        'Please fill in all fields.',
      );
      return;
    }

    this.error.set('');
    this.saving.set(true);

    const request: CreateIncidentRequest = {
      roomId: this.selectedRoomId(),
      incidentType:
        this.incidentType() as CreateIncidentRequest['incidentType'],
      description: this.description(),
    };

    this.incidentsService
      .createIncident(request)
      .subscribe({
        next: () => {
          this.success.set(true);
          this.saving.set(false);
          setTimeout(() => {
            this.router.navigate([
              '/app/incidents/new',
            ]);
          }, 2000);
        },
        error: (err) => {
          this.error.set(
            err.error?.message ||
              'Failed to report incident. Please try again.',
          );
          this.saving.set(false);
        },
      });
  }
}
