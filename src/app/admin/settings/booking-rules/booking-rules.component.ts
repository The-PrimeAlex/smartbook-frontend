import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideCalendar,
  LucideClock,
  LucideSave,
  LucideShieldCheck,
  LucideTimer,
} from '@lucide/angular';
import { SettingsService } from '../../../shared/services/settings.service';
import { Setting } from '../../../shared/models/settings.model';
import {
  PageBannerComponent,
  IconComponent,
} from '../../../shared/ui';

@Component({
  selector: 'app-booking-rules',
  standalone: true,
  imports: [FormsModule, PageBannerComponent, IconComponent, KeyValuePipe],
  templateUrl: './booking-rules.component.html',
  styleUrl: './booking-rules.component.css',
})
export class BookingRulesComponent implements OnInit {
  readonly LucideCalendar = LucideCalendar;
  readonly LucideClock = LucideClock;
  readonly LucideSave = LucideSave;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideTimer = LucideTimer;
  private readonly settingsService = inject(
    SettingsService,
  );
  readonly settings = signal<Setting[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  readonly formValues = signal<
    Record<string, string>
  >({});

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.settingsService
      .getSettingsByCategory('booking')
      .subscribe({
        next: (settings) => {
          this.settings.set(settings);
          const values: Record<string, string> =
            {};
          settings.forEach(
            (s) => (values[s.key] = s.value),
          );
          this.formValues.set(values);
          this.loading.set(false);
        },
        error: (e: Error) => {
          this.error.set(e.message);
          this.loading.set(false);
        },
      });
  }

  save(): void {
    this.saving.set(true);
    this.saved.set(false);
    const updates = this.settings().map((s) => ({
      key: s.key,
      value: this.formValues()[s.key] ?? s.value,
    }));
    this.settingsService
      .bulkUpdateSettings(updates)
      .subscribe({
        next: () => {
          this.saved.set(true);
          this.saving.set(false);
          setTimeout(
            () => this.saved.set(false),
            3000,
          );
        },
        error: (e: Error) => {
          this.error.set(e.message);
          this.saving.set(false);
        },
      });
  }

  getValue(key: string): string {
    return this.formValues()[key] ?? '';
  }
  setValue(key: string, value: string): void {
    this.formValues.update((v) => ({
      ...v,
      [key]: value,
    }));
  }

  getGroupIcon(group: string) {
    switch (group) {
      case 'duration':
        return this.LucideClock;
      case 'scheduling':
        return this.LucideTimer;
      case 'policy':
        return this.LucideShieldCheck;
      default:
        return this.LucideCalendar;
    }
  }

  getGroupLabel(group: string): string {
    switch (group) {
      case 'duration':
        return 'Duration Limits';
      case 'scheduling':
        return 'Scheduling Rules';
      case 'policy':
        return 'Booking Policy';
      default:
        return 'Other';
    }
  }

  getGroupedSettings(): Record<string, Setting[]> {
    const groups: Record<string, Setting[]> = {};
    const groupMap: Record<string, string> = {
      'booking.min_duration_minutes': 'duration',
      'booking.max_duration_hours': 'duration',
      'booking.advance_days': 'scheduling',
      'booking.auto_checkin': 'scheduling',
      'booking.auto_checkout_overrun_minutes': 'scheduling',
      'booking.noshow_minutes': 'policy',
      'booking.require_approval': 'policy',
      'booking.allow_overlap': 'policy',
    };
    this.settings().forEach((s) => {
      const group = groupMap[s.key] || 'other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(s);
    });
    return groups;
  }
}
