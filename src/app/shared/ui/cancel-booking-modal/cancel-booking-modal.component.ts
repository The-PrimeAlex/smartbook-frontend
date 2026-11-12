import {
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideOctagonAlert,
  LucideInfo,
} from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

export interface CancelBookingModalData {
  roomName: string;
  startTime: string;
  endTime: string;
  hasFee: boolean;
  feeAmount: string;
  freeCancellationHours: number;
}

@Component({
  selector: 'app-cancel-booking-modal',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl:
    './cancel-booking-modal.component.html',
  styleUrl:
    './cancel-booking-modal.component.css',
})
export class CancelBookingModalComponent {
  readonly LucideOctagonAlert =
    LucideOctagonAlert;
  readonly LucideInfo = LucideInfo;

  readonly data =
    input.required<CancelBookingModalData>();
  readonly cancel = output<void>();
  readonly confirm = output<string>(); // cancellation reason

  reason = '';

  onConfirm(): void {
    const trimmed = this.reason.trim();
    if (!trimmed) return;
    this.confirm.emit(trimmed);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
