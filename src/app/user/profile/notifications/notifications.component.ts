import { Component, OnInit, inject, signal } from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import {
  LucideBell,
} from '@lucide/angular';
import {
  UserNotificationPreferencesService,
  UserNotificationPreferences,
} from '../../../shared/services/user-notification-preferences.service';
import { PageBannerComponent } from '../../../shared/ui';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [PageBannerComponent, IconComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  private readonly preferencesService = inject(
    UserNotificationPreferencesService,
  );

  readonly LucideBell = LucideBell;

  readonly preferences = signal<UserNotificationPreferences>({
    send_reminders: true,
  });
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.preferencesService.getPreferences().subscribe({
      next: (prefs) => {
        this.preferences.set(prefs);
        this.loading.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  toggleReminders(): void {
    this.preferences.update((prefs) => ({
      ...prefs,
      send_reminders: !prefs.send_reminders,
    }));
    // Auto-save
    this.preferencesService
      .bulkUpdatePreferences(this.preferences())
      .subscribe({
        error: (e: Error) => this.error.set(e.message),
      });
  }
}
