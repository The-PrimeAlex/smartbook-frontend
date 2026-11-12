import { Component, inject } from '@angular/core';
import { createLogger } from '../../shared/services/logger.service';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Router,
  RouterLink,
} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
} from 'libphonenumber-js/max';
import { AuthService } from '../../core/auth/auth.service';
import { RequestResultModalComponent } from '../request-result-modal/request-result-modal.component';
import { IconComponent } from '../../shared/ui';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideBuilding,
  LucideChevronDown,
  LucideSearch,
  LucideShieldCheck,
  LucideUserRound,
} from '@lucide/angular';
import { environment } from '../../../environments/environment';

interface CountryOption {
  countryCode: CountryCode;
  countryName: string;
  callingCode: string;
  flag: string;
}

@Component({
  selector: 'app-registration-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,

    RequestResultModalComponent,
    IconComponent,
  ],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css',
})
export class RegistrationRequestComponent {
  private readonly log = createLogger(
    'Registration',
  );
  private readonly formBuilder =
    inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService =
    inject(AuthService);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideBuilding = LucideBuilding;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideSearch = LucideSearch;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideUserRound = LucideUserRound;

  loading = false;
  submitted = false;
  errorMessage = '';
  showModal = false;
  modalType: 'success' | 'pending' = 'pending';
  modalTitle = '';
  modalMessage = '';

  readonly countries: CountryOption[] =
    this.buildCountries();
  countryDropdownOpen = false;
  countrySearch = '';

  readonly registrationForm =
    this.formBuilder.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [
        '',
        [Validators.required, Validators.email],
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
              this.registrationForm?.get(
                'countryIsoCode',
              )?.value ?? 'KE';
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
      companyName: ['', Validators.required],
      registrationNumber: [''],
      contactEmail: [
        '',
        [Validators.required, Validators.email],
      ],
    });

  constructor() {
    this.registrationForm
      .get('countryIsoCode')
      ?.valueChanges.subscribe(() => {
        this.registrationForm
          .get('phoneNumber')
          ?.updateValueAndValidity({
            emitEvent: false,
          });
      });
  }

  get selectedCountry():
    CountryOption | undefined {
    const selectedCountryCode =
      this.registrationForm.get(
        'countryIsoCode',
      )?.value;
    return this.countries.find(
      (country) =>
        country.countryCode ===
        selectedCountryCode,
    );
  }

  get filteredCountries(): CountryOption[] {
    const searchTerm = this.countrySearch
      .trim()
      .toLowerCase();
    if (!searchTerm) {
      return this.countries;
    }
    const normalizedSearchTerm =
      searchTerm.replace(/\s/g, '');
    return this.countries.filter(
      (country) =>
        country.countryName
          .toLowerCase()
          .includes(searchTerm) ||
        country.countryCode
          .toLowerCase()
          .includes(searchTerm) ||
        country.callingCode.includes(
          normalizedSearchTerm,
        ),
    );
  }

  toggleCountryDropdown(): void {
    this.countryDropdownOpen =
      !this.countryDropdownOpen;
    if (this.countryDropdownOpen) {
      this.countrySearch = '';
    }
  }

  selectCountry(country: CountryOption): void {
    this.registrationForm
      .get('countryIsoCode')
      ?.setValue(country.countryCode);
    this.countryDropdownOpen = false;
    this.countrySearch = '';
    this.registrationForm
      .get('phoneNumber')
      ?.markAsTouched();
  }

  onCountrySearch(searchTerm: string): void {
    this.countrySearch = searchTerm;
  }

  onCountrySearchKeydown(
    event: KeyboardEvent,
  ): void {
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
    const digitsOnlyPhoneNumber =
      phoneNumber.replace(/\D/g, '');
    if (phoneNumber !== digitsOnlyPhoneNumber) {
      this.registrationForm
        .get('phoneNumber')
        ?.setValue(digitsOnlyPhoneNumber, {
          emitEvent: false,
        });
    }
  }

  private buildCountries(): CountryOption[] {
    const countryNames = new Intl.DisplayNames(
      ['en'],
      {
        type: 'region',
      },
    );
    return getCountries()
      .map((countryCode): CountryOption => ({
        countryCode,
        countryName:
          countryNames.of(countryCode) ??
          countryCode,
        callingCode: `+${getCountryCallingCode(countryCode)}`,
        flag: this.getCountryFlag(countryCode),
      }))
      .sort((firstCountry, secondCountry) =>
        firstCountry.countryName.localeCompare(
          secondCountry.countryName,
        ),
      );
  }

  private getCountryFlag(
    countryCode: string,
  ): string {
    return countryCode
      .toUpperCase()
      .replace(/[A-Z]/g, (character) =>
        String.fromCodePoint(
          character.charCodeAt(0) + 127397,
        ),
      );
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formValue =
      this.registrationForm.getRawValue();
    const body = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phoneNumber:
        `${getCountryCallingCode(formValue.countryIsoCode as CountryCode)}` +
        formValue.phoneNumber,
      companyName: formValue.companyName,
      registrationNumber:
        formValue.registrationNumber || null,
      contactEmail: formValue.contactEmail,
    };

    this.authService
      .ensureCsrfToken()
      .pipe(
        switchMap(() =>
          this.http.post(
            `${environment.apiUrl}/registration-requests`,
            body,
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.submitted = false;
          this.modalType = 'success';
          this.modalTitle = 'Request Submitted';
          this.modalMessage =
            "Your registration request is being processed. An administrator will review it, and you'll receive an email with your login details once your request is approved.";
          this.showModal = true;
          // Defer form reset so the modal has time to render first
          setTimeout(() => {
            this.registrationForm.reset({
              firstName: '',
              lastName: '',
              email: '',
              countryIsoCode: 'KE',
              phoneNumber: '',
              companyName: '',
              registrationNumber: '',
              contactEmail: '',
            });
          }, 100);
        },
        error: (err) => {
          this.log.error(
            'Registration request error:',
            err,
          );
          this.loading = false;
          this.submitted = false;
          if (err.status === 409) {
            const serverError = err.error?.error;
            if (
              serverError ===
              'email_already_registered'
            ) {
              this.modalType = 'pending';
              this.modalTitle =
                'Account Already Exists';
              this.modalMessage =
                'An account is already registered with this email address. Please log in to access your account, or use the forgot password option if you need to reset your password.';
              this.showModal = true;
            } else {
              this.modalType = 'pending';
              this.modalTitle =
                'Registration Request Pending';
              this.modalMessage =
                serverError ||
                "You already have a pending registration request for this email. An administrator is reviewing it, and you'll receive an email with your login details once it's approved.";
              this.showModal = true;
            }
            // Defer form reset so the modal has time to render first
            setTimeout(() => {
              this.registrationForm.reset({
                firstName: '',
                lastName: '',
                email: '',
                countryIsoCode: 'KE',
                phoneNumber: '',
                companyName: '',
                registrationNumber: '',
                contactEmail: '',
              });
            }, 100);
          } else {
            this.errorMessage =
              'Failed to submit your request. Please try again later.';
          }
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  showError(
    fieldName: keyof typeof this.registrationForm.controls,
  ): boolean {
    const formControl =
      this.registrationForm.controls[fieldName];
    return (
      formControl.invalid &&
      (formControl.touched || this.submitted)
    );
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMessage = '';
  }
}
