// Persian/Gregorian date conversion utilities
import { toJD, fromJD, toGregorian, toJalaali } from 'jalaali-js';

/**
 * Convert Gregorian date string (YYYY-MM-DD) to Persian date string (YYYY-MM-DD)
 */
export function gregorianToPersian(gregorianDate) {
  if (!gregorianDate) return '';
  const [year, month, day] = gregorianDate.split('-').map(Number);
  try {
    const { jy, jm, jd } = toJalaali(year, month, day);
    return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
  } catch (error) {
    return '';
  }
}

/**
 * Convert Persian date string (YYYY-MM-DD) to Gregorian date string (YYYY-MM-DD)
 */
export function persianToGregorian(persianDate) {
  if (!persianDate) return '';
  const [year, month, day] = persianDate.split('-').map(Number);
  try {
    const { gy, gm, gd } = toGregorian(year, month, day);
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  } catch (error) {
    return '';
  }
}

/**
 * Format a date (Gregorian or Persian) for display
 * Returns date in Persian locale format
 */
export function formatPersianDate(gregorianDate) {
  if (!gregorianDate) return '-';
  const persianDate = gregorianToPersian(gregorianDate);
  return persianDate;
}

/**
 * Get today's date in Persian format (YYYY-MM-DD)
 */
export function todayPersian() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const gregorianToday = `${year}-${month}-${day}`;
  return gregorianToPersian(gregorianToday);
}

/**
 * Get today's date in Gregorian format (YYYY-MM-DD)
 */
export function todayGregorian() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
