import {
  Component,
  input,
  output,
} from '@angular/core';

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-filter-group',
  standalone: true,
  template: `
    <div class="filter-group" [class]="class()">
      @for (
        filter of filters();
        track filter.value
      ) {
        <button
          type="button"
          class="filter-btn"
          [class.active]="
            activeFilter() === filter.value
          "
          (click)="select.emit(filter.value)"
        >
          {{ filter.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .filter-btn {
      padding: 0.4rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 999px;
      background: var(--card-bg);
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-btn:hover {
      border-color: var(--brand-accent);
      color: var(--brand-accent);
    }
    .filter-btn.active {
      background: var(--brand-accent);
      border-color: var(--brand-accent);
      color: #fff;
    }
  `,
})
export class FilterGroupComponent {
  filters = input.required<FilterOption[]>();
  activeFilter = input<string>('');
  class = input<string>('');
  select = output<string>();
}
