/** Maps user role strings to display labels. */
export function getRoleLabel(
  role: string,
): string {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'USER':
      return 'Tenant';
    default:
      return role;
  }
}

/** Formats an array of roles into a comma-separated label string. */
export function getRolesLabel(
  roles: string[],
): string {
  return roles.map(getRoleLabel).join(', ');
}

/** Checks if a user has the ADMIN role. */
export function isAdmin(
  roles: string[],
): boolean {
  return roles.includes('ADMIN');
}
