import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [LucideDynamicIcon],
  template: `
    <div
      class="stat-card"
      [style.animation-delay]="delay()"
    >
      @if (icon()) {
        <div
          class="stat-icon"
          [style.background]="iconBg()"
          [style.color]="iconColor()"
        >
          <svg
            [lucideIcon]="icon()"
            [size]="iconSize()"
            [strokeWidth]="2"
          ></svg>
        </div>
      }
      <div class="stat-info">
        <span class="stat-value"
          ><ng-content select="[stat-value]"
        /></span>
        <span class="stat-label"
          ><ng-content select="[stat-label]"
        /></span>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1.25rem 1rem;
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
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
      text-align: center;
      min-width: 0;
      width: 100%;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    [data-theme='dark'] .stat-card {
      background: var(--card-bg);
    }
    @media (max-width: 30rem) {
      .stat-card {
        padding: 12px 14px !important;
        gap: 0.25rem !important;
      }
      .stat-icon {
        width: 32px !important;
        height: 32px !important;
      }
      .stat-value {
        font-size: 1.25rem !important;
      }
      .stat-label {
        font-size: 0.75rem !important;
      }
    }
  `,
})
export class StatCardComponent {
  icon = input<any | null>(null);
  iconSize = input<number>(24);
  iconBg = input<string>('rgba(59, 130, 246, 0.12)');
  iconColor = input<string>('var(--info, #3b82f6)');
  delay = input<string>('0s');
}
