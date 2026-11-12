import {
  Component,
  input,
  output,
} from '@angular/core';
import {
  LucideDynamicIcon,
  LucideSearch,
  LucideX,
} from '@lucide/angular';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [LucideDynamicIcon],
  template: `
    <div
      class="search-box"
      [class.focused]="value().length > 0"
    >
      <svg
        [lucideIcon]="searchIcon"
        [size]="20"
        [strokeWidth]="2"
        aria-hidden="true"
      ></svg>
      <input
        type="search"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="
          change.emit($any($event.target).value)
        "
        [attr.aria-label]="placeholder()"
      />
      @if (value().length > 0) {
        <button
          type="button"
          class="search-clear"
          (click)="change.emit('')"
          aria-label="Clear search"
        >
          <svg
            [lucideIcon]="xIcon"
            [size]="16"
            [strokeWidth]="2"
            aria-hidden="true"
          ></svg>
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background: var(--card-bg);
      transition: border-color 0.15s ease;
    }
    .search-box.focused {
      border-color: var(--brand-accent);
    }
    .search-box svg:first-child {
      flex-shrink: 0;
      color: var(--text-muted);
    }
    .search-box input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.85rem;
      color: var(--text-primary);
    }
    .search-box input::placeholder {
      color: var(--text-muted);
    }
    .search-clear {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: var(--neutral-100);
      cursor: pointer;
      color: var(--text-muted);
      transition: background 0.15s ease;
    }
    .search-clear:hover {
      background: var(--neutral-200);
    }
  `,
})
export class SearchBoxComponent {
  readonly searchIcon = LucideSearch;
  readonly xIcon = LucideX;
  placeholder = input<string>('Search...');
  value = input<string>('');
  change = output<string>();
}
