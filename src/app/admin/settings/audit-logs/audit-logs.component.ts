import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LucideFileClock } from '@lucide/angular';
import { SettingsService } from '../../../shared/services/settings.service';
import { Setting } from '../../../shared/models/settings.model';
import {
  PageBannerComponent,
  EmptyStateComponent,
} from '../../../shared/ui';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    PageBannerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css',
})
export class AuditLogsComponent implements OnInit {
  readonly LucideFileClock = LucideFileClock;
  private readonly settingsService =
    inject(SettingsService);
  readonly settings = signal<Setting[]>([]);
  readonly allSettings = signal<Setting[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  readonly formValues = signal<Record<string, string>>({});

  /** Modified settings sorted by updatedAt descending (most recent first) */
  get sortedModifiedSettings() {
    return [...this.allSettings()].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime(),
    );
  }

  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.settingsService
      .getSettingsByCategory('audit')
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
    // Load all settings to show modified ones
    this.settingsService.getAllSettings().subscribe({
      next: (all) => {
        this.allSettings.set(
          all.filter((s) => !s.systemDefault),
        );
      },
      error: () => {
        /* non-critical */
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
}
