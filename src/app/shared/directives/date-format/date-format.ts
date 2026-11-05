import { DateFormatPipe } from './date-format.pipe';

export function formatDate(value: string | Date): string {
  if (!value) return '—';
  const date =
    typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(
  value: string | Date,
): string {
  if (!value) return '—';
  const date =
    typeof value === 'string' ? new Date(value) : value;
  const dateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr}, ${timeStr}`;
}

export { DateFormatPipe };
