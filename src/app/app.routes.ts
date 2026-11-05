import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/password-reset/password-reset.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'registration-request',
    loadComponent: () =>
      import('./auth/registration/registration.component').then(
        (m) => m.RegistrationRequestComponent,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(
        (m) => m.PasswordResetComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        pathMatch: 'full',
        loadComponent: () =>
          import('./user/dashboard/dashboard.component').then(
            (m) => m.Dashboard,
          ),
      },
      {
        path: 'app',
        children: [
          {
            path: 'rooms',
            loadComponent: () =>
              import('./user/rooms/find-rooms/find-rooms.component').then(
                (m) => m.FindRoomsComponent,
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./user/profile/my-profile/my-profile.component').then(
                (m) => m.MyProfileComponent,
              ),
          },
          {
            path: 'profile/password',
            loadComponent: () =>
              import('./user/profile/change-password/change-password.component').then(
                (m) => m.ChangePasswordComponent,
              ),
          },
          {
            path: 'profile/security',
            loadComponent: () =>
              import('./user/profile/security/security.component').then(
                (m) => m.SecurityComponent,
              ),
          },
          {
            path: 'profile/notifications',
            loadComponent: () =>
              import('./user/profile/notifications/notifications.component').then(
                (m) => m.NotificationsComponent,
              ),
          },
          {
            path: 'settings/preferences',
            loadComponent: () =>
              import('./user/settings/preferences/preferences.component').then(
                (m) => m.PreferencesComponent,
              ),
          },
          {
            path: 'settings/notifications',
            loadComponent: () =>
              import('./user/profile/notifications/notifications.component').then(
                (m) => m.NotificationsComponent,
              ),
          },
          {
            path: 'bookings/upcoming',
            loadComponent: () =>
              import('./user/bookings/upcoming-bookings/upcoming-bookings.component').then(
                (m) => m.UpcomingBookingsComponent,
              ),
          },
          {
            path: 'bookings/history',
            loadComponent: () =>
              import('./user/bookings/booking-history/booking-history.component').then(
                (m) => m.BookingHistoryComponent,
              ),
          },
          {
            path: 'bookings/cancelled',
            loadComponent: () =>
              import('./user/bookings/cancelled-bookings/cancelled-bookings.component').then(
                (m) => m.CancelledBookingsComponent,
              ),
          },
          {
            path: 'bookings/new',
            loadComponent: () =>
              import('./user/bookings/create-booking/create-booking.component').then(
                (m) => m.CreateBookingComponent,
              ),
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./user/notifications/notification-inbox/notification-inbox.component').then(
                (m) => m.NotificationInboxComponent,
              ),
          },
          {
            path: 'charges',
            loadComponent: () =>
              import('./user/billing/my-charges/my-charges.component').then(
                (m) => m.MyChargesComponent,
              ),
          },
          {
            path: 'incidents',
            loadComponent: () =>
              import('./user/incidents/my-incidents/my-incidents.component').then(
                (m) => m.MyIncidentsComponent,
              ),
          },
          {
            path: 'incidents/new',
            loadComponent: () =>
              import('./user/incidents/report-incident/report-incident.component').then(
                (m) => m.ReportIncidentComponent,
              ),
          },
          {
            path: 'calendar',
            loadComponent: () =>
              import('./admin/calendar/calendar.component').then(
                (m) => m.CalendarComponent,
              ),
          },
          {
            path: 'settings/calendar',
            loadComponent: () =>
              import('./admin/settings/calendar-integration/calendar-integration.component').then(
                (m) => m.CalendarIntegrationComponent,
              ),
          },
        ],
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./admin/dashboard/admin-dashboard.component').then(
                (m) => m.AdminDashboard,
              ),
          },
          {
            path: 'calendar',
            loadComponent: () =>
              import('./admin/calendar/calendar.component').then(
                (m) => m.CalendarComponent,
              ),
          },
          {
            path: 'bookings',

            loadComponent: () =>
              import('./admin/bookings/view-bookings/view-bookings.component').then(
                (m) => m.ViewBookingsComponent,
              ),
          },
          {
            path: 'bookings/new',
            loadComponent: () =>
              import('./admin/bookings/create-booking/create-booking.component').then(
                (m) => m.CreateBookingComponent,
              ),
          },
          {
            path: 'rooms',
            loadComponent: () =>
              import('./admin/rooms/view-rooms/view-rooms.component').then(
                (m) => m.ViewRoomsComponent,
              ),
          },
          {
            path: 'rooms/new',
            loadComponent: () =>
              import('./admin/rooms/new-room/new-room.component').then(
                (m) => m.NewRoomComponent,
              ),
          },
          {
            path: 'equipment',
            loadComponent: () =>
              import('./admin/equipments/room-equipments/room-equipments.component').then(
                (m) => m.RoomEquipmentComponent,
              ),
          },
          {
            path: 'users/new',
            loadComponent: () =>
              import('./admin/users/add-user/add-user.component').then(
                (m) => m.AddUserComponent,
              ),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./admin/users/view-users/view-users.component').then(
                (m) => m.ViewUsersComponent,
              ),
          },
          {
            path: 'users/requests',
            loadComponent: () =>
              import('./admin/users/registration-requests/registration-requests.component').then(
                (m) => m.RegistrationRequestsComponent,
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./user/profile/my-profile/my-profile.component').then(
                (m) => m.MyProfileComponent,
              ),
          },
          {
            path: 'profile/password',
            loadComponent: () =>
              import('./user/profile/change-password/change-password.component').then(
                (m) => m.ChangePasswordComponent,
              ),
          },
          {
            path: 'monitoring',
            loadComponent: () =>
              import('./admin/monitoring/room-monitoring/room-monitoring-al.component').then(
                (m) => m.RoomMonitoringAlComponent,
              ),
          },
          {
            path: 'monitoring/no-shows',
            loadComponent: () =>
              import('./admin/monitoring/room-monitoring/room-monitoring-al.component').then(
                (m) => m.RoomMonitoringAlComponent,
              ),
          },
          {
            path: 'monitoring/overruns',
            loadComponent: () =>
              import('./admin/monitoring/room-monitoring/room-monitoring-al.component').then(
                (m) => m.RoomMonitoringAlComponent,
              ),
          },
          {
            path: 'incidents',
            loadComponent: () =>
              import('./admin/incidents/admin-incidents.component').then(
                (m) => m.AdminIncidentsComponent,
              ),
          },
          {
            path: 'incidents/damage',
            loadComponent: () =>
              import('./admin/incidents/admin-incidents.component').then(
                (m) => m.AdminIncidentsComponent,
              ),
          },
          {
            path: 'billing',
            loadComponent: () =>
              import('./admin/billing/all-invoices/all-invoices.component').then(
                (m) => m.AllInvoicesComponent,
              ),
          },
          {
            path: 'billing/usage',
            loadComponent: () =>
              import('./admin/billing/usage-charges/usage-charges.component').then(
                (m) => m.UsageChargesComponent,
              ),
          },
          {
            path: 'billing/damages',
            loadComponent: () =>
              import('./admin/billing/damage-charges/damage-charges.component').then(
                (m) => m.DamageChargesComponent,
              ),
          },
          {
            path: 'billing/payments',
            loadComponent: () =>
              import('./admin/billing/payment-records/payment-records.component').then(
                (m) => m.PaymentRecordsComponent,
              ),
          },
          {
            path: 'reports/occupancy',
            loadComponent: () =>
              import('./admin/reports/reports-al/reports-al.component').then(
                (m) => m.ReportsAlComponent,
              ),
          },
          {
            path: 'reports/bookings',
            loadComponent: () =>
              import('./admin/reports/reports-al/reports-al.component').then(
                (m) => m.ReportsAlComponent,
              ),
          },
          {
            path: 'reports/revenue',
            loadComponent: () =>
              import('./admin/reports/reports-al/reports-al.component').then(
                (m) => m.ReportsAlComponent,
              ),
          },
          {
            path: 'settings/general',
            loadComponent: () =>
              import('./admin/settings/general-settings/general-settings.component').then(
                (m) => m.GeneralSettingsComponent,
              ),
          },
          {
            path: 'settings/rooms',
            loadComponent: () =>
              import('./admin/settings/room-configuration/room-configuration.component').then(
                (m) => m.RoomConfigurationComponent,
              ),
          },
          {
            path: 'settings/bookings',
            loadComponent: () =>
              import('./admin/settings/booking-rules/booking-rules.component').then(
                (m) => m.BookingRulesComponent,
              ),
          },
          {
            path: 'settings/billing',
            loadComponent: () =>
              import('./admin/settings/billing-rates/billing-rates.component').then(
                (m) => m.BillingRatesComponent,
              ),
          },
          {
            path: 'settings/notifications',
            loadComponent: () =>
              import('./admin/settings/notifications-settings/notifications-settings.component').then(
                (m) => m.NotificationsSettingsComponent,
              ),
          },
          {
            path: 'settings/calendar',
            loadComponent: () =>
              import('./admin/settings/calendar-integration/calendar-integration.component').then(
                (m) => m.CalendarIntegrationComponent,
              ),
          },
          {
            path: 'settings/audit-logs',
            loadComponent: () =>
              import('./admin/settings/audit-logs/audit-logs.component').then(
                (m) => m.AuditLogsComponent,
              ),
          },
        ],
      },
    ],
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./pages/forbidden/forbidden.component').then(
        (m) => m.ForbiddenComponent,
      ),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./auth/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
  {
    path: 'admin',
    pathMatch: 'full',
    redirectTo: 'admin/dashboard',
  },
];
