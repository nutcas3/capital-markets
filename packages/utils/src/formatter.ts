import { format } from 'date-fns';

/**
 * Format a number as currency with 2 decimal places
 * @param value Number to format
 * @param maximumFractionDigits Maximum fraction digits (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string, maximumFractionDigits = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.00';
  }
  
  // For large numbers, limit decimal places
  if (Math.abs(numValue) >= 1000) {
    maximumFractionDigits = Math.min(maximumFractionDigits, 2);
  }
  
  // For very small numbers, show more decimal places
  if (Math.abs(numValue) > 0 && Math.abs(numValue) < 0.01) {
    maximumFractionDigits = 6;
  }
  
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits
  });
}

/**
 * Format a percentage value
 * @param value Percentage value (0.05 = 5%)
 * @param includeSign Whether to include + sign for positive values
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, includeSign = true): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

/**
 * Format a date in a readable format
 * @param date Date to format
 * @param formatStr Format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, formatStr = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return format(dateObj, formatStr);
}

/**
 * Format a wallet address for display
 * @param address Wallet address
 * @param startChars Number of characters to show at start
 * @param endChars Number of characters to show at end
 * @returns Truncated address with ellipsis
 */
export function formatWalletAddress(address: string, startChars = 4, endChars = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address || '';
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a number with appropriate suffix (K, M, B)
 * @param value Number to format
 * @returns Formatted number with suffix
 */
export function formatCompactNumber(value: number): string {
  if (value < 1000) {
    return value.toString();
  } else if (value < 1000000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else if (value < 1000000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
}
