
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique ID
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Formats a number as currency (Naira)
 */
export const formatNaira = (amount: number): string => {
  return `₦${amount.toFixed(2)}`;
};

/**
 * Formats a date string (YYYY-MM-DD) to a more readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a percentage
 */
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};
