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
  LucideSmartphone,
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
import { interval, Subscription } from 'rxjs';
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
  readonly LucideSmartphone = LucideSmartphone;
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
  paymentMethod = signal('MPESA');
  paymentAmount = signal<number>(0);
  phoneNumber = signal('');
  transactionReference = signal('');
  paying = signal(false);
  paymentSuccess = signal(false);
  paymentError = signal<string | null>(null);
  pollingSeconds = signal(0); // Track seconds elapsed while polling
  paymentWaiting = signal(false); // Waiting for M-Pesa confirmation
  mpesaCheckoutRequestId = signal<string | null>(null);
  private pollSubscription: Subscription | null = null;

  filterStatus = signal('ALL');

  paymentMethods = [
    { value: 'MPESA', label: 'M-Pesa' },
    { value: 'CARD', label: 'Card' },
    {
      value: 'BANK_TRANSFER',
      label: 'Bank Transfer',
    },
    { value: 'CASH', label: 'Cash' },
  ];

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
        this.bills.set(bills);
        this.loading.set(false);
      },
      error: (err) => {
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
    this.paymentAmount.set(bill.totalAmount - bill.amountPaid);
    this.paymentMethod.set('MPESA');
    this.phoneNumber.set('');
    this.transactionReference.set('');
    this.paymentSuccess.set(false);
    this.paymentError.set(null);
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.stopPolling();
    this.showPaymentModal.set(false);
    this.selectedBill.set(null);
    this.mpesaCheckoutRequestId.set(null);
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

    // Validate phone number for M-Pesa
    if (this.paymentMethod() === 'MPESA') {
      let phone = this.phoneNumber().trim();
      if (!phone) {
        this.paymentError.set('Please enter your M-Pesa phone number.');
        return;
      }
      // Normalize phone number: convert 07/01 format to 254 format
      if (phone.match(/^0[17]\d{8}$/)) {
        phone = '254' + phone.substring(1);
      }
      if (!phone.match(/^254\d{9}$/)) {
        this.paymentError.set('Invalid phone number. Use format: 07XXXXXXXXX, 01XXXXXXXXX, or 254XXXXXXXXX');
        return;
      }
      // Update the phone number in the request with the normalized value
      this.phoneNumber.set(phone);
    }

    const request: PaymentRequest = {
      paymentMethod: this.paymentMethod(),
      amount: this.paymentAmount(),
      transactionReference: this.transactionReference(),
      phoneNumber: this.phoneNumber(),
    };

    this.paying.set(true);
    this.paymentError.set(null);

    this.billingService.createPayment(bill.billId, request).subscribe({
      next: (response: PaymentResponse) => {
        this.paying.set(false);

        // For M-Pesa, start polling for payment status
        if (
          request.paymentMethod === 'MPESA' &&
          response.transactionReference
        ) {
          this.mpesaCheckoutRequestId.set(response.transactionReference);
          this.paymentWaiting.set(true);
          this.startPolling();
        } else {
          // For other methods, show success immediately
          this.paymentSuccess.set(true);
          this.loadBills();
        }
      },
      error: (err) => {
        this.paying.set(false);
        const serverMsg = err.error?.error || err.error?.message;
        const statusText = err.status ? ` (${err.status})` : '';
        this.paymentError.set(
          serverMsg || `Payment failed${statusText}. Please try again.`,
        );
        this.log.error('Payment error:', err);
        this.log.error('Payment error body:', err.error);
      },
    });
  }

  private pollCount = 0;
  readonly maxPollCount = 12; // 12 polls * 5s = 60 seconds max
  paymentTimedOut = false;

  startPolling(): void {
    this.pollCount = 0;
    this.pollingSeconds.set(0);
    this.paymentTimedOut = false;
    // Check status immediately after STK push, then poll every 5 seconds
    const checkoutId = this.mpesaCheckoutRequestId();
    if (checkoutId) {
      this.checkPaymentStatus(checkoutId);
    }

    // Poll every 5 seconds for up to 60 seconds (12 polls max)
    this.pollSubscription = interval(5000).subscribe({
      next: () => {
        this.pollCount++;
        this.pollingSeconds.update(s => s + 5);
        const currentCheckoutId = this.mpesaCheckoutRequestId();
        if (!currentCheckoutId) return;

        // Stop after max polls
        if (this.pollCount >= this.maxPollCount) {
          this.stopPolling();
          this.paymentWaiting.set(false);
          this.paymentTimedOut = true;
          this.paymentError.set(
            'Waiting for M-Pesa confirmation timed out. In sandbox mode, M-Pesa does not send callbacks to public servers. If you completed the payment on your phone, click "I\'ve Paid" to confirm manually.',
          );
          return;
        }

        this.checkPaymentStatus(currentCheckoutId);
      },
    });
  }

  // Manually confirm payment — used when M-Pesa sandbox callbacks don't reach the backend
  confirmPaymentManually(): void {
    const checkoutId = this.mpesaCheckoutRequestId();
    if (!checkoutId) return;

    this.paymentWaiting.set(true);
    this.paymentError.set(null);
    this.billingService.confirmMpesaPayment(checkoutId).subscribe({
      next: () => {
        this.paymentWaiting.set(false);
        this.paymentTimedOut = false;
        this.paymentSuccess.set(true);
        this.mpesaCheckoutRequestId.set(null);
        this.loadBills();
      },
      error: (err) => {
        this.paymentWaiting.set(false);
        const serverMsg = err.error?.error || err.error?.message;
        this.paymentError.set(serverMsg || 'Failed to confirm payment. Please try again.');
      },
    });
  }

  checkPaymentStatus(checkoutId: string): void {
    this.billingService.queryMpesaPaymentStatus(checkoutId).subscribe({
      next: (status) => {
        if (status.paymentStatus === 'SUCCESS') {
          this.stopPolling();
          this.paymentWaiting.set(false);
          this.paymentSuccess.set(true);
          this.loadBills();
        } else if (status.paymentStatus === 'FAILED') {
          this.stopPolling();
          this.paymentWaiting.set(false);
          this.paymentError.set('Payment was declined. Please try again.');
        }
        // If still PENDING, keep polling
      },
      error: (err) => {
        // Ignore polling errors — keep trying
        this.log.error('Polling error:', err);
      },
    });
  }

  stopPolling(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = null;
    }
  }

  cancelWaiting(): void {
    this.stopPolling();
    this.paymentWaiting.set(false);
    this.pollingSeconds.set(0);
    this.mpesaCheckoutRequestId.set(null);
    // Reset to show the payment form again
    this.paymentError.set(null);
    this.paymentSuccess.set(false);
  }

  get pollingProgressPercent(): number {
    return Math.min((this.pollingSeconds() / (this.maxPollCount * 5)) * 100, 100);
  }

  get pollingTimeRemaining(): string {
    const remaining = Math.max(0, (this.maxPollCount * 5) - this.pollingSeconds());
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  get pollingMaxSeconds(): number {
    return this.maxPollCount * 5; // 120 seconds (2 minutes)
  }

  get filteredBills(): Bill[] {
    if (this.filterStatus() === 'ALL') return this.bills();
    return this.bills().filter((b) => b.billStatus === this.filterStatus());
  }

  get totalOutstanding(): number {
    return this.bills().reduce(
      (sum, b) => sum + (b.totalAmount - b.amountPaid),
      0,
    );
  }

  get totalPaid(): number {
    return this.bills().reduce((sum, b) => sum + b.amountPaid, 0);
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
