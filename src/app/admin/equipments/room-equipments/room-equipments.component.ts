import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { createLogger } from '../../../shared/services/logger.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LucideCheck,
  LucideChevronDown,
  LucideHash,
  LucideMonitor,
  LucidePlus,
  LucideRefreshCw,
  LucideTrash2,
  LucideUsers,
  LucideWrench,
  LucideX,
} from '@lucide/angular';

import { RoomService } from '../../../shared/services/room.service';
import {
  MeetingRoom,
  RoomEquipment,
  RoomEquipmentStatus,
} from '../../../shared/models/room.model';
import { RoomEquipmentService } from '../../../shared/services/room-equipments.service';
import { finalize, forkJoin, timeout } from 'rxjs';
import {
  IconComponent,
  EmptyStateComponent,
  SearchBoxComponent,
  PageBannerComponent,
} from '../../../shared/ui';

export interface RoomCardData {
  room: MeetingRoom;
  equipment: RoomEquipment[];
  loading: boolean;
}

@Component({
  selector: 'app-room-equipment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,

    IconComponent,
    EmptyStateComponent,
    SearchBoxComponent,
    PageBannerComponent,
  ],
  templateUrl: './room-equipments.component.html',
  styleUrl: './room-equipments.component.css',
})
export class RoomEquipmentComponent implements OnInit {
  private readonly log = createLogger(
    'RoomEquipments',
  );
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideHash = LucideHash;
  readonly LucideMonitor = LucideMonitor;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUsers = LucideUsers;
  readonly LucideWrench = LucideWrench;
  readonly LucideX = LucideX;

  private readonly fb = inject(FormBuilder);
  private readonly roomService =
    inject(RoomService);
  private readonly equipmentService = inject(
    RoomEquipmentService,
  );

  roomCards: RoomCardData[] = [];

  loadingRooms = false;

  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  filterStatus: string = 'ALL';

  expandingRoomId: string | null = null;
  addingRoomId: string | null = null;

  // Modal state for add equipment dialog
  addModalOpen = false;
  addModalRoomId: string | null = null;
  addModalRoomName = '';

  readonly statuses: RoomEquipmentStatus[] = [
    'ACTIVE',
    'OUT_OF_SERVICE',
    'RETIRED',
  ];

  readonly equipmentForm =
    this.fb.nonNullable.group({
      equipmentName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
        ],
      ],
      assetCode: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
        ],
      ],
      description: [
        '',
        [Validators.maxLength(500)],
      ],
      status: [
        'ACTIVE' as RoomEquipmentStatus,
        Validators.required,
      ],
    });

  ngOnInit(): void {
    this.loadAllRooms();
  }

  get filteredRooms(): RoomCardData[] {
    let result = this.roomCards;

    // Apply search filter
    const query = this.searchTerm
      .trim()
      .toLowerCase();
    if (query) {
      result = result.filter(
        (card) =>
          card.room.roomName
            .toLowerCase()
            .includes(query) ||
          card.room.roomType
            .toLowerCase()
            .includes(query),
      );
    }

    // Apply status filter
    if (this.filterStatus !== 'ALL') {
      result = result.filter((card) =>
        card.equipment.some(
          (eq) => eq.status === this.filterStatus,
        ),
      );
    }

    return result;
  }

  get totalEquipment(): number {
    return this.roomCards.reduce(
      (sum, card) => sum + card.equipment.length,
      0,
    );
  }

  get totalActive(): number {
    return this.roomCards.reduce(
      (sum, card) =>
        sum +
        card.equipment.filter(
          (eq) => eq.status === 'ACTIVE',
        ).length,
      0,
    );
  }

  get totalOutOfService(): number {
    return this.roomCards.reduce(
      (sum, card) =>
        sum +
        card.equipment.filter(
          (eq) => eq.status === 'OUT_OF_SERVICE',
        ).length,
      0,
    );
  }

  loadAllRooms(): void {
    this.loadingRooms = true;
    this.errorMessage = '';

    this.roomService
      .getRooms()
      .pipe(
        timeout(15000),
        finalize(
          () => (this.loadingRooms = false),
        ),
      )
      .subscribe({
        next: (rooms) => {
          const roomList = rooms ?? [];
          this.roomCards = roomList.map(
            (room) => ({
              room,
              equipment: [] as RoomEquipment[],
              loading: true,
            }),
          );

          // Eagerly load equipment for all rooms in parallel
          if (roomList.length > 0) {
            const equipmentRequests =
              roomList.map((room) =>
                this.roomService.getRoomDetails(
                  room.roomId,
                ),
              );

            forkJoin(equipmentRequests).subscribe({
              next: (detailsList) => {
                detailsList.forEach(
                  (details, index) => {
                    const card =
                      this.roomCards[index];
                    if (card) {
                      card.equipment =
                        details.equipment ?? [];
                      card.loading = false;
                    }
                  },
                );
              },
              error: (error) => {
                this.log.error(
                  'Failed to load some room equipment:',
                  error,
                );
                this.roomCards.forEach(
                  (card) =>
                    (card.loading = false),
                );
              },
            });
          }
        },
        error: (error) => {
          this.loadingRooms = false;
          this.errorMessage =
            error.message ||
            'Could not load rooms. Please try again.';
          this.roomCards = [];
          this.log.error(
            'Failed to load rooms:',
            error,
          );
        },
      });
  }

  loadRoomEquipment(roomId: string): void {
    const card = this.roomCards.find(
      (c) => c.room.roomId === roomId,
    );
    if (!card) return;

    card.loading = true;

    this.roomService
      .getRoomDetails(roomId)
      .subscribe({
        next: (details) => {
          card.equipment =
            details.equipment ?? [];
          card.loading = false;
        },
        error: (error) => {
          this.log.error(
            `Failed to load equipment for room ${roomId}:`,
            error,
          );
          card.loading = false;
        },
      });
  }

  toggleExpand(roomId: string): void {
    this.expandingRoomId =
      this.expandingRoomId === roomId
        ? null
        : roomId;
  }

  openAddModal(roomId: string, roomName: string): void {
    const card = this.roomCards.find(
      (c) => c.room.roomId === roomId,
    );
    // Auto-expand the room card if not already expanded
    if (card && this.expandingRoomId !== roomId) {
      this.expandingRoomId = roomId;
    }

    this.addModalRoomId = roomId;
    this.addModalRoomName = roomName;
    this.equipmentForm.reset({
      equipmentName: '',
      assetCode: '',
      description: '',
      status: 'ACTIVE',
    });
    this.addModalOpen = true;
  }

  closeAddModal(): void {
    this.addModalOpen = false;
    this.addModalRoomId = null;
    this.addModalRoomName = '';
    this.equipmentForm.reset({
      equipmentName: '',
      assetCode: '',
      description: '',
      status: 'ACTIVE',
    });
  }

  getCard(
    roomId: string,
  ): RoomCardData | undefined {
    return this.roomCards.find(
      (c) => c.room.roomId === roomId,
    );
  }

  addEquipment(): void {
    if (!this.addModalRoomId) return;
    const roomId = this.addModalRoomId;

    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.equipmentForm.getRawValue();

    const equipment: RoomEquipment = {
      equipmentName:
        formValue.equipmentName.trim(),
      assetCode: formValue.assetCode.trim(),
      description: formValue.description.trim(),
      status: formValue.status,
    };

    this.errorMessage = '';
    this.successMessage = '';

    this.equipmentService
      .addEquipment(roomId, equipment)
      .subscribe({
        next: () => {
          this.successMessage =
            'Equipment added successfully.';
          this.loadRoomEquipment(roomId);
          this.closeAddModal();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message ||
            error.message ||
            'Could not add equipment.';
        },
      });
  }

  changeStatus(
    roomId: string,
    equipment: RoomEquipment,
    newStatus: string,
  ): void {
    if (
      !this.statuses.includes(
        newStatus as RoomEquipmentStatus,
      )
    ) {
      return;
    }

    const previousStatus = equipment.status;
    const status =
      newStatus as RoomEquipmentStatus;

    if (status === previousStatus) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.equipmentService
      .updateStatus(
        roomId,
        equipment.assetCode,
        status,
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Equipment status updated.';
          this.loadRoomEquipment(roomId);
        },
        error: (error) => {
          equipment.status = previousStatus;
          this.errorMessage =
            error.error?.message ||
            error.message ||
            'Could not update status.';
        },
      });
  }

  removeEquipment(
    roomId: string,
    equipment: RoomEquipment,
  ): void {
    const card = this.roomCards.find(
      (c) => c.room.roomId === roomId,
    );

    const confirmed = window.confirm(
      `Remove "${equipment.equipmentName}" from ${card?.room.roomName}?`,
    );

    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.equipmentService
      .removeEquipment(
        roomId,
        equipment.assetCode,
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Equipment removed successfully.';
          this.loadRoomEquipment(roomId);
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message ||
            error.message ||
            'Could not remove equipment.';
        },
      });
  }

  equipmentStatusLabel(
    status: RoomEquipmentStatus,
  ): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'OUT_OF_SERVICE':
        return 'Out of Service';
      case 'RETIRED':
        return 'Retired';
      default:
        return status;
    }
  }
}
