import { DecimalPipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  catchError,
  forkJoin,
  of,
  Subscription,
} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  NavigationEnd,
  Router,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  LucideCheck,
  LucideChevronDown,
  LucideMonitor,
  LucideUsers,
  LucideWrench,
} from '@lucide/angular';

import { RoomService } from '../../../shared/services/room.service';
import {
  MeetingRoom,
  RoomEquipment,
  RoomEquipmentStatus,
  RoomStatus,
  RoomType,
} from '../../../shared/models/room.model';
import {
  IconComponent,
  PageBannerComponent,
  type BadgeVariant,
} from '../../../shared/ui';

interface RoomCardData {
  room: MeetingRoom;
  equipment: RoomEquipment[];
  expanded: boolean;
  detailsLoading: boolean;
  detailsLoaded: boolean;
  detailsError: string | null;
}

@Component({
  selector: 'app-view-rooms',
  standalone: true,
  imports: [
    DecimalPipe,
    IconComponent,
    PageBannerComponent,
  ],
  templateUrl: './view-rooms.component.html',
  styleUrl: './view-rooms.component.css',
})
export class ViewRoomsComponent implements OnInit, OnDestroy {
  private readonly roomService =
    inject(RoomService);
  private readonly router = inject(Router);
  private readonly routerSubscription =
    new Subscription();

  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideMonitor = LucideMonitor;
  readonly LucideUsers = LucideUsers;
  readonly LucideWrench = LucideWrench;

  readonly selectedType = signal<
    RoomType | 'ALL'
  >('ALL');
  readonly rooms = signal<MeetingRoom[]>([]);
  readonly roomCards = signal<RoomCardData[]>([]);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly filteredRooms = computed(() => {
    const type = this.selectedType();
    return this.rooms().filter(
      (room) =>
        type === 'ALL' || room.roomType === type,
    );
  });

  readonly filteredCards = computed(() => {
    const filteredRoomIds = new Set(
      this.filteredRooms().map((r) => r.roomId),
    );
    return this.roomCards().filter((card) =>
      filteredRoomIds.has(card.room.roomId),
    );
  });

  readonly activeRoomCount = computed(
    () =>
      this.rooms().filter(
        (room) => room.status === 'ACTIVE',
      ).length,
  );

  readonly totalCapacity = computed(() =>
    this.rooms()
      .filter((room) => room.status === 'ACTIVE')
      .reduce(
        (total, room) =>
          total + (room.capacity ?? 0),
        0,
      ),
  );

  readonly totalEquipment = computed(() =>
    this.roomCards().reduce(
      (sum, card) => sum + card.equipment.length,
      0,
    ),
  );

  ngOnInit(): void {
    this.loadRooms();

    // Reload rooms when navigating back to this page (e.g., after creating a new room)
    this.routerSubscription.add(
      this.router.events
        .pipe(
          filter(
            (e): e is NavigationEnd =>
              e instanceof NavigationEnd,
          ),
        )
        .subscribe(() => {
          this.loadRooms();
        }),
    );
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  loadRooms(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.roomService.getRooms().subscribe({
      next: (response) => {
        const roomList = response ?? [];
        this.rooms.set(roomList);

        // Eagerly load all room equipment details in parallel
        if (roomList.length > 0) {
          const detailsRequests = roomList.map(
            (room) =>
              this.roomService
                .getRoomDetails(room.roomId)
                .pipe(
                  map((details) => ({
                    roomId: room.roomId,
                    equipment:
                      details.equipment ?? [],
                  })),
                  catchError(() =>
                    of({
                      roomId: room.roomId,
                      equipment:
                        [] as RoomEquipment[],
                    }),
                  ),
                ),
          );

          forkJoin(detailsRequests).subscribe({
            next: (results) => {
              const equipmentMap = new Map<
                string,
                RoomEquipment[]
              >();
              results.forEach((result) =>
                equipmentMap.set(
                  result.roomId,
                  result.equipment,
                ),
              );

              this.roomCards.set(
                roomList.map((room) => ({
                  room,
                  equipment:
                    equipmentMap.get(
                      room.roomId,
                    ) ?? [],
                  expanded: false,
                  detailsLoading: false,
                  detailsLoaded: true,
                  detailsError: null,
                })),
              );
              this.loading.set(false);
            },
            error: () => {
              // Fallback: set cards with empty equipment if forkJoin fails
              this.roomCards.set(
                roomList.map((room) => ({
                  room,
                  equipment:
                    [] as RoomEquipment[],
                  expanded: false,
                  detailsLoading: false,
                  detailsLoaded: true,
                  detailsError: null,
                })),
              );
              this.loading.set(false);
            },
          });
        } else {
          this.roomCards.set([]);
          this.loading.set(false);
        }
      },
      error: (error: Error) => {
        this.errorMessage.set(
          error.message ||
            'Unable to load rooms. Please try again.',
        );
        this.loading.set(false);
      },
    });
  }

  setRoomType(type: RoomType | 'ALL'): void {
    this.selectedType.set(type);
  }

  clearFilters(): void {
    this.selectedType.set('ALL');
  }

  toggleExpand(roomId: string): void {
    const cards = this.roomCards();
    const index = cards.findIndex(
      (c) => c.room.roomId === roomId,
    );
    if (index === -1) return;

    const card = cards[index];
    const newCards = [...cards];
    newCards[index] = {
      ...card,
      expanded: !card.expanded,
    };
    this.roomCards.set(newCards);
  }

  roomTypeLabel(type: RoomType): string {
    switch (type) {
      case 'BOARDROOM':
        return 'Boardroom';

      case 'VIDEO_CONFERENCE':
        return 'Video conference';

      case 'MEETING_SUITE':
        return 'Meeting suite';
    }
  }

  roomStatusLabel(status: RoomStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';

      case 'MAINTENANCE':
        return 'Maintenance';

      case 'RETIRED':
        return 'Retired';
    }
  }

  equipmentStatusLabel(
    status: RoomEquipmentStatus,
  ): string {
    switch (status) {
      case 'ACTIVE':
        return 'Available';

      case 'OUT_OF_SERVICE':
        return 'Out of service';

      case 'RETIRED':
        return 'Retired';
    }
  }

  getStatusClass(status: RoomStatus): string {
    const base = 'status-badge';
    switch (status) {
      case 'ACTIVE':
        return `${base} status-active`;
      case 'MAINTENANCE':
        return `${base} status-warning`;
      case 'RETIRED':
        return `${base} status-inactive`;
    }
  }

  getEquipStatusClass(
    status: RoomEquipmentStatus,
  ): string {
    const base = 'status-badge';
    switch (status) {
      case 'ACTIVE':
        return `${base} status-active`;
      case 'OUT_OF_SERVICE':
        return `${base} status-warning`;
      case 'RETIRED':
        return `${base} status-inactive`;
    }
  }
}
