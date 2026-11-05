import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCircleAlert,
  
  LucideLogOut,
  LucideX,
} from '@lucide/angular';
import { InactivityService } from '../inactivity.service';
import { IconComponent } from '../../../shared/ui';

@Component({
  selector: 'app-auto-logout-modal',
  standalone: true,
  imports: [CommonModule,  IconComponent],
  templateUrl: './auto-logout-modal.component.html',
  styleUrl: './auto-logout-modal.component.css',
})
export class AutoLogoutModalComponent {
  readonly inactivityService = inject(InactivityService);
  private readonly router = inject(Router);

  readonly LucideCircleAlert = LucideCircleAlert;
  readonly LucideX = LucideX;
  readonly LucideLogOut = LucideLogOut;
  readonly LucideArrowLeft = LucideArrowLeft;

  readonly warningVisible = computed(
    () =>
      this.inactivityService.stateSignal().warningVisible,
  );

  readonly secondsRemaining = computed(
    () =>
      this.inactivityService.stateSignal().secondsRemaining,
  );

  readonly loggedOut = computed(
    () => this.inactivityService.stateSignal().loggedOut,
  );

  readonly backNavWarning = computed(
    () =>
      this.inactivityService.stateSignal().backNavWarning,
  );

  stay() {
    this.inactivityService.stay();
  }

  goToLogin() {
    this.inactivityService.reset();
    this.router.navigate(['/login']);
  }

  confirmBackNavigation() {
    this.inactivityService.confirmBackNavigation();
  }

  dismissBackNavigation() {
    this.inactivityService.dismissBackNavigation();
  }
}
