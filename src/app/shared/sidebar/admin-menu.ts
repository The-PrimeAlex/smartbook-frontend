import { MenuSection } from './models';

export const ADMIN_MENU: MenuSection[] = [
  {
    label: 'MAIN',
    items: [
      {
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/admin/dashboard',
      },
      {
        label: 'Calendar',
        icon: 'calendar',
        route: '/admin/calendar',
      },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      {
        label: 'Meeting Rooms',
        icon: 'rooms',
        children: [
          {
            label: 'All Rooms',
            icon: 'list',
            route: '/admin/rooms',
          },
          {
            label: 'Add New Room',
            icon: 'plus',
            route: '/admin/rooms/new',
          },
          // { label: 'Room Categories', icon: 'grid', route: '/admin/room-categories' },
          {
            label: 'Room Equipment',
            icon: 'monitor',
            route: '/admin/equipment',
          },
        ],
      },
      {
        label: 'Bookings',
        icon: 'bookings',
        children: [
          {
            label: 'All Bookings',
            icon: 'list',
            route: '/admin/bookings',
          },
          {
            label: 'Create Booking',
            icon: 'plus',
            route: '/admin/bookings/new',
          },
          // { label: 'Pending Approvals', icon: 'clock', route: '/admin/bookings/pending' },
          // { label: 'Booking History', icon: 'history', route: '/admin/bookings/history' },
        ],
      },
      // {
      //   label: 'Tenants',
      //   icon: 'tenants',
      //   children: [
      //     { label: 'All Tenants', icon: 'list', route: '/admin/tenants' },
      //     { label: 'Add Tenant', icon: 'plus', route: '/admin/tenants/new' },
      //     { label: 'Tenant Activity', icon: 'activity', route: '/admin/tenants/activity' },
      //   ],
      // },
    ],
  },
  {
    label: 'MONITORING',
    items: [
      {
        label: 'Room Monitoring',
        icon: 'monitoring',
        children: [
          {
            label: 'Live Room Status',
            icon: 'activity',
            route: '/admin/monitoring',
          },
          {
            label: 'No-Shows',
            icon: 'users',
            route: '/admin/monitoring/no-shows',
          },
          {
            label: 'Overruns',
            icon: 'clock',
            route: '/admin/monitoring/overruns',
          },
        ],
      },
      {
        label: 'Incidents',
        icon: 'incidents',
        children: [
          {
            label: 'All Incidents',
            icon: 'list',
            route: '/admin/incidents',
          },
          {
            label: 'Charged Incidents',
            icon: 'billing',
            route: '/admin/incidents/damage',
          },
        ],
      },
    ],
  },
  {
    label: 'FINANCE & REPORTS',
    items: [
      {
        label: 'Billing',
        icon: 'billing',
        children: [
          {
            label: 'All Invoices',
            icon: 'list',
            route: '/admin/billing',
          },
          {
            label: 'Usage Charges',
            icon: 'clock',
            route: '/admin/billing/usage',
          },
          {
            label: 'Damage Charges',
            icon: 'alert',
            route: '/admin/billing/damages',
          },
          {
            label: 'Payment Records',
            icon: 'payments',
            route: '/admin/billing/payments',
          },
        ],
      },
      {
        label: 'Reports & Analytics',
        icon: 'reports',
        children: [
          {
            label: 'Occupancy Reports',
            icon: 'chart',
            route: '/admin/reports/occupancy',
          },
          {
            label: 'Booking Reports',
            icon: 'calendar',
            route: '/admin/reports/bookings',
          },
          {
            label: 'Revenue Reports',
            icon: 'billing',
            route: '/admin/reports/revenue',
          },
        ],
      },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      {
        label: 'Users & Roles',
        icon: 'users',
        children: [
          {
            label: 'All Users',
            icon: 'list',
            route: '/admin/users',
          },
          {
            label: 'Add User',
            icon: 'plus',
            route: '/admin/users/new',
          },
          {
            label: 'Registration Requests',
            icon: 'mail',
            route: '/admin/users/requests',
          },
          // { label: 'Roles & Permissions', icon: 'shield', route: '/admin/roles' },
        ],
      },
      {
        label: 'My Profile',
        icon: 'profile',
        children: [
          {
            label: 'Personal Information',
            icon: 'user',
            route: '/admin/profile',
          },
          {
            label: 'Change Password',
            icon: 'lock',
            route: '/admin/profile/password',
          },
          // { label: 'Security', icon: 'shield', route: '/admin/profile/security' },
          // { label: 'Activity Log', icon: 'history', route: '/admin/profile/activity' },
        ],
      },
      {
        label: 'Settings',
        icon: 'settings',
        children: [
          // { label: 'General Settings', icon: 'settings', route: '/admin/settings/general' },
          {
            label: 'Room Configuration',
            icon: 'rooms',
            route: '/admin/settings/rooms',
          },
          {
            label: 'Booking Rules',
            icon: 'calendar',
            route: '/admin/settings/bookings',
          },
          {
            label: 'Billing & Rates',
            icon: 'billing',
            route: '/admin/settings/billing',
          },
          {
            label: 'Notifications',
            icon: 'bell',
            route: '/admin/settings/notifications',
          },
          // { label: 'Calendar Integration', icon: 'calendar', route: '/admin/settings/calendar' },
          {
            label: 'Audit Logs',
            icon: 'history',
            route: '/admin/settings/audit-logs',
          },
        ],
      },
    ],
  },
];
