import {
  Pipe,
  PipeTransform,
} from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(
    value: string | Date,
    format: 'date' | 'datetime' = 'date',
  ): string {
    if (!value) return '—';
    const date =
      typeof value === 'string'
        ? new Date(value)
        : value;

    const dateStr = date.toLocaleDateString(
      'en-GB',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      },
    );

    if (format === 'datetime') {
      const timeStr = date.toLocaleTimeString(
        'en-US',
        {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        },
      );
      return `${dateStr}, ${timeStr}`;
    }

    return dateStr;
  }
}
