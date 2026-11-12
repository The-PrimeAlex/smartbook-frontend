import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  LucideCalendar,
  LucideCheck,
  LucideChevronDown,
  LucideClock,
  LucideDollarSign,
  LucideMapPin,
  LucideMonitor,
  LucideSearch,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { RoomService } from '../../../shared/services/room.service';
import { BookingService } from '../../../shared/services/booking.service';
import type {
  MeetingRoom,
  RoomType,
  RoomStatus,
} from '../../../shared/models/room.model';
import {
  PageBannerComponent,
  StatCardComponent,
  SearchBoxComponent,
  FilterGroupComponent,
  EmptyStateComponent,
  type FilterOption,
} from '../../../shared/ui';
import { getBookingStatusLabel } from '../../../shared/directives';

interface RoomEquipmentShort {
  equipmentName: string;
  status: string;
}

interface ScheduleBooking {
  bookingId: string;
  startTime: string;
  endTime: string;
  bookingStatus: string;
  purpose: string;
  userName: string;
}

interface RoomCardData {
  room: MeetingRoom;
  equipment: RoomEquipmentShort[];
  schedule: ScheduleBooking[];
  expanded: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-find-rooms',
  standalone: true,
  imports: [
    PageBannerComponent,
    StatCardComponent,
    SearchBoxComponent,
    FilterGroupComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  templateUrl: './find-rooms.component.html',
  styleUrl: './find-rooms.component.css',
})
export class FindRoomsComponent {
  private readonly roomService =
    inject(RoomService);
  private readonly bookingService = inject(
    BookingService,
  );
  private readonly router = inject(Router);

  readonly LucideCalendar = LucideCalendar;
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideClock = LucideClock;
  readonly LucideDollarSign = LucideDollarSign;
  readonly LucideMapPin = LucideMapPin;
  readonly LucideMonitor = LucideMonitor;
  readonly LucideSearch = LucideSearch;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  readonly filterTypeOptions: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'BOARDROOM', label: 'Boardroom' },
    {
      value: 'VIDEO_CONFERENCE',
      label: 'Video Conference',
    },
    {
      value: 'MEETING_SUITE',
      label: 'Meeting Suite',
    },
  ];

  readonly filterStatusOptions: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  readonly rooms = signal<RoomCardData[]>([]);
  readonly loading = signal(true);

  readonly searchQuery = signal('');
  readonly filterType = signal<string>('all');
  readonly filterStatus = signal<string>('all');

  readonly filteredRooms = computed(() => {
    const query = this.searchQuery()
      .toLowerCase()
      .trim();
    const typeFilter = this.filterType();
    const statusFilter = this.filterStatus();
    let result = this.rooms();

    if (query) {
      result = result.filter(
        (card) =>
          card.room.roomName
            .toLowerCase()
            .includes(query) ||
          card.room.description
            .toLowerCase()
            .includes(query),
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(
        (card) =>
          card.room.roomType === typeFilter,
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(
        (card) =>
          card.room.status === statusFilter,
      );
    }

    return result;
  });

  readonly totalRooms = computed(
    () => this.rooms().length,
  );
  readonly activeRooms = computed(
    () =>
      this.rooms().filter(
        (c) => c.room.status === 'ACTIVE',
      ).length,
  );
  readonly totalCapacity = computed(() =>
    this.rooms().reduce(
      (sum, c) => sum + c.room.capacity,
      0,
    ),
  );
  readonly totalEquipment = computed(() =>
    this.rooms().reduce(
      (sum, c) => sum + c.equipment.length,
      0,
    ),
  );

  ngOnInit() {
    this.loadAllRooms();
  }

  loadAllRooms() {
    this.loading.set(true);

    this.roomService.getRooms().subscribe({
      next: (rooms) => {
        if (rooms.length === 0) {
          this.rooms.set([]);
          this.loading.set(false);
          return;
        }

        const detailRequests = rooms.map((room) =>
          this.roomService.getRoomDetails(
            room.roomId,
          ),
        );

        forkJoin(detailRequests).subscribe({
          next: (details) => {
            // Fetch schedules for all rooms in parallel
            const scheduleRequests = rooms.map(
              (room) =>
                this.bookingService.getRoomSchedule(
                  room.roomId,
                ),
            );

            forkJoin(scheduleRequests).subscribe({
              next: (schedules) => {
                const cards: RoomCardData[] =
                  rooms.map((room, i) => ({
                    room,
                    equipment: (
                      details[i]?.equipment ?? []
                    ).map((eq) => ({
                      equipmentName:
                        eq.equipmentName,
                      status: eq.status,
                    })),
                    schedule: (
                      schedules[i] ?? []
                    ).map((b) => ({
                      bookingId: b.bookingId,
                      startTime: b.startTime,
                      endTime: b.endTime,
                      bookingStatus:
                        b.bookingStatus,
                      purpose: b.purpose,
                      userName: b.userName,
                    })),
                    expanded: false,
                    loading: false,
                  }));
                this.rooms.set(cards);
                this.loading.set(false);
              },
              error: () => {
                // If schedules fail, still show rooms without schedule
                const cards: RoomCardData[] =
                  rooms.map((room, i) => ({
                    room,
                    equipment: (
                      details[i]?.equipment ?? []
                    ).map((eq) => ({
                      equipmentName:
                        eq.equipmentName,
                      status: eq.status,
                    })),
                    schedule: [],
                    expanded: false,
                    loading: false,
                  }));
                this.rooms.set(cards);
                this.loading.set(false);
              },
            });
          },
          error: () => {
            // If details fail, still show rooms without equipment
            const cards: RoomCardData[] =
              rooms.map((room) => ({
                room,
                equipment: [],
                schedule: [],
                expanded: false,
                loading: false,
              }));
            this.rooms.set(cards);
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  toggleExpand(index: number) {
    const filteredCard =
      this.filteredRooms()[index];
    const allCards = this.rooms();
    const realIndex = allCards.findIndex(
      (c) =>
        c.room.roomId ===
        filteredCard.room.roomId,
    );

    if (realIndex >= 0) {
      const newCards = [...allCards];
      newCards[realIndex].expanded =
        !newCards[realIndex].expanded;
      this.rooms.set(newCards);
    }
  }

  bookRoom(roomId: string) {
    this.router.navigate(['/app/bookings/new'], {
      queryParams: { roomId },
    });
  }

  getStatusClass(status: RoomStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'MAINTENANCE':
        return 'status-maintenance';
      case 'RETIRED':
        return 'status-retired';
      default:
        return '';
    }
  }

  getRoomTypeIcon(type: RoomType): string {
    switch (type) {
      case 'BOARDROOM':
        return '🏢';
      case 'VIDEO_CONFERENCE':
        return '📹';
      case 'MEETING_SUITE':
        return '🪑';
      default:
        return '🏠';
    }
  }

  getRoomTypeLabel(type: RoomType): string {
    switch (type) {
      case 'BOARDROOM':
        return 'Boardroom';
      case 'VIDEO_CONFERENCE':
        return 'Video Conference';
      case 'MEETING_SUITE':
        return 'Meeting Suite';
      default:
        return type;
    }
  }

  /**
   * Group schedule bookings by date for timeline display.
   */
  getScheduleByDate(
    bookings: ScheduleBooking[],
  ): {
    date: string;
    bookings: ScheduleBooking[];
  }[] {
    const map = new Map<
      string,
      ScheduleBooking[]
    >();
    for (const b of bookings) {
      const date = new Date(
        b.startTime,
      ).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const existing = map.get(date) ?? [];
      existing.push(b);
      map.set(date, existing);
    }
    return Array.from(map.entries()).map(
      ([date, bookings]) => ({ date, bookings }),
    );
  }

  /**
   * Format a time string for display (e.g., "9:00 AM").
   */
  formatTime(timeStr: string): string {
    return new Date(timeStr).toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      },
    );
  }

  /**
   * Get CSS class for booking status in timeline.
   */
  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'CHECKED_IN':
        return 'status-checked-in';
      case 'COMPLETED':
        return 'status-completed';
      default:
        return '';
    }
  }

  /**
   * Get label for booking status.
   */
  getBookingStatusLabel = getBookingStatusLabel;
}
