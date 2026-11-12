import { CountryCode } from 'libphonenumber-js/max';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  companyName: string;
  registrationNumber: string;
  companyEmail: string;
}
export type UserRole = 'ADMIN' | 'USER';
export type UserStatus =
  'ACTIVE' | 'DISABLED' | 'PENDING';
