import { CommonModule } from '@angular/common';
import { createLogger } from '../../../shared/services/logger.service';
import { IconComponent } from '../../../shared/ui';
import { Component, inject, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
} from 'libphonenumber-js/max';
import {
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
  
  LucideHome,
  LucideMail,
  LucideSearch,
  LucideShieldCheck,
  LucideUser,
} from '@lucide/angular';

import {
  CreateUserRequest,
  UserStatus,
} from './add-user.model';
import { UserRole, UsersService } from '../users.service';
import { PageBannerComponent } from '../../../shared/ui';

interface CountryOption {
  countryCode: CountryCode;
  countryName: string;
  callingCode: string;
  flag: string;
}

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    
    PageBannerComponent,
    IconComponent,
  ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css',
})
export class AddUserComponent {
  private readonly log = createLogger('AddUser');
  private readonly usersService = inject(UsersService);
  private readonly formBuilder = inject(FormBuilder);
  cancel = output<void>();

  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronLeft = LucideChevronLeft;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideHome = LucideHome;
  readonly LucideMail = LucideMail;
  readonly LucideSearch = LucideSearch;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideUser = LucideUser;

  readonly roles: { value: UserRole; label: string }[] = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'USER', label: 'User' },
  ];

  readonly statuses: {
    value: UserStatus;
    label: string;
  }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DISABLED', label: 'Disabled' },
    { value: 'PENDING', label: 'Pending' },
  ];

  readonly countries: CountryOption[] =
    this.buildCountries();
  readonly form: FormGroup;

  countryDropdownOpen = false;
  countrySearch = '';
  submitted = false;
  isSubmitting = false;

  constructor() {
    this.form = this.formBuilder.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(120),
        ],
      ],
      countryIsoCode: [
        'KE' as CountryCode,
        Validators.required,
      ],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]+$/),
          (
            control: AbstractControl,
          ): ValidationErrors | null => {
            const phoneNumber = String(
              control.value ?? '',
            ).trim();

            if (!phoneNumber) {
              return null;
            }

            const selectedCountry =
              this.form?.get('countryIsoCode')?.value ??
              'KE';

            try {
              return isValidPhoneNumber(
                phoneNumber,
                selectedCountry,
              )
                ? null
                : { invalidPhone: true };
            } catch {
              return { invalidPhone: true };
            }
          },
        ],
      ],
      role: ['USER' as UserRole, Validators.required],
      status: [
        'PENDING' as UserStatus,
        Validators.required,
      ],
      companyName: [''],
      registrationNumber: [''],
      contactEmail: ['', Validators.email],
    });

    this.form
      .get('countryIsoCode')
      ?.valueChanges.subscribe(() => {
        this.form
          .get('phoneNumber')
          ?.updateValueAndValidity({
            emitEvent: false,
          });
      });

    this.form.get('role')?.valueChanges.subscribe(() => {
      this.updateOrganizationValidators();
    });

    this.updateOrganizationValidators();
  }

  get isAdmin(): boolean {
    return this.form.get('role')?.value === 'ADMIN';
  }

  get selectedCountry(): CountryOption | undefined {
    const selectedCountryCode = this.form.get(
      'countryIsoCode',
    )?.value;

    return this.countries.find(
      (country) =>
        country.countryCode === selectedCountryCode,
    );
  }

  get filteredCountries(): CountryOption[] {
    const searchTerm = this.countrySearch
      .trim()
      .toLowerCase();

    if (!searchTerm) {
      return this.countries;
    }

    const normalizedSearchTerm = searchTerm.replace(
      /\s/g,
      '',
    );

    return this.countries.filter(
      (country) =>
        country.countryName
          .toLowerCase()
          .includes(searchTerm) ||
        country.countryCode
          .toLowerCase()
          .includes(searchTerm) ||
        country.callingCode.includes(normalizedSearchTerm),
    );
  }

  hasError(fieldName: string, errorName?: string): boolean {
    const control = this.form.get(fieldName);

    if (!control || !(control.touched || this.submitted)) {
      return false;
    }

    return errorName
      ? control.hasError(errorName)
      : control.invalid;
  }

  toggleCountryDropdown(): void {
    this.countryDropdownOpen = !this.countryDropdownOpen;

    if (this.countryDropdownOpen) {
      this.countrySearch = '';
    }
  }

  selectCountry(country: CountryOption): void {
    this.form
      .get('countryIsoCode')
      ?.setValue(country.countryCode);
    this.countryDropdownOpen = false;
    this.countrySearch = '';
    this.form.get('phoneNumber')?.markAsTouched();
  }

  onCountrySearch(searchTerm: string): void {
    this.countrySearch = searchTerm;
  }

  onCountrySearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.countryDropdownOpen = false;
      this.countrySearch = '';
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const firstMatchingCountry =
        this.filteredCountries[0];

      if (firstMatchingCountry) {
        this.selectCountry(firstMatchingCountry);
      }
    }
  }

  onPhoneInput(phoneNumber: string): void {
    const digitsOnlyPhoneNumber = phoneNumber.replace(
      /\D/g,
      '',
    );

    if (phoneNumber !== digitsOnlyPhoneNumber) {
      this.form
        .get('phoneNumber')
        ?.setValue(digitsOnlyPhoneNumber, {
          emitEvent: false,
        });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.updateOrganizationValidators();
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    const formValues = this.form.getRawValue();

    const userRequest: CreateUserRequest = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim().toLowerCase(),
      phoneNumber:
        `${getCountryCallingCode(formValues.countryIsoCode as CountryCode)}` +
        formValues.phoneNumber,
      role: formValues.role,
      status: formValues.status,
      companyName: formValues.companyName?.trim() ?? '',
      registrationNumber:
        formValues.registrationNumber?.trim() ?? '',
      companyEmail:
        formValues.contactEmail?.trim().toLowerCase() ?? '',
    };

    this.usersService.addUser(userRequest).subscribe({
      next: (response) => {
        this.log.log(
          'User added successfully:',
          response.message,
        );
        this.isSubmitting = true;
      },
      error: (error) => {
        this.log.error('Failed to add user:', error);

        this.isSubmitting = true;
      },
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private updateOrganizationValidators(): void {
    const companyNameControl = this.form.get('companyName');
    const registrationNumberControl = this.form.get(
      'registrationNumber',
    );
    const contactEmailControl =
      this.form.get('contactEmail');

    if (
      !companyNameControl ||
      !registrationNumberControl ||
      !contactEmailControl
    ) {
      return;
    }

    if (this.form.get('role')?.value === 'USER') {
      companyNameControl.setValidators([
        Validators.required,
        Validators.maxLength(100),
      ]);

      contactEmailControl.setValidators([
        Validators.required,
        Validators.email,
        Validators.maxLength(120),
      ]);
    } else {
      companyNameControl.clearValidators();
      contactEmailControl.clearValidators();
    }

    registrationNumberControl.setValidators([
      Validators.maxLength(60),
    ]);

    companyNameControl.updateValueAndValidity({
      emitEvent: false,
    });
    registrationNumberControl.updateValueAndValidity({
      emitEvent: false,
    });
    contactEmailControl.updateValueAndValidity({
      emitEvent: false,
    });
  }

  private buildCountries(): CountryOption[] {
    const countryNames = new Intl.DisplayNames(['en'], {
      type: 'region',
    });

    return getCountries()
      .map((countryCode): CountryOption => ({
        countryCode,
        countryName:
          countryNames.of(countryCode) ?? countryCode,
        callingCode: `+${getCountryCallingCode(countryCode)}`,
        flag: this.getCountryFlag(countryCode),
      }))
      .sort((firstCountry, secondCountry) =>
        firstCountry.countryName.localeCompare(
          secondCountry.countryName,
        ),
      );
  }

  private getCountryFlag(countryCode: string): string {
    return countryCode
      .toUpperCase()
      .replace(/[A-Z]/g, (character) =>
        String.fromCodePoint(
          character.charCodeAt(0) + 127397,
        ),
      );
  }
}
