import {
  Component,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheckCircle,
  LucideMail,
  LucideShieldCheck,
} from '@lucide/angular';
import { PasswordResetService } from '../../core/services/password-reset.service';
import { IconComponent } from '../../shared/ui';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class PasswordResetComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly passwordResetService = inject(
    PasswordResetService,
  );

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideMail = LucideMail;
  readonly LucideShieldCheck = LucideShieldCheck;

  constructor(private readonly cdr: ChangeDetectorRef) {}
  readonly passwordResetForm =
    this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
    });

  isSubmitting = false;
  requestSubmitted = false;
  submitted = false;
  errorMessage = '';

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (
      this.passwordResetForm.invalid ||
      this.isSubmitting
    ) {
      this.passwordResetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const request = {
      email:
        this.passwordResetForm.controls.email.value.trim(),
    };

    this.passwordResetService
      .requestPasswordReset(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.requestSubmitted = true;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage =
            'We could not connect to SmartBook. Please try again in a moment.';
        },
      });
  }

  useAnotherEmail(): void {
    this.requestSubmitted = false;
    this.submitted = false;
    this.errorMessage = '';
    this.passwordResetForm.reset({ email: '' });
  }

  get emailHasError(): boolean {
    const emailControl =
      this.passwordResetForm.controls.email;

    return (
      emailControl.invalid &&
      (emailControl.touched || this.submitted)
    );
  }

  get emailErrorMessage(): string {
    const emailControl =
      this.passwordResetForm.controls.email;

    if (emailControl.hasError('required')) {
      return 'Enter your email address.';
    }

    if (emailControl.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return '';
  }
}
