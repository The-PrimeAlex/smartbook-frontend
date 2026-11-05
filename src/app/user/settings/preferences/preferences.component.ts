import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import { FormsModule } from '@angular/forms';
import {
  LucideCheckCircle2,
  
  LucideFileBox,
  LucideMoon,
  LucideSettings,
  LucideSun,
  LucideXCircle,
} from '@lucide/angular';
import { SettingsService } from '../../../shared/services/settings.service';
import { Setting } from '../../../shared/models/settings.model';
import { ThemeService } from '../../../core/services/theme.service';
import { PageBannerComponent } from '../../../shared/ui';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [
    FormsModule,
    
    PageBannerComponent,
    IconComponent,
  ],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.css',
})
export class PreferencesComponent implements OnInit {
  private readonly settingsService =
    inject(SettingsService);
  private readonly themeService = inject(ThemeService);

  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideFileBox = LucideFileBox;
  readonly LucideMoon = LucideMoon;
  readonly LucideSettings = LucideSettings;
  readonly LucideSun = LucideSun;
  readonly LucideXCircle = LucideXCircle;
  readonly settings = signal<Setting[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  readonly formValues = signal<Record<string, string>>({});
  readonly darkMode = signal(this.themeService.isDark);

  readonly timezoneOptions = [
    'Africa/Nairobi',
    'Africa/Lagos',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  readonly weekStartOptions = [
    'Sunday',
    'Monday',
    'Saturday',
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.settingsService
      .getSettingsByCategory('general')
      .subscribe({
        next: (settings) => {
          this.settings.set(settings);
          const values: Record<string, string> = {};
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
          setTimeout(() => this.saved.set(false), 3000);
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
    this.formValues.update((v) => ({ ...v, [key]: value }));
  }

  toggleDarkMode(): void {
    const next = this.themeService.toggle();
    this.darkMode.set(next === 'dark');
  }
}
