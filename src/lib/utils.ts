import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to Dominican Pesos (RD$) with thousand separators and 2 decimals.
 * By default the system operates in Dominican Pesos (RD$).
 */
export function formatDOP(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'RD$\u00A00.00';
  }
  let numeric = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (!isFinite(numeric)) return 'RD$\u00A00.00';
  if (numeric > 9999999999.99) {
    numeric = 9999999999.99;
  }
  return `RD$\u00A0${numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a date string strictly as DD/MM/YYYY (Día/Mes/Año)
 * avoiding timezone offset shifts.
 */
export function formatDate(dateString?: string | null, includeTime: boolean = false): string {
  if (!dateString) return '—';
  try {
    const str = String(dateString).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, y, m, d] = match;
      const formatted = `${d}/${m}/${y}`;
      if (includeTime && str.includes('T')) {
        const timePart = str.split('T')[1]?.slice(0, 5);
        return timePart ? `${formatted} ${timePart}` : formatted;
      }
      return formatted;
    }
    const date = new Date(str);
    if (isNaN(date.getTime())) return str;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const formatted = `${d}/${m}/${y}`;
    if (includeTime) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${formatted} ${hh}:${mm}`;
    }
    return formatted;
  } catch {
    return String(dateString);
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
