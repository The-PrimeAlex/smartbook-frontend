import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import { CommonModule } from '@angular/common';
import {
  LucideBell,
  LucideCheck,
  LucideCheckCheck,
  LucideCircle,
  LucideClock,
  LucideTriangleAlert,
} from '@lucide/angular';
import { Notification } from '../../../shared/models/notification.model';
import { NotificationService } from '../../../shared/services/notification.service';
import {
  PageBannerComponent,
  StatCardComponent,
  FilterGroupComponent,
  EmptyStateComponent,
  type FilterOption,
} from '../../../shared/ui';

@Component({
  selector: 'app-notification-inbox',
  standalone: true,
  imports: [
    CommonModule,

    PageBannerComponent,
    StatCardComponent,
    FilterGroupComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  templateUrl:
    './notification-inbox.component.html',
  styleUrl: './notification-inbox.component.css',
})
export class NotificationInboxComponent implements OnInit {
  private readonly notificationService = inject(
    NotificationService,
  );

  readonly LucideBell = LucideBell;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCheck = LucideCheckCheck;
  readonly LucideCircle = LucideCircle;
  readonly LucideClock = LucideClock;
  readonly LucideTriangleAlert =
    LucideTriangleAlert;

  readonly filterOptions: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
  ];

  readonly notifications = signal<Notification[]>(
    [],
  );
  readonly loading = signal(true);
  readonly filter = signal<'all' | 'unread'>(
    'all',
  );
  readonly markingAll = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const unreadOnly = this.filter() === 'unread';
    this.notificationService
      .getNotifications(unreadOnly)
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  markRead(notification: Notification): void {
    this.notificationService
      .markAsRead(notification.notificationId)
      .subscribe({
        next: () => {
          const current = this.notifications();
          this.notifications.set(
            current.map((n) =>
              n.notificationId ===
              notification.notificationId
                ? {
                    ...n,
                    isRead: true,
                    readAt:
                      new Date().toISOString(),
                  }
                : n,
            ),
          );
        },
      });
  }

  markAllRead(): void {
    this.markingAll.set(true);
    this.notificationService
      .markAllAsRead()
      .subscribe({
        next: () => {
          this.notifications.set(
            this.notifications().map((n) => ({
              ...n,
              isRead: true,
              readAt: new Date().toISOString(),
            })),
          );
          this.markingAll.set(false);
        },
        error: () => {
          this.markingAll.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.load();
  }

  get unreadCount(): number {
    return this.notifications().filter(
      (n) => !n.isRead,
    ).length;
  }

  get total(): number {
    return this.notifications().length;
  }

  getEventTypeClass(eventType: string): string {
    switch (eventType) {
      case 'AUTO_CHECK_IN':
        return 'event-auto-checkin';
      case 'OVERRUN':
        return 'event-overrun';
      case 'BOOKING_CONFLICT':
        return 'event-conflict';
      case 'NO_SHOW':
        return 'event-no-show';
      default:
        return 'event-default';
    }
  }

  getEventTypeLabel(eventType: string): string {
    switch (eventType) {
      case 'AUTO_CHECK_IN':
        return 'Auto Check-in';
      case 'OVERRUN':
        return 'Overrun';
      case 'BOOKING_CONFLICT':
        return 'Booking Conflict';
      case 'NO_SHOW':
        return 'No-show';
      default:
        return eventType;
    }
  }

  timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(
      diffMs / 3600000,
    );
    const diffDays = Math.floor(
      diffMs / 86400000,
    );

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24)
      return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  onFilterSelect(value: string) {
    this.filter.set(value as 'all' | 'unread');
    this.onFilterChange();
  }
}
