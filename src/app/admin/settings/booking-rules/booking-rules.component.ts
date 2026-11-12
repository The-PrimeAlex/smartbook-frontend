import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideCalendar } from '@lucide/angular';
import { SettingsService } from '../../../shared/services/settings.service';
import { Setting } from '../../../shared/models/settings.model';
import { PageBannerComponent } from '../../../shared/ui';

@Component({
  selector: 'app-booking-rules',
  standalone: true,
  imports: [FormsModule, PageBannerComponent],
  templateUrl: './booking-rules.component.html',
  styleUrl: './booking-rules.component.css',
})
export class BookingRulesComponent implements OnInit {
  readonly LucideCalendar = LucideCalendar;
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
}
