import {
  Component,
  EventEmitter,
  HostListener,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideClock, LucideLogOut, LucideX } from '@lucide/angular';
import { IconComponent } from '../../../shared/ui';

@Component({
  selector: 'app-confirm-logout-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './confirm-logout-modal.component.html',
  styleUrl: './confirm-logout-modal.component.css',
})
export class ConfirmLogoutModalComponent {
  readonly LucideClock = LucideClock;
  readonly LucideLogOut = LucideLogOut;
  readonly LucideX = LucideX;

  readonly visible = signal(false);

  @Output() confirmed = new EventEmitter<void>();

  show() {
    this.visible.set(true);
  }

  hide() {
    this.visible.set(false);
  }

  confirm() {
    this.visible.set(false);
    this.confirmed.emit();
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEscapeKey(event: Event) {
    if (this.visible()) {
      event.stopPropagation();
      this.hide();
    }
  }
}
