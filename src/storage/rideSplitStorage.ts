import { createSampleCyclesData } from '../data/sampleData';
import { AllCyclesData, CycleEntriesMap, CycleId, DateStr, VehicleEntryItem } from '../types/ridesplit';

const STORAGE_KEY = 'ridesplit_cycles_v1';
const INITIALIZED_KEY = 'ridesplit_initialized_v1';

export interface RideSplitRepository {
  loadAllCycles(): AllCyclesData;
  saveAllCycles(data: AllCyclesData): void;
  clearSampleEntries(data: AllCyclesData): AllCyclesData;
  resetWithSampleData(): AllCyclesData;
}

function sanitizeCycleEntries(rawCycle: unknown): CycleEntriesMap {
  if (!rawCycle || typeof rawCycle !== 'object') return {};
  const cleaned: CycleEntriesMap = {};

  for (const [dateStr, items] of Object.entries(rawCycle as Record<string, unknown>)) {
    if (!Array.isArray(items)) continue;
    const validItems: VehicleEntryItem[] = [];
    for (const item of items) {
      if (
        item &&
        typeof item === 'object' &&
        'id' in item &&
        'code' in item &&
        typeof (item as VehicleEntryItem).id === 'string' &&
        typeof (item as VehicleEntryItem).code === 'string'
      ) {
        const entry = item as VehicleEntryItem;
        validItems.push({
          id: entry.id,
          code: entry.code,
          isSample: Boolean(entry.isSample),
          createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
        });
      }
    }
    if (validItems.length > 0) {
      cleaned[dateStr as DateStr] = validItems;
    }
  }

  return cleaned;
}

/**
 * LocalStorage-backed repository structured cleanly so an API/database adapter
 * can replace these methods without touching UI components.
 */
export const rideSplitStorage: RideSplitRepository = {
  loadAllCycles(): AllCyclesData {
    try {
      const initialized = localStorage.getItem(INITIALIZED_KEY);
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!initialized) {
        const seeded = createSampleCyclesData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        localStorage.setItem(INITIALIZED_KEY, '1');
        return seeded;
      }

      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') {
        return {};
      }

      const sanitized: AllCyclesData = {};
      for (const [cycleId, cycleValue] of Object.entries(parsed)) {
        const cleanedCycle = sanitizeCycleEntries(cycleValue);
        if (Object.keys(cleanedCycle).length > 0) {
          sanitized[cycleId as CycleId] = cleanedCycle;
        }
      }
      return sanitized;
    } catch {
      return createSampleCyclesData();
    }
  },

  saveAllCycles(data: AllCyclesData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(INITIALIZED_KEY, '1');
    } catch {
      // Ignore storage quota errors gracefully
    }
  },

  clearSampleEntries(data: AllCyclesData): AllCyclesData {
    const next: AllCyclesData = {};

    for (const [cycleId, cycleMap] of Object.entries(data)) {
      const nextCycleMap: CycleEntriesMap = {};
      for (const [dateStr, items] of Object.entries(cycleMap)) {
        const userItems = items.filter((item) => !item.isSample);
        if (userItems.length > 0) {
          nextCycleMap[dateStr] = userItems;
        }
      }
      if (Object.keys(nextCycleMap).length > 0) {
        next[cycleId] = nextCycleMap;
      }
    }

    this.saveAllCycles(next);
    return next;
  },

  resetWithSampleData(): AllCyclesData {
    const seeded = createSampleCyclesData();
    this.saveAllCycles(seeded);
    return seeded;
  },
};

export function countSampleEntries(data: AllCyclesData): number {
  let count = 0;
  for (const cycleMap of Object.values(data)) {
    for (const items of Object.values(cycleMap)) {
      for (const item of items) {
        if (item.isSample) count++;
      }
    }
  }
  return count;
}

export function countTotalEntries(data: AllCyclesData): number {
  let count = 0;
  for (const cycleMap of Object.values(data)) {
    for (const items of Object.values(cycleMap)) {
      count += items.length;
    }
  }
  return count;
}
