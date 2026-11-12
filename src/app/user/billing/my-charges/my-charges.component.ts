import { Component, OnInit, signal } from '@angular/core';
import { createLogger } from '../../../shared/services/logger.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class MyChargesComponent implements OnInit {
  private readonly log = createLogger('MyCharges');
  bills = signal<Bill[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  statsCollapsed = signal(false);

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
  paymentWaiting = signal(false); // Waiting for M-Pesa confirmation
  mpesaCheckoutRequestId = signal<string | null>(null);
  private pollSubscription: Subscription | null = null;

  filterStatus = signal('ALL');

  paymentMethods = [
    { value: 'MPESA', label: 'M-Pesa' },
    { value: 'CARD', label: 'Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CASH', label: 'Cash' },
  ];

  constructor(private billingService: BillingService) {}

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading.set(true);
    this.billingService.getMyBills().subscribe({
      next: (bills) => {
        this.bills.set(bills);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load your charges');
        this.loading.set(false);
        this.log.error('Error loading bills:', err);
      },
    });
  }

  openPayment(bill: Bill): void {
    this.selectedBill.set(bill);
    this.paymentAmount.set(
      bill.totalAmount - bill.amountPaid,
    );
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

    const request: PaymentRequest = {
      paymentMethod: this.paymentMethod(),
      amount: this.paymentAmount(),
      transactionReference: this.transactionReference(),
      phoneNumber: this.phoneNumber(),
    };

    this.paying.set(true);
    this.paymentError.set(null);

    this.billingService
      .createPayment(bill.billId, request)
      .subscribe({
        next: (response: PaymentResponse) => {
          this.paying.set(false);

          // For M-Pesa, start polling for payment status
          if (
            request.paymentMethod === 'MPESA' &&
            response.transactionReference
          ) {
            this.mpesaCheckoutRequestId.set(
              response.transactionReference,
            );
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
          this.paymentError.set(
            'Payment failed. Please try again.',
          );
          this.log.error('Payment error:', err);
        },
      });
  }

  startPolling(): void {
    // Poll every 3 seconds for up to 2 minutes
    this.pollSubscription = interval(3000).subscribe({
      next: () => {
        const checkoutId = this.mpesaCheckoutRequestId();
        if (!checkoutId) return;

        this.billingService
          .queryMpesaPaymentStatus(checkoutId)
          .subscribe({
            next: (status) => {
              if (status.paymentStatus === 'SUCCESS') {
                this.stopPolling();
                this.paymentWaiting.set(false);
                this.paymentSuccess.set(true);
                this.loadBills();
              } else if (
                status.paymentStatus === 'FAILED'
              ) {
                this.stopPolling();
                this.paymentWaiting.set(false);
                this.paymentError.set(
                  'Payment was declined. Please try again.',
                );
              }
              // If still PENDING, keep polling
            },
            error: (err) => {
              // Ignore polling errors — keep trying
              this.log.error('Polling error:', err);
            },
          });
      },
    });

    // Auto-stop after 2 minutes (40 polls)
    setTimeout(() => {
      if (this.pollSubscription) {
        this.stopPolling();
        this.paymentWaiting.set(false);
        this.paymentError.set(
          'Payment timed out. Please check your M-Pesa SIM toolkit for confirmation.',
        );
      }
    }, 120000);
  }

  stopPolling(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = null;
    }
  }

  get filteredBills(): Bill[] {
    if (this.filterStatus() === 'ALL') return this.bills();
    return this.bills().filter(
      (b) => b.billStatus === this.filterStatus(),
    );
  }

  get totalOutstanding(): number {
    return this.bills().reduce(
      (sum, b) => sum + (b.totalAmount - b.amountPaid),
      0,
    );
  }

  get totalPaid(): number {
    return this.bills().reduce(
      (sum, b) => sum + b.amountPaid,
      0,
    );
  }

  get unpaidCount(): number {
    return this.bills().filter(
      (b) =>
        b.billStatus !== 'PAID' && b.billStatus !== 'VOID',
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
