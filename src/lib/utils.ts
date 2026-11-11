import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to Dominican Pesos (DOP / RD$) with thousand separators and 2 decimals.
 */
export function formatDOP(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'RD$ 0.00';
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Formats a date string to Spanish Dominican Republic locale.
 */
export function formatDate(dateString?: string | null, includeTime: boolean = false): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Extracts a readable error message from API responses or PostgreSQL triggers.
 */
export function extractErrorMessage(error: any): string {
  if (!error) return 'Ocurrió un error inesperado.';

  if (typeof error === 'string') return error;

  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (data.details) {
      if (typeof data.details.message === 'string' && data.details.message.trim()) {
        return data.details.message;
      }
      if (Array.isArray(data.details.message) && data.details.message.length > 0) {
        return data.details.message.join('. ');
      }
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message.join('. ');
    }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return 'No se pudo completar la operación.';
}
