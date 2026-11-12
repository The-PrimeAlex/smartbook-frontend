import { BookingStatus } from '../../models/booking.model';
import { RoomStatus } from '../../models/room.model';

/** Maps booking status enums to display labels. */
export function getBookingStatusLabel(
  status: string,
): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    CHECKED_IN: 'Checked In',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  };
  return labels[status] || status;
}

/** Maps bill status strings to display labels. */
export function getBillStatusLabel(
  status: string,
): string {
  switch (status) {
    case 'PAID':
      return 'Paid';
    case 'ISSUED':
      return 'Unpaid';
    case 'PARTIALLY_PAID':
      return 'Partial';
    case 'OVERDUE':
      return 'Overdue';
    case 'VOID':
      return 'Void';
    default:
      return status;
  }
}

/** Maps incident status strings to display labels. */
export function getIncidentStatusLabel(
  status: string,
): string {
  switch (status) {
    case 'REPORTED':
      return 'Reported';
    case 'INVESTIGATING':
      return 'Investigating';
    case 'RESOLVED':
      return 'Resolved';
    case 'CHARGED':
      return 'Charged';
    case 'WAIVED':
      return 'Waived';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
}

/** Maps user account status strings to display labels. */
export function getUserStatusLabel(
  status: string,
): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    DISABLED: 'Disabled',
    SUSPENDED: 'Suspended',
    INACTIVE: 'Inactive',
  };
  return labels[status] || status;
}

/** Maps registration request status strings to display labels. */
export function getRegistrationStatusLabel(
  status: string,
): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
}

/** Maps room status enums to display labels. */
export function getRoomStatusLabel(
  status: string,
): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'MAINTENANCE':
      return 'Maintenance';
    default:
      return status;
  }
}

/** Maps equipment status strings to display labels. */
export function getEquipmentStatusLabel(
  status: string,
): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'DAMAGED':
      return 'Damaged';
    case 'MAINTENANCE':
      return 'Maintenance';
    default:
      return status;
  }
}

/** Maps payment status strings to display labels. */
export function getPaymentStatusLabel(
  status: string,
): string {
  switch (status) {
    case 'SUCCESS':
      return 'Success';
    case 'FAILED':
      return 'Failed';
    case 'PENDING':
      return 'Pending';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return status;
  }
}
