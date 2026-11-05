import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import { FormsModule } from '@angular/forms';
import {
  LucideBell,
  LucideCheckCircle2,
  
  LucideFileBox,
  LucideXCircle,
} from '@lucide/angular';
import {
  UserNotificationPreferencesService,
  UserNotificationPreferences,
} from '../../../shared/services/user-notification-preferences.service';
import { PageBannerComponent } from '../../../shared/ui';

interface NotificationPreferenceDef {
  key: keyof UserNotificationPreferences;
  label: string;
  description: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    FormsModule,
    
    PageBannerComponent,
    IconComponent,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  private readonly preferencesService =
    inject(UserNotificationPreferencesService);

  readonly LucideBell = LucideBell;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideFileBox = LucideFileBox;
  readonly LucideXCircle = LucideXCircle;

  readonly preferenceDefinitions: NotificationPreferenceDef[] = [
    {
      key: 'booking_confirmation',
      label: 'Booking Confirmation',
      description: 'Receive an email when your booking is confirmed.',
    },
    {
      key: 'send_reminders',
      label: 'Meeting Reminders',
      description: 'Receive a reminder email before your meeting starts.',
    },
    {
      key: 'noshow_notification',
      label: 'No-Show Notification',
      description: 'Receive a notification when a booking is marked as no-show.',
    },
    {
      key: 'overrun_notification',
      label: 'Overrun Notification',
      description: 'Receive a notification when your booking goes into overrun.',
    },
    {
      key: 'invoice_email',
      label: 'Invoice Email',
      description: 'Receive an invoice email after checkout.',
    },
  ];

  readonly preferences = signal<UserNotificationPreferences>({
    booking_confirmation: true,
    send_reminders: true,
    noshow_notification: true,
    overrun_notification: true,
    invoice_email: true,
  });
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
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

  save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.preferencesService
      .bulkUpdatePreferences(this.preferences())
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

  togglePreference(key: keyof UserNotificationPreferences): void {
    this.preferences.update((prefs) => ({
      ...prefs,
      [key]: !prefs[key],
    }));
  }

  isPreferenceEnabled(key: keyof UserNotificationPreferences): boolean {
    return this.preferences()[key];
  }
}
