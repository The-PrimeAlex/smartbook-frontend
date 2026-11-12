import { Component, input } from '@angular/core';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'paid'
  | 'unpaid'
  | 'partial'
  | 'overdue'
  | 'verified'
  | 'rejected'
  | 'pending'
  | 'charged'
  | 'waived'
  | 'reported';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span
    class="status-badge badge-{{ variant() }}"
    [attr.class]="
      'status-badge badge-' +
      variant() +
      ' ' +
      class()
    "
    >{{ label() }}</span
  >`,
  styles: `
    :host {
      display: inline-block;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      white-space: nowrap;
      line-height: 1;
    }
    .badge-success,
    .badge-paid,
    .badge-verified {
      background: rgba(34, 197, 94, 0.12);
      color: #16a34a;
    }
    .badge-warning,
    .badge-pending,
    .badge-reported {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
    }
    .badge-danger,
    .badge-rejected {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
    }
    .badge-unpaid,
    .badge-overdue {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    .badge-partial {
      background: rgba(242, 140, 40, 0.12);
      color: #f28c28;
    }
    .badge-info,
    .badge-charged {
      background: rgba(59, 130, 246, 0.12);
      color: #3b82f6;
    }
    .badge-neutral,
    .badge-waived {
      background: rgba(107, 114, 128, 0.12);
      color: #6b7280;
    }
  `,
})
export class StatusBadgeComponent {
  label = input.required<string>();
  variant = input<BadgeVariant>('neutral');
  class = input<string>('');
}
