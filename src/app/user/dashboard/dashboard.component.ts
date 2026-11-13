import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { createLogger } from '../../shared/services/logger.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import {
  LucideCalendar,
  LucideCreditCard,
  LucideFileText,
  LucideLayoutDashboard,
  LucideMapPin,
  LucideMail,
  LucideMapPinned,
  LucideBell,
  LucideClock,
  LucideShieldCheck,
  LucideUsers,
  LucideSearch,
  LucideSettings,
  LucideX,
  LucideChevronDown,
} from '@lucide/angular';

import { AuthService } from '../../core/auth/auth.service';
import { BookingService } from '../../shared/services/booking.service';
import { Booking } from '../../shared/models/booking.model';
import { BillingService } from '../../shared/services/billing.service';
import { Bill } from '../../shared/models/billing.model';
import { NotificationService } from '../../shared/services/notification.service';
import { Notification } from '../../shared/models/notification.model';
import {
  IconComponent,
  StatCardComponent,
  EmptyStateComponent,
  PageBannerComponent,
} from '../../shared/ui';
import {
  getBookingStatusLabel,
  getBillStatusLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../shared/directives';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    StatCardComponent,
    EmptyStateComponent,
    PageBannerComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class Dashboard implements OnInit {
  private readonly log = createLogger(
    'UserDashboard',
  );
  private readonly authService =
    inject(AuthService);
  private readonly bookingService = inject(
    BookingService,
  );
  private readonly billingService = inject(
    BillingService,
  );
  private readonly notificationService = inject(
    NotificationService,
  );
  private readonly router = inject(Router);

  protected readonly LucideCalendar =
    LucideCalendar;
  protected readonly LucideCreditCard =
    LucideCreditCard;
  protected readonly LucideFileText =
    LucideFileText;
  protected readonly LucideLayoutDashboard =
    LucideLayoutDashboard;
  protected readonly LucideMapPin = LucideMapPin;
  protected readonly LucideMail = LucideMail;
  protected readonly LucideMapPinned =
    LucideMapPinned;
  protected readonly LucideBell = LucideBell;
  protected readonly LucideClock = LucideClock;
  protected readonly LucideShieldCheck =
    LucideShieldCheck;
  protected readonly LucideUsers = LucideUsers;
  protected readonly LucideSearch = LucideSearch;
  protected readonly LucideSettings =
    LucideSettings;
  protected readonly LucideX = LucideX;
  protected readonly LucideChevronDown =
    LucideChevronDown;

  readonly currentUser =
    this.authService.currentUser;

  readonly fullName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Account';
    return (
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
      'Account'
    );
  });

  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'BS';
    return (
      `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() ||
      'BS'
    );
  });

  readonly email = computed(
    () =>
      this.currentUser()?.email ??
      'Not available',
  );

  // Data signals
  readonly bookings = signal<Booking[]>([]);
  readonly bills = signal<Bill[]>([]);
  readonly notifications = signal<Notification[]>(
    [],
  );
  readonly loading = signal(true);
  readonly statsCollapsed = signal(false);

  toggleStatsCollapsed(): void {
    this.statsCollapsed.update((v) => !v);
  }

  // Computed stats
  readonly upcomingBookings = computed(() => {
    const now = new Date();
    return this.bookings()
      .filter((b) => {
        const startTime = new Date(b.startTime);
        return (
          startTime >= now &&
          [
            'PENDING',
            'CONFIRMED',
            'CHECKED_IN',
          ].includes(b.bookingStatus)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() -
          new Date(b.startTime).getTime(),
      )
      .slice(0, 5);
  });

  readonly unpaidBills = computed(() => {
    return this.bills()
      .filter(
        (b) =>
          b.billStatus !== 'PAID' &&
          b.billStatus !== 'VOID',
      )
      .sort(
        (a, b) =>
          new Date(a.dueAt).getTime() -
          new Date(b.dueAt).getTime(),
      )
      .slice(0, 5);
  });

  readonly recentNotifications = computed(() => {
    return this.notifications()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  });

  readonly unreadCount = computed(
    () =>
      this.notifications().filter(
        (n) => !n.isRead,
      ).length,
  );

  readonly upcomingCount = computed(
    () => this.upcomingBookings().length,
  );

  readonly totalOutstanding = computed(() => {
    return this.bills()
      .filter(
        (b) =>
          b.billStatus !== 'PAID' &&
          b.billStatus !== 'VOID',
      )
      .reduce(
        (sum, b) =>
          sum + (b.totalAmount - b.amountPaid),
        0,
      );
  });

  readonly totalBookings = computed(
    () => this.bookings().length,
  );

  // Quick links
  readonly quickLinks = [
    {
      icon: LucideSearch,
      label: 'Find a Room',
      route: '/app/rooms',
      color: '#f28c28',
    },
    {
      icon: LucideCalendar,
      label: 'My Bookings',
      route: '/app/bookings/upcoming',
      color: '#142b4a',
    },
    {
      icon: LucideCreditCard,
      label: 'My Charges',
      route: '/app/charges',
      color: '#f28c28',
    },
    {
      icon: LucideBell,
      label: 'Notifications',
      route: '/app/notifications',
      color: '#142b4a',
    },
    {
      icon: LucideMapPinned,
      label: 'Calendar',
      route: '/app/calendar',
      color: '#f28c28',
    },
    {
      icon: LucideSettings,
      label: 'Preferences',
      route: '/app/settings/preferences',
      color: '#142b4a',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      bookings: this.bookingService.getMyBookings().pipe(
        catchError((err) => {
          this.log.error('Error loading bookings:', err);
          return of([]);
        }),
      ),
      bills: this.billingService.getMyBills().pipe(
        catchError((err) => {
          this.log.error('Error loading bills:', err);
          return of([]);
        }),
      ),
      notifications: this.notificationService
        .getNotifications(false)
        .pipe(
          catchError((err) => {
            this.log.error('Error loading notifications:', err);
            return of([]);
          }),
        ),
    }).subscribe({
      next: (data) => {
        this.bookings.set(data.bookings);
        this.bills.set(data.bills);
        this.notifications.set(
          data.notifications,
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.log.error(
          'Error loading dashboard data:',
          err,
        );
        this.loading.set(false);
      },
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'CHECKED_IN':
        return 'status-checked-in';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'NO_SHOW':
        return 'status-no-show';
      default:
        return '';
    }
  }

  getBookingStatusLabel = getBookingStatusLabel;

  getBillStatusClass(status: string): string {
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

  getBillStatusLabel = getBillStatusLabel;

  getNotificationIconClass(
    eventType: string,
  ): string {
    switch (eventType) {
      case 'AUTO_CHECK_IN':
        return 'icon-checkin';
      case 'OVERRUN':
        return 'icon-overrun';
      case 'NO_SHOW':
        return 'icon-noshow';
      case 'BOOKING_CONFLICT':
        return 'icon-conflict';
      default:
        return 'icon-default';
    }
  }

  formatDateTime = formatDateTime;
  formatDate = formatDate;
  formatCurrency = formatCurrency;

  timeUntil(dateStr: string): string {
    const now = new Date();
    const target = new Date(dateStr);
    const diffMs =
      target.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Starting now';
    if (diffMins < 60) return `In ${diffMins}m`;
    if (diffHours < 24)
      return `In ${diffHours}h ${diffMins % 60}m`;
    return `In ${diffDays}d ${diffHours % 24}h`;
  }
}
