import {
  Injectable,
  inject,
  signal,
} from '@angular/core';
import { createLogger } from '../../shared/services/logger.service';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { CreateUserRequest } from './add-user/add-user.model';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

export interface OrganizationProfile {
  name: string;
  email: string;
  registrationNumber: string;
}

export interface MyProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  organization: OrganizationProfile | null;
}

export interface SmartBookUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: AccountStatus;
  createdAt: string;
  roles: UserRole[];
  companyName?: string;
  registrationNumber?: string;
  registrationContactEmail?: string;
}

export type UserFilter =
  'ALL' | 'ADMINS' | AccountStatus;

export type UserRole = 'ADMIN' | 'USER';
export type AccountStatus =
  'ACTIVE' | 'DISABLED' | 'PENDING';

// Backend response shape
interface BackendUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  roles: string[];
  tenant: {
    companyName: string;
    registrationNumber: string;
    contactEmail: string;
  } | null;
}

function mapBackendUser(
  u: BackendUser,
): SmartBookUser {
  const statusMap: Record<string, AccountStatus> =
    {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'DISABLED',
      SUSPENDED: 'DISABLED',
      PENDING: 'PENDING',
    };
  const status =
    statusMap[u.status] ?? 'DISABLED';
  const roles: UserRole[] = u.roles.map(
    (r) => r.replace('ROLE_', '') as UserRole,
  );
  return {
    id: u.userId,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phone ?? '',
    status,
    createdAt: u.createdAt,
    roles,
    companyName: u.tenant?.companyName,
    registrationNumber:
      u.tenant?.registrationNumber,
    registrationContactEmail:
      u.tenant?.contactEmail,
  };
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly log = createLogger(
    'UsersService',
  );
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private users = signal<SmartBookUser[]>([]);
  private loading = signal(false);

  readonly readOnlyUsers =
    this.users.asReadonly();
  readonly isLoading = this.loading.asReadonly();

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.http
      .get<BackendUser[]>(
        `${environment.apiUrl}/users/`,
      )
      .pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.log.error(
            'Failed to fetch users:',
            err,
          );
          this.loading.set(false);
          return of([]);
        }),
      )
      .subscribe((raw) => {
        this.users.set(raw.map(mapBackendUser));
      });
  }

  deactivateUser(
    userId: string,
  ): Observable<{ message: string }> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http
          .patch<{ message: string }>(
            `${environment.apiUrl}/users/${userId}/deactivate`,
            {},
          )
          .pipe(
            tap(() => {
              // Update local state
              this.users.update((users) =>
                users.map((u) =>
                  u.id === userId
                    ? {
                        ...u,
                        status:
                          'DISABLED' as AccountStatus,
                      }
                    : u,
                ),
              );
            }),
          ),
      ),
    );
  }

  getMyProfile(): Observable<MyProfile> {
    return this.http.get<MyProfile>(
      `${environment.apiUrl}/users/me/profile`,
    );
  }

  updateProfile(
    profile: MyProfile,
  ): Observable<void> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.put<void>(
          `${environment.apiUrl}/users/me/profile`,
          profile,
        ),
      ),
    );
  }

  addUser(user: CreateUserRequest) {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http
          .post<{ message: string }>(
            `${environment.apiUrl}/users`,
            user,
          )
          .pipe(tap(() => this.loadUsers())),
      ),
    );
  }
}
