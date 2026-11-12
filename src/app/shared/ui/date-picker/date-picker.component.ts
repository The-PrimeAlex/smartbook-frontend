import {
  Component,
  forwardRef,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import flatpickr from 'flatpickr';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(
        () => DatePickerComponent,
      ),
      multi: true,
    },
  ],
})
export class DatePickerComponent
  implements OnInit, OnDestroy
{
  @Input() min: string = '';
  @Input() max: string = '';
  @Input() placeholder: string = 'Select date';
  @Input() disabled: boolean = false;

  private fpInstance: any;
  private _value: string = '';

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.fpInstance = flatpickr(
      this.el.nativeElement.querySelector(
        'input',
      ),
      {
        mode: 'single',
        dateFormat: 'Y-m-d',
        minDate: this.min || undefined,
        maxDate: this.max || undefined,
        disableMobile: true,
        animate: true,
        onChange: ([date], dateStr) => {
          this._value = dateStr;
          this.onChangeCallback(dateStr);
        },
        onReady: () => {
          // Apply min date after initialization
          if (this.min) {
            this.fpInstance.set(
              'minDate',
              this.min,
            );
          }
        },
      },
    );

    // Escape key to close calendar
    document.addEventListener(
      'keydown',
      this.onKeyDown,
    );
  }

  ngOnDestroy() {
    if (this.fpInstance) {
      this.fpInstance.destroy();
    }
    document.removeEventListener(
      'keydown',
      this.onKeyDown,
    );
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (
      e.key === 'Escape' &&
      this.fpInstance &&
      this.fpInstance.isOpen
    ) {
      this.fpInstance.close();
    }
  };

  writeValue(value: string): void {
    this._value = value;
    if (this.fpInstance && value) {
      this.fpInstance.setDate(value);
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
    if (this.fpInstance) {
      this.fpInstance.set('disabled', isDisabled);
    }
  }

  private onChangeCallback = (_: any) => {};
  private onTouchedCallback = () => {};
}
