import { Component, input, output } from '@angular/core';
import {
  LucideCheckCircle2,
  LucideClock,
  
} from '@lucide/angular';
import { IconComponent } from '../../shared/ui';

export type ModalType = 'success' | 'pending';

@Component({
  selector: 'app-request-result-modal',
  standalone: true,
  imports: [ IconComponent],
  templateUrl: './request-result-modal.component.html',
  styleUrl: './request-result-modal.component.css',
})
export class RequestResultModalComponent {
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideClock = LucideClock;

  readonly type = input.required<ModalType>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly close = output<void>();

  closeModal(): void {
    this.close.emit();
  }
}
