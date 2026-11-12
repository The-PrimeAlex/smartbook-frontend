import {
  Component,
  forwardRef,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(
        () => TimePickerComponent,
      ),
      multi: true,
    },
  ],
})
export class TimePickerComponent
  implements OnInit, OnDestroy
{
  @Input() placeholder: string = 'Select time';
  @Input() disabled: boolean = false;
  @Input() step: string = '60';

  private _value: string = '';
  private _nativeInput: HTMLInputElement | null =
    null;

  // Custom dropdown state
  dropdownOpen = false;
  hours: number[] = [];
  minutes: number[] = [];
  selectedHour: number | null = null;
  selectedMinute: number | null = null;

  // Typable input state
  inputBuffer = '';
  isTyping = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Build hour list (0-23)
    for (let h = 0; h < 24; h++) {
      this.hours.push(h);
    }
    // Build minute list — every minute (0-59)
    for (let m = 0; m < 60; m++) {
      this.minutes.push(m);
    }

    // Parse initial value
    if (this._value) {
      this.parseTime(this._value);
    }

    // Click outside to close dropdown
    document.addEventListener(
      'click',
      this.onClickOutside,
    );
    // Escape key to close dropdown
    document.addEventListener(
      'keydown',
      this.onKeyDown,
    );
  }

  ngOnDestroy() {
    document.removeEventListener(
      'click',
      this.onClickOutside,
    );
    document.removeEventListener(
      'keydown',
      this.onKeyDown,
    );
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.dropdownOpen) {
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  };

  private onClickOutside = (e: MouseEvent) => {
    if (
      !this.el.nativeElement.contains(e.target)
    ) {
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  };

  toggleDropdown(): void {
    if (this.disabled) return;
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.cdr.detectChanges();
    }
  }

  selectHour(hour: number): void {
    this.selectedHour = hour;
    // Don't auto-close, let user pick minute too
  }

  selectMinute(minute: number): void {
    this.selectedMinute = minute;
    this.updateValue();
  }

  private updateValue(): void {
    if (
      this.selectedHour !== null &&
      this.selectedMinute !== null
    ) {
      const h = String(
        this.selectedHour,
      ).padStart(2, '0');
      const m = String(
        this.selectedMinute,
      ).padStart(2, '0');
      this._value = `${h}:${m}`;
      this.inputBuffer = '';
      this.isTyping = false;
      this.onChangeCallback(this._value);
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  }

  private parseTime(value: string): void {
    const parts = value.split(':');
    if (parts.length === 2) {
      this.selectedHour = parseInt(parts[0], 10);
      this.selectedMinute = parseInt(
        parts[1],
        10,
      );
    }
  }

  get displayValue(): string {
    // If user is typing, show the buffer
    if (this.isTyping && this.inputBuffer) {
      return this.inputBuffer;
    }
    if (
      this.selectedHour !== null &&
      this.selectedMinute !== null
    ) {
      const h12 = this.selectedHour % 12 || 12;
      const ampm =
        this.selectedHour < 12 ? 'AM' : 'PM';
      const m = String(
        this.selectedMinute,
      ).padStart(2, '0');
      return `${h12}:${m} ${ampm}`;
    }
    return this.placeholder;
  }

  get isValueSet(): boolean {
    return (
      this.selectedHour !== null &&
      this.selectedMinute !== null
    );
  }

  // Handle direct typing in the input
  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement)
      .value;
    this.inputBuffer = raw;
    this.isTyping = true;

    // Try to parse the typed value
    const parsed = this.tryParseTypedTime(raw);
    if (parsed) {
      this.selectedHour = parsed.hour;
      this.selectedMinute = parsed.minute;
      const h = String(parsed.hour).padStart(
        2,
        '0',
      );
      const m = String(parsed.minute).padStart(
        2,
        '0',
      );
      this._value = `${h}:${m}`;
      this.onChangeCallback(this._value);
    } else {
      // Invalid time, don't update the model
      this._value = '';
      this.onChangeCallback('');
    }
  }

  // Parse typed input: supports "14:30", "2:30", "1430", "230"
  private tryParseTypedTime(
    input: string,
  ): { hour: number; minute: number } | null {
    // Remove any whitespace
    const cleaned = input.trim();
    if (!cleaned) return null;

    let hour: number;
    let minute: number;

    if (cleaned.includes(':')) {
      // Format: "H:MM" or "HH:MM"
      const parts = cleaned.split(':');
      if (parts.length !== 2) return null;
      hour = parseInt(parts[0], 10);
      minute = parseInt(parts[1], 10);
    } else {
      // Format: "HHMM" or "HMM"
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length < 2 || digits.length > 4)
        return null;
      if (digits.length === 2) {
        hour = parseInt(digits, 10);
        minute = 0;
      } else if (digits.length === 3) {
        hour = parseInt(digits[0], 10);
        minute = parseInt(
          digits.substring(1),
          10,
        );
      } else {
        hour = parseInt(
          digits.substring(0, 2),
          10,
        );
        minute = parseInt(
          digits.substring(2),
          10,
        );
      }
    }

    // Validate
    if (isNaN(hour) || isNaN(minute)) return null;
    if (hour < 0 || hour > 23) return null;
    if (minute < 0 || minute > 59) return null;

    return { hour, minute };
  }

  onInputFocus(): void {
    if (this.isValueSet && !this.isTyping) {
      // Show 24-hour format when focusing for easy editing
      const h = String(
        this.selectedHour!,
      ).padStart(2, '0');
      const m = String(
        this.selectedMinute!,
      ).padStart(2, '0');
      this.inputBuffer = `${h}:${m}`;
      this.isTyping = true;
    }
  }

  onInputBlur(): void {
    // After a short delay, check if the value is valid
    setTimeout(() => {
      if (this.inputBuffer) {
        const parsed = this.tryParseTypedTime(
          this.inputBuffer,
        );
        if (parsed) {
          this.selectedHour = parsed.hour;
          this.selectedMinute = parsed.minute;
          const h = String(parsed.hour).padStart(
            2,
            '0',
          );
          const m = String(
            parsed.minute,
          ).padStart(2, '0');
          this._value = `${h}:${m}`;
          this.onChangeCallback(this._value);
        } else {
          // Revert to previous valid value
          if (this.isValueSet) {
            const h = String(
              this.selectedHour!,
            ).padStart(2, '0');
            const m = String(
              this.selectedMinute!,
            ).padStart(2, '0');
            this.inputBuffer = '';
            this._value = `${h}:${m}`;
          } else {
            this.inputBuffer = '';
            this._value = '';
            this.onChangeCallback('');
          }
        }
      }
      this.isTyping = false;
      this.cdr.detectChanges();
    }, 150);
  }

  writeValue(value: string): void {
    this._value = value || '';
    if (value) {
      this.parseTime(value);
    } else {
      this.selectedHour = null;
      this.selectedMinute = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private onChangeCallback = (_: any) => {};
  private onTouchedCallback = () => {};
}
