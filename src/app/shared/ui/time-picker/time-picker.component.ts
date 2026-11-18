import {
  Component,
  forwardRef,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
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

  // Dropdown state
  dropdownOpen = false;
  hours12: number[] = [];
  minutes: number[] = [];
  selectedHour: number | null = null;
  selectedMinute: number | null = null;
  selectedAmPm: 'AM' | 'PM' | null = null;

  // Direct reference to the native input element
  private nativeInput: HTMLInputElement | null = null;

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Build hour list (1-12)
    for (let h = 1; h <= 12; h++) {
      this.hours12.push(h);
    }
    // Build minute list (0-59)
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
    this.updateInputDisplay();
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onClickOutside);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.dropdownOpen) {
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  };

  private onClickOutside = (e: MouseEvent) => {
    if (!this.el.nativeElement.contains(e.target)) {
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
    this.updateInputDisplay();
  }

  selectAmPm(ampm: 'AM' | 'PM'): void {
    this.selectedAmPm = ampm;
    this.updateInputDisplay();
  }

  selectMinute(minute: number): void {
    this.selectedMinute = minute;
    this.commitSelection();
  }

  // Directly set the native input value
  private updateInputDisplay(): void {
    if (this.nativeInput) {
      this.nativeInput.value = this.getDisplayString();
    }
  }

  private getDisplayString(): string {
    if (this.selectedHour !== null && this.selectedAmPm !== null) {
      const m = this.selectedMinute !== null ? String(this.selectedMinute).padStart(2, '0') : '--';
      return `${this.selectedHour}:${m} ${this.selectedAmPm}`;
    }
    return '';
  }

  private commitSelection(): void {
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
      this.onChangeCallback(this._value);
      this.dropdownOpen = false;
      this.cdr.detectChanges();
      // Update the input display after dropdown closes
      setTimeout(() => this.updateInputDisplay(), 0);
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

  get displayString(): string {
    if (this.selectedHour !== null && this.selectedAmPm !== null) {
      const m = this.selectedMinute !== null ? String(this.selectedMinute).padStart(2, '0') : '--';
      return `${this.selectedHour}:${m} ${this.selectedAmPm}`;
    }
    return '';
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
    setTimeout(() => this.updateInputDisplay(), 0);
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
