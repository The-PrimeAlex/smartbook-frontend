import { Component, computed, signal } from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import {
  LucideAlertTriangle,
  LucideCalendar,
  LucideFileText,
  LucideSearch,
  LucideUser,
  LucideX,
  LucideArrowUpDown,
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
  FilterGroupComponent,
  SearchBoxComponent,
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
  selector: 'app-all-invoices',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    StatusBadgeComponent,
    StatCardComponent,
    EmptyStateComponent,
    FilterGroupComponent,
    SearchBoxComponent,
    PageBannerComponent,
  ],
  templateUrl: './all-invoices.component.html',
  styleUrl: './all-invoices.component.css',
})
export class AllInvoicesComponent implements OnInit {
  readonly LucideAlertTriangle = LucideAlertTriangle;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideFileText = LucideFileText;
  readonly LucideSearch = LucideSearch;
  readonly LucideUser = LucideUser;
  readonly LucideX = LucideX;
  readonly LucideArrowUpDown = LucideArrowUpDown;
  readonly bills = signal<AdminBill[]>([]);
  readonly loading = signal(true);
  readonly selectedFilter = signal<string>('ALL');
  readonly searchTerm = signal('');
  readonly sortBy = signal<string>('date-desc'); // date-desc, date-asc, amount-desc, amount-asc, status

  readonly filteredBills = computed(() => {
    const filter = this.selectedFilter();
    const term = this.searchTerm().trim().toLowerCase();
    const sortBy = this.sortBy();
    let result = this.bills();
    // Filter by status
    if (filter !== 'ALL') {
      result = result.filter(
        (b) => b.billStatus === filter,
      );
    }
    // Filter by search term
    if (term) {
      result = result.filter((b) => {
        const roomName = (
          b.booking?.roomName || ''
        ).toLowerCase();
        const userName = (
          b.booking?.userName || ''
        ).toLowerCase();
        const purpose = (
          b.booking?.purpose || ''
        ).toLowerCase();
        const billId = (b.billId || '').toLowerCase();
        return (
          roomName.includes(term) ||
          userName.includes(term) ||
          purpose.includes(term) ||
          billId.includes(term)
        );
      });
    }
    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return (a.issuedAt || '').localeCompare(b.issuedAt || '');
        case 'date-desc':
          return (b.issuedAt || '').localeCompare(a.issuedAt || '');
        case 'amount-asc':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case 'amount-desc':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'status':
          return (a.billStatus || '').localeCompare(b.billStatus || '');
        default:
          return 0;
      }
    });
    return result;
  });
  readonly totalBills = computed(() => this.bills().length);
  readonly unpaidCount = computed(
    () =>
      this.bills().filter((b) => b.billStatus === 'ISSUED')
        .length,
  );
  readonly paidCount = computed(
    () =>
      this.bills().filter((b) => b.billStatus === 'PAID')
        .length,
  );
  readonly partialCount = computed(
    () =>
      this.bills().filter(
        (b) => b.billStatus === 'PARTIALLY_PAID',
      ).length,
  );
  readonly totalRevenue = computed(() =>
    this.bills().reduce((sum, b) => sum + b.totalAmount, 0),
  );
  readonly totalPaid = computed(() =>
    this.bills().reduce((sum, b) => sum + b.amountPaid, 0),
  );
  readonly filterOptions: FilterOption[] = [
    { value: 'ALL', label: 'All' },
    { value: 'ISSUED', label: 'Unpaid' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PARTIALLY_PAID', label: 'Partial' },
    { value: 'OVERDUE', label: 'Overdue' },
  ];

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
  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }
  setSort(sort: string): void {
    this.sortBy.set(sort);
  }
  readonly sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'amount-desc', label: 'Highest Amount' },
    { value: 'amount-asc', label: 'Lowest Amount' },
    { value: 'status', label: 'By Status' },
  ];
  clearSearch(): void {
    this.searchTerm.set('');
  }
  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
        return 'status-paid';
      case 'ISSUED':
        return 'status-issued';
      case 'PARTIALLY_PAID':
        return 'status-partial';
      case 'OVERDUE':
        return 'status-overdue';
      case 'VOID':
        return 'status-void';
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
