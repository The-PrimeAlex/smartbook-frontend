import {
  Component,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import {
  LucideAlertTriangle,
  LucideCalendar,
  LucideChevronDown,
  LucideUser,
} from '@lucide/angular';
import {
  AdminBillingService,
  AdminBill,
} from '../admin-billing.service';
import {
  IconComponent,
  StatusBadgeComponent,
  StatCardComponent,
  EmptyStateComponent,
  PageBannerComponent,
  type BadgeVariant,
} from '../../../shared/ui';
import {
  getBillBadgeVariant,
  getBillStatusLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../../shared/directives';

@Component({
  selector: 'app-damage-charges',
  standalone: true,
  imports: [
    CommonModule,

    IconComponent,
    StatusBadgeComponent,
    StatCardComponent,
    EmptyStateComponent,
    PageBannerComponent,
  ],
  templateUrl: './damage-charges.component.html',
  styleUrl: './damage-charges.component.css',
})
export class DamageChargesComponent implements OnInit {
  readonly LucideAlertTriangle = LucideAlertTriangle;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideUser = LucideUser;

  readonly bills = signal<AdminBill[]>([]);
  readonly loading = signal(true);
  readonly statsCollapsed = signal(false);

  toggleStatsCollapsed(): void {
    this.statsCollapsed.update((v) => !v);
  }

  // Filter bills that have at least one INCIDENT item
  readonly damageBills = computed(() =>
    this.bills().filter((b) =>
      b.items.some((item) => item.itemType === 'INCIDENT'),
    ),
  );

  readonly totalDamageBills = computed(
    () => this.damageBills().length,
  );
  readonly totalDamageCharges = computed(() =>
    this.damageBills().reduce((sum, b) => {
      const incidentItems = b.items.filter(
        (item) => item.itemType === 'INCIDENT',
      );
      return (
        sum +
        incidentItems.reduce(
          (s, item) => s + item.amount,
          0,
        )
      );
    }, 0),
  );
  readonly totalDamagePaid = computed(() =>
    this.damageBills().reduce(
      (sum, b) => sum + (b.amountPaid || 0),
      0,
    ),
  );

  // Calculate the incident-only total for a bill (not the full bill total)
  getIncidentTotal(bill: AdminBill): number {
    return bill.items
      .filter((item) => item.itemType === 'INCIDENT')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  constructor(
    private billingService: AdminBillingService,
  ) {}

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading.set(true);
    this.billingService
      .getAllBills()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (bills) => this.bills.set(bills),
        error: () => this.loading.set(false),
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
        return 'status-paid';
      case 'UNPAID':
        return 'status-unpaid';
      case 'PARTIALLY_PAID':
        return 'status-partial';
      case 'OVERDUE':
        return 'status-overdue';
      default:
        return '';
    }
  }

  getStatusLabel = getBillStatusLabel;
  formatCurrency = formatCurrency;
  formatDate = formatDate;
  formatDateTime = formatDateTime;
  getBadgeVariant = getBillBadgeVariant;
}
