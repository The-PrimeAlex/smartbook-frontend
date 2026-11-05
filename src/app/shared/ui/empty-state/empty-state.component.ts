import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [LucideDynamicIcon],
  template: `
    <div class="empty-state">
      <svg
        [lucideIcon]="icon()"
        [size]="iconSize()"
        [strokeWidth]="1.5"
      ></svg>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--text-muted);
    }
    .empty-state svg {
      color: var(--neutral-300);
    }
    .empty-state h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .empty-state p {
      margin: 0;
      font-size: 0.9rem;
      max-width: 320px;
    }
  `,
})
export class EmptyStateComponent {
  icon = input<any>(null as any);
  iconSize = input<number>(64);
  title = input<string>('Nothing found');
  message = input<string>(
    'No items match your current filter.',
  );
}
