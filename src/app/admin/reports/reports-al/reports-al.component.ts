import { DatePipe, DecimalPipe } from '@angular/common';
import { Observable } from 'rxjs';
import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  LucideCalendar,
  LucideLayoutGrid,
  LucideRefreshCw,
  LucideDollarSign,
  LucideAlertCircle,
  LucideCheckCircle,
  LucideChevronDown,
} from '@lucide/angular';
import {
  ReportsAlService,
  OccupancyReportAl,
  BookingReportAl,
  RevenueReportAl,
} from './reports-al.service';
import {
  IconComponent,
  StatusBadgeComponent,
  EmptyStateComponent,
  PageBannerComponent,
} from '../../../shared/ui';

type TabMode = 'occupancy' | 'bookings' | 'revenue';

interface StatusCount {
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: any;
}

interface RoomRanking {
  roomName: string;
  value: number;
  percentage: number;
}

@Component({
  selector: 'app-reports-al',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    IconComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PageBannerComponent,
  ],
  templateUrl: './reports-al.component.html',
  styleUrl: './reports-al.component.css',
})
export class ReportsAlComponent implements OnInit {
  private readonly reportsService = inject(
    ReportsAlService,
  );
  private readonly route = inject(ActivatedRoute);

  readonly LucideLayoutGrid = LucideLayoutGrid;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideDollarSign = LucideDollarSign;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideAlertCircle = LucideAlertCircle;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideChevronDown = LucideChevronDown;

  readonly activeTab = signal<TabMode>('occupancy');
  readonly occupancyRecords = signal<OccupancyReportAl[]>(
    [],
  );
  readonly bookingRecords = signal<BookingReportAl[]>([]);
  readonly revenueRecords = signal<RevenueReportAl[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  // Occupancy stats
  readonly totalRooms = signal(0);
  readonly totalBookings = signal(0);
  readonly totalCheckedIn = signal(0);
  readonly totalNoShows = signal(0);
  readonly totalHoursBooked = signal(0);
  readonly totalHoursUsed = signal(0);
  readonly occupancyRankings = signal<RoomRanking[]>([]);

  // Booking stats
  readonly bookingStatusBreakdown = signal<StatusCount[]>([]);
  readonly bookingAvgDuration = signal(0);
  readonly bookingAvgOverrun = signal(0);
  readonly bookingOverrunCount = signal(0);

  // Revenue stats
  readonly totalRevenue = signal(0);
  readonly totalOverrunRevenue = signal(0);
  readonly totalCancellationRevenue = signal(0);
  readonly totalNoShowRevenue = signal(0);
  readonly totalIncidentRevenue = signal(0);
  readonly totalTaxRevenue = signal(0);
  readonly avgTicketSize = signal(0);
  readonly revenueByRoom = signal<RoomRanking[]>([]);
  readonly unpaidCount = signal(0);
  readonly overdueCount = signal(0);
  readonly revenueSourcesExpanded = signal(false);

  ngOnInit(): void {
    const url = this.route.snapshot.url.join('/');
    let initialTab: TabMode = 'occupancy';
    if (url.includes('bookings')) {
      initialTab = 'bookings';
    } else if (url.includes('revenue')) {
      initialTab = 'revenue';
    }
    this.activeTab.set(initialTab);
    this.loadTab(initialTab);
  }

  selectTab(tab: TabMode): void {
    this.activeTab.set(tab);
    this.loadTab(tab);
  }

  loadTab(tab: TabMode): void {
    this.loading.set(true);
    this.errorMessage.set('');

    let obs: Observable<unknown[]>;
    switch (tab) {
      case 'occupancy':
        obs = this.reportsService.getOccupancyReports();
        break;
      case 'bookings':
        obs = this.reportsService.getBookingReports();
        break;
      case 'revenue':
        obs = this.reportsService.getRevenueReports();
        break;
    }

    obs.subscribe({
      next: (response: unknown[]) => {
        if (tab === 'occupancy') {
          this.occupancyRecords.set(
            response as OccupancyReportAl[],
          );
          this.updateOccupancyStats(
            response as OccupancyReportAl[],
          );
        } else if (tab === 'bookings') {
          this.bookingRecords.set(
            response as BookingReportAl[],
          );
          this.updateBookingStats(
            response as BookingReportAl[],
          );
        } else {
          this.revenueRecords.set(
            response as RevenueReportAl[],
          );
          this.updateRevenueStats(
            response as RevenueReportAl[],
          );
        }
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(
          error.message ||
            'Unable to load data. Please try again.',
        );
        this.loading.set(false);
      },
    });
  }

  private updateOccupancyStats(
    records: OccupancyReportAl[],
  ): void {
    let rooms = 0;
    let bookings = 0;
    let checkedIn = 0;
    let noShows = 0;
    let hoursBooked = 0;
    let hoursUsed = 0;
    for (const r of records) {
      rooms++;
      if (r.totalBookings) bookings += r.totalBookings;
      if (r.checkedInBookings) checkedIn += r.checkedInBookings;
      if (r.noShowBookings) noShows += r.noShowBookings;
      if (r.totalHoursBooked) hoursBooked += r.totalHoursBooked;
      if (r.totalHoursUsed) hoursUsed += r.totalHoursUsed;
    }
    this.totalRooms.set(rooms);
    this.totalBookings.set(bookings);
    this.totalCheckedIn.set(checkedIn);
    this.totalNoShows.set(noShows);
    this.totalHoursBooked.set(hoursBooked);
    this.totalHoursUsed.set(hoursUsed);

    // Build room rankings by bookings
    const maxBookings = Math.max(1, ...records.map(r => r.totalBookings || 0));
    const rankings: RoomRanking[] = records
      .filter(r => r.totalBookings && r.totalBookings > 0)
      .sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0))
      .map(r => ({
        roomName: r.roomName || 'Unknown',
        value: r.totalBookings || 0,
        percentage: ((r.totalBookings || 0) / maxBookings) * 100,
      }));
    this.occupancyRankings.set(rankings);
  }

  private updateBookingStats(
    records: BookingReportAl[],
  ): void {
    if (!records.length) {
      this.bookingStatusBreakdown.set([]);
      this.bookingAvgDuration.set(0);
      this.bookingAvgOverrun.set(0);
      this.bookingOverrunCount.set(0);
      return;
    }

    // Count by status
    const statusMap: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    let totalOverrun = 0;
    let overrunCount = 0;

    for (const r of records) {
      const status = r.bookingStatus || 'UNKNOWN';
      statusMap[status] = (statusMap[status] || 0) + 1;
      if (r.durationMinutes) {
        totalDuration += r.durationMinutes;
        durationCount++;
      }
      if (r.overrunMinutes && r.overrunMinutes > 0) {
        totalOverrun += r.overrunMinutes;
        overrunCount++;
      }
    }

    // Build status breakdown with colors and icons
    const statusConfig: Record<string, { color: string }> = {
      'PENDING': { color: '#f59e0b' },
      'CONFIRMED': { color: '#3b82f6' },
      'CHECKED_IN': { color: '#8b5cf6' },
      'COMPLETED': { color: '#10b981' },
      'CANCELLED': { color: '#6b7280' },
      'NO_SHOW': { color: '#ef4444' },
    };

    const breakdown: StatusCount[] = Object.entries(statusMap)
      .map(([label, count]) => {
        const config = statusConfig[label] || { color: '#6b7280' };
        return {
          label,
          count,
          percentage: (count / records.length) * 100,
          color: config.color,
          icon: null,
        };
      })
      .sort((a, b) => b.count - a.count);

    this.bookingStatusBreakdown.set(breakdown);
    this.bookingAvgDuration.set(durationCount > 0 ? totalDuration / durationCount : 0);
    this.bookingAvgOverrun.set(overrunCount > 0 ? totalOverrun / overrunCount : 0);
    this.bookingOverrunCount.set(overrunCount);
  }

  private updateRevenueStats(
    records: RevenueReportAl[],
  ): void {
    let revenue = 0;
    let overrunRevenue = 0;
    let cancellationRevenue = 0;
    let noShowRevenue = 0;
    let incidentRevenue = 0;
    let taxRevenue = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    const roomRevenueMap: Record<string, number> = {};

    for (const r of records) {
      if (r.totalAmount) revenue += r.totalAmount;
      if (r.overrunCharge && r.overrunCharge > 0)
        overrunRevenue += r.overrunCharge;
      if (r.cancellationFee && r.cancellationFee > 0)
        cancellationRevenue += r.cancellationFee;
      if (r.noShowFee && r.noShowFee > 0)
        noShowRevenue += r.noShowFee;
      if (r.incidentFee && r.incidentFee > 0)
        incidentRevenue += r.incidentFee;
      if (r.taxAmount) taxRevenue += r.taxAmount;
      if (r.billStatus === 'PAID') paidCount++;
      if (r.billStatus && r.billStatus !== 'PAID' && r.billStatus !== 'DRAFT' && r.billStatus !== 'VOID') unpaidCount++;
      if (r.billStatus === 'OVERDUE') overdueCount++;
      if (r.roomName && r.totalAmount) {
        roomRevenueMap[r.roomName] = (roomRevenueMap[r.roomName] || 0) + r.totalAmount;
      }
    }

    this.totalRevenue.set(revenue);
    this.totalOverrunRevenue.set(overrunRevenue);
    this.totalCancellationRevenue.set(cancellationRevenue);
    this.totalNoShowRevenue.set(noShowRevenue);
    this.totalIncidentRevenue.set(incidentRevenue);
    this.totalTaxRevenue.set(taxRevenue);
    this.avgTicketSize.set(records.length > 0 ? revenue / records.length : 0);
    this.unpaidCount.set(unpaidCount);
    this.overdueCount.set(overdueCount);

    // Build revenue by room rankings
    const maxRevenue = Math.max(1, ...Object.values(roomRevenueMap));
    const revRankings: RoomRanking[] = Object.entries(roomRevenueMap)
      .sort(([, a], [, b]) => b - a)
      .map(([roomName, value]) => ({
        roomName,
        value,
        percentage: (value / maxRevenue) * 100,
      }));
    this.revenueByRoom.set(revRankings);
  }

  calculateAvgOccupancy(): number {
    const records = this.occupancyRecords();
    if (!records.length) return 0;
    let sum = 0;
    let count = 0;
    for (const r of records) {
      if (r.occupancyRate != null) {
        sum += r.occupancyRate;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  billedCount(): number {
    let count = 0;
    for (const r of this.revenueRecords()) {
      if (r.billStatus && r.billStatus !== 'DRAFT') count++;
    }
    return count;
  }

  paidCount(): number {
    let count = 0;
    for (const r of this.revenueRecords()) {
      if (r.billStatus === 'PAID') count++;
    }
    return count;
  }

  formatKsh(value: number | null): string {
    if (value == null) return 'KSH 0';
    return (
      'KSH ' +
      value.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  refresh(): void {
    this.loadTab(this.activeTab());
  }

  toggleRevenueSources(): void {
    this.revenueSourcesExpanded.update(v => !v);
  }

  getRevenueWithBills(): RevenueReportAl[] {
    return this.revenueRecords().filter(r => (r.totalAmount || 0) > 0);
  }

  statusBadgeClass(status: string | null): string {
    if (!status) return '';
    switch (status) {
      case 'PENDING':
        return 'badge-pending';
      case 'CONFIRMED':
        return 'badge-confirmed';
      case 'CHECKED_IN':
        return 'badge-checked-in';
      case 'COMPLETED':
        return 'badge-completed';
      case 'CANCELLED':
        return 'badge-cancelled';
      case 'NO_SHOW':
        return 'badge-no-show';
      case 'PAID':
        return 'badge-paid';
      case 'ISSUED':
        return 'badge-issued';
      case 'OVERDUE':
        return 'badge-overdue';
      case 'VOID':
        return 'badge-void';
      case 'DRAFT':
        return 'badge-draft';
      case 'PARTIALLY_PAID':
        return 'badge-partially-paid';
      default:
        return '';
    }
  }

  getOccupancyRateColor(rate: number | null): string {
    if (rate == null) return '#6b7280';
    if (rate >= 75) return '#10b981';
    if (rate >= 50) return '#3b82f6';
    if (rate >= 25) return '#f59e0b';
    return '#ef4444';
  }

  getOccupancyRateLabel(rate: number | null): string {
    if (rate == null) return 'No data';
    if (rate >= 75) return 'Excellent';
    if (rate >= 50) return 'Good';
    if (rate >= 25) return 'Moderate';
    return 'Low';
  }

  getCheckInRate(): number {
    if (this.totalBookings() === 0) return 0;
    return (this.totalCheckedIn() / this.totalBookings()) * 100;
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  formatMinutesShort(minutes: number | null): string {
    if (minutes == null) return '—';
    return this.formatMinutes(minutes);
  }
}
