import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideLayoutGrid } from '@lucide/angular';

import { RoomService } from '../../../shared/services/room.service';
import {
  RoomType,
  RoomStatus,
} from '../../../shared/models/room.model';
import { PageBannerComponent } from '../../../shared/ui';

@Component({
  selector: 'app-new-room',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageBannerComponent,
  ],
  templateUrl: './new-room.component.html',
  styleUrl: './new-room.component.css',
})
export class NewRoomComponent {
  readonly LucideLayoutGrid = LucideLayoutGrid;
  private readonly fb = inject(FormBuilder);
  private readonly roomService = inject(RoomService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly roomTypes: { value: RoomType; label: string }[] =
    [
      { value: 'BOARDROOM', label: 'Boardroom' },
      {
        value: 'VIDEO_CONFERENCE',
        label: 'Video Conference',
      },
      { value: 'MEETING_SUITE', label: 'Meeting Suite' },
    ];

  readonly roomStatuses: {
    value: RoomStatus;
    label: string;
  }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'RETIRED', label: 'Retired' },
  ];

  readonly roomForm = this.fb.nonNullable.group({
    roomName: [
      '',
      [Validators.required, Validators.maxLength(100)],
    ],
    roomType: [
      'BOARDROOM' as RoomType,
      Validators.required,
    ],
    capacity: [
      8,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(1000),
      ],
    ],
    hourlyRate: [
      0,
      [Validators.required, Validators.min(0)],
    ],
    status: ['ACTIVE' as RoomStatus, Validators.required],
    description: ['', [Validators.maxLength(1000)]],
  });

  fieldInvalid(
    field: keyof typeof this.roomForm.controls,
  ): boolean {
    const control = this.roomForm.controls[field];
    return (
      control.invalid && (control.dirty || control.touched)
    );
  }

  submitRoom(): void {
    this.roomForm.markAllAsTouched();
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.roomForm.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);

    const formValue = this.roomForm.getRawValue();

    this.roomService
      .createRoom({
        roomName: formValue.roomName.trim(),
        roomType: formValue.roomType,
        capacity: formValue.capacity,
        hourlyRate: formValue.hourlyRate,
        status: formValue.status,
        description: formValue.description.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.successMessage.set(
            'Room created successfully.',
          );

          void this.router.navigate(['/admin/rooms']);
        },
        error: (error: Error) => {
          this.submitting.set(false);
          this.errorMessage.set(
            error.message || 'Unable to create the room.',
          );
        },
      });
  }

  resetForm(): void {
    this.roomForm.reset({
      roomName: '',
      roomType: 'BOARDROOM',
      capacity: 8,
      hourlyRate: 0,
      status: 'ACTIVE',
      description: '',
    });

    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
