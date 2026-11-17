import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [LucideDynamicIcon],
  template: `
    <div class="stat-card">
      @if (icon()) {
        <div class="stat-icon" [style.color]="iconColor()">
          <svg
            [lucideIcon]="icon()"
            [size]="iconSize()"
            [strokeWidth]="2"
          ></svg>
        </div>
      }
      <div class="stat-info">
        <span class="stat-value"><ng-content select="[stat-value]" /></span>
        <span class="stat-label"><ng-content select="[stat-label]" /></span>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.75rem 1rem;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      transition: border-color 150ms ease;
    }
    .stat-card:hover {
      border-color: var(--border-color-hover);
    }
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      min-width: 0;
      gap: 0.125rem;
    }
    .stat-value {
      font-size: 1.125rem;
      font-weight: 600;
      line-height: 1.3;
      color: var(--text-primary);
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    @media (max-width: 30rem) {
      .stat-card {
        padding: 0.5rem 0.625rem !important;
        gap: 0.375rem !important;
      }
      .stat-value {
        font-size: 1rem !important;
      }
      .stat-label {
        font-size: 0.6875rem !important;
      }
    }
  `,
})
export class StatCardComponent {
  icon = input<any | null>(null);
  iconSize = input<number>(20);
  iconColor = input<string>('var(--text-secondary)');
}
