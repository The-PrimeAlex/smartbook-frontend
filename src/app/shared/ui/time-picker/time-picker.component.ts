import {
  Component,
  forwardRef,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true,
    },
  ],
})
export class TimePickerComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Select time';
  @Input() disabled: boolean = false;
  @Input() step: string = '60';

  private _value: string = '';
  
  // Track the display string to force input re-render
  displayText: string = '';

  // Custom dropdown state
  dropdownOpen = false;
  hours12: number[] = [];
  minutes: number[] = [];
  selectedHour: number | null = null;
  selectedMinute: number | null = null;
  selectedAmPm: 'AM' | 'PM' | null = null;

  // Snapshot of the value before opening the dropdown, for Escape/cancel restore
  private pendingHour: number | null = null;
  private pendingMinute: number | null = null;
  private pendingAmPm: 'AM' | 'PM' | null = null;

  // Typable input state
  inputBuffer = '';
  isTyping = false;

  @ViewChild('timeInput', { static: true }) timeInputRef: ElementRef<HTMLInputElement> | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Build hour list (1-12)
    for (let h = 1; h <= 12; h++) {
      this.hours12.push(h);
    }
    // Build minute list — every minute (0-59)
    for (let m = 0; m < 60; m++) {
      this.minutes.push(m);
    }

    // Parse initial value
    if (this._value) {
      this.parseTime(this._value);
    }
    this.displayText = this.displayValue;

    // Click outside to close dropdown
    document.addEventListener('click', this.onClickOutside);
    // Escape key to close dropdown
    document.addEventListener('keydown', this.onKeyDown);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onClickOutside);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.dropdownOpen) {
      this.restorePending();
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  };

  private onClickOutside = (e: MouseEvent) => {
    if (!this.el.nativeElement.contains(e.target)) {
      this.restorePending();
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  };

  private restorePending(): void {
    if (this.pendingHour !== null && this.pendingMinute !== null && this.pendingAmPm !== null) {
      this.selectedHour = this.pendingHour;
      this.selectedMinute = this.pendingMinute;
      this.selectedAmPm = this.pendingAmPm;
      this.inputBuffer = '';
      this.isTyping = false;
      this.displayText = this.displayValue;
      this.cdr.detectChanges();
      this.forceInputValue();
    }
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      // Save current value so we can restore on Escape/cancel
      this.pendingHour = this.selectedHour;
      this.pendingMinute = this.selectedMinute;
      this.pendingAmPm = this.selectedAmPm;
      this.cdr.detectChanges();
    }
  }

  selectHour(hour: number): void {
    this.selectedHour = hour;
    this.updateDisplay();
  }

  selectAmPm(ampm: 'AM' | 'PM'): void {
    this.selectedAmPm = ampm;
    this.updateDisplay();
  }

  selectMinute(minute: number): void {
    this.selectedMinute = minute;
    this.updateValueAndClose();
  }

  private updateDisplay(): void {
    this.inputBuffer = '';
    this.isTyping = false;
    this.displayText = this.displayValue;
    this.cdr.detectChanges();
  }

  private forceInputValue(): void {
    if (this.timeInputRef) {
      this.timeInputRef.nativeElement.value = this.displayText;
    }
  }

  private updateValueAndClose(): void {
    if (this.selectedHour !== null && this.selectedMinute !== null && this.selectedAmPm !== null) {
      // Convert 12-hour to 24-hour
      let hour24 = this.selectedHour;
      if (this.selectedAmPm === 'PM' && hour24 !== 12) {
        hour24 += 12;
      }
      if (this.selectedAmPm === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      const h = String(hour24).padStart(2, '0');
      const m = String(this.selectedMinute).padStart(2, '0');
      this._value = `${h}:${m}`;
      this.inputBuffer = '';
      this.isTyping = false;
      this.displayText = this.displayValue;
      this.onChangeCallback(this._value);
      this.dropdownOpen = false;
      this.cdr.detectChanges();
      // Force the native input to show the 12-hour display value after dropdown closes
      setTimeout(() => this.forceInputValue(), 0);
    }
  }

  private parseTime(value: string): void {
    const parts = value.split(':');
    if (parts.length === 2) {
      const hour24 = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);
      if (!isNaN(hour24) && !isNaN(minute)) {
        this.selectedMinute = minute;
        // Convert 24-hour to 12-hour
        if (hour24 === 0) {
          this.selectedHour = 12;
          this.selectedAmPm = 'AM';
        } else if (hour24 < 12) {
          this.selectedHour = hour24;
          this.selectedAmPm = 'AM';
        } else if (hour24 === 12) {
          this.selectedHour = 12;
          this.selectedAmPm = 'PM';
        } else {
          this.selectedHour = hour24 - 12;
          this.selectedAmPm = 'PM';
        }
      }
    }
  }

  get displayValue(): string {
    // If user is typing, show the buffer
    if (this.isTyping && this.inputBuffer) {
      return this.inputBuffer;
    }
    if (this.selectedHour !== null && this.selectedAmPm !== null) {
      const m = this.selectedMinute !== null ? String(this.selectedMinute).padStart(2, '0') : '--';
      return `${this.selectedHour}:${m} ${this.selectedAmPm}`;
    }
    return this.placeholder;
  }

  get isValueSet(): boolean {
    return this.selectedHour !== null && this.selectedMinute !== null && this.selectedAmPm !== null;
  }

  // Handle direct typing in the input
  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.inputBuffer = raw;
    this.isTyping = true;

    // Try to parse the typed value
    const parsed = this.tryParseTypedTime(raw);
    if (parsed) {
      this.selectedMinute = parsed.minute;
      // Convert 24-hour to 12-hour + AM/PM
      if (parsed.hour === 0) {
        this.selectedHour = 12;
        this.selectedAmPm = 'AM';
      } else if (parsed.hour < 12) {
        this.selectedHour = parsed.hour;
        this.selectedAmPm = 'AM';
      } else if (parsed.hour === 12) {
        this.selectedHour = 12;
        this.selectedAmPm = 'PM';
      } else {
        this.selectedHour = parsed.hour - 12;
        this.selectedAmPm = 'PM';
      }
      const h = String(parsed.hour).padStart(2, '0');
      const m = String(parsed.minute).padStart(2, '0');
      this._value = `${h}:${m}`;
      this.onChangeCallback(this._value);
    } else {
      // Invalid time, don't update the model
      this._value = '';
      this.onChangeCallback('');
    }
  }

  // Parse typed input: supports "14:30", "2:30", "2:30 PM", "2:30PM", "1430", "230"
  private tryParseTypedTime(
    input: string,
  ): { hour: number; minute: number } | null {
    // Remove any whitespace
    const cleaned = input.trim();
    if (!cleaned) return null;

    // Check for AM/PM suffix
    const upper = cleaned.toUpperCase();
    let isPm = false;
    let isAm = false;
    let timePart = cleaned;

    if (upper.includes('PM')) {
      isPm = true;
      timePart = cleaned.replace(/PM/i, '').trim();
    } else if (upper.includes('AM')) {
      isAm = true;
      timePart = cleaned.replace(/AM/i, '').trim();
    }

    let hour: number;
    let minute: number;

    if (timePart.includes(':')) {
      // Format: "H:MM" or "HH:MM"
      const parts = timePart.split(':');
      if (parts.length !== 2) return null;
      hour = parseInt(parts[0], 10);
      minute = parseInt(parts[1], 10);
    } else {
      // Format: "HHMM" or "HMM"
      const digits = timePart.replace(/\D/g, '');
      if (digits.length < 2 || digits.length > 4) return null;
      if (digits.length === 2) {
        hour = parseInt(digits, 10);
        minute = 0;
      } else if (digits.length === 3) {
        hour = parseInt(digits[0], 10);
        minute = parseInt(digits.substring(1), 10);
      } else {
        hour = parseInt(digits.substring(0, 2), 10);
        minute = parseInt(digits.substring(2), 10);
      }
    }

    // Validate
    if (isNaN(hour) || isNaN(minute)) return null;
    if (minute < 0 || minute > 59) return null;

    // If AM/PM was specified, treat as 12-hour format
    if (isAm || isPm) {
      if (hour < 1 || hour > 12) return null;
      // Convert 12-hour to 24-hour
      if (isPm && hour !== 12) {
        hour += 12;
      }
      if (isAm && hour === 12) {
        hour = 0;
      }
    } else {
      // No AM/PM — treat as 24-hour format
      if (hour < 0 || hour > 23) return null;
    }

    return { hour, minute };
  }

  onInputFocus(): void {
    if (this.isValueSet && !this.isTyping) {
      // Show 12-hour format when focusing for easy editing
      const m = String(this.selectedMinute!).padStart(2, '0');
      this.inputBuffer = `${this.selectedHour}:${m} ${this.selectedAmPm}`;
      this.isTyping = true;
    }
  }

  onInputBlur(): void {
    // After a short delay, check if the value is valid
    setTimeout(() => {
      if (this.inputBuffer) {
        const parsed = this.tryParseTypedTime(this.inputBuffer);
        if (parsed) {
          this.selectedMinute = parsed.minute;
          // Convert 24-hour to 12-hour + AM/PM
          if (parsed.hour === 0) {
            this.selectedHour = 12;
            this.selectedAmPm = 'AM';
          } else if (parsed.hour < 12) {
            this.selectedHour = parsed.hour;
            this.selectedAmPm = 'AM';
          } else if (parsed.hour === 12) {
            this.selectedHour = 12;
            this.selectedAmPm = 'PM';
          } else {
            this.selectedHour = parsed.hour - 12;
            this.selectedAmPm = 'PM';
          }
          const h = String(parsed.hour).padStart(2, '0');
          const m = String(parsed.minute).padStart(2, '0');
          this._value = `${h}:${m}`;
          this.onChangeCallback(this._value);
        } else {
          // Revert to previous valid value
          if (this.isValueSet) {
            // Recalculate 24-hour value
            let hour24 = this.selectedHour!;
            if (this.selectedAmPm === 'PM' && hour24 !== 12) hour24 += 12;
            if (this.selectedAmPm === 'AM' && hour24 === 12) hour24 = 0;
            const h = String(hour24).padStart(2, '0');
            const m = String(this.selectedMinute!).padStart(2, '0');
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
      this.displayText = this.isValueSet ? this.displayValue : '';
      this.cdr.detectChanges();
      this.forceInputValue();
    }, 150);
  }

  writeValue(value: string): void {
    this._value = value || '';
    if (value) {
      this.parseTime(value);
    } else {
      this.selectedHour = null;
      this.selectedMinute = null;
      this.selectedAmPm = null;
    }
    this.displayText = this.isValueSet ? this.displayValue : '';
    setTimeout(() => this.forceInputValue(), 0);
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
