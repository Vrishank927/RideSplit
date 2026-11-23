import { ChevronLeft, ChevronRight, Clock, RotateCcw } from 'lucide-react';
import { MEMBER_ACCENT_STYLES, VEHICLES } from '../constants/vehicles';
import { CycleEntriesMap, CycleId, DateStr } from '../types/ridesplit';
import { formatCycleRange, getCycleDays } from '../utils/billingCycle';
import { formatINR } from '../utils/calculations';

interface BillingCalendarProps {
  cycleId: CycleId;
  activeCycleId: CycleId;
  selectedDate: DateStr | null;
  cycleEntries: CycleEntriesMap;
  onSelectDate: (dateStr: DateStr) => void;
  onPrevCycle: () => void;
  onNextCycle: () => void;
  onJumpToCurrentCycle: () => void;
  onOpenSpentUntilNow: () => void;
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BillingCalendar({
  cycleId,
  activeCycleId,
  selectedDate,
  cycleEntries,
  onSelectDate,
  onPrevCycle,
  onNextCycle,
  onJumpToCurrentCycle,
  onOpenSpentUntilNow,
}: BillingCalendarProps) {
  const days = getCycleDays(cycleId);
  const leadingEmptyCount = days.length > 0 ? days[0].weekdayIndex : 0;
  const totalCells = leadingEmptyCount + days.length;
  const trailingEmptyCount = (7 - (totalCells % 7)) % 7;

  const isViewingCurrentCycle = cycleId === activeCycleId;

  return (
    <section
      aria-label="Billing cycle calendar"
      className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden"
    >
      {/* Calendar Header & Cycle Navigation */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50/70">
            <button
              type="button"
              onClick={onPrevCycle}
              aria-label="Previous billing cycle"
              className="w-10 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <button
              type="button"
              onClick={onNextCycle}
              aria-label="Next billing cycle"
              className="w-10 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
              {formatCycleRange(cycleId)}
            </h2>
            <p className="text-xs text-slate-500">
              {days.length} days in cycle
              {!isViewingCurrentCycle && ' · Viewing past/future cycle'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isViewingCurrentCycle && (
            <button
              type="button"
              onClick={onJumpToCurrentCycle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors min-h-[36px] whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Current Cycle</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSpentUntilNow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-lg transition-colors min-h-[36px] whitespace-nowrap shrink-0"
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span>Spent Until Now</span>
          </button>
        </div>
      </div>

      {/* Weekday Column Labels */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/70">
        {WEEKDAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[11px] sm:text-xs font-medium text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {/* Leading Spacer Cells */}
        {Array.from({ length: leadingEmptyCount }).map((_, idx) => (
          <div
            key={`lead-${idx}`}
            aria-hidden="true"
            className="min-h-[66px] sm:min-h-[88px] lg:min-h-[96px] bg-slate-50/40"
          />
        ))}

        {/* Cycle Date Cells */}
        {days.map((day) => {
          const entries = cycleEntries[day.dateStr] ?? [];
          const hasEntries = entries.length > 0;
          const isSelected = selectedDate === day.dateStr;
          const dayTotal = entries.reduce((sum, e) => sum + (VEHICLES[e.code]?.cost ?? 0), 0);

          const showMonthLabel = day.isStartBoundary || day.isFirstOfMonth || day.isEndBoundary;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(day.dateStr)}
              aria-label={`${day.shortMonth} ${day.dayOfMonth}, ${entries.length} vehicle entries`}
              aria-pressed={isSelected}
              className={`group relative min-h-[66px] sm:min-h-[88px] lg:min-h-[96px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-colors focus-visible:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-slate-900 ${
                isSelected
                  ? 'bg-slate-900/[0.04] ring-1 ring-inset ring-slate-900 z-10'
                  : hasEntries
                  ? 'bg-white hover:bg-slate-50/80'
                  : 'bg-white hover:bg-slate-50/70'
              }`}
            >
              {/* Date Number Row */}
              <div className="flex items-start justify-between gap-1 w-full">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center text-xs sm:text-sm tabular-nums leading-none ${
                      day.isToday
                        ? 'px-1.5 py-0.5 rounded-md bg-slate-900 text-white font-semibold'
                        : isSelected
                        ? 'font-bold text-slate-900'
                        : hasEntries
                        ? 'font-semibold text-slate-900'
                        : 'font-medium text-slate-500'
                    }`}
                  >
                    {day.dayOfMonth}
                  </span>
                  {showMonthLabel && (
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                      {day.shortMonth}
                    </span>
                  )}
                </div>

                {day.isToday && (
                  <span className="hidden sm:inline text-[10px] font-semibold text-slate-700">
                    Today
                  </span>
                )}
              </div>

              {/* Logged Vehicle Codes */}
              <div className="mt-1 flex flex-col gap-1 w-full">
                {hasEntries && (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {entries.map((entry) => {
                        const v = VEHICLES[entry.code];
                        const style = MEMBER_ACCENT_STYLES[v.owner];
                        return (
                          <span
                            key={entry.id}
                            className={`inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-semibold leading-none border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {entry.code}
                          </span>
                        );
                      })}
                    </div>

                    <span className="hidden sm:block text-[11px] font-medium text-slate-500 tabular-nums">
                      {formatINR(dayTotal)}
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}

        {/* Trailing Spacer Cells */}
        {Array.from({ length: trailingEmptyCount }).map((_, idx) => (
          <div
            key={`trail-${idx}`}
            aria-hidden="true"
            className="min-h-[66px] sm:min-h-[88px] lg:min-h-[96px] bg-slate-50/40"
          />
        ))}
      </div>

      {/* Subtle Color Legend */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            <strong className="font-mono font-semibold text-slate-700">VC/VB</strong> Varun
          </span>
          <span>
            <strong className="font-mono font-semibold text-teal-800">YC/YB</strong> Yashasvi
          </span>
          <span>
            <strong className="font-mono font-semibold text-indigo-900">VRC/VRB</strong> Vrishank
          </span>
        </div>
        <span className="text-slate-400">Tap any date to add or edit entries</span>
      </div>
    </section>
  );
}
