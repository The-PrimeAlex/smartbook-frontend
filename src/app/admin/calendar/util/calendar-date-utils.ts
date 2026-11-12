// Pure utility functions for calendar date/time operations
// Extracted from calendar.component.ts to keep the component focused on UI logic

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');
  const day = String(date.getDate()).padStart(
    2,
    '0',
  );
  return `${year}-${month}-${day}`;
}

export function timeKey(date: Date): string {
  const hours = String(date.getHours()).padStart(
    2,
    '0',
  );
  const minutes = String(
    date.getMinutes(),
  ).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

export function parseDate(
  value: unknown,
): Date | null {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date;
}

export function formatTime12Hour(
  time: string,
): string {
  if (!time) {
    return '';
  }
  const [hoursText, minutesText] =
    time.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return time;
  }
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function previousMonthDate(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    date.getDate(),
  );
}

export function nextMonthDate(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

export function previousWeekDate(
  date: Date,
): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 7);
  return result;
}

export function nextWeekDate(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 7);
  return result;
}
