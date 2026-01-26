/**
 * Get today's date at midnight in local timezone
 * This ensures consistent date handling across the application
 * and prevents timezone-related date shifting issues
 */
const TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

export function getTodayDate(): Date {
  const now = new Date();
  return getDateAtMidnight(now);
}

/**
 * Get a date at midnight in local timezone
 */
export function getDateAtMidnight(date: Date): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // JS months are 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');

  // Return date at 00:00:00 server time (UTC) which maps to the date part
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Format date to YYYY-MM-DD string in local timezone
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// returns Date objects representing UTC start and end that correspond to the provided local-midnight Date
export function getUtcRangeForLocalDate(localMidnightDate: Date): { startUtc: Date; endUtc: Date } {
  // localMidnightDate should be a Date at local 00:00 created with getDateAtMidnight()
  const startUtcIso = localMidnightDate.toISOString(); // e.g. 2026-01-25T18:30:00.000Z for India
  const startUtc = new Date(startUtcIso);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}
