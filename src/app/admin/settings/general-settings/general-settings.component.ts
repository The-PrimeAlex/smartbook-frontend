import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import { FormsModule } from '@angular/forms';
import {
  LucideMoon,
  LucideSettings,
  LucideSun,
} from '@lucide/angular';
import { SettingsService } from '../../../shared/services/settings.service';
import { Setting } from '../../../shared/models/settings.model';
import { ThemeService } from '../../../core/services/theme.service';
import { PageBannerComponent } from '../../../shared/ui';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [
    FormsModule,

    PageBannerComponent,
    IconComponent,
  ],
  templateUrl:
    './general-settings.component.html',
  styleUrl: './general-settings.component.css',
})
export class GeneralSettingsComponent implements OnInit {
  private readonly settingsService = inject(
    SettingsService,
  );
  private readonly themeService =
    inject(ThemeService);

  readonly LucideMoon = LucideMoon;
  readonly LucideSettings = LucideSettings;
  readonly LucideSun = LucideSun;

  readonly darkMode = signal(
    this.themeService.isDark,
  );

  toggleDarkMode(): void {
    this.themeService.toggle();
    this.darkMode.set(this.themeService.isDark);
  }

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
      .getSettingsByCategory('general')
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
