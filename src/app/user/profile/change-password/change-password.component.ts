import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/ui';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { LucideLock } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { PageBannerComponent } from '../../../shared/ui';
import { resetPasswordChangeRedirected } from '../../../core/http/auth.interceptor';

function passwordsMatch(
  control: AbstractControl,
): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get(
    'confirmPassword',
  )?.value;

  if (!newPassword || !confirmPassword) {
    return null;
  }

  return newPassword === confirmPassword
    ? null
    : { passwordsMismatch: true };
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    PageBannerComponent,
    IconComponent,
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly LucideLock = LucideLock;

  readonly loading = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: [
        '',
        [Validators.required, Validators.minLength(12)],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  changePassword(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } =
      this.passwordForm.getRawValue();

    this.loading.set(true);

    this.authService
      .changePassword({ currentPassword, newPassword })
      .subscribe({
        next: () => {
          // The backend returns a new access token with updated user data.
          // The auth service already applied the response (stored token + user).
          resetPasswordChangeRedirected();
          this.loading.set(false);
          this.passwordForm.reset();

          this.successMessage.set(
            'Your password has been changed successfully.',
          );
        },
        error: (error: unknown) => {
          this.loading.set(false);

          const message =
            typeof error === 'object' &&
            error !== null &&
            'error' in error &&
            typeof error.error === 'object' &&
            error.error !== null &&
            'message' in error.error &&
            typeof error.error.message === 'string'
              ? error.error.message
              : 'Unable to change your password. Check your current password and try again.';

          this.errorMessage.set(message);
        },
      });
  }
}
