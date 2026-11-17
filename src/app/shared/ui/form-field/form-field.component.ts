import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <div class="form-field" [class.invalid]="invalid()">
      @if (label()) {
        <label [for]="id()">
          {{ label() }}
          @if (required()) {
            <span class="required-mark">*</span>
          }
        </label>
      }
      <ng-content></ng-content>
      @if (invalid() && errorMessage()) {
        <p class="field-error" [id]="id() + '-error'">
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-field label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-primary);
    }
    .required-mark {
      color: var(--error-color, #ef4444);
      margin-left: 0.15rem;
    }
    .field-error {
      margin: 0;
      font-size: 0.75rem;
      color: var(--error-color, #ef4444);
    }
  `,
})
export class FormFieldComponent {
  label = input<string | null>(null);
  id = input<string>('');
  required = input<boolean>(false);
  invalid = input<boolean>(false);
  errorMessage = input<string | null>(null);
}
