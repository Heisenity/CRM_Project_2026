/**
 * Get today's date at midnight in local timezone
 * This ensures consistent date handling across the application
 * and prevents timezone-related date shifting issues
 */
export function getTodayDate(): Date {
  const now = new Date()
  // Create a new date with year, month, day in local timezone
  // This prevents UTC conversion issues
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
}

/**
 * Get a date at midnight in local timezone
 */
export function getDateAtMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
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
