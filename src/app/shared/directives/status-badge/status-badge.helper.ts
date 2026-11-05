import { BadgeVariant } from '../../ui/status-badge/status-badge.component';

/** Maps bill/payment status strings to BadgeVariant values. */
export function getBillBadgeVariant(
  status: string,
): BadgeVariant {
  switch (status) {
    case 'PAID':
      return 'paid';
    case 'PARTIALLY_PAID':
      return 'partial';
    case 'OVERDUE':
      return 'overdue';
    case 'VOID':
      return 'neutral';
    case 'ISSUED':
      return 'unpaid';
    default:
      return 'pending';
  }
}

/** Maps payment record status strings to BadgeVariant values. */
export function getPaymentBadgeVariant(
  status: string,
): BadgeVariant {
  switch (status) {
    case 'SUCCESS':
      return 'paid';
    case 'FAILED':
      return 'danger';
    case 'PENDING':
      return 'pending';
    case 'REFUNDED':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Maps booking status strings to BadgeVariant values. */
export function getBookingBadgeVariant(
  status: string,
): BadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'CONFIRMED':
    case 'CHECKED_IN':
      return 'success';
    case 'COMPLETED':
      return 'info';
    case 'CANCELLED':
      return 'neutral';
    case 'NO_SHOW':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Maps incident status strings to BadgeVariant values. */
export function getIncidentBadgeVariant(
  status: string,
): BadgeVariant {
  switch (status) {
    case 'REPORTED':
      return 'pending';
    case 'INVESTIGATING':
      return 'info';
    case 'RESOLVED':
      return 'success';
    case 'CHARGED':
      return 'paid';
    case 'WAIVED':
      return 'neutral';
    case 'REJECTED':
      return 'danger';
    default:
      return 'pending';
  }
}

/** Maps user account status strings to BadgeVariant values. */
export function getUserBadgeVariant(
  status: string,
): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING':
      return 'pending';
    case 'DISABLED':
      return 'danger';
    case 'SUSPENDED':
      return 'overdue';
    case 'INACTIVE':
      return 'neutral';
    default:
      return 'neutral';
  }
}

/** Maps registration request status strings to BadgeVariant values. */
export function getRegistrationBadgeVariant(
  status: string,
): BadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    default:
      return 'neutral';
  }
}
