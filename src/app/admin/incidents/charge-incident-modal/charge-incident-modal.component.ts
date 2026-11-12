import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormsModule,
  NgForm,
} from '@angular/forms';
import {
  LucideDynamicIcon,
  LucideFileText,
  LucideLoader,
} from '@lucide/angular';
import { IconComponent } from '../../../shared/ui';

@Component({
  selector: 'app-charge-incident-modal',
  standalone: true,
  imports: [
    FormsModule,
    LucideDynamicIcon,
    IconComponent,
  ],
  templateUrl:
    './charge-incident-modal.component.html',
  styleUrl:
    './charge-incident-modal.component.css',
})
export class ChargeIncidentModalComponent {
  readonly LucideFileText = LucideFileText;
  readonly LucideLoader = LucideLoader;

  @Input() chargeAmount = '';
  @Input() chargeReason = '';
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{
    amount: string;
    reason: string;
  }>();

  @ViewChild('chargeForm') form?: NgForm;

  protected visible = false;
  /** Prevents the opening click from immediately closing the modal */
  protected interactive = false;

  @Input()
  set setVisible(v: boolean) {
    if (v && !this.visible) {
      // Modal just opened — delay enabling pointer interaction
      this.interactive = false;
    }
    this.visible = v;
    if (v && this.interactive === false) {
      setTimeout(() => {
        this.interactive = true;
      }, 100);
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (!this.interactive) return;
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onSubmit() {
    if (this.form?.valid && this.chargeAmount) {
      this.submit.emit({
        amount: this.chargeAmount,
        reason: this.chargeReason,
      });
    }
  }

  onCancel() {
    this.close.emit();
  }
}
