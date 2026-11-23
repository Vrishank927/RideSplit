import { AllCyclesData, CycleEntriesMap, CycleId, VehicleCode, VehicleEntryItem } from '../types/ridesplit';
import { formatLocalDateStr, getCycleBounds, getCycleIdForDate, shiftCycleId } from '../utils/billingCycle';

function makeSampleEntry(dateStr: string, code: VehicleCode, idx: number): VehicleEntryItem {
  return {
    id: `sample-${dateStr}-${code}-${idx}`,
    code,
    isSample: true,
    createdAt: 1700000000000 + idx,
  };
}

function addOffsetDays(base: Date, days: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return formatLocalDateStr(d);
}

/**
 * Generates realistic sample entries anchored to the current billing cycle and previous cycle.
 * Every entry is marked with `isSample: true` so it can be cleanly distinguished and cleared.
 */
export function createSampleCyclesData(referenceDate: Date = new Date()): AllCyclesData {
  const currentCycleId: CycleId = getCycleIdForDate(referenceDate);
  const prevCycleId: CycleId = shiftCycleId(currentCycleId, -1);

  const currentBounds = getCycleBounds(currentCycleId);
  const prevBounds = getCycleBounds(prevCycleId);

  const todayStr = formatLocalDateStr(referenceDate);

  // Sample pattern for the current active cycle (placed on or before today when possible)
  const currentPattern: Array<{ offset: number; codes: VehicleCode[] }> = [
    { offset: 1, codes: ['VC'] },
    { offset: 3, codes: ['YC'] },
    { offset: 5, codes: ['VB'] },
    { offset: 7, codes: ['VC', 'YB'] }, // Multi-vehicle day: ₹315 + ₹150 = ₹465
    { offset: 10, codes: ['YC'] },
    { offset: 12, codes: ['VC'] },
    { offset: 14, codes: ['VRB'] },
    { offset: 16, codes: ['YC', 'VB'] }, // Multi-vehicle day: ₹330 + ₹150 = ₹480
    { offset: 19, codes: ['VC'] },
    { offset: 22, codes: ['VRC'] },
    { offset: 25, codes: ['VC'] },
    { offset: 27, codes: ['YB'] },
  ];

  const currentMap: CycleEntriesMap = {};
  let seq = 1;

  for (const item of currentPattern) {
    const dateStr = addOffsetDays(currentBounds.startDate, item.offset);
    if (dateStr <= currentBounds.endDateStr && dateStr <= todayStr) {
      currentMap[dateStr] = item.codes.map((code) => makeSampleEntry(dateStr, code, seq++));
    }
  }

  // Ensure at least a few sample entries exist even if today is the 23rd (day 0 of cycle)
  if (Object.keys(currentMap).length === 0) {
    const d0 = currentBounds.startDateStr;
    currentMap[d0] = [makeSampleEntry(d0, 'VC', seq++)];
  }

  // Previous completed cycle sample data for testing cycle navigation
  const prevPattern: Array<{ offset: number; codes: VehicleCode[] }> = [
    { offset: 2, codes: ['VC'] },
    { offset: 4, codes: ['YC'] },
    { offset: 6, codes: ['VC'] },
    { offset: 9, codes: ['YC'] },
    { offset: 11, codes: ['VC', 'YB'] },
    { offset: 14, codes: ['VRC'] },
    { offset: 17, codes: ['YC'] },
    { offset: 20, codes: ['VC'] },
    { offset: 23, codes: ['VB'] },
    { offset: 26, codes: ['YC'] },
  ];

  const prevMap: CycleEntriesMap = {};
  for (const item of prevPattern) {
    const dateStr = addOffsetDays(prevBounds.startDate, item.offset);
    if (dateStr <= prevBounds.endDateStr) {
      prevMap[dateStr] = item.codes.map((code) => makeSampleEntry(dateStr, code, seq++));
    }
  }

  return {
    [currentCycleId]: currentMap,
    [prevCycleId]: prevMap,
  };
}
