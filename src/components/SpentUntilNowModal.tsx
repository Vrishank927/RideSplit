import { useEffect, useState } from 'react';
import { ArrowRight, CalendarRange, Info, X } from 'lucide-react';
import { CycleEntriesMap, CycleId, DateStr } from '../types/ridesplit';
import {
  formatCycleRange,
  formatShortDate,
  formatShortDateWithDay,
  getCycleBounds,
  getDefaultCutoffForCycle,
} from '../utils/billingCycle';
import { calculateExpenseReport, formatINR } from '../utils/calculations';

interface SpentUntilNowModalProps {
  isOpen: boolean;
  cycleId: CycleId;
  selectedDate: DateStr | null;
  cycleEntries: CycleEntriesMap;
  onClose: () => void;
}

export function SpentUntilNowModal({
  isOpen,
  cycleId,
  selectedDate,
  cycleEntries,
  onClose,
}: SpentUntilNowModalProps) {
  const bounds = getCycleBounds(cycleId);
  const defaultCutoff = getDefaultCutoffForCycle(cycleId);

  const [cutoffDate, setCutoffDate] = useState<DateStr>(defaultCutoff);

  // Sync cutoff whenever modal opens or cycle changes
  useEffect(() => {
    if (isOpen) {
      if (selectedDate && selectedDate >= bounds.startDateStr && selectedDate <= defaultCutoff) {
        setCutoffDate(selectedDate);
      } else {
        setCutoffDate(defaultCutoff);
      }
    }
  }, [isOpen, cycleId, selectedDate, bounds.startDateStr, defaultCutoff]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const liveReport = calculateExpenseReport(cycleEntries, cutoffDate);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spent-until-now-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/45 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[90dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-teal-800">
              <span>Provisional Live Summary</span>
              <span aria-hidden="true">·</span>
              <span>{formatCycleRange(cycleId, true)}</span>
            </div>
            <h2 id="spent-until-now-title" className="mt-0.5 text-lg font-bold text-slate-900">
              Spent Until Now
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Spent Until Now modal"
            className="w-10 h-10 -mr-2 -mt-1 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Cutoff Date Controls */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <CalendarRange className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium text-slate-800">
                  From {formatShortDate(bounds.startDateStr)} to {formatShortDateWithDay(cutoffDate)}
                </p>
                <p className="text-slate-500">Excludes future dates and other billing cycles</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="cutoff-date-input" className="sr-only">
                As of date
              </label>
              <input
                id="cutoff-date-input"
                type="date"
                min={bounds.startDateStr}
                max={bounds.endDateStr}
                value={cutoffDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val >= bounds.startDateStr && val <= bounds.endDateStr) {
                    setCutoffDate(val);
                  }
                }}
                className="h-9 px-2.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Total & Equal Share */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 border border-slate-200/80 rounded-xl bg-white">
              <p className="text-xs font-medium text-slate-500">Total Expense Until Now</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {formatINR(liveReport.totalExpense)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
                {liveReport.usageDays} {liveReport.usageDays === 1 ? 'day' : 'days'} ·{' '}
                {liveReport.totalEntries} {liveReport.totalEntries === 1 ? 'entry' : 'entries'}
              </p>
            </div>

            <div className="p-4 border border-slate-200/80 rounded-xl bg-white">
              <p className="text-xs font-medium text-slate-500">Equal Share Until Now</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {formatINR(liveReport.equalShare)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Divided equally by 3</p>
            </div>
          </div>

          {/* Individual Contributions */}
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-2">Individual Contributions</h3>
            <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {liveReport.memberBreakdowns.map((mb) => {
                const netLabel =
                  Math.abs(mb.difference) < 0.01
                    ? 'Settled'
                    : mb.difference > 0
                    ? `Receive ${formatINR(mb.difference)}`
                    : `Pay ${formatINR(Math.abs(mb.difference))}`;

                return (
                  <div
                    key={mb.member}
                    className="px-4 py-3 bg-white flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{mb.member}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {mb.entryCount} {mb.entryCount === 1 ? 'ride' : 'rides'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">
                        {formatINR(mb.spent)}
                      </p>
                      <p
                        className={`text-xs font-medium tabular-nums ${
                          mb.difference > 0.01
                            ? 'text-teal-700'
                            : mb.difference < -0.01
                            ? 'text-slate-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {netLabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provisional Current Settlement */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-slate-500">
                Current Settlement (Provisional)
              </h3>
              <span className="text-[11px] font-medium text-slate-500">Not final</span>
            </div>

            {liveReport.totalExpense === 0 ? (
              <div className="p-4 border border-slate-200/80 rounded-xl text-center text-xs text-slate-500">
                No vehicle entries recorded up to {formatShortDate(cutoffDate)}.
              </div>
            ) : liveReport.settlements.length === 0 ? (
              <div className="p-4 border border-slate-200/80 rounded-xl text-center text-xs text-slate-600">
                Everyone has spent equally up to {formatShortDate(cutoffDate)}. No provisional transfers needed.
              </div>
            ) : (
              <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {liveReport.settlements.map((tx, idx) => (
                  <div
                    key={`${tx.from}-${tx.to}-${idx}`}
                    className="px-4 py-3 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-900">{tx.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="font-semibold text-slate-900">{tx.to}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatINR(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 pt-1 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                Provisional settlement only. Payments are not marked as paid and will recalculate automatically as new rides are added before the cycle closes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
