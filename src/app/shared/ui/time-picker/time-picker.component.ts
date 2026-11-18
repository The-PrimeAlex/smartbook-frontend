import {
  Component,
  forwardRef,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  ChangeDetectorRef,
  AfterViewInit,
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
export class TimePickerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() placeholder: string = 'Select time';
  @Input() disabled: boolean = false;
  @Input() step: string = '60';

  private _value: string = '';

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

  // Flag to prevent onInputBlur from overwriting a value selected via dropdown
  private selectedFromDropdown = false;

  // Direct reference to the native input element
  private nativeInput: HTMLInputElement | null = null;

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

    // Click outside to close dropdown
    document.addEventListener('click', this.onClickOutside);
    // Escape key to close dropdown
    document.addEventListener('keydown', this.onKeyDown);
  }

  ngAfterViewInit() {
    // Get direct reference to the native input element
    this.nativeInput = this.el.nativeElement.querySelector('input.time-input');
    this.setInputDisplayValue();
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
      this.setInputDisplayValue();
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
    this.selectedFromDropdown = true;
    this.setInputDisplayValue();
  }

  selectAmPm(ampm: 'AM' | 'PM'): void {
    this.selectedAmPm = ampm;
    this.selectedFromDropdown = true;
    this.setInputDisplayValue();
  }

  selectMinute(minute: number): void {
    this.selectedMinute = minute;
    this.commitAndClose();
  }

  // Directly set the native input value, bypassing Angular's [value] binding
  private setInputDisplayValue(): void {
    if (this.nativeInput) {
      this.nativeInput.value = this.getDisplayString();
    }
  }

  private getDisplayString(): string {
    if (this.isTyping && this.inputBuffer) {
      return this.inputBuffer;
    }
    if (this.selectedHour !== null && this.selectedAmPm !== null) {
      const m = this.selectedMinute !== null ? String(this.selectedMinute).padStart(2, '0') : '--';
      return `${this.selectedHour}:${m} ${this.selectedAmPm}`;
    }
    return '';
  }

  private commitAndClose(): void {
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
      this.selectedFromDropdown = true;
      this.onChangeCallback(this._value);
      this.dropdownOpen = false;
      this.cdr.detectChanges();
      // Set the display value after dropdown closes
      setTimeout(() => this.setInputDisplayValue(), 0);
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
    const cleaned = input.trim();
    if (!cleaned) return null;

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
      const parts = timePart.split(':');
      if (parts.length !== 2) return null;
      hour = parseInt(parts[0], 10);
      minute = parseInt(parts[1], 10);
    } else {
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

    if (isNaN(hour) || isNaN(minute)) return null;
    if (minute < 0 || minute > 59) return null;

    if (isAm || isPm) {
      if (hour < 1 || hour > 12) return null;
      if (isPm && hour !== 12) {
        hour += 12;
      }
      if (isAm && hour === 12) {
        hour = 0;
      }
    } else {
      if (hour < 0 || hour > 23) return null;
    }

    return { hour, minute };
  }

  onInputFocus(): void {
    if (this.isValueSet && !this.isTyping) {
      const m = String(this.selectedMinute!).padStart(2, '0');
      this.inputBuffer = `${this.selectedHour}:${m} ${this.selectedAmPm}`;
      this.isTyping = true;
      // Update the input to show the 12-hour format for editing
      if (this.nativeInput) {
        this.nativeInput.value = this.inputBuffer;
      }
    }
  }

  onInputBlur(): void {
    setTimeout(() => {
      // If a value was just selected from the dropdown, don't overwrite it
      if (this.selectedFromDropdown) {
        this.selectedFromDropdown = false;
        this.inputBuffer = '';
        this.isTyping = false;
        this.setInputDisplayValue();
        return;
      }
      if (this.inputBuffer) {
        const parsed = this.tryParseTypedTime(this.inputBuffer);
        if (parsed) {
          this.selectedMinute = parsed.minute;
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
          if (this.isValueSet) {
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
      this.setInputDisplayValue();
    }, 150);
  }

  writeValue(value: string): void {
    if (value === this._value) return;
    this._value = value || '';
    if (value) {
      this.parseTime(value);
    } else {
      this.selectedHour = null;
      this.selectedMinute = null;
      this.selectedAmPm = null;
    }
    setTimeout(() => this.setInputDisplayValue(), 0);
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
