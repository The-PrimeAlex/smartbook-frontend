import {
  Component,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import {
  LucideAlertTriangle,
  LucideChevronDown,
  LucideClock,
  LucideUser,
} from '@lucide/angular';
import {
  AdminBillingService,
  AdminUsageRecord,
} from '../admin-billing.service';
import {
  IconComponent,
  StatCardComponent,
  EmptyStateComponent,
  PageBannerComponent,
} from '../../../shared/ui';
import { formatDateTime } from '../../../shared/directives';

@Component({
  selector: 'app-usage-charges',
  standalone: true,
  imports: [
    CommonModule,

    IconComponent,
    StatCardComponent,
    EmptyStateComponent,
    PageBannerComponent,
  ],
  templateUrl: './usage-charges.component.html',
  styleUrl: './usage-charges.component.css',
})
export class UsageChargesComponent implements OnInit {
  readonly LucideAlertTriangle = LucideAlertTriangle;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideClock = LucideClock;
  readonly LucideUser = LucideUser;

  readonly usage = signal<AdminUsageRecord[]>([]);
  readonly loading = signal(true);
  readonly statsCollapsed = signal(false);

  toggleStatsCollapsed(): void {
    this.statsCollapsed.update((v) => !v);
  }

  readonly totalUsage = computed(() => this.usage().length);
  readonly totalDuration = computed(() =>
    this.usage().reduce(
      (sum, u) => sum + (u.actualDurationMinutes || 0),
      0,
    ),
  );
  readonly totalOverrun = computed(() =>
    this.usage().reduce(
      (sum, u) => sum + (u.overrunMinutes || 0),
      0,
    ),
  );
  readonly autoClosedCount = computed(
    () => this.usage().filter((u) => u.autoClosed).length,
  );

  constructor(
    private billingService: AdminBillingService,
  ) {}

  ngOnInit(): void {
    this.loadUsage();
  }

  loadUsage(): void {
    this.loading.set(true);
    this.billingService
      .getAllUsage()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.usage.set(data),
        error: () => this.loading.set(false),
      });
  }

  formatDuration(minutes: number | null): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  formatDateTime = (v: string | null) =>
    v ? formatDateTime(v) : '—';
}
