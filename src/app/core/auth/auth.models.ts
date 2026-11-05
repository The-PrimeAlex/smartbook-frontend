export interface LoginRequest {
  email: string;
  password: string;
}

export interface CurrentUser {
  userId: string;
  tenantId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  /** Roles are returned without the Spring ROLE_ prefix. */
  roles: string[];
  /** True when the user must replace their temporary password. */
  mustChangePassword: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: CurrentUser;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
