import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/ui';
import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideCheck,
  LucideCheckCircle2,
  LucideClock,
  LucideFileText,
  LucideLock,
  LucideMail,
  LucideShield,
  LucideShieldCheck,
  LucideUser,
  LucideZap,
} from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { PageBannerComponent } from '../../../shared/ui';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [
    CommonModule,

    PageBannerComponent,
    IconComponent,
  ],
  templateUrl: './security.component.html',
  styleUrl: './security.component.css',
})
export class SecurityComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideClock = LucideClock;
  readonly LucideFileText = LucideFileText;
  readonly LucideLock = LucideLock;
  readonly LucideMail = LucideMail;
  readonly LucideShield = LucideShield;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideUser = LucideUser;
  readonly LucideZap = LucideZap;

  readonly loading = signal(true);
  readonly userEmail = signal('');
  readonly sessionAgeMinutes = signal(0);

  ngOnInit(): void {
    this.loading.set(true);
    const user = this.authService.currentUser();
    if (user) {
      this.userEmail.set(user.email);
      this.loading.set(false);
    } else {
      this.loading.set(false);
    }
  }

  goToChangePassword(): void {
    this.router.navigate(['/app/profile/password']);
  }

  goToProfile(): void {
    this.router.navigate(['/app/profile']);
  }
}
