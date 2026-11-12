import { MenuSection } from './models';

export const USER_MENU: MenuSection[] = [
  {
    label: 'WORKSPACE',
    items: [
      {
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
      },
      {
        label: 'Find a Room',
        icon: 'rooms',
        route: '/app/rooms',
      },
      {
        label: 'Calendar',
        icon: 'calendar',
        route: '/app/calendar',
      },
      {
        label: 'Notifications',
        icon: 'bell',
        route: '/app/notifications',
      },
      {
        label: 'My Bookings',
        icon: 'bookings',
        children: [
          {
            label: 'Upcoming Bookings',
            icon: 'calendar',
            route: '/app/bookings/upcoming',
          },
          {
            label: 'Booking History',
            icon: 'history',
            route: '/app/bookings/history',
          },
          {
            label: 'Cancelled Bookings',
            icon: 'list',
            route: '/app/bookings/cancelled',
          },
        ],
      },
    ],
  },
  {
    label: 'MY ACTIVITY',
    items: [
      // { label: 'Room Status', icon: 'monitoring', route: '/app/room-status' },
      {
        label: 'Incidents',
        icon: 'incidents',
        children: [
          {
            label: 'My Incidents',
            icon: 'list',
            route: '/app/incidents',
          },
          {
            label: 'Report an Incident',
            icon: 'plus',
            route: '/app/incidents/new',
          },
        ],
      },
      {
        label: 'My Charges',
        icon: 'billing',
        route: '/app/charges',
      },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      {
        label: 'My Profile',
        icon: 'profile',
        children: [
          {
            label: 'Personal Information',
            icon: 'user',
            route: '/app/profile',
          },
          {
            label: 'Change Password',
            icon: 'lock',
            route: '/app/profile/password',
          },
          {
            label: 'Security',
            icon: 'shield',
            route: '/app/profile/security',
          },
          // { label: 'Notifications', icon: 'bell', route: '/app/profile/notifications' },
        ],
      },
      {
        label: 'Settings',
        icon: 'settings',
        children: [
          {
            label: 'Preferences',
            icon: 'settings',
            route: '/app/settings/preferences',
          },
          {
            label: 'Notifications',
            icon: 'bell',
            route: '/app/settings/notifications',
          },
          {
            label: 'Calendar Integration',
            icon: 'calendar',
            route: '/app/settings/calendar',
          },
        ],
      },
    ],
  },
];
