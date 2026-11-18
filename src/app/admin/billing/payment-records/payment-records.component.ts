import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  LucideChevronDown,
  LucideCheckCircle,
  LucideCreditCard,
  LucideXCircle,
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
    CommonModule,
    FormsModule,
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
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideXCircle = LucideXCircle;

  readonly payments = signal<AdminPaymentRecord[]>([]);
  readonly pendingPayments = signal<AdminPaymentRecord[]>([]);
  readonly loading = signal(true);
  readonly selectedFilter = signal<string>('ALL');
  readonly statsCollapsed = signal(true);
  readonly approving = signal<string | null>(null);
  readonly rejecting = signal<string | null>(null);
  rejectReason = '';
  readonly paymentToReject = signal<string | null>(null);

  toggleStatsCollapsed(): void {
    this.statsCollapsed.update((v) => !v);
  }

  readonly filteredPayments = computed(() => {
    const filter = this.selectedFilter();
    const all = this.payments();
    if (filter === 'ALL') return all;
    return all.filter((p) => p.paymentStatus === filter);
  });

  readonly totalPayments = computed(() => this.payments().length);
  readonly approvedCount = computed(
    () =>
      this.payments().filter(
        (p) => p.paymentStatus === 'APPROVED',
      ).length,
  );
  readonly pendingApprovalCount = computed(
    () =>
      this.payments().filter(
        (p) => p.paymentStatus === 'PENDING_ADMIN_APPROVAL',
      ).length,
  );
  readonly rejectedCount = computed(
    () =>
      this.payments().filter(
        (p) => p.paymentStatus === 'REJECTED',
      ).length,
  );
  readonly totalAmount = computed(() =>
    this.payments()
      .filter((p) => p.paymentStatus === 'APPROVED')
      .reduce((sum, p) => sum + p.amount, 0),
  );

  readonly filterOptions: FilterOption[] = [
    { value: 'ALL', label: 'All' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PENDING_ADMIN_APPROVAL', label: 'Pending Approval' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  constructor(private billingService: AdminBillingService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.billingService
      .getAllPayments()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.payments.set(data);
          this.pendingPayments.set(
            data.filter(
              (p) => p.paymentStatus === 'PENDING_ADMIN_APPROVAL',
            ),
          );
        },
        error: () => this.loading.set(false),
      });
  }

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  approvePayment(paymentId: string): void {
    this.approving.set(paymentId);
    this.billingService.approvePayment(paymentId).subscribe({
      next: () => {
        this.approving.set(null);
        this.loadPayments();
      },
      error: () => this.approving.set(null),
    });
  }

  openRejectDialog(paymentId: string): void {
    this.paymentToReject.set(paymentId);
    this.rejectReason = '';
  }

  rejectPayment(): void {
    const paymentId = this.paymentToReject();
    if (!paymentId) return;
    this.rejecting.set(paymentId);
    this.billingService
      .rejectPayment(paymentId, this.rejectReason || undefined)
      .subscribe({
        next: () => {
          this.rejecting.set(null);
          this.paymentToReject.set(null);
          this.rejectReason = '';
          this.loadPayments();
        },
        error: () => {
          this.rejecting.set(null);
          this.paymentToReject.set(null);
        },
      });
  }

  closeRejectDialog(): void {
    this.paymentToReject.set(null);
    this.rejectReason = '';
  }

  getStatusLabel = getPaymentStatusLabel;

  getMethodLabel(method: string): string {
    switch (method) {
      case 'CASH':
        return 'Cash';
      case 'CARD':
        return 'Card';
      case 'BANK_TRANSFER':
        return 'Bank Transfer';
      default:
        return method;
    }
  }

  formatCurrency = formatCurrency;
  formatDateTime = formatDateTime;
  getBadgeVariant = getPaymentBadgeVariant;
}
