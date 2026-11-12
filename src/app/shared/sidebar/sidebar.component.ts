import {
  Component,
  HostBinding,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { IconComponent } from '../ui';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs';

import {
  LucideBell,
  LucideCalendarCheck,
  LucideCalendarDays,
  LucideChartNoAxesCombined,
  LucideDoorOpen,
  LucideHistory,
  LucideHouse,
  LucideLogOut,
  LucideMail,
  LucideMonitor,
  LucideReceipt,
  LucideSettings,
  LucideUsers,
} from '@lucide/angular';

import { AuthService } from '../../core/auth/auth.service';
import { ConfirmLogoutModalComponent } from '../../core/services/confirm-logout-modal/confirm-logout-modal.component';
import type {
  MenuItem,
  MenuSection,
  SidebarRole,
} from './models';
import { ADMIN_MENU } from './admin-menu';
import { USER_MENU } from './user-menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,

    ConfirmLogoutModalComponent,
    IconComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly iconMap: Record<string, any> = {
    // Main navigation
    dashboard: LucideHouse,
    calendar: LucideCalendarDays,
    rooms: LucideDoorOpen,
    bookings: LucideCalendarCheck,
    tenants: LucideUsers,

    // Monitoring
    monitoring: LucideMonitor,
    incidents: LucideReceipt,

    // Finance and reports
    billing: LucideReceipt,
    reports: LucideChartNoAxesCombined,

    // Administration
    users: LucideUsers,
    profile: LucideUsers,
    settings: LucideSettings,
    notifications: LucideBell,
    history: LucideHistory,

    // General submenu keys
    list: LucideCalendarDays,
    plus: LucideCalendarCheck,
    grid: LucideDoorOpen,
    monitor: LucideMonitor,
    clock: LucideCalendarDays,
    activity: LucideChartNoAxesCombined,
    alert: LucideBell,
    payments: LucideReceipt,
    chart: LucideChartNoAxesCombined,
    shield: LucideSettings,
    user: LucideUsers,
    lock: LucideSettings,

    // Specific submenu keys
    'all-rooms': LucideDoorOpen,
    'add-room': LucideCalendarCheck,
    'room-categories': LucideDoorOpen,
    'room-equipment': LucideSettings,
    'all-bookings': LucideCalendarCheck,
    'create-booking': LucideCalendarCheck,
    'booking-history': LucideHistory,
    'all-tenants': LucideUsers,
    'live-room-status': LucideMonitor,
    'all-incidents': LucideReceipt,
    'all-invoices': LucideReceipt,
    'occupancy-reports': LucideChartNoAxesCombined,
    'general-settings': LucideSettings,
    'room-configuration': LucideSettings,
    'booking-rules': LucideCalendarCheck,
    'calendar-integration': LucideCalendarDays,
    'audit-logs': LucideHistory,
    mail: LucideMail,
    bell: LucideBell,
  };

  protected readonly LucidHouse = LucideHouse;
  protected readonly LucidLogOut = LucideLogOut;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild(ConfirmLogoutModalComponent)
  confirmModal!: ConfirmLogoutModalComponent;

  @HostBinding('class.mobile-open')
  get mobileOpenClass(): boolean {
    return this.mobileOpen();
  }

  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly expandedMenus = signal<Record<string, boolean>>(
    {},
  );

  readonly currentUser = this.authService.currentUser;

  readonly isAdmin = computed(() =>
    this.authService.hasRole('ADMIN'),
  );

  readonly role = computed<SidebarRole>(() =>
    this.isAdmin() ? 'admin' : 'user',
  );

  readonly menu = computed<MenuSection[]>(() =>
    this.isAdmin() ? ADMIN_MENU : USER_MENU,
  );

  readonly subtitle = computed(() =>
    this.isAdmin() ? 'Administrator' : 'Meeting Management',
  );

  private isMobile = signal(false);

  constructor() {
    // Check mobile state
    this.isMobile.set(window.matchMedia('(max-width: 30rem)').matches);

    // Listen for window resize to detect mobile/desktop transitions
    const mql = window.matchMedia('(max-width: 30rem)');
    mql.addEventListener('change', (e) => {
      this.isMobile.set(e.matches);
      if (!e.matches) {
        // Switching to desktop: close mobile drawer
        this.mobileOpen.set(false);
      }
    });

    // Watch for auth state changes and close sidebar on mobile when user logs in
    effect(() => {
      const user = this.currentUser();
      if (user && this.isMobile()) {
        this.mobileOpen.set(false);
      }
    });

    this.expandActiveParent();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
      )
      .subscribe(() => {
        // Close mobile sidebar on navigation
        if (this.isMobile()) {
          this.mobileOpen.set(false);
        }
        this.expandActiveParent();
      });
  }

  readonly fullName = computed(() => {
    const user = this.currentUser();

    if (!user) return 'Account';

    return `${user.firstName} ${user.lastName}`.trim();
  });

  readonly initials = computed(() => {
    const user = this.currentUser();

    if (!user) return 'BS';

    return (
      `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() ||
      'BS'
    );
  });

  readonly email = computed(
    () => this.currentUser()?.email ?? '',
  );

  toggleSidebar(): void {
    if (this.isMobile()) {
      // On mobile, toggle the slide-in/out drawer
      this.mobileOpen.update((val) => !val);
    } else {
      // On desktop, toggle the collapsed state
      this.collapsed.update((value) => !value);
    }
  }

  /** Exposed for the main-layout hamburger button to open the mobile drawer */
  toggleMobileOpen(): void {
    this.mobileOpen.update((val) => !val);
  }

  /** Exposed for the main-layout to close the mobile drawer */
  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  openSidebarOnClick(): void {
    if (this.isMobile()) {
      // Close mobile sidebar after clicking a menu item
      this.mobileOpen.set(false);
    } else if (this.collapsed()) {
      this.collapsed.set(false);
    }
  }

  toggleMenu(label: string): void {
    if (this.isMobile()) {
      // On mobile, expand the submenu but keep the sidebar open
      this.expandedMenus.update((menus) => ({
        ...menus,
        [label]: !menus[label],
      }));
      return;
    }

    if (this.collapsed()) {
      this.collapsed.set(false);

      this.expandedMenus.update((menus) => ({
        ...menus,
        [label]: true,
      }));

      return;
    }

    this.expandedMenus.update((menus) => ({
      ...menus,
      [label]: !menus[label],
    }));
  }

  isExpanded(label: string): boolean {
    return !!this.expandedMenus()[label];
  }

  hasChildren(item: MenuItem): boolean {
    return !!item.children?.length;
  }

  private expandActiveParent(): void {
    const currentUrl = this.router.url;

    this.expandedMenus.update((menus) => {
      const updated = { ...menus };

      for (const section of this.menu()) {
        for (const item of section.items) {
          if (
            item.children?.some(
              (child) =>
                child.route &&
                (currentUrl === child.route ||
                  currentUrl.startsWith(
                    `${child.route}/`,
                  ) ||
                  currentUrl.startsWith(`${child.route}?`)),
            )
          ) {
            updated[item.label] = true;
          }
        }
      }

      return updated;
    });
  }

  signOut(): void {
    this.confirmModal.show();
  }

  performSignOut(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
