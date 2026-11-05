import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideLayoutGrid,
  LucideSearch,
} from '@lucide/angular';
import {
  RoomService,
  CreateRoomRequest,
} from '../../../shared/services/room.service';
import {
  MeetingRoom,
  RoomType,
  RoomStatus,
} from '../../../shared/models/room.model';
import {
  PageBannerComponent,
  SearchBoxComponent,
  EmptyStateComponent,
} from '../../../shared/ui';

@Component({
  selector: 'app-room-configuration',
  standalone: true,
  imports: [
    FormsModule,
    PageBannerComponent,
    SearchBoxComponent,
    EmptyStateComponent,
  ],
  templateUrl: './room-configuration.component.html',
  styleUrl: './room-configuration.component.css',
})
export class RoomConfigurationComponent implements OnInit {
  readonly LucideLayoutGrid = LucideLayoutGrid;
  readonly LucideSearch = LucideSearch;
  private readonly roomService = inject(RoomService);

  readonly rooms = signal<MeetingRoom[]>([]);
  readonly filteredRooms = signal<MeetingRoom[]>([]);
  readonly searchQuery = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');

  /* Selected room for inline editing panel */
  readonly selectedRoom = signal<MeetingRoom | null>(null);
  readonly editing = signal(false);
  readonly draft = signal<CreateRoomRequest>({
    roomName: '',
    roomType: 'BOARDROOM',
    capacity: 1,
    hourlyRate: 0,
    status: 'ACTIVE',
    description: '',
  });

  readonly roomTypes: RoomType[] = [
    'BOARDROOM',
    'VIDEO_CONFERENCE',
    'MEETING_SUITE',
  ];
  readonly roomStatuses: RoomStatus[] = [
    'ACTIVE',
    'MAINTENANCE',
    'RETIRED',
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.roomService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.filterRooms();
        this.loading.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  selectRoom(room: MeetingRoom): void {
    this.selectedRoom.set(room);
    this.editing.set(false);
    this.draft.set({
      roomName: room.roomName,
      roomType: room.roomType,
      capacity: room.capacity,
      hourlyRate: room.hourlyRate,
      status: room.status,
      description: room.description ?? '',
    });
  }

  startEditing(): void {
    this.editing.set(true);
  }

  cancelEditing(): void {
    const room = this.selectedRoom();
    if (room) {
      this.draft.set({
        roomName: room.roomName,
        roomType: room.roomType,
        capacity: room.capacity,
        hourlyRate: room.hourlyRate,
        status: room.status,
        description: room.description ?? '',
      });
    }
    this.editing.set(false);
  }

  saveRoom(): void {
    const room = this.selectedRoom();
    if (!room) return;
    const draft = this.draft();

    this.saving.set(true);
    this.error.set('');
    this.roomService
      .updateRoom(room.roomId, draft)
      .subscribe({
        next: (updated) => {
          this.rooms.update((rooms) =>
            rooms.map((r) =>
              r.roomId === room.roomId ? updated : r,
            ),
          );
          this.selectedRoom.set(updated);
          this.saved.set(true);
          this.saving.set(false);
          this.editing.set(false);
          setTimeout(() => this.saved.set(false), 3000);
        },
        error: (e: Error) => {
          this.error.set(e.message);
          this.saving.set(false);
        },
      });
  }

  setDraftField(
    field: keyof CreateRoomRequest,
    value: string | number,
  ): void {
    this.draft.update((v) => ({ ...v, [field]: value }));
  }

  formatRoomType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  setSearch(query: string): void {
    this.searchQuery.set(query);
    this.filterRooms();
  }

  filterRooms(): void {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredRooms.set(this.rooms());
    } else {
      this.filteredRooms.set(
        this.rooms().filter(
          (r) =>
            r.roomName.toLowerCase().includes(query) ||
            r.roomType.toLowerCase().includes(query) ||
            (r.description &&
              r.description.toLowerCase().includes(query)),
        ),
      );
    }
  }

  formatStatus(status: string): string {
    return (
      status.charAt(0).toUpperCase() +
      status.slice(1).toLowerCase()
    );
  }
}
