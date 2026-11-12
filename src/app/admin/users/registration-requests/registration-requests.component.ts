import {
  Component,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RegistrationRequestsService,
  RegistrationRequest,
} from './registration-requests.service';
import {
  LucideMail,
  LucideClock,
  LucideCheckCircle,
  LucideXCircle,
  LucideUser,
  LucideBuilding,
  LucidePhone,
  LucideCheck,
  LucideRefreshCw,
} from '@lucide/angular';
import {
  IconComponent,
  StatusBadgeComponent,
  StatCardComponent,
  EmptyStateComponent,
  FilterGroupComponent,
  PageBannerComponent,
  type BadgeVariant,
  type FilterOption,
} from '../../../shared/ui';
import {
  getRegistrationBadgeVariant,
  getRegistrationStatusLabel,
  formatDate,
} from '../../../shared/directives';

@Component({
  selector: 'app-registration-requests',
  standalone: true,
  imports: [
    CommonModule,

    IconComponent,
    StatusBadgeComponent,
    StatCardComponent,
    EmptyStateComponent,
    FilterGroupComponent,
    PageBannerComponent,
  ],
  templateUrl:
    './registration-requests.component.html',
  styleUrl:
    './registration-requests.component.css',
})
export class RegistrationRequestsComponent implements OnInit {
  private readonly service =
    new RegistrationRequestsService();

  readonly LucideMail = LucideMail;
  readonly LucideClock = LucideClock;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideXCircle = LucideXCircle;
  readonly LucideUser = LucideUser;
  readonly LucideBuilding = LucideBuilding;
  readonly LucidePhone = LucidePhone;
  readonly LucideCheck = LucideCheck;
  readonly LucideRefreshCw = LucideRefreshCw;

  requests = signal<RegistrationRequest[]>([]);
  selectedFilter = signal<string>('ALL');
  loading = signal(true);
  successMessage = signal('');
  processingId = signal<string | null>(null);

  readonly filterOptions: FilterOption[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  filteredRequests = computed(() => {
    const filter = this.selectedFilter();
    const all = this.requests();
    if (filter === 'ALL') return all;
    return all.filter((r) => r.status === filter);
  });

  totalCount = computed(
    () => this.requests().length,
  );
  pendingCount = computed(
    () =>
      this.requests().filter(
        (r) => r.status === 'PENDING',
      ).length,
  );
  approvedCount = computed(
    () =>
      this.requests().filter(
        (r) => r.status === 'APPROVED',
      ).length,
  );
  rejectedCount = computed(
    () =>
      this.requests().filter(
        (r) => r.status === 'REJECTED',
      ).length,
  );

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading.set(true);
    const filter =
      this.selectedFilter() === 'ALL'
        ? undefined
        : this.selectedFilter();
    this.service.getRequests(filter).subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.requests.set([]);
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter);
    this.loadRequests();
  }

  approveRequest(request: RegistrationRequest) {
    this.processingId.set(request.requestId);
    this.service
      .approveRequest(request.requestId)
      .subscribe({
        next: () => {
          this.requests.update((reqs) =>
            reqs.map((r) =>
              r.requestId === request.requestId
                ? { ...r, status: 'APPROVED' }
                : r,
            ),
          );
          this.successMessage.set(
            `Request approved for ${request.firstName} ${request.lastName}`,
          );
          this.processingId.set(null);
          setTimeout(
            () => this.successMessage.set(''),
            3000,
          );
        },
        error: () => {
          this.processingId.set(null);
        },
      });
  }

  rejectRequest(request: RegistrationRequest) {
    this.processingId.set(request.requestId);
    this.service
      .rejectRequest(request.requestId)
      .subscribe({
        next: () => {
          this.requests.update((reqs) =>
            reqs.map((r) =>
              r.requestId === request.requestId
                ? { ...r, status: 'REJECTED' }
                : r,
            ),
          );
          this.successMessage.set(
            `Request rejected for ${request.firstName} ${request.lastName}`,
          );
          this.processingId.set(null);
          setTimeout(
            () => this.successMessage.set(''),
            3000,
          );
        },
        error: () => {
          this.processingId.set(null);
        },
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  getStatusLabel = getRegistrationStatusLabel;
  formatDate = formatDate;
  getBadgeVariant = getRegistrationBadgeVariant;
}
