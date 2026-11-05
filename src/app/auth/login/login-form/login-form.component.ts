import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
})
export class LoginFormComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly showPassword = signal<boolean>(false);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set('');
      }
    });
  }

  get emailControl() {
    return this.form.get('email');
  }
  setShowPassword(): void {
    this.showPassword.update((current) => !current);
  }
  onSubmit(): void {
    if (this.loading()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          if (user.mustChangePassword) {
            void this.router.navigate(
              ['/change-password'],
              {
                replaceUrl: true,
              },
            );
            return;
          }

          const returnUrl =
            this.route.snapshot.queryParamMap.get(
              'returnUrl',
            );

          // Use replaceUrl: true so the login page is removed from browser history.
          // This prevents the back button from returning to the login page.
          const options = { replaceUrl: true };

          if (
            returnUrl?.startsWith('/') &&
            !returnUrl.startsWith('//')
          ) {
            void this.router.navigateByUrl(
              returnUrl,
              options,
            );
            return;
          }

          // Redirect to role-appropriate dashboard
          const destination = this.authService.hasRole(
            'ADMIN',
          )
            ? '/admin/dashboard'
            : '/dashboard';
          void this.router.navigateByUrl(
            destination,
            options,
          );
        },

        error: () => {
          this.errorMessage.set(
            'You have entered an invalid email or password',
          );
        },
      });
  }
}
