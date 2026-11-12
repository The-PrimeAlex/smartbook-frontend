import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { resetPasswordChangeRedirected } from '../../core/http/auth.interceptor';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = new FormGroup({
    currentPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(12),
      ],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = this.form.getRawValue();

    this.errorMessage.set('');
    this.successMessage.set('');

    if (newPassword !== confirmPassword) {
      this.errorMessage.set(
        'The new passwords do not match.',
      );
      return;
    }

    if (currentPassword === newPassword) {
      this.errorMessage.set(
        'Your new password must be different from your temporary password.',
      );
      return;
    }

    this.loading.set(true);

    this.authService
      .changePassword({ currentPassword, newPassword })
      .pipe(
        // Refresh the user profile and access token after the flag is cleared.
        switchMap(() =>
          this.authService.refreshAccessToken(),
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => {
          // Reset the interceptor guard so future 403 password_change_required
          // errors can be caught again if needed in a later session
          resetPasswordChangeRedirected();
          this.successMessage.set(
            'Password changed successfully.',
          );
          void this.router.navigateByUrl('/dashboard', {
            replaceUrl: true,
          });
        },
        error: (error) => {
          if (error.status === 400) {
            this.errorMessage.set(
              error.error?.message ??
                'Please check your current password and new password.',
            );
          } else {
            this.errorMessage.set(
              'We could not change your password. Please try again.',
            );
          }
        },
      });
  }
}
