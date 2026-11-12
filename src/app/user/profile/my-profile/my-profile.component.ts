import { CommonModule } from '@angular/common';
import { createLogger } from '../../../shared/services/logger.service';
import { IconComponent } from '../../../shared/ui';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  FormBuilder,
  Validators,
} from '@angular/forms';
import {
  LucideBuilding2,
  LucideCheckCircle2,
  LucideFileText,
  LucideMail,
  LucidePencil,
  LucidePhone,
  LucideUser,
  LucideXCircle,
} from '@lucide/angular';
import {
  UsersService,
  MyProfile,
} from '../../../admin/users/users.service';
import { PageBannerComponent } from '../../../shared/ui';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    PageBannerComponent,
    IconComponent,
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css',
})
export class MyProfileComponent implements OnInit {
  private readonly log =
    createLogger('MyProfile');
  private readonly usersService =
    inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly LucideBuilding2 = LucideBuilding2;
  readonly LucideCheckCircle2 =
    LucideCheckCircle2;
  readonly LucideFileText = LucideFileText;
  readonly LucideMail = LucideMail;
  readonly LucidePencil = LucidePencil;
  readonly LucidePhone = LucidePhone;
  readonly LucideUser = LucideUser;
  readonly LucideXCircle = LucideXCircle;

  readonly profile = signal<MyProfile | null>(
    null,
  );
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editing = signal(false);

  readonly fullName = computed(() => {
    const user = this.profile();

    if (!user) return '';

    return `${user.firstName} ${user.lastName}`.trim();
  });

  readonly initials = computed(() => {
    const user = this.profile();

    if (!user) return '';

    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  });

  readonly profileForm =
    this.fb.nonNullable.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(200),
        ],
      ],
      phoneNumber: [
        '',
        [Validators.maxLength(20)],
      ],
    });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.editing.set(false);

    this.usersService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phoneNumber: profile.phoneNumber,
        });
        this.loading.set(false);
      },
      error: (error) => {
        this.log.error(
          'Failed to load profile:',
          error,
        );
        this.errorMessage.set(
          'Unable to load your profile. Please try again.',
        );
        this.loading.set(false);
      },
    });
  }

  startEditing(): void {
    this.editing.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    if (this.profile()) {
      this.profileForm.patchValue({
        firstName: this.profile()!.firstName,
        lastName: this.profile()!.lastName,
        email: this.profile()!.email,
        phoneNumber: this.profile()!.phoneNumber,
      });
    }
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.profileForm.reset();
    if (this.profile()) {
      this.profileForm.patchValue({
        firstName: this.profile()!.firstName,
        lastName: this.profile()!.lastName,
        email: this.profile()!.email,
        phoneNumber: this.profile()!.phoneNumber,
      });
    }
    this.errorMessage.set('');
  }

  saveProfile(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const updatedProfile: MyProfile = {
      ...this.profile()!,
      ...this.profileForm.getRawValue(),
      organization:
        this.profile()?.organization ?? null,
    };

    this.saving.set(true);

    this.usersService
      .updateProfile(updatedProfile)
      .subscribe({
        next: () => {
          this.profile.set(updatedProfile);
          this.saving.set(false);
          this.editing.set(false);
          this.successMessage.set(
            'Your profile has been updated successfully.',
          );
        },
        error: (error) => {
          this.log.error(
            'Failed to update profile:',
            error,
          );
          this.saving.set(false);
          const message =
            typeof error === 'object' &&
            error !== null &&
            'error' in error &&
            typeof error.error === 'object' &&
            error.error !== null &&
            'message' in error.error &&
            typeof error.error.message ===
              'string'
              ? error.error.message
              : 'Unable to update your profile. Please try again.';

          this.errorMessage.set(message);
        },
      });
  }
}
