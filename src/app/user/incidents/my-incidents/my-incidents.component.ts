import {
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import { RouterLink } from '@angular/router';
import {
  LucideCalendar,
  LucideCheckCircle,
  LucideCircleAlert,
  LucideCircleX,
  LucideClock,
  LucideFileText,
  LucideHome,
  LucideTriangleAlert,
} from '@lucide/angular';
import {
  IncidentsService,
  IncidentResponse,
} from '../../../shared/services/incidents.service';
import {
  PageBannerComponent,
  StatCardComponent,
  FilterGroupComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  type FilterOption,
  type BadgeVariant,
} from '../../../shared/ui';
import {
  getIncidentBadgeVariant,
  getIncidentStatusLabel,
  formatDate,
} from '../../../shared/directives';

@Component({
  selector: 'app-my-incidents',
  standalone: true,
  imports: [
    RouterLink,

    PageBannerComponent,
    StatCardComponent,
    FilterGroupComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    IconComponent,
  ],
  templateUrl: './my-incidents.component.html',
  styleUrl: './my-incidents.component.css',
})
export class MyIncidentsComponent implements OnInit {
  incidents = signal<IncidentResponse[]>([]);
  loading = signal(true);
  filterStatus = signal<string>('all');

  readonly LucideCalendar = LucideCalendar;
  readonly LucideCheckCircle = LucideCheckCircle;
  readonly LucideCircleAlert = LucideCircleAlert;
  readonly LucideCircleX = LucideCircleX;
  readonly LucideClock = LucideClock;
  readonly LucideFileText = LucideFileText;
  readonly LucideHome = LucideHome;
  readonly LucideTriangleAlert =
    LucideTriangleAlert;

  readonly filterOptions: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'REPORTED', label: 'Reported' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  constructor(
    private incidentsService: IncidentsService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.incidentsService
      .getMyIncidents()
      .subscribe({
        next: (data) => {
          this.incidents.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  get filteredIncidents() {
    const all = this.incidents();
    if (this.filterStatus() === 'all') return all;
    return all.filter(
      (i) =>
        i.incidentStatus === this.filterStatus(),
    );
  }

  get totalIncidents() {
    return this.incidents().length;
  }

  get reportedCount() {
    return this.incidents().filter(
      (i) => i.incidentStatus === 'REPORTED',
    ).length;
  }

  get verifiedCount() {
    return this.incidents().filter(
      (i) => i.incidentStatus === 'VERIFIED',
    ).length;
  }

  get rejectedCount() {
    return this.incidents().filter(
      (i) => i.incidentStatus === 'REJECTED',
    ).length;
  }

  getStatusLabel = getIncidentStatusLabel;

  getStatusClass(status: string): string {
    switch (status) {
      case 'REPORTED':
        return 'status-reported';
      case 'VERIFIED':
        return 'status-verified';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  }

  isCharged(incident: IncidentResponse): boolean {
    return (
      incident.incidentStatus === 'VERIFIED' &&
      incident.chargeAmount !== null &&
      incident.chargeAmount > 0
    );
  }

  isWaived(incident: IncidentResponse): boolean {
    return (
      incident.incidentStatus === 'VERIFIED' &&
      (incident.chargeAmount === null ||
        incident.chargeAmount === 0)
    );
  }

  getChargeLabel(
    incident: IncidentResponse,
  ): string {
    if (this.isCharged(incident)) {
      return `Charged — KES ${incident.chargeAmount}`;
    } else if (this.isWaived(incident)) {
      return 'Charge Waived';
    }
    return '';
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'EQUIPMENT_DAMAGE':
        return 'Equipment Damage';
      case 'ROOM_DAMAGE':
        return 'Room Damage';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  }

  formatDate = formatDate;

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  getBadgeVariant = getIncidentBadgeVariant;
}
