import {
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { createLogger } from '../../../shared/services/logger.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import {
  LucideCalendar,
  LucideCheckCircle,
  LucideChevronDown,
  LucideCircleAlert,
  LucideClock,
  LucideCreditCard,
  LucideDollarSign,
  LucideFileText,
  LucideLoader,
  LucideTriangleAlert,
  LucideX,
  LucideXCircle,
} from '@lucide/angular';
import { BillingService } from '../../../shared/services/billing.service';
import {
  Bill,
  PaymentRequest,
  PaymentResponse,
} from '../../../shared/models/billing.model';
import { Subscription } from 'rxjs';
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
  getBillBadgeVariant,
  getBillStatusLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../../shared/directives';

@Component({
  selector: 'app-my-charges',
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
  templateUrl: './my-charges.component.html',
  styleUrl: './my-charges.component.css',
})
export class MyChargesComponent implements OnInit, OnDestroy {
  private readonly log = createLogger('MyCharges');
  bills = signal<Bill[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  statsCollapsed = signal(true);
  private routerSubscription: Subscription | null = null;

  toggleStatsCollapsed(): void {
    this.statsCollapsed.update((v) => !v);
  }

  readonly LucideCalendar = LucideCalendar;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideCircleAlert = LucideCircleAlert;
  readonly LucideClock = LucideClock;
  readonly LucideCreditCard = LucideCreditCard;
  readonly LucideDollarSign = LucideDollarSign;
  readonly LucideFileText = LucideFileText;
  readonly LucideLoader = LucideLoader;
  readonly LucideTriangleAlert = LucideTriangleAlert;
  readonly LucideX = LucideX;
  readonly LucideXCircle = LucideXCircle;

  readonly filterOptions: FilterOption[] = [
    { value: 'ALL', label: 'All' },
    { value: 'ISSUED', label: 'Unpaid' },
    { value: 'PARTIALLY_PAID', label: 'Partial' },
    { value: 'PAID', label: 'Paid' },
    { value: 'OVERDUE', label: 'Overdue' },
  ];

  showPaymentModal = signal(false);
  selectedBill = signal<Bill | null>(null);
  paymentAmount = signal<number>(0);
  transactionReference = signal('');
  paying = signal(false);
  paymentSuccess = signal(false);
  paymentError = signal<string | null>(null);

  filterStatus = signal('ALL');

  constructor(
    private billingService: BillingService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadBills();
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.loadBills();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadBills(): void {
    this.loading.set(true);
    this.billingService.getMyBills().subscribe({
      next: (bills) => {
        // Defensively handle null totalAmount on any bill
        const safeBills = bills.map((b) => ({
          ...b,
          totalAmount: b.totalAmount ?? 0,
          amountPaid: b.amountPaid ?? 0,
        }));
        this.bills.set(safeBills);
        this.loading.set(false);
      },
      error: (err) => {
        // If the user was logged out (401), redirect to login
        if (err.status === 401) {
          this.router.navigate(['/login'], { replaceUrl: true });
          return;
        }
        this.error.set(
          "We couldn't load your charges. Please try again in a moment.",
        );
        this.loading.set(false);
        this.log.error('Error loading bills:', err);
      },
    });
  }

  openPayment(bill: Bill): void {
    this.selectedBill.set(bill);
    const outstanding = (bill.totalAmount ?? 0) - (bill.amountPaid ?? 0);
    this.paymentAmount.set(outstanding > 0 ? outstanding : 0);
    this.transactionReference.set('');
    this.paymentSuccess.set(false);
    this.paymentError.set(null);
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedBill.set(null);
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.showPaymentModal()) {
      event.stopPropagation();
      this.closePaymentModal();
    }
  }

  closePaymentModalIfOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closePaymentModal();
    }
  }

  submitPayment(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const bill = this.selectedBill();
    if (!bill) return;

    const amount = this.paymentAmount();
    const outstanding = (bill.totalAmount ?? 0) - (bill.amountPaid ?? 0);

    // Validate amount
    if (amount <= 0) {
      this.paymentError.set('Please enter a valid amount.');
      return;
    }
    if (amount > outstanding) {
      this.paymentError.set(`Amount cannot exceed outstanding balance of ${formatCurrency(outstanding, bill.currency)}`);
      return;
    }

    const request: PaymentRequest = {
      paymentMethod: 'CASH',
      amount: amount,
      transactionReference: this.transactionReference().trim(),
    };

    this.paying.set(true);
    this.paymentError.set(null);

    this.billingService.createPayment(bill.billId, request).subscribe({
      next: () => {
        this.paying.set(false);
        this.paymentSuccess.set(true);
        this.loadBills();
      },
      error: (err) => {
        this.paying.set(false);
        const serverMsg = err.error?.error || err.error?.message;
        this.paymentError.set(
          serverMsg || 'Payment failed. Please try again.',
        );
        this.log.error('Payment error:', err);
      },
    });
  }

  get filteredBills(): Bill[] {
    if (this.filterStatus() === 'ALL') return this.bills();
    return this.bills().filter((b) => b.billStatus === this.filterStatus());
  }

  get totalOutstanding(): number {
    return this.bills().reduce(
      (sum, b) => sum + ((b.totalAmount ?? 0) - (b.amountPaid ?? 0)),
      0,
    );
  }

  get totalPaid(): number {
    return this.bills().reduce((sum, b) => sum + (b.amountPaid ?? 0), 0);
  }

  get unpaidCount(): number {
    return this.bills().filter(
      (b) => b.billStatus !== 'PAID' && b.billStatus !== 'VOID',
    ).length;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
        return 'status-paid';
      case 'PARTIALLY_PAID':
        return 'status-partial';
      case 'OVERDUE':
        return 'status-overdue';
      case 'VOID':
        return 'status-void';
      default:
        return 'status-pending';
    }
  }

  getStatusLabel = getBillStatusLabel;
  getBadgeVariant = getBillBadgeVariant;
  formatCurrency = formatCurrency;
  formatDate = formatDate;
  formatDateTime = formatDateTime;
}
