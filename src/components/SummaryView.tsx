import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { MEMBER_ACCENT_STYLES, VEHICLES } from '../constants/vehicles';
import { CycleEntriesMap, CycleId, DateStr, ExpenseReport } from '../types/ridesplit';
import { formatCycleRange, formatShortDateWithDay } from '../utils/billingCycle';
import { formatINR, generateReportCSV } from '../utils/calculations';

interface SummaryViewProps {
  cycleId: CycleId;
  cycleEntries: CycleEntriesMap;
  report: ExpenseReport;
  onPrevCycle: () => void;
  onNextCycle: () => void;
  onSelectDateInCalendar: (dateStr: DateStr) => void;
}

export function SummaryView({
  cycleId,
  cycleEntries,
  report,
  onPrevCycle,
  onNextCycle,
  onSelectDateInCalendar,
}: SummaryViewProps) {
  const cycleLabel = formatCycleRange(cycleId);

  const handleDownloadCSV = () => {
    const csv = generateReportCSV(cycleLabel, cycleEntries, report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ridesplit-${cycleId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeDates = Object.keys(cycleEntries)
    .filter((d) => (cycleEntries[d]?.length ?? 0) > 0)
    .sort();

  return (
    <div className="space-y-6">
      {/* Page Heading & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Monthly Summary
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{cycleLabel}</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center border border-slate-200 rounded-lg bg-white">
            <button
              type="button"
              onClick={onPrevCycle}
              aria-label="Previous billing cycle"
              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <button
              type="button"
              onClick={onNextCycle}
              aria-label="Next billing cycle"
              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="h-10 px-4 inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Expense Breakdown Table */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Expense Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Total {formatINR(report.totalExpense)} split equally across all 3 members
            </p>
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            <span>{report.usageDays} days</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{report.totalEntries} entries</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 px-4 sm:px-5">Member</th>
                <th className="py-3 px-4 sm:px-5 text-right">Amount Spent</th>
                <th className="py-3 px-4 sm:px-5 text-right">Equal Share</th>
                <th className="py-3 px-4 sm:px-5 text-right">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {report.memberBreakdowns.map((mb) => {
                const diffStatus =
                  Math.abs(mb.difference) < 0.01
                    ? 'Settled'
                    : mb.difference > 0
                    ? `${formatINR(mb.difference, true)} (Receive)`
                    : `${formatINR(mb.difference)} (Pay)`;

                return (
                  <tr key={mb.member} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="font-medium text-slate-900">{mb.member}</div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {mb.carCount} car · {mb.bikeCount} bike
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatINR(mb.spent)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-slate-600 tabular-nums">
                      {formatINR(mb.equalShare)}
                    </td>
                    <td
                      className={`py-3.5 px-4 sm:px-5 text-right font-medium tabular-nums ${
                        mb.difference > 0.01
                          ? 'text-teal-700'
                          : mb.difference < -0.01
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {diffStatus}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900">
                <td className="py-3 px-4 sm:px-5">Total</td>
                <td className="py-3 px-4 sm:px-5 text-right tabular-nums">
                  {formatINR(report.totalExpense)}
                </td>
                <td className="py-3 px-4 sm:px-5 text-right tabular-nums">
                  {formatINR(report.totalExpense)}
                </td>
                <td className="py-3 px-4 sm:px-5 text-right text-slate-500 tabular-nums">₹0</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Two-Column Breakdown: Vehicle Counts + Daily Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Vehicle Usage Breakdown */}
        <section className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Vehicle Usage</h2>
            <p className="text-xs text-slate-500">Entries per vehicle code this cycle</p>
          </div>

          <div className="divide-y divide-slate-100">
            {report.vehicleStats.map(({ vehicle, count, totalCost }) => {
              const style = MEMBER_ACCENT_STYLES[vehicle.owner];
              return (
                <div
                  key={vehicle.code}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex w-11 justify-center py-0.5 rounded text-xs font-mono font-semibold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {vehicle.code}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{vehicle.label}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {formatINR(vehicle.cost)} / day
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <p className="text-sm font-semibold text-slate-900">{formatINR(totalCost)}</p>
                    <p className="text-xs text-slate-500">
                      {count} {count === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Chronological Daily Log */}
        <section className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">Daily Log</h2>
              <p className="text-xs text-slate-500">Click any row to edit in Calendar</p>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {activeDates.length} active {activeDates.length === 1 ? 'day' : 'days'}
            </span>
          </div>

          {activeDates.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No vehicle rides recorded in this billing cycle yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {activeDates.map((dateStr) => {
                const items = cycleEntries[dateStr] ?? [];
                const dayCost = items.reduce((sum, i) => sum + (VEHICLES[i.code]?.cost ?? 0), 0);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onSelectDateInCalendar(dateStr)}
                    className="w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {formatShortDateWithDay(dateStr)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {items.map((entry) => {
                          const v = VEHICLES[entry.code];
                          const style = MEMBER_ACCENT_STYLES[v.owner];
                          return (
                            <span
                              key={entry.id}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${style.bg} ${style.text} ${style.border}`}
                            >
                              {entry.code}
                            </span>
                          );
                        })}
                        <span className="text-xs text-slate-500 truncate">
                          {items.map((i) => VEHICLES[i.code].label).join(' + ')}
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatINR(dayCost)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
