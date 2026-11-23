import { CycleId, DateStr } from '../types/ridesplit';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatLocalDateStr(date: Date): DateStr {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateStr(dateStr: DateStr): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getTodayDateStr(): DateStr {
  return formatLocalDateStr(new Date());
}

/**
 * Returns the active billing cycle ID (YYYY-MM) for a given date.
 * Rule: Cycle runs from 23rd of month M to 23rd of month M+1.
 * On day >= 23, the new cycle starting on the 23rd of this month is active.
 * On day < 23, the cycle that started on the 23rd of the previous month is active.
 */
export function getCycleIdForDate(date: Date = new Date()): CycleId {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  const startDate = day >= 23 ? new Date(year, month, 1) : new Date(year, month - 1, 1);
  const cy = startDate.getFullYear();
  const cm = String(startDate.getMonth() + 1).padStart(2, '0');
  return `${cy}-${cm}`;
}

export function shiftCycleId(cycleId: CycleId, deltaMonths: number): CycleId {
  const [y, m] = cycleId.split('-').map(Number);
  const shifted = new Date(y, m - 1 + deltaMonths, 1);
  const ny = shifted.getFullYear();
  const nm = String(shifted.getMonth() + 1).padStart(2, '0');
  return `${ny}-${nm}`;
}

export function getCycleBounds(cycleId: CycleId): {
  startDate: Date;
  endDate: Date;
  startDateStr: DateStr;
  endDateStr: DateStr;
} {
  const [y, m] = cycleId.split('-').map(Number);
  const startDate = new Date(y, m - 1, 23);
  const endDate = new Date(y, m, 23);
  return {
    startDate,
    endDate,
    startDateStr: formatLocalDateStr(startDate),
    endDateStr: formatLocalDateStr(endDate),
  };
}

export interface CycleCalendarDay {
  dateStr: DateStr;
  date: Date;
  dayOfMonth: number;
  monthIndex: number;
  shortMonth: string;
  weekdayIndex: number; // 0 = Sun .. 6 = Sat
  isStartBoundary: boolean;
  isEndBoundary: boolean;
  isFirstOfMonth: boolean;
  isToday: boolean;
}

/**
 * Generates every inclusive calendar day from the 23rd of the cycle start month
 * through the 23rd of the following month.
 */
export function getCycleDays(cycleId: CycleId): CycleCalendarDay[] {
  const { startDate, endDate } = getCycleBounds(cycleId);
  const todayStr = getTodayDateStr();
  const days: CycleCalendarDay[] = [];

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  while (cursor.getTime() <= endDate.getTime()) {
    const dateStr = formatLocalDateStr(cursor);
    const dayOfMonth = cursor.getDate();
    const monthIndex = cursor.getMonth();
    days.push({
      dateStr,
      date: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()),
      dayOfMonth,
      monthIndex,
      shortMonth: SHORT_MONTH_NAMES[monthIndex],
      weekdayIndex: cursor.getDay(),
      isStartBoundary: dateStr === formatLocalDateStr(startDate),
      isEndBoundary: dateStr === formatLocalDateStr(endDate),
      isFirstOfMonth: dayOfMonth === 1,
      isToday: dateStr === todayStr,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function formatCycleRange(cycleId: CycleId, compact = false): string {
  const { startDate, endDate } = getCycleBounds(cycleId);
  const startMonth = compact
    ? SHORT_MONTH_NAMES[startDate.getMonth()]
    : MONTH_NAMES[startDate.getMonth()];
  const endMonth = compact
    ? SHORT_MONTH_NAMES[endDate.getMonth()]
    : MONTH_NAMES[endDate.getMonth()];

  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startMonth} 23 – ${endMonth} 23, ${endDate.getFullYear()}`;
  }
  return `${startMonth} 23, ${startDate.getFullYear()} – ${endMonth} 23, ${endDate.getFullYear()}`;
}

export function formatDateHeading(dateStr: DateStr): string {
  const date = parseLocalDateStr(dateStr);
  const weekday = FULL_WEEKDAYS[date.getDay()];
  const month = MONTH_NAMES[date.getMonth()];
  return `${weekday}, ${month} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatShortDate(dateStr: DateStr): string {
  const date = parseLocalDateStr(dateStr);
  return `${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatShortDateWithDay(dateStr: DateStr): string {
  const date = parseLocalDateStr(dateStr);
  return `${SHORT_WEEKDAYS[date.getDay()]}, ${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

export function isDateInCycle(dateStr: DateStr, cycleId: CycleId): boolean {
  const { startDateStr, endDateStr } = getCycleBounds(cycleId);
  return dateStr >= startDateStr && dateStr <= endDateStr;
}

export function getDefaultCutoffForCycle(cycleId: CycleId): DateStr {
  const todayStr = getTodayDateStr();
  const { startDateStr, endDateStr } = getCycleBounds(cycleId);
  if (todayStr < startDateStr) {
    return startDateStr;
  }
  if (todayStr > endDateStr) {
    return endDateStr;
  }
  return todayStr;
}
