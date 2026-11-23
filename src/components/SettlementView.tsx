import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { CycleEntriesMap, CycleId, ExpenseReport, Member } from '../types/ridesplit';
import { formatCycleRange } from '../utils/billingCycle';
import { formatINR, generateReportCSV } from '../utils/calculations';

interface SettlementViewProps {
  cycleId: CycleId;
  cycleEntries: CycleEntriesMap;
  report: ExpenseReport;
  onPrevCycle: () => void;
  onNextCycle: () => void;
}

export function SettlementView({
  cycleId,
  cycleEntries,
  report,
  onPrevCycle,
  onNextCycle,
}: SettlementViewProps) {
  const cycleLabel = formatCycleRange(cycleId);

  const handleDownloadCSV = () => {
    const csv = generateReportCSV(cycleLabel, cycleEntries, report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ridesplit-settlement-${cycleId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Compute paid and received totals for mathematical verification
  const paidByMember: Record<Member, number> = { Varun: 0, Yashasvi: 0, Vrishank: 0 };
  const receivedByMember: Record<Member, number> = { Varun: 0, Yashasvi: 0, Vrishank: 0 };

  for (const tx of report.settlements) {
    paidByMember[tx.from] += tx.amount;
    receivedByMember[tx.to] += tx.amount;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Monthly Settlement
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
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Settlement Card */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Minimum Settlement Transfers
            </h2>
            <p className="text-xs text-slate-500">
              Equal share per member: <span className="font-semibold text-slate-800 tabular-nums">{formatINR(report.equalShare)}</span>
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            Total cycle expense {formatINR(report.totalExpense)}
          </span>
        </div>

        <div className="p-5">
          {report.totalExpense === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-700">No expenses recorded in this cycle</p>
              <p className="mt-1 text-xs text-slate-500">
                Add vehicle entries in the Calendar tab to calculate settlements.
              </p>
            </div>
          ) : report.settlements.length === 0 ? (
            <div className="py-6 px-4 bg-teal-50/60 border border-teal-200/80 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  All expenses are already settled equally.
                </p>
                <p className="text-xs text-slate-600">
                  Each member has spent {formatINR(report.equalShare)} — no transfers needed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {report.settlements.map((tx, idx) => (
                  <div
                    key={`${tx.from}-${tx.to}-${idx}`}
                    className="px-4 sm:px-5 py-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                        <span>{tx.from}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>{tx.to}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {tx.from} pays {tx.to} {formatINR(tx.amount)}
                      </p>
                    </div>

                    <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                      {formatINR(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                <span>All expenses are settled equally after these payments.</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mathematical Balance Verification */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Balance Verification
          </h2>
          <p className="text-xs text-slate-500">
            Shows how each member&apos;s final net contribution equals {formatINR(report.equalShare)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 px-4 sm:px-5">Member</th>
                <th className="py-3 px-4 sm:px-5 text-right">Spent</th>
                <th className="py-3 px-4 sm:px-5 text-right">Pays</th>
                <th className="py-3 px-4 sm:px-5 text-right">Receives</th>
                <th className="py-3 px-4 sm:px-5 text-right">Final Net Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {report.memberBreakdowns.map((mb) => {
                const pays = paidByMember[mb.member];
                const receives = receivedByMember[mb.member];
                const finalNet = mb.spent + pays - receives;

                return (
                  <tr key={mb.member} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5 font-medium text-slate-900">{mb.member}</td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-slate-700 tabular-nums">
                      {formatINR(mb.spent)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-slate-700 tabular-nums">
                      {pays > 0 ? `+${formatINR(pays)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-teal-700 tabular-nums">
                      {receives > 0 ? `-${formatINR(receives)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatINR(finalNet)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
