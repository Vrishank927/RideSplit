export type Member = 'Varun' | 'Yashasvi' | 'Vrishank';

export type VehicleType = 'Car' | 'Bike';

export type VehicleCode = 'VC' | 'YC' | 'VRC' | 'VB' | 'YB' | 'VRB';

export interface VehicleInfo {
  code: VehicleCode;
  owner: Member;
  type: VehicleType;
  label: string;
  cost: number;
}

export interface VehicleEntryItem {
  id: string;
  code: VehicleCode;
  isSample?: boolean;
  createdAt: number;
}

/**
 * Date string formatted strictly in local calendar time as YYYY-MM-DD.
 */
export type DateStr = string;

/**
 * Billing cycle identifier formatted as YYYY-MM representing the month
 * in which the cycle starts on the 23rd (e.g., "2026-11" = Nov 23 – Dec 23, 2026).
 */
export type CycleId = string;

export type CycleEntriesMap = Record<DateStr, VehicleEntryItem[]>;

export type AllCyclesData = Record<CycleId, CycleEntriesMap>;

export interface SettlementTransaction {
  from: Member;
  to: Member;
  amount: number;
}

export interface MemberBreakdown {
  member: Member;
  spent: number;
  equalShare: number;
  difference: number; // positive = spent more (to receive), negative = spent less (to pay)
  entryCount: number;
  carCount: number;
  bikeCount: number;
}

export interface VehicleUsageStat {
  vehicle: VehicleInfo;
  count: number;
  totalCost: number;
}

export interface ExpenseReport {
  totalExpense: number;
  equalShare: number;
  usageDays: number;
  totalEntries: number;
  memberBreakdowns: MemberBreakdown[];
  vehicleStats: VehicleUsageStat[];
  settlements: SettlementTransaction[];
}

export type AppTab = 'calendar' | 'summary' | 'settlement';
