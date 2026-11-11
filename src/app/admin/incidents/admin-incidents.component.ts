import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import {
  Router,
  RouterLink,
  ActivatedRoute,
} from '@angular/router';
import {
  LucideAlertTriangle,
  LucideCalendar,
  LucideCheckCircle2,
  LucideCircleAlert,
  LucideDollarSign,
  LucideFileText,
  LucideLoader,
  LucideMapPin,
  LucideUser,
  LucideX,
} from '@lucide/angular';
import {
  IncidentsService,
  IncidentResponse,
  IncidentActionRequest,
} from '../../shared/services/incidents.service';
import {
  IconComponent,
  StatusBadgeComponent,
  StatCardComponent,
  EmptyStateComponent,
  FilterGroupComponent,
  PageBannerComponent,
  type BadgeVariant,
  type FilterOption,
} from '../../shared/ui';
import {
  getIncidentBadgeVariant,
  getIncidentStatusLabel,
  formatDate,
  formatCurrency,
} from '../../shared/directives';

@Component({
  selector: 'app-admin-incidents',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,

    IconComponent,
    StatusBadgeComponent,
    StatCardComponent,
    EmptyStateComponent,
    FilterGroupComponent,
    PageBannerComponent,
  ],
  templateUrl: './admin-incidents.component.html',
  styleUrl: './admin-incidents.component.css',
})
export class AdminIncidentsComponent implements OnInit {
  readonly LucideAlertTriangle = LucideAlertTriangle;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideCircleAlert = LucideCircleAlert;
  readonly LucideDollarSign = LucideDollarSign;
  readonly LucideFileText = LucideFileText;
  readonly LucideLoader = LucideLoader;
  readonly LucideMapPin = LucideMapPin;
  readonly LucideUser = LucideUser;
  readonly LucideX = LucideX;

  incidents = signal<IncidentResponse[]>([]);
  loading = signal(true);
  filterStatus = signal<string>('all');
  message = signal<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  isDamagePage = signal(false);

  readonly filterOptions: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'REPORTED', label: 'Reported' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Waived' },
  ];

  // Side panel
  showSidePanel = signal(false);
  sidePanelMode = signal<'charge' | 'waive'>('charge');
  selectedIncident = signal<IncidentResponse | null>(null);
  chargeAmount = signal('');
  chargeReason = signal('');
  waiveReason = signal('');
  processing = signal(false);

  constructor(
    private incidentsService: IncidentsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isDamagePage.set(
      this.router.url === '/admin/incidents/damage',
    );
    this.load();
  }

  load() {
    this.loading.set(true);
    const status =
      this.filterStatus() === 'all'
        ? undefined
        : this.filterStatus();
    this.incidentsService
      .getAllIncidents(status)
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

  onFilterChange() {
    this.load();
  }

  onFilterSelect(value: string) {
    this.filterStatus.set(value);
    this.onFilterChange();
  }

  getBadgeVariant = getIncidentBadgeVariant;

  getFilteredIncidents(): IncidentResponse[] {
    const all = this.incidents();
    if (this.isDamagePage()) {
      // Damage Charges page: show only VERIFIED incidents with a charge amount
      return all.filter(
        (i) =>
          i.incidentStatus === 'VERIFIED' &&
          i.chargeAmount &&
          i.chargeAmount > 0,
      );
    }
    return all;
  }

  get totalIncidents() {
    return this.getFilteredIncidents().length;
  }

  get reportedCount() {
    return this.getFilteredIncidents().filter(
      (i) => i.incidentStatus === 'REPORTED',
    ).length;
  }

  get verifiedCount() {
    return this.getFilteredIncidents().filter(
      (i) => i.incidentStatus === 'VERIFIED',
    ).length;
  }

  get rejectedCount() {
    return this.getFilteredIncidents().filter(
      (i) => i.incidentStatus === 'REJECTED',
    ).length;
  }

  get pendingActionCount() {
    return this.getFilteredIncidents().filter(
      (i) => i.incidentStatus === 'REPORTED',
    ).length;
  }

  get totalChargesAmount() {
    return this.getFilteredIncidents().reduce(
      (sum, i) => sum + (i.chargeAmount || 0),
      0,
    );
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

  canTakeAction(incident: IncidentResponse): boolean {
    return incident.incidentStatus === 'REPORTED';
  }

  verifyIncident(incident: IncidentResponse) {
    this.incidentsService
      .verifyIncident(incident.incidentId)
      .subscribe({
        next: () => {
          this.message.set({
            type: 'success',
            text: 'Incident verified',
          });
          this.load();
          setTimeout(() => this.message.set(null), 4000);
        },
        error: (err) => {
          this.message.set({
            type: 'error',
            text:
              err.error?.message ||
              'Failed to verify incident',
          });
          setTimeout(() => this.message.set(null), 4000);
        },
      });
  }

  openChargePanel(incident: IncidentResponse) {
    this.selectedIncident.set(incident);
    this.sidePanelMode.set('charge');
    this.chargeAmount.set(
      incident.chargeAmount
        ? incident.chargeAmount.toString()
        : '',
    );
    this.chargeReason.set('');
    this.showSidePanel.set(true);
  }

  openWaivePanel(incident: IncidentResponse) {
    this.selectedIncident.set(incident);
    this.sidePanelMode.set('waive');
    this.waiveReason.set('');
    this.showSidePanel.set(true);
  }

  closeSidePanel() {
    this.showSidePanel.set(false);
  }

  closeSidePanelIfOverlayClick(event: Event) {
    // Only close if clicking directly on the overlay, not on child elements
    if (event.target === event.currentTarget) {
      this.showSidePanel.set(false);
    }
  }

  switchPanelTab(mode: 'charge' | 'waive') {
    this.sidePanelMode.set(mode);
  }

  submitCharge(_form: NgForm) {
    const incident = this.selectedIncident();
    if (!incident || !this.chargeAmount()) return;

    this.processing.set(true);
    const request: IncidentActionRequest = {
      chargeAmount: parseFloat(this.chargeAmount()),
      reason: this.chargeReason() || 'Incident charge',
    };

    this.incidentsService
      .chargeIncident(incident.incidentId, request)
      .subscribe({
        next: () => {
          this.showSidePanel.set(false);
          this.processing.set(false);
          this.message.set({
            type: 'success',
            text: 'Charge applied successfully',
          });
          this.load();
          setTimeout(() => this.message.set(null), 4000);
        },
        error: (err) => {
          this.processing.set(false);
          this.message.set({
            type: 'error',
            text:
              err.error?.message ||
              'Failed to apply charge',
          });
          setTimeout(() => this.message.set(null), 4000);
        },
      });
  }

  submitWaive(_form: NgForm) {
    const incident = this.selectedIncident();
    if (!incident) return;

    this.processing.set(true);
    const request: IncidentActionRequest = {
      chargeAmount: 0,
      reason:
        this.waiveReason() || 'Charge waived by admin',
    };

    this.incidentsService
      .waiveIncident(incident.incidentId, request)
      .subscribe({
        next: () => {
          this.showSidePanel.set(false);
          this.processing.set(false);
          this.message.set({
            type: 'success',
            text: 'Charge waived successfully',
          });
          this.load();
          setTimeout(() => this.message.set(null), 4000);
        },
        error: (err) => {
          this.processing.set(false);
          this.message.set({
            type: 'error',
            text:
              err.error?.message ||
              'Failed to waive charge',
          });
          setTimeout(() => this.message.set(null), 4000);
        },
      });
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

  formatCurrency = formatCurrency;
}
