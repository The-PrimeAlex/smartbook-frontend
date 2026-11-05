export interface Notification {
  notificationId: string;
  bookingId: string | null;
  eventType: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
}
