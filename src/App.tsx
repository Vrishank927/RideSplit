import { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, RotateCcw, Sparkles, X } from 'lucide-react';
import { BillingCalendar } from './components/BillingCalendar';
import { DashboardStrip } from './components/DashboardStrip';
import { DayEntryPanel } from './components/DayEntryPanel';
import { Header, MobileBottomNav } from './components/Header';
import { SettlementView } from './components/SettlementView';
import { SpentUntilNowModal } from './components/SpentUntilNowModal';
import { SummaryView } from './components/SummaryView';
import { VEHICLES } from './constants/vehicles';
import {
  countSampleEntries,
  countTotalEntries,
  rideSplitStorage,
} from './storage/rideSplitStorage';
import {
  AllCyclesData,
  AppTab,
  CycleEntriesMap,
  CycleId,
  DateStr,
  VehicleCode,
  VehicleEntryItem,
} from './types/ridesplit';
import {
  formatShortDateWithDay,
  getCycleIdForDate,
  getDefaultCutoffForCycle,
  shiftCycleId,
} from './utils/billingCycle';
import { calculateExpenseReport, formatINR } from './utils/calculations';

function createEntryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const activeCycleId = useMemo(() => getCycleIdForDate(new Date()), []);

  const [allCycles, setAllCycles] = useState<AllCyclesData>(() =>
    rideSplitStorage.loadAllCycles()
  );
  const [viewedCycleId, setViewedCycleId] = useState<CycleId>(activeCycleId);
  const [selectedDate, setSelectedDate] = useState<DateStr>(() =>
    getDefaultCutoffForCycle(activeCycleId)
  );
  const [activeTab, setActiveTab] = useState<AppTab>('calendar');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isSpentUntilNowOpen, setIsSpentUntilNowOpen] = useState(false);

  const currentCycleEntries: CycleEntriesMap = useMemo(
    () => allCycles[viewedCycleId] ?? {},
    [allCycles, viewedCycleId]
  );

  const report = useMemo(
    () => calculateExpenseReport(currentCycleEntries),
    [currentCycleEntries]
  );

  const sampleEntryCount = useMemo(() => countSampleEntries(allCycles), [allCycles]);
  const totalEntryCount = useMemo(() => countTotalEntries(allCycles), [allCycles]);

  const updateCycles = (updater: (prev: AllCyclesData) => AllCyclesData) => {
    setAllCycles((prev) => {
      const next = updater(prev);
      rideSplitStorage.saveAllCycles(next);
      return next;
    });
  };

  const handleCycleChange = (nextCycleId: CycleId) => {
    setViewedCycleId(nextCycleId);
    setSelectedDate(getDefaultCutoffForCycle(nextCycleId));
    setIsMobileSheetOpen(false);
  };

  const handleSelectDate = (dateStr: DateStr) => {
    setSelectedDate(dateStr);
    setIsMobileSheetOpen(true);
  };

  const handleAddCodes = (dateStr: DateStr, codes: VehicleCode[]) => {
    updateCycles((prev) => {
      const prevCycle = prev[viewedCycleId] ?? {};
      const existing = prevCycle[dateStr] ?? [];
      const existingCodes = new Set(existing.map((e) => e.code));

      const toAdd: VehicleEntryItem[] = [];
      for (const code of codes) {
        if (!existingCodes.has(code)) {
          existingCodes.add(code);
          toAdd.push({
            id: createEntryId(),
            code,
            isSample: false,
            createdAt: Date.now(),
          });
        }
      }

      if (toAdd.length === 0) return prev;

      return {
        ...prev,
        [viewedCycleId]: {
          ...prevCycle,
          [dateStr]: [...existing, ...toAdd],
        },
      };
    });
  };

  const handleReplaceEntry = (dateStr: DateStr, entryId: string, newCode: VehicleCode) => {
    updateCycles((prev) => {
      const prevCycle = prev[viewedCycleId] ?? {};
      const existing = prevCycle[dateStr] ?? [];
      if (existing.some((e) => e.id !== entryId && e.code === newCode)) {
        return prev;
      }

      const updatedDay = existing.map((e) =>
        e.id === entryId ? { ...e, code: newCode, isSample: false } : e
      );

      return {
        ...prev,
        [viewedCycleId]: {
          ...prevCycle,
          [dateStr]: updatedDay,
        },
      };
    });
  };

  const handleRemoveEntry = (dateStr: DateStr, entryId: string) => {
    updateCycles((prev) => {
      const prevCycle = prev[viewedCycleId] ?? {};
      const existing = prevCycle[dateStr] ?? [];
      const remaining = existing.filter((e) => e.id !== entryId);

      const nextCycle = { ...prevCycle };
      if (remaining.length === 0) {
        delete nextCycle[dateStr];
      } else {
        nextCycle[dateStr] = remaining;
      }

      const next = { ...prev };
      if (Object.keys(nextCycle).length === 0) {
        delete next[viewedCycleId];
      } else {
        next[viewedCycleId] = nextCycle;
      }
      return next;
    });
  };

  const handleClearDay = (dateStr: DateStr) => {
    updateCycles((prev) => {
      const prevCycle = prev[viewedCycleId] ?? {};
      const nextCycle = { ...prevCycle };
      delete nextCycle[dateStr];

      const next = { ...prev };
      if (Object.keys(nextCycle).length === 0) {
        delete next[viewedCycleId];
      } else {
        next[viewedCycleId] = nextCycle;
      }
      return next;
    });
  };

  const handleClearSampleData = () => {
    const cleaned = rideSplitStorage.clearSampleEntries(allCycles);
    setAllCycles(cleaned);
  };

  const handleRestoreSampleData = () => {
    const seeded = rideSplitStorage.resetWithSampleData();
    setAllCycles(seeded);
    setViewedCycleId(activeCycleId);
    setSelectedDate(getDefaultCutoffForCycle(activeCycleId));
  };

  const selectedEntries = currentCycleEntries[selectedDate] ?? [];
  const selectedDayCost = selectedEntries.reduce(
    (sum, item) => sum + (VEHICLES[item.code]?.cost ?? 0),
    0
  );

  return (
    <div className="min-h-dvh flex flex-col bg-[#f7f8fa] text-slate-900">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSpentUntilNow={() => setIsSpentUntilNowOpen(true)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 md:pb-12 space-y-5">
        {/* Sample Data Notice Bar (shown only while sample entries exist) */}
        {sampleEntryCount > 0 && (
          <div className="px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              <span>
                Showing <strong className="font-semibold text-slate-800">{sampleEntryCount}</strong>{' '}
                sample {sampleEntryCount === 1 ? 'entry' : 'entries'} for testing alongside your saved data.
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSampleData}
              className="inline-flex items-center gap-1 px-2.5 py-1 font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              <span>Clear Sample Data</span>
            </button>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-5">
            <DashboardStrip report={report} />

            {/* Two-Column Desktop Split: Calendar (8 cols) + Day Inspector (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-8">
                <BillingCalendar
                  cycleId={viewedCycleId}
                  activeCycleId={activeCycleId}
                  selectedDate={selectedDate}
                  cycleEntries={currentCycleEntries}
                  onSelectDate={handleSelectDate}
                  onPrevCycle={() => handleCycleChange(shiftCycleId(viewedCycleId, -1))}
                  onNextCycle={() => handleCycleChange(shiftCycleId(viewedCycleId, 1))}
                  onJumpToCurrentCycle={() => handleCycleChange(activeCycleId)}
                  onOpenSpentUntilNow={() => setIsSpentUntilNowOpen(true)}
                />

                {/* Mobile Quick-Open Card for Selected Date */}
                <div className="lg:hidden mt-4 p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Selected date</span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
                      {formatShortDateWithDay(selectedDate)}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {selectedEntries.length === 0
                        ? 'No vehicles logged'
                        : `${selectedEntries.map((e) => e.code).join(' + ')} · ${formatINR(selectedDayCost)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileSheetOpen(true)}
                    className="h-10 px-4 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {selectedEntries.length === 0 ? 'Add Entry' : 'Edit Date'}
                  </button>
                </div>
              </div>

              {/* Desktop Side Day Editor */}
              <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-6">
                <DayEntryPanel
                  dateStr={selectedDate}
                  entries={selectedEntries}
                  onAddCodes={handleAddCodes}
                  onReplaceEntry={handleReplaceEntry}
                  onRemoveEntry={handleRemoveEntry}
                  onClearDay={handleClearDay}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <SummaryView
            cycleId={viewedCycleId}
            cycleEntries={currentCycleEntries}
            report={report}
            onPrevCycle={() => handleCycleChange(shiftCycleId(viewedCycleId, -1))}
            onNextCycle={() => handleCycleChange(shiftCycleId(viewedCycleId, 1))}
            onSelectDateInCalendar={(dateStr) => {
              setSelectedDate(dateStr);
              setActiveTab('calendar');
            }}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementView
            cycleId={viewedCycleId}
            cycleEntries={currentCycleEntries}
            report={report}
            onPrevCycle={() => handleCycleChange(shiftCycleId(viewedCycleId, -1))}
            onNextCycle={() => handleCycleChange(shiftCycleId(viewedCycleId, 1))}
          />
        )}

        {/* Quiet Footer Action when no data exists */}
        {totalEntryCount === 0 && (
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleRestoreSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Load sample entries to test calculations</span>
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Sheet for Date Entry */}
      {isMobileSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex items-end bg-slate-950/45 backdrop-blur-xs"
          onClick={() => setIsMobileSheetOpen(false)}
        >
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <DayEntryPanel
              dateStr={selectedDate}
              entries={selectedEntries}
              onAddCodes={handleAddCodes}
              onReplaceEntry={handleReplaceEntry}
              onRemoveEntry={handleRemoveEntry}
              onClearDay={handleClearDay}
              onCloseMobile={() => setIsMobileSheetOpen(false)}
              isMobileSheet
            />
          </div>
        </div>
      )}

      {/* Spent Until Now Modal */}
      <SpentUntilNowModal
        isOpen={isSpentUntilNowOpen}
        cycleId={viewedCycleId}
        selectedDate={selectedDate}
        cycleEntries={currentCycleEntries}
        onClose={() => setIsSpentUntilNowOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
