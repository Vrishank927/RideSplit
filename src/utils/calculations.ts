import { MEMBERS, VEHICLE_LIST, VEHICLES } from '../constants/vehicles';
import {
  CycleEntriesMap,
  DateStr,
  ExpenseReport,
  Member,
  MemberBreakdown,
  SettlementTransaction,
  VehicleCode,
  VehicleUsageStat,
} from '../types/ridesplit';

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Formats an INR currency amount cleanly.
 * Uses up to 2 decimals only when non-integer paise exist.
 */
export function formatINR(amount: number, showSign = false): string {
  const rounded = round2(amount);
  const abs = Math.abs(rounded);
  const hasDecimals = Math.abs(abs - Math.round(abs)) > 0.001;

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);

  if (rounded < -0.004) {
    return `-₹${formatted}`;
  }
  if (showSign && rounded > 0.004) {
    return `+₹${formatted}`;
  }
  return `₹${formatted}`;
}

/**
 * Calculates minimum-transaction settlements among Varun, Yashasvi, and Vrishank.
 * Works in integer paise so total paid and total received always balance identically,
 * handles arbitrary decimals (2 decimal places), never self-pays, and minimizes transactions.
 */
export function calculateSettlements(
  memberSpent: Record<Member, number>,
  totalExpense: number
): SettlementTransaction[] {
  if (totalExpense <= 0) {
    return [];
  }

  const equalShare = totalExpense / MEMBERS.length;

  // Convert net balances (spent - equalShare) into integer paise
  const netPaiseMap: Record<Member, number> = {
    Varun: Math.round((memberSpent.Varun - equalShare) * 100),
    Yashasvi: Math.round((memberSpent.Yashasvi - equalShare) * 100),
    Vrishank: Math.round((memberSpent.Vrishank - equalShare) * 100),
  };

  // Reconcile any 1-2 paise rounding residual from dividing by 3 so sum(net) === 0
  const sumPaise = MEMBERS.reduce((acc, m) => acc + netPaiseMap[m], 0);
  if (sumPaise !== 0) {
    // Adjust the member with the largest absolute balance to absorb the 1-2 paise rounding delta
    const targetMember = [...MEMBERS].sort(
      (a, b) => Math.abs(netPaiseMap[b]) - Math.abs(netPaiseMap[a])
    )[0];
    netPaiseMap[targetMember] -= sumPaise;
  }

  const creditors = MEMBERS.filter((m) => netPaiseMap[m] > 0)
    .map((m) => ({ member: m, paise: netPaiseMap[m] }))
    .sort((a, b) => b.paise - a.paise);

  const debtors = MEMBERS.filter((m) => netPaiseMap[m] < 0)
    .map((m) => ({ member: m, paise: -netPaiseMap[m] }))
    .sort((a, b) => b.paise - a.paise);

  const transactions: SettlementTransaction[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settlePaise = Math.min(debtor.paise, creditor.paise);

    if (settlePaise > 0 && debtor.member !== creditor.member) {
      transactions.push({
        from: debtor.member,
        to: creditor.member,
        amount: round2(settlePaise / 100),
      });
    }

    debtor.paise -= settlePaise;
    creditor.paise -= settlePaise;

    if (debtor.paise === 0) i++;
    if (creditor.paise === 0) j++;
  }

  return transactions;
}

/**
 * Computes full expense breakdown, usage stats, and settlements for a cycle's entries.
 * Optionally filters entries up to `upToDate` (inclusive) for live "Spent Until Now" calculations.
 */
export function calculateExpenseReport(
  cycleEntries: CycleEntriesMap,
  upToDate?: DateStr
): ExpenseReport {
  const memberSpent: Record<Member, number> = {
    Varun: 0,
    Yashasvi: 0,
    Vrishank: 0,
  };
  const memberEntries: Record<Member, number> = {
    Varun: 0,
    Yashasvi: 0,
    Vrishank: 0,
  };
  const memberCars: Record<Member, number> = {
    Varun: 0,
    Yashasvi: 0,
    Vrishank: 0,
  };
  const memberBikes: Record<Member, number> = {
    Varun: 0,
    Yashasvi: 0,
    Vrishank: 0,
  };
  const codeCounts: Record<VehicleCode, number> = {
    VC: 0,
    YC: 0,
    VRC: 0,
    VB: 0,
    YB: 0,
    VRB: 0,
  };

  let totalExpense = 0;
  let usageDays = 0;
  let totalEntries = 0;

  const sortedDates = Object.keys(cycleEntries).sort();

  for (const dateStr of sortedDates) {
    if (upToDate && dateStr > upToDate) {
      continue;
    }

    const entries = cycleEntries[dateStr] ?? [];
    if (entries.length === 0) {
      continue;
    }

    usageDays += 1;

    for (const item of entries) {
      const vehicle = VEHICLES[item.code];
      if (!vehicle) continue;

      totalExpense += vehicle.cost;
      totalEntries += 1;
      codeCounts[item.code] += 1;

      memberSpent[vehicle.owner] += vehicle.cost;
      memberEntries[vehicle.owner] += 1;
      if (vehicle.type === 'Car') {
        memberCars[vehicle.owner] += 1;
      } else {
        memberBikes[vehicle.owner] += 1;
      }
    }
  }

  const equalShare = round2(totalExpense / MEMBERS.length);

  const memberBreakdowns: MemberBreakdown[] = MEMBERS.map((member) => {
    const spent = round2(memberSpent[member]);
    const difference = round2(spent - equalShare);
    return {
      member,
      spent,
      equalShare,
      difference,
      entryCount: memberEntries[member],
      carCount: memberCars[member],
      bikeCount: memberBikes[member],
    };
  });

  const vehicleStats: VehicleUsageStat[] = VEHICLE_LIST.map((vehicle) => ({
    vehicle,
    count: codeCounts[vehicle.code],
    totalCost: round2(codeCounts[vehicle.code] * vehicle.cost),
  }));

  const settlements = calculateSettlements(memberSpent, totalExpense);

  return {
    totalExpense: round2(totalExpense),
    equalShare,
    usageDays,
    totalEntries,
    memberBreakdowns,
    vehicleStats,
    settlements,
  };
}

/**
 * Computes total expense for a single day's entries.
 */
export function calculateDayCost(codes: VehicleCode[]): number {
  return codes.reduce((sum, code) => sum + (VEHICLES[code]?.cost ?? 0), 0);
}

/**
 * Generates an RFC-4180 clean CSV string for the monthly expense report & settlement.
 */
export function generateReportCSV(
  cycleLabel: string,
  cycleEntries: CycleEntriesMap,
  report: ExpenseReport
): string {
  const escape = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows: string[] = [];

  rows.push(`RideSplit Expense Report,${escape(cycleLabel)}`);
  rows.push('');

  rows.push('Summary');
  rows.push(`Total Monthly Expense,${report.totalExpense.toFixed(2)}`);
  rows.push(`Equal Contribution Per Person,${report.equalShare.toFixed(2)}`);
  rows.push(`Vehicle Usage Days,${report.usageDays}`);
  rows.push(`Total Vehicle Entries,${report.totalEntries}`);
  rows.push('');

  rows.push('Member Breakdown');
  rows.push('Member,Amount Spent (INR),Equal Share (INR),Difference (INR),Entries');
  for (const mb of report.memberBreakdowns) {
    rows.push(
      [
        mb.member,
        mb.spent.toFixed(2),
        mb.equalShare.toFixed(2),
        mb.difference.toFixed(2),
        mb.entryCount,
      ]
        .map(escape)
        .join(',')
    );
  }
  rows.push('');

  rows.push('Settlement Plan');
  if (report.settlements.length === 0) {
    rows.push('All expenses are already settled equally.');
  } else {
    rows.push('From,To,Amount (INR)');
    for (const tx of report.settlements) {
      rows.push([tx.from, tx.to, tx.amount.toFixed(2)].map(escape).join(','));
    }
  }
  rows.push('');

  rows.push('Daily Vehicle Log');
  rows.push('Date,Vehicle Codes,Vehicles,Daily Cost (INR)');
  const sortedDates = Object.keys(cycleEntries).sort();
  for (const dateStr of sortedDates) {
    const items = cycleEntries[dateStr] ?? [];
    if (items.length === 0) continue;
    const codesStr = items.map((i) => i.code).join(' + ');
    const labelsStr = items.map((i) => VEHICLES[i.code].label).join(' + ');
    const dayCost = items.reduce((s, i) => s + VEHICLES[i.code].cost, 0);
    rows.push([dateStr, codesStr, labelsStr, dayCost.toFixed(2)].map(escape).join(','));
  }

  return rows.join('\n');
}
