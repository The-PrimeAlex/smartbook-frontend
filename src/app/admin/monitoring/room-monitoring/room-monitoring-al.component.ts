import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  LucideActivity,
  LucideAlertTriangle,
  LucideArrowUpRight,
  LucideCalendarDays,
  LucideCheckCircle2,
  LucideChevronDown,
  LucideClock,
  LucideFilter,
  LucideMail,
  LucideMinus,
  LucidePlus,
  LucideRefreshCw,
  LucideSearch,
  LucideUser,
  LucideUserX,
  LucideWrench,
  LucideX,
  LucideXCircle,
} from '@lucide/angular';
import {
  RoomBookingRecordAl,
  RoomMonitoringAlService,
  RoomMonitoringRecordAl,
} from './room-monitoring-al.service';
import {
  IconComponent,
  PageBannerComponent,
} from '../../../shared/ui';

type TabMode = 'live' | 'no-shows' | 'overruns';
type StatusFilter = 'all' | 'available' | 'occupied' | 'reserved' | 'overrun' | 'maintenance';

@Component({
  selector: 'app-room-monitoring',
  standalone: true,
  imports: [
    DatePipe,
    IconComponent,
    PageBannerComponent,
  ],
  templateUrl: './room-monitoring-al.component.html',
  styleUrl: './room-monitoring-al.component.css',
})
export class RoomMonitoringAlComponent implements OnInit, OnDestroy {
  private readonly monitoringService = inject(
    RoomMonitoringAlService,
  );
  private readonly route = inject(ActivatedRoute);

  readonly LucideActivity = LucideActivity;
  readonly LucideAlertTriangle = LucideAlertTriangle;
  readonly LucideArrowUpRight = LucideArrowUpRight;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideClock = LucideClock;
  readonly LucideFilter = LucideFilter;
  readonly LucideMail = LucideMail;
  readonly LucideMinus = LucideMinus;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideUser = LucideUser;
  readonly LucideUserX = LucideUserX;
  readonly LucideWrench = LucideWrench;
  readonly LucideX = LucideX;
  readonly LucideXCircle = LucideXCircle;

  readonly activeTab = signal<TabMode>('live');
  readonly records = signal<RoomMonitoringRecordAl[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  // Dashboard overview stats
  readonly totalRooms = signal(0);
  readonly availableCount = signal(0);
  readonly occupiedCount = signal(0);
  readonly reservedCount = signal(0);
  readonly maintenanceCount = signal(0);
  readonly attentionCount = signal(0);
  readonly overrunCount = signal(0);

  // Live monitoring state
  readonly lastUpdated = signal<Date | null>(null);
  readonly autoRefreshInterval = 30000; // 30 seconds
  private autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

  // Search and filter
  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly showFilters = signal(false);

  // Filtered records for live tab
  readonly filteredRecords = computed(() => {
    let result = this.records();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();

    if (query) {
      result = result.filter((r) =>
        (r.roomName ?? '').toLowerCase().includes(query) ||
        (r.purpose ?? '').toLowerCase().includes(query) ||
        (r.bookerName ?? '').toLowerCase().includes(query),
      );
    }

    if (filter !== 'all') {
      result = result.filter((r) => {
        const status = (r.liveStatus ?? '').toLowerCase();
        switch (filter) {
          case 'available': return status === 'available';
          case 'occupied': return status === 'occupied';
          case 'reserved': return status === 'reserved' || status === 'confirmed' || status === 'pending';
          case 'overrun': return status === 'overrun';
          case 'maintenance': return status === 'maintenance' || status === 'retired';
          default: return true;
        }
      });
    }

    return result;
  });

  // Room detail panel state
  readonly selectedRoom = signal<RoomMonitoringRecordAl | null>(null);
  readonly roomBookings = signal<RoomBookingRecordAl[]>([]);
  readonly roomBookingsLoading = signal(false);

  ngOnInit(): void {
    // Determine the initial tab from the route URL
    const url = this.route.snapshot.url.join('/');
    let initialTab: TabMode = 'live';
    if (url.includes('no-shows')) {
      initialTab = 'no-shows';
    } else if (url.includes('overruns')) {
      initialTab = 'overruns';
    }
    this.activeTab.set(initialTab);
    this.loadTab(initialTab);
    
    // Start auto-refresh for live tab
    if (initialTab === 'live') {
      this.startAutoRefresh();
    }
  }

  selectTab(tab: TabMode): void {
    // Stop auto-refresh when leaving live tab
    if (this.activeTab() === 'live') {
      this.stopAutoRefresh();
    }
    
    this.activeTab.set(tab);
    this.loadTab(tab);
    
    // Start auto-refresh when entering live tab
    if (tab === 'live') {
      this.startAutoRefresh();
    }
  }

  loadTab(tab: TabMode): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.records.set([]);

    let observable;
    switch (tab) {
      case 'live':
        observable =
          this.monitoringService.getLiveRoomStatus();
        break;
      case 'no-shows':
        observable = this.monitoringService.getNoShows();
        break;
      case 'overruns':
        observable = this.monitoringService.getOverruns();
        break;
    }

    observable.subscribe({
      next: (response) => {
        this.records.set(response ?? []);
        if (tab === 'live') {
          this.updateLiveStats(response);
          this.lastUpdated.set(new Date());
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

  private updateLiveStats(
    records: RoomMonitoringRecordAl[],
  ): void {
    let available = 0;
    let occupied = 0;
    let reserved = 0;
    let maintenance = 0;
    let attention = 0;

    for (const r of records) {
      const status = r.liveStatus ?? '';
      if (status === 'AVAILABLE') available++;
      else if (status === 'OCCUPIED') occupied++;
      else if (status === 'OVERRUN') attention++;
      else if (status === 'MAINTENANCE') { maintenance++; attention++; }
      else if (status === 'RESERVED' || status === 'PENDING' || status === 'CONFIRMED') reserved++;
    }

    this.totalRooms.set(records.length);
    this.availableCount.set(available);
    this.occupiedCount.set(occupied);
    this.reservedCount.set(reserved);
    this.maintenanceCount.set(maintenance);
    this.attentionCount.set(attention);
  }

  // Filter helpers
  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
  }

  selectStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  // Action helpers
  viewBookings(record: RoomMonitoringRecordAl): void {
    this.openRoomDetail(record);
  }

  contactBooker(record: RoomMonitoringRecordAl): void {
    // In a real app, this would open a contact dialog or mailto link
    alert(`Contact: ${record.bookerName ?? 'Unknown'}`);
  }

  refresh(): void {
    this.loadTab(this.activeTab());
    if (this.activeTab() === 'live') {
      this.lastUpdated.set(new Date());
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh(); // Clear any existing timer
    this.autoRefreshTimer = setInterval(() => {
      this.loadTab('live');
    }, this.autoRefreshInterval);
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  /**
   * Calculate time remaining for an active booking.
   * Returns positive minutes remaining, or negative if overrunning.
   */
  getTimeRemaining(record: RoomMonitoringRecordAl): number | null {
    if (!record.startTime || !record.endTime) return null;
    const now = new Date();
    const end = new Date(record.endTime);
    const diff = Math.round((end.getTime() - now.getTime()) / 60000);
    return diff;
  }

  /**
   * Format time remaining as a human-readable string.
   */
  formatTimeRemaining(record: RoomMonitoringRecordAl): string {
    const mins = this.getTimeRemaining(record);
    if (mins === null) return '';
    if (mins > 0) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0) return `${h}h ${m}m remaining`;
      return `${m}m remaining`;
    } else if (mins < 0) {
      const abs = Math.abs(mins);
      const h = Math.floor(abs / 60);
      const m = abs % 60;
      if (h > 0) return `${h}h ${m}m over`;
      return `${abs}m over`;
    }
    return 'Ending now';
  }

  /**
   * Get CSS class for time remaining indicator.
   */
  getTimeRemainingClass(record: RoomMonitoringRecordAl): string {
    const mins = this.getTimeRemaining(record);
    if (mins === null) return '';
    if (mins > 15) return 'time-ok';
    if (mins > 0) return 'time-warning';
    return 'time-danger';
  }

  /**
   * Format status for display (e.g., POTENTIAL_NO_SHOW → Potential No-Show)
   */
  formatStatus(status: string | null): string {
    if (!status) return '—';
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'OCCUPIED': return 'Occupied';
      case 'OVERRUN': return 'Overrun';
      case 'MAINTENANCE': return 'Maintenance';
      case 'RETIRED': return 'Retired';
      case 'NO_SHOW': return 'No-Show';
      case 'POTENTIAL_NO_SHOW': return 'Potential No-Show';
      case 'RESERVED': return 'Reserved';
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      default: return status;
    }
  }

  /**
   * Get CSS class for room card based on status
   */
  getRoomCardClass(record: RoomMonitoringRecordAl): string {
    const status = record.liveStatus ?? '';
    switch (status) {
      case 'OVERRUN': return 'room-card-overrun';
      case 'MAINTENANCE': return 'room-card-maintenance';
      case 'OCCUPIED': return 'room-card-occupied';
      case 'RESERVED': return 'room-card-reserved';
      case 'AVAILABLE': return 'room-card-available';
      default: return '';
    }
  }

  bookingStatusBadgeClass(status: string | null): string {
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
      default:
        return '';
    }
  }

  statusBadgeClass(status: string | null): string {
    switch (status) {
      case 'AVAILABLE':
        return 'badge-available';
      case 'OCCUPIED':
        return 'badge-occupied';
      case 'OVERRUN':
        return 'badge-overrun';
      case 'MAINTENANCE':
        return 'badge-maintenance';
      case 'RETIRED':
        return 'badge-retired';
      case 'NO_SHOW':
        return 'badge-no-show';
      case 'POTENTIAL_NO_SHOW':
        return 'badge-potential-no-show';
      case 'RESERVED':
        return 'badge-reserved';
      default:
        return '';
    }
  }

  private escapeListener = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.selectedRoom()) {
      this.closeRoomDetail();
    }
  };

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.escapeListener);
    this.stopAutoRefresh();
  }

  openRoomDetail(record: RoomMonitoringRecordAl): void {
    if (!record.roomId) return;
    this.selectedRoom.set(record);
    this.roomBookingsLoading.set(true);
    this.roomBookings.set([]);
    document.addEventListener('keydown', this.escapeListener);

    this.monitoringService.getRoomBookings(record.roomId).subscribe({
      next: (bookings) => {
        this.roomBookings.set(bookings ?? []);
        this.roomBookingsLoading.set(false);
      },
      error: () => {
        this.roomBookings.set([]);
        this.roomBookingsLoading.set(false);
      },
    });
  }

  closeRoomDetail(): void {
    this.selectedRoom.set(null);
    this.roomBookings.set([]);
    document.removeEventListener('keydown', this.escapeListener);
  }
}
