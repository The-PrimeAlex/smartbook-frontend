import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideDynamicIcon,
  LucideLoader,
  LucideX,
} from '@lucide/angular';
import { IconComponent } from '../../../shared/ui';

@Component({
  selector: 'app-waive-incident-modal',
  standalone: true,
  imports: [FormsModule, LucideDynamicIcon, IconComponent],
  templateUrl: './waive-incident-modal.component.html',
  styleUrl: './waive-incident-modal.component.css',
})
export class WaiveIncidentModalComponent {
  readonly LucideLoader = LucideLoader;
  readonly LucideX = LucideX;

  @Input() waiveReason = '';
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<string>();

  protected visible = false;
  /** Prevents the opening click from immediately closing the modal */
  protected interactive = false;

  @Input()
  set setVisible(v: boolean) {
    if (v && !this.visible) {
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
    this.submit.emit(this.waiveReason);
  }

  onCancel() {
    this.close.emit();
  }
}
