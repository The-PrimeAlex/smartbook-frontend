import { CurrencyFormatPipe } from './currency-format.pipe';

export function formatCurrency(
  amount: number,
  currency: string = 'KES',
): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export { CurrencyFormatPipe };
