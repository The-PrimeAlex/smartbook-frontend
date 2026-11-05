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
import { forkJoin } from 'rxjs';

import {
  LucideCalendar,
  LucideCreditCard,
  LucideLayoutDashboard,
  LucideMapPin,
  LucideBell,
  LucideClock,
  LucideUsers,
  LucideSearch,
  LucideSettings,
  LucideMonitor,
  LucideFileText,
  LucideTrendingUp,
  LucideShieldCheck,
  LucidePlus,
  LucideActivity,
  LucideTriangleAlert,
} from '@lucide/angular';

import { AuthService } from '../../core/auth/auth.service';
import { RoomService } from '../../shared/services/room.service';
import { MeetingRoom } from '../../shared/models/room.model';
import { BookingService } from '../../shared/services/booking.service';
import { Booking } from '../../shared/models/booking.model';
import {
  UsersService,
  SmartBookUser,
} from '../users/users.service';
import {
  RoomMonitoringAlService,
  RoomMonitoringRecordAl,
} from '../monitoring/room-monitoring/room-monitoring-al.service';
import {
  ReportsAlService,
  RevenueReportAl,
} from '../reports/reports-al/reports-al.service';
import { IncidentsService } from '../../shared/services/incidents.service';
import {
  IconComponent,
  StatCardComponent,
  EmptyStateComponent,
  PageBannerComponent,
} from '../../shared/ui';
import {
  getBookingStatusLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../shared/directives';

export interface QuickAction {
  label: string;
  icon: any;
  color: string;
  route: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    StatCardComponent,
    EmptyStateComponent,
    PageBannerComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboard implements OnInit {
  private readonly log = createLogger('AdminDashboard');
  private readonly authService = inject(AuthService);
  private readonly roomService = inject(RoomService);
  private readonly bookingService = inject(BookingService);
  private readonly usersService = inject(UsersService);
  private readonly monitoringService = inject(
    RoomMonitoringAlService,
  );
  private readonly reportsService = inject(
    ReportsAlService,
  );
  private readonly incidentsService = inject(
    IncidentsService,
  );
  private readonly router = inject(Router);

  protected readonly LucideCalendar = LucideCalendar;
  protected readonly LucideCreditCard = LucideCreditCard;
  protected readonly LucideTriangleAlert =
    LucideTriangleAlert;
  protected readonly LucideLayoutDashboard =
    LucideLayoutDashboard;
  protected readonly LucideMapPin = LucideMapPin;
  protected readonly LucideBell = LucideBell;
  protected readonly LucideClock = LucideClock;
  protected readonly LucideUsers = LucideUsers;
  protected readonly LucideSearch = LucideSearch;
  protected readonly LucideSettings = LucideSettings;
  protected readonly LucideMonitor = LucideMonitor;
  protected readonly LucideFileText = LucideFileText;
  protected readonly LucideTrendingUp = LucideTrendingUp;
  protected readonly LucideShieldCheck = LucideShieldCheck;
  protected readonly LucidePlus = LucidePlus;
  protected readonly LucideActivity = LucideActivity;

  readonly currentUser = this.authService.currentUser;

  readonly fullName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Admin';
    return (
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
      'Admin'
    );
  });

  // Data signals
  readonly rooms = signal<MeetingRoom[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly users = signal<SmartBookUser[]>([]);
  readonly liveStatus = signal<RoomMonitoringRecordAl[]>(
    [],
  );
  readonly revenueReports = signal<RevenueReportAl[]>([]);
  readonly incidents = signal<any[]>([]);
  readonly loading = signal(true);

  // Computed stats
  readonly totalRooms = computed(() => this.rooms().length);
  readonly activeRooms = computed(
    () =>
      this.rooms().filter((r) => r.status === 'ACTIVE')
        .length,
  );
  readonly maintenanceRooms = computed(
    () =>
      this.rooms().filter((r) => r.status === 'MAINTENANCE')
        .length,
  );
  readonly totalCapacity = computed(() =>
    this.rooms().reduce(
      (sum, r) => sum + (r.capacity || 0),
      0,
    ),
  );

  readonly totalBookings = computed(
    () => this.bookings().length,
  );
  readonly confirmedBookings = computed(
    () =>
      this.bookings().filter(
        (b) => b.bookingStatus === 'CONFIRMED',
      ).length,
  );
  readonly pendingBookings = computed(
    () =>
      this.bookings().filter(
        (b) => b.bookingStatus === 'PENDING',
      ).length,
  );
  readonly checkedInBookings = computed(
    () =>
      this.bookings().filter(
        (b) => b.bookingStatus === 'CHECKED_IN',
      ).length,
  );
  readonly noShowBookings = computed(
    () =>
      this.bookings().filter(
        (b) => b.bookingStatus === 'NO_SHOW',
      ).length,
  );

  readonly totalUsers = computed(() => this.users().length);
  readonly activeUsers = computed(
    () =>
      this.users().filter((u) => u.status === 'ACTIVE')
        .length,
  );
  readonly adminUsers = computed(
    () =>
      this.users().filter((u) => u.roles?.includes('ADMIN'))
        .length,
  );

  readonly totalRevenue = computed(() => {
    return this.revenueReports().reduce(
      (sum, r) => sum + (r.totalAmount || 0),
      0,
    );
  });

  readonly totalIncidents = computed(
    () => this.incidents().length,
  );
  readonly reportedIncidents = computed(
    () =>
      this.incidents().filter(
        (i) => i.incidentStatus === 'REPORTED',
      ).length,
  );

  readonly occupiedRooms = computed(
    () =>
      this.liveStatus().filter(
        (r) => r.liveStatus === 'OCCUPIED',
      ).length,
  );
  readonly overrunRooms = computed(
    () =>
      this.liveStatus().filter(
        (r) => r.liveStatus === 'OVERRUN',
      ).length,
  );

  readonly recentBookings = computed(() => {
    return this.bookings()
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 5);
  });

  readonly quickLinks: QuickAction[] = [
    {
      label: 'Create Room',
      icon: LucidePlus,
      color: '#f28c28',
      route: '/admin/rooms/new',
    },
    {
      label: 'Add Equipment',
      icon: LucideActivity,
      color: '#3b82f6',
      route: '/admin/equipments',
    },
    {
      label: 'Add User',
      icon: LucideUsers,
      color: '#10b981',
      route: '/admin/users/new',
    },
    {
      label: 'Verify User',
      icon: LucideShieldCheck,
      color: '#8b5cf6',
      route: '/admin/users/requests',
    },
    {
      label: 'Verify Incidents',
      icon: LucideTriangleAlert,
      color: '#ef4444',
      route: '/admin/incidents',
    },
    {
      label: 'All Bookings',
      icon: LucideCalendar,
      color: '#f59e0b',
      route: '/admin/bookings',
    },
    {
      label: 'Live Monitoring',
      icon: LucideMonitor,
      color: '#06b6d4',
      route: '/admin/monitoring',
    },
    {
      label: 'Settings',
      icon: LucideSettings,
      color: '#6b7280',
      route: '/admin/settings/general',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      rooms: this.roomService.getRooms(),
      bookings: this.bookingService.getAllBookings(),
      liveStatus:
        this.monitoringService.getLiveRoomStatus(),
      revenueReports:
        this.reportsService.getRevenueReports(),
      incidents: this.incidentsService.getAllIncidents(),
    }).subscribe({
      next: (data) => {
        this.rooms.set(data.rooms);
        this.bookings.set(data.bookings);
        this.liveStatus.set(data.liveStatus);
        this.revenueReports.set(data.revenueReports);
        this.incidents.set(data.incidents);
        this.users.set(
          this.usersService.readOnlyUsers() ?? [],
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.log.error(
          'Error loading admin dashboard data:',
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

  getLiveStatusClass(status: string): string {
    switch (status) {
      case 'OCCUPIED':
        return 'status-occupied';
      case 'AVAILABLE':
        return 'status-available';
      case 'OVERRUN':
        return 'status-overrun';
      case 'MAINTENANCE':
        return 'status-maintenance';
      default:
        return '';
    }
  }

  formatDateTime = formatDateTime;
  formatDate = formatDate;
  formatCurrency = formatCurrency;

  timeUntil(dateStr: string): string {
    const now = new Date();
    const target = new Date(dateStr);
    const diffMs = target.getTime() - now.getTime();
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
