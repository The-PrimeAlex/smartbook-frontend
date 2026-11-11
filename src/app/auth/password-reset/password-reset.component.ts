import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheckCircle,
  LucideEye,
  LucideEyeOff,
  LucideLockKeyhole,
  LucideShieldCheck,
} from '@lucide/angular';

import { PasswordResetService } from '../../core/services/password-reset.service';
import { IconComponent } from '../../shared/ui';

function passwordsMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get(
    'confirmPassword',
  )?.value;

  if (!confirmPassword) {
    return null;
  }

  return newPassword === confirmPassword
    ? null
    : { passwordsDoNotMatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css',
})
export class ResetPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly passwordResetService = inject(
    PasswordResetService,
  );
  private readonly changeDetectorRef = inject(
    ChangeDetectorRef,
  );
  private readonly destroyRef = inject(DestroyRef);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideEye = LucideEye;
  readonly LucideEyeOff = LucideEyeOff;
  readonly LucideLockKeyhole = LucideLockKeyhole;
  readonly LucideShieldCheck = LucideShieldCheck;

  readonly resetPasswordForm =
    this.formBuilder.nonNullable.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(12),
            Validators.pattern(/[a-z]/),
            Validators.pattern(/[A-Z]/),
            Validators.pattern(/[0-9]/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: passwordsMatchValidator,
      },
    );

  readonly resetToken =
    this.activatedRoute.snapshot.queryParamMap
      .get('token')
      ?.trim() ?? '';

  isSubmitting = false;
  submitted = false;
  requestSucceeded = false;
  showNewPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  get hasValidToken(): boolean {
    return this.resetToken.length > 0;
  }

  get newPasswordControl() {
    return this.resetPasswordForm.controls.newPassword;
  }

  get confirmPasswordControl() {
    return this.resetPasswordForm.controls.confirmPassword;
  }

  get newPasswordHasError(): boolean {
    return (
      this.newPasswordControl.invalid &&
      (this.newPasswordControl.touched || this.submitted)
    );
  }

  get confirmPasswordHasError(): boolean {
    return (
      (this.confirmPasswordControl.invalid ||
        this.resetPasswordForm.hasError(
          'passwordsDoNotMatch',
        )) &&
      (this.confirmPasswordControl.touched ||
        this.submitted)
    );
  }

  get passwordsMatch(): boolean {
    const confirmation = this.confirmPasswordControl.value;

    return (
      confirmation.length > 0 &&
      this.newPasswordControl.value === confirmation
    );
  }

  get passwordLengthValid(): boolean {
    return this.newPasswordControl.value.length >= 12;
  }

  get passwordHasLowercase(): boolean {
    return /[a-z]/.test(this.newPasswordControl.value);
  }

  get passwordHasUppercase(): boolean {
    return /[A-Z]/.test(this.newPasswordControl.value);
  }

  get passwordHasNumber(): boolean {
    return /[0-9]/.test(this.newPasswordControl.value);
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.hasValidToken) {
      this.errorMessage =
        'This reset link is missing its security token. Request a new password reset link.';
      return;
    }

    if (
      this.resetPasswordForm.invalid ||
      this.isSubmitting
    ) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const request = {
      token: this.resetToken,
      newPassword: this.newPasswordControl.value,
    };

    this.passwordResetService
      .resetPassword(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.requestSucceeded = true;
          this.resetPasswordForm.reset({
            newPassword: '',
            confirmPassword: '',
          });
          this.changeDetectorRef.detectChanges();
        },
        error: (error: {
          error?: { message?: string };
        }) => {
          this.errorMessage =
            error.error?.message ??
            'We could not reset your password. The link may have expired or already been used. Request a new one and try again.';
        },
      });
  }
}
