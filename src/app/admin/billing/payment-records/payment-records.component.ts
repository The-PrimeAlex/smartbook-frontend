import {
  Component,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';
import {
  LucideChevronDown,
  LucideCreditCard,
} from '@lucide/angular';
import {
  AdminBillingService,
  AdminPaymentRecord,
} from '../admin-billing.service';
import {
  IconComponent,
  StatusBadgeComponent,
  StatCardComponent,
  EmptyStateComponent,
  FilterGroupComponent,
  PageBannerComponent,
  type FilterOption,
  type BadgeVariant,
} from '../../../shared/ui';
import {
  getPaymentBadgeVariant,
  getPaymentStatusLabel,
  formatCurrency,
  formatDateTime,
} from '../../../shared/directives';

@Component({
  selector: 'app-payment-records',
  standalone: true,
  imports: [
    IconComponent,
    StatusBadgeComponent,
    StatCardComponent,
    EmptyStateComponent,
    FilterGroupComponent,
    PageBannerComponent,
  ],
  templateUrl: './payment-records.component.html',
  styleUrl: './payment-records.component.css',
})
export class PaymentRecordsComponent implements OnInit {
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideCreditCard = LucideCreditCard;
  readonly payments = signal<
    AdminPaymentRecord[]
  >([]);
  readonly loading = signal(true);
  readonly selectedFilter = signal<string>('ALL');
  readonly statsCollapsed = signal(false);

  toggleStatsCollapsed(): void {
    this.statsCollapsed.update((v) => !v);
  }

  readonly filteredPayments = computed(() => {
    const filter = this.selectedFilter();
    const all = this.payments();
    if (filter === 'ALL') return all;
    return all.filter(
      (p) => p.paymentStatus === filter,
    );
  });
  readonly totalPayments = computed(
    () => this.payments().length,
  );
  readonly successCount = computed(
    () =>
      this.payments().filter(
        (p) => p.paymentStatus === 'SUCCESS',
      ).length,
  );
  readonly pendingCount = computed(
    () =>
      this.payments().filter(
        (p) => p.paymentStatus === 'PENDING',
      ).length,
  );
  readonly failedCount = computed(
    () =>
      this.payments().filter(
        (p) => p.paymentStatus === 'FAILED',
      ).length,
  );
  readonly totalAmount = computed(() =>
    this.payments()
      .filter(
        (p) => p.paymentStatus === 'SUCCESS',
      )
      .reduce((sum, p) => sum + p.amount, 0),
  );
  readonly filterOptions: FilterOption[] = [
    { value: 'ALL', label: 'All' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'FAILED', label: 'Failed' },
  ];
  constructor(
    private billingService: AdminBillingService,
  ) {}
  ngOnInit(): void {
    this.loadPayments();
  }
  loadPayments(): void {
    this.loading.set(true);
    this.billingService
      .getAllPayments()
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => this.payments.set(data),
        error: () => this.loading.set(false),
      });
  }
  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }
  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'status-success';
      case 'PENDING':
        return 'status-pending';
      case 'FAILED':
        return 'status-failed';
      case 'REFUNDED':
        return 'status-refunded';
      default:
        return '';
    }
  }
  getStatusLabel = getPaymentStatusLabel;
  getMethodLabel(method: string): string {
    switch (method) {
      case 'MPESA':
        return 'M-Pesa';
      case 'CARD':
        return 'Card';
      case 'BANK_TRANSFER':
        return 'Bank Transfer';
      case 'CASH':
        return 'Cash';
      default:
        return method;
    }
  }
  formatCurrency = formatCurrency;
  formatDateTime = formatDateTime;
  getBadgeVariant = getPaymentBadgeVariant;
}
