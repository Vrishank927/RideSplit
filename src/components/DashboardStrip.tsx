import { MEMBER_ACCENT_STYLES } from '../constants/vehicles';
import { ExpenseReport } from '../types/ridesplit';
import { formatINR } from '../utils/calculations';

interface DashboardStripProps {
  report: ExpenseReport;
}

export function DashboardStrip({ report }: DashboardStripProps) {
  const { totalExpense, equalShare, usageDays, totalEntries, memberBreakdowns } = report;

  return (
    <section
      aria-label="Monthly expense overview"
      className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
        {/* Primary cycle totals */}
        <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Monthly Expense</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {formatINR(totalExpense)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">Equal Share / Person</p>
              <p className="mt-1 text-lg sm:text-xl font-semibold text-slate-800 tabular-nums">
                {formatINR(equalShare)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 tabular-nums">
            <span>
              <strong className="font-semibold text-slate-700">{usageDays}</strong>{' '}
              {usageDays === 1 ? 'usage day' : 'usage days'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-slate-700">{totalEntries}</strong>{' '}
              {totalEntries === 1 ? 'vehicle entry' : 'vehicle entries'}
            </span>
          </div>
        </div>

        {/* Member spending breakdown */}
        <div className="lg:col-span-7 grid grid-cols-3 divide-x divide-slate-200/80">
          {memberBreakdowns.map((item) => {
            const sharePercent =
              totalExpense > 0 ? Math.min(100, Math.round((item.spent / totalExpense) * 100)) : 0;
            const style = MEMBER_ACCENT_STYLES[item.member];
            const diffText =
              Math.abs(item.difference) < 0.01
                ? 'Even'
                : item.difference > 0
                ? `+${formatINR(item.difference)}`
                : formatINR(item.difference);

            return (
              <div key={item.member} className="p-3.5 sm:p-5 flex flex-col justify-between gap-2.5">
                <div>
                  <p className="text-xs font-medium text-slate-500 truncate">{item.member}</p>
                  <p className="mt-1 text-base sm:text-xl font-semibold text-slate-900 tabular-nums">
                    {formatINR(item.spent)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${style.bar} transition-all duration-200`}
                      style={{ width: `${sharePercent}%` }}
                    />
                  </div>
                  <p
                    className={`text-[11px] sm:text-xs font-medium tabular-nums truncate ${
                      item.difference > 0.01
                        ? 'text-teal-700'
                        : item.difference < -0.01
                        ? 'text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {totalExpense === 0 ? 'No entries' : diffText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
