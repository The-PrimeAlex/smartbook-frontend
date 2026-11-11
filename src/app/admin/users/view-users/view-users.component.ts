import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  LucideBuilding,
  LucideFileText,
  LucideMail,
  LucidePhone,
  LucideSearch,
  LucideShield,
  LucideTriangleAlert,
  LucideUser,
  LucideUserCheck,
  LucideX,
} from '@lucide/angular';
import {
  AccountStatus,
  SmartBookUser,
  UserFilter,
} from '../users.service';
import { UsersService } from '../users.service';
import { UserRole } from '../add-user/add-user.model';
import {
  IconComponent,
  StatusBadgeComponent,
  EmptyStateComponent,
  SearchBoxComponent,
  PageBannerComponent,
  type BadgeVariant,
} from '../../../shared/ui';
import {
  getUserBadgeVariant,
  getUserStatusLabel,
  getRolesLabel,
  isAdmin,
} from '../../../shared/directives';

@Component({
  selector: 'app-view-users',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,

    IconComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SearchBoxComponent,
    PageBannerComponent,
  ],
  templateUrl: './view-users.component.html',
  styleUrl: './view-users.component.css',
})
export class ViewUsersComponent {
  private usersService = inject(UsersService);

  readonly LucideBuilding = LucideBuilding;
  readonly LucideFileText = LucideFileText;
  readonly LucideMail = LucideMail;
  readonly LucidePhone = LucidePhone;
  readonly LucideSearch = LucideSearch;
  readonly LucideShield = LucideShield;
  readonly LucideTriangleAlert = LucideTriangleAlert;
  readonly LucideUser = LucideUser;
  readonly LucideUserCheck = LucideUserCheck;
  readonly LucideX = LucideX;
  readonly searchTerm = signal('');
  readonly activeFilter = signal<UserFilter>('ALL');
  readonly selectedUser = signal<SmartBookUser | null>(
    null,
  );
  readonly deactivateConfirm = signal<SmartBookUser | null>(
    null,
  );
  readonly deactivating = signal(false);
  readonly message = signal<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  protected users = this.usersService.readOnlyUsers;
  protected loading = this.usersService.isLoading;

  readonly filters: { label: string; value: UserFilter }[] =
    [
      { label: 'All Users', value: 'ALL' },
      { label: 'Admins', value: 'ADMINS' },
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Disabled', value: 'DISABLED' },
      { label: 'Pending', value: 'PENDING' },
    ];

  constructor() {}

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filter = this.activeFilter();
    const users = this.users();

    if (!users) return [];

    return users.filter((user) => {
      let matchesFilter = true;
      switch (filter) {
        case 'ADMINS':
          // Safe navigation added (?.) to prevent crashes if roles is undefined
          matchesFilter =
            user.roles?.includes('ADMIN') ?? false;
          break;
        case 'ACTIVE':
        case 'DISABLED':
        case 'PENDING':
          matchesFilter = user.status === filter;
          break;
      }

      if (!matchesFilter) return false;

      if (!term) return true;

      const searchableText = `
      ${user.firstName}
      ${user.lastName}
      ${user.email}
      ${user.phoneNumber}
      ${user.companyName ?? ''}
      ${user.registrationNumber ?? ''}
      ${user.registrationContactEmail ?? ''}
      ${user.roles?.join(' ') ?? ''}
    `.toLowerCase();

      return searchableText.includes(term);
    });
  });

  readonly activeCount = computed(
    () =>
      this.users()?.filter(
        (user) => user.status === 'ACTIVE',
      ).length,
  );

  readonly adminCount = computed(
    () =>
      this.users()?.filter((user) =>
        user.roles.includes('ADMIN'),
      ).length,
  );

  readonly tenantCount = computed(
    () =>
      this.users()?.filter((user) =>
        user.roles.includes('USER'),
      ).length,
  );

  setFilter(filter: UserFilter): void {
    this.activeFilter.set(filter);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.activeFilter.set('ALL');
  }

  openProfile(user: SmartBookUser): void {
    this.selectedUser.set(user);
  }

  closeProfile(): void {
    this.selectedUser.set(null);
  }

  getInitials(user: SmartBookUser): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getFullName(user: SmartBookUser): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getRoleLabel = getRolesLabel;

  isAdminUser(user: SmartBookUser): boolean {
    return isAdmin(user.roles);
  }

  getStatusLabel = getUserStatusLabel;

  getStatusIcon(status: AccountStatus): string {
    const icons: Record<AccountStatus, string> = {
      ACTIVE: '✓',
      DISABLED: '−',
      PENDING: '◷',
    };

    return icons[status];
  }

  hasCompanyDetails(user: SmartBookUser): boolean {
    return (
      !this.isAdminUser(user) &&
      Boolean(
        user.companyName ||
        user.registrationNumber ||
        user.registrationContactEmail,
      )
    );
  }

  trackByUserId(
    _index: number,
    user: SmartBookUser,
  ): string {
    return user.id;
  }

  openDeactivateConfirm(user: SmartBookUser): void {
    this.deactivateConfirm.set(user);
  }

  closeDeactivateConfirm(): void {
    this.deactivateConfirm.set(null);
  }

  confirmDeactivate(): void {
    const user = this.deactivateConfirm();
    if (!user) return;
    this.deactivating.set(true);
    this.usersService.deactivateUser(user.id).subscribe({
      next: () => {
        this.deactivating.set(false);
        this.deactivateConfirm.set(null);
        this.message.set({
          type: 'success',
          text: `${user.firstName} ${user.lastName} has been deactivated.`,
        });
        setTimeout(() => this.message.set(null), 4000);
      },
      error: (err) => {
        this.deactivating.set(false);
        this.message.set({
          type: 'error',
          text: 'Failed to deactivate user. Please try again.',
        });
        setTimeout(() => this.message.set(null), 4000);
      },
    });
  }

  canDeactivate(user: SmartBookUser): boolean {
    return (
      user.status === 'ACTIVE' || user.status === 'PENDING'
    );
  }

  getBadgeVariant = getUserBadgeVariant;
}
