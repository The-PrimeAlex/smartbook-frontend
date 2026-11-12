// Pure utility functions for mapping booking data to calendar display format
// Extracted from calendar.component.ts to keep the component focused on UI logic

import {
  BookingSyncResult,
  GoogleCalendarEventDto,
} from '../../../shared/services/calendar.service';
import {
  dateKey,
  parseDate,
  timeKey,
} from './calendar-date-utils';

type BookingStatus =
  'Confirmed' | 'Pending' | 'Cancelled';
type RoomType =
  | 'All Rooms'
  | 'Boardroom'
  | 'Meeting Room'
  | 'Video Suite';

export interface CalendarBooking {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  room: string;
  roomType: Exclude<RoomType, 'All Rooms'> | null;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  source: 'SMARTBOOK' | 'GOOGLE';
  eventUrl?: string | null;
}

export interface RawBooking {
  [key: string]: unknown;
}

export function extractBookingArray(
  response: unknown,
): RawBooking[] {
  if (Array.isArray(response)) {
    return response.filter(
      (item): item is RawBooking =>
        typeof item === 'object' && item !== null,
    );
  }
  if (
    typeof response === 'object' &&
    response !== null
  ) {
    const obj = response as Record<
      string,
      unknown
    >;
    for (const key of [
      'bookings',
      'content',
      'data',
      'items',
    ]) {
      const value = obj[key];
      if (Array.isArray(value)) {
        return value.filter(
          (item): item is RawBooking =>
            typeof item === 'object' &&
            item !== null,
        );
      }
    }
  }
  return [];
}

export function mapSmartBookBooking(
  raw: RawBooking,
  index: number,
): CalendarBooking | null {
  const startValue = firstValue(raw, [
    'startTime',
    'start',
    'startDateTime',
    'bookingStart',
  ]);
  const endValue = firstValue(raw, [
    'endTime',
    'end',
    'endDateTime',
    'bookingEnd',
  ]);
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end) {
    return null;
  }

  const roomObject = asObject(
    firstValue(raw, ['room']),
  );
  const room =
    firstString(raw, ['roomName', 'room_name']) ??
    firstString(roomObject, [
      'roomName',
      'name',
      'title',
    ]) ??
    'Room not specified';

  const purpose =
    firstString(raw, [
      'purpose',
      'title',
      'description',
      'bookingPurpose',
    ]) ?? 'Room reservation';

  const customerObject = asObject(
    firstValue(raw, [
      'user',
      'customer',
      'bookedBy',
    ]),
  );
  const customerName =
    firstString(raw, [
      'customerName',
      'userName',
      'fullName',
    ]) ??
    firstString(customerObject, [
      'fullName',
      'name',
      'username',
      'email',
    ]) ??
    'SmartBook customer';

  const customerId =
    firstString(raw, [
      'customerId',
      'userId',
      'bookedById',
    ]) ??
    firstString(customerObject, [
      'userId',
      'id',
    ]) ??
    '';

  const statusValue =
    firstString(raw, [
      'bookingStatus',
      'status',
    ]) ?? 'PENDING';
  const id =
    firstString(raw, ['bookingId', 'id']) ??
    `booking-${index}`;

  return {
    id,
    title: `${purpose} — ${room}`,
    customerId,
    customerName,
    room,
    roomType: inferRoomType(room),
    date: dateKey(start),
    startTime: timeKey(start),
    endTime: timeKey(end),
    status: mapBookingStatus(statusValue),
    source: 'SMARTBOOK',
  };
}

export function mapGoogleEvent(
  event: GoogleCalendarEventDto,
): CalendarBooking | null {
  const start = parseDate(event.start);
  const end = parseDate(event.end);
  if (
    !start ||
    !end ||
    event.status === 'cancelled'
  ) {
    return null;
  }
  const room =
    event.location?.trim() || 'Google Calendar';
  const title =
    event.summary?.trim() || 'Calendar event';

  return {
    id: event.id,
    title,
    customerId: '',
    customerName: 'Google Calendar',
    room,
    roomType: inferRoomType(room),
    date: dateKey(start),
    startTime: event.allDay
      ? '00:00'
      : timeKey(start),
    endTime: event.allDay
      ? '23:59'
      : timeKey(end),
    status: 'Confirmed',
    source: 'GOOGLE',
    eventUrl: event.htmlLink,
  };
}

export function formatSyncResult(
  result: BookingSyncResult,
): string {
  if (result.message) {
    return result.message;
  }
  const created = result.created ?? 0;
  const alreadySynced = result.alreadySynced ?? 0;
  const skipped = result.skipped ?? 0;
  const failed = result.failed ?? 0;
  return `Sync complete: ${created} created, ${alreadySynced} already synced, ${skipped} skipped, ${failed} failed.`;
}

export function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    typeof error === 'object' &&
    error !== null
  ) {
    const candidate = error as {
      error?: { message?: unknown } | string;
      message?: unknown;
    };
    if (
      typeof candidate.error === 'object' &&
      candidate.error !== null &&
      typeof candidate.error.message === 'string'
    ) {
      return candidate.error.message;
    }
    if (typeof candidate.error === 'string') {
      return candidate.error;
    }
    if (typeof candidate.message === 'string') {
      return candidate.message;
    }
  }
  return fallback;
}

// --- Private helpers ---

function mapBookingStatus(
  value: string,
): BookingStatus {
  const status = value.trim().toUpperCase();
  if (
    status === 'CANCELLED' ||
    status === 'NO_SHOW'
  ) {
    return 'Cancelled';
  }
  if (status === 'PENDING') {
    return 'Pending';
  }
  return 'Confirmed';
}

function inferRoomType(
  roomName: string,
): Exclude<RoomType, 'All Rooms'> | null {
  const name = roomName.toLowerCase();
  if (
    name.includes('boardroom') ||
    name.includes('board room')
  ) {
    return 'Boardroom';
  }
  if (
    name.includes('video') ||
    name.includes('suite') ||
    name.includes('studio')
  ) {
    return 'Video Suite';
  }
  if (
    name.includes('meeting') ||
    name.includes('conference')
  ) {
    return 'Meeting Room';
  }
  return null;
}

function firstValue(
  object: RawBooking,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = object[key];
    if (
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      return value;
    }
  }
  return undefined;
}

function firstString(
  object: RawBooking,
  keys: string[],
): string | null {
  const value = firstValue(object, keys);
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return null;
}

function asObject(value: unknown): RawBooking {
  return typeof value === 'object' &&
    value !== null
    ? (value as RawBooking)
    : {};
}
