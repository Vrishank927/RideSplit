import { useState, FormEvent } from 'react';
import { Bike, Car, Check, Plus, Trash2, X } from 'lucide-react';
import {
  getCodeByOwnerAndType,
  MEMBER_ACCENT_STYLES,
  MEMBERS,
  parseVehicleInput,
  VEHICLE_LIST,
  VEHICLES,
} from '../constants/vehicles';
import { DateStr, Member, VehicleCode, VehicleEntryItem, VehicleType } from '../types/ridesplit';
import { formatDateHeading } from '../utils/billingCycle';
import { formatINR } from '../utils/calculations';

interface DayEntryPanelProps {
  dateStr: DateStr;
  entries: VehicleEntryItem[];
  onAddCodes: (dateStr: DateStr, codes: VehicleCode[]) => void;
  onReplaceEntry: (dateStr: DateStr, entryId: string, newCode: VehicleCode) => void;
  onRemoveEntry: (dateStr: DateStr, entryId: string) => void;
  onClearDay: (dateStr: DateStr) => void;
  onCloseMobile?: () => void;
  isMobileSheet?: boolean;
}

export function DayEntryPanel({
  dateStr,
  entries,
  onAddCodes,
  onReplaceEntry,
  onRemoveEntry,
  onClearDay,
  onCloseMobile,
  isMobileSheet = false,
}: DayEntryPanelProps) {
  const [codeInput, setCodeInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'info'; message: string } | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<Member>('Varun');
  const [selectedType, setSelectedType] = useState<VehicleType>('Car');

  const existingCodes = entries.map((e) => e.code);
  const dayTotal = entries.reduce((sum, e) => sum + (VEHICLES[e.code]?.cost ?? 0), 0);

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = codeInput.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Enter a vehicle code such as VC, YC, or YB.' });
      return;
    }

    const { validCodes, invalidTokens } = parseVehicleInput(trimmed);

    if (invalidTokens.length > 0) {
      setFeedback({
        type: 'error',
        message: `Unrecognized code${invalidTokens.length > 1 ? 's' : ''}: ${invalidTokens.join(', ')}. Valid: VC, YC, VRC, VB, YB, VRB.`,
      });
      return;
    }

    const newCodes = validCodes.filter((c) => !existingCodes.includes(c));
    const skippedDuplicates = validCodes.filter((c) => existingCodes.includes(c));

    if (newCodes.length === 0) {
      setFeedback({
        type: 'info',
        message: `${skippedDuplicates.join(', ')} already recorded for this date.`,
      });
      return;
    }

    onAddCodes(dateStr, newCodes);
    setCodeInput('');
    if (skippedDuplicates.length > 0) {
      setFeedback({
        type: 'info',
        message: `Added ${newCodes.join(', ')}. Skipped duplicate ${skippedDuplicates.join(', ')}.`,
      });
    } else {
      setFeedback(null);
    }
  };

  const handleQuickToggle = (code: VehicleCode) => {
    setFeedback(null);
    const existing = entries.find((e) => e.code === code);
    if (existing) {
      setFeedback({
        type: 'info',
        message: `${code} is already added for this date. Use the list below to remove or change it.`,
      });
      return;
    }
    onAddCodes(dateStr, [code]);
  };

  const handleOwnerTypeAdd = () => {
    setFeedback(null);
    const code = getCodeByOwnerAndType(selectedOwner, selectedType);
    if (existingCodes.includes(code)) {
      setFeedback({
        type: 'info',
        message: `${VEHICLES[code].label} (${code}) is already logged for this date.`,
      });
      return;
    }
    onAddCodes(dateStr, [code]);
  };

  const ownerTypeCode = getCodeByOwnerAndType(selectedOwner, selectedType);
  const isOwnerTypeAdded = existingCodes.includes(ownerTypeCode);

  return (
    <div
      className={`bg-white ${
        isMobileSheet
          ? 'rounded-t-3xl max-h-[88dvh] flex flex-col'
          : 'border border-slate-200/90 rounded-2xl flex flex-col'
      }`}
    >
      {/* Mobile Drag Handle */}
      {isMobileSheet && (
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
            {formatDateHeading(dateStr)}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
            {entries.length === 0
              ? 'No vehicles logged'
              : `${entries.length} ${entries.length === 1 ? 'vehicle' : 'vehicles'} · Daily total ${formatINR(dayTotal)}`}
          </p>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close date panel"
            className="w-10 h-10 -mr-2 -mt-1 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Body */}
      <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
        {/* Direct Code Input */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label htmlFor="vehicle-code-input" className="block text-xs font-medium text-slate-700">
            Enter vehicle code(s)
          </label>
          <div className="flex gap-2">
            <input
              id="vehicle-code-input"
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                if (feedback) setFeedback(null);
              }}
              placeholder="e.g. VC or VC, YB"
              autoComplete="off"
              className="flex-1 min-w-0 h-11 px-3 text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
            />
            <button
              type="submit"
              className="h-11 px-4 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
          {feedback && (
            <p
              role="status"
              className={`text-xs ${feedback.type === 'error' ? 'text-rose-700' : 'text-slate-600'}`}
            >
              {feedback.message}
            </p>
          )}
        </form>

        {/* Quick Tap Vehicle Buttons */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Quick select vehicle</span>
            <span className="text-[11px] text-slate-400">Multi-select supported</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {VEHICLE_LIST.map((v) => {
              const isAdded = existingCodes.includes(v.code);
              const style = MEMBER_ACCENT_STYLES[v.owner];
              return (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => handleQuickToggle(v.code)}
                  aria-pressed={isAdded}
                  className={`min-h-[50px] px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    isAdded
                      ? 'bg-slate-50 border-slate-300 text-slate-500'
                      : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/70 text-slate-900 active:scale-[0.99]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-xs font-semibold ${isAdded ? 'text-slate-500' : style.text}`}>
                        {v.code}
                      </span>
                      {v.type === 'Car' ? (
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      ) : (
                        <Bike className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {v.owner} · <span className="tabular-nums">{formatINR(v.cost)}</span>
                    </p>
                  </div>
                  {isAdded && (
                    <Check className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Owner + Vehicle Type Selector */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <span className="block text-xs font-medium text-slate-700">Or select by owner & type</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              aria-label="Select vehicle owner"
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value as Member)}
              className="flex-1 h-10 px-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            >
              {MEMBERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              aria-label="Select vehicle type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as VehicleType)}
              className="w-full sm:w-28 h-10 px-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            >
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
            </select>

            <button
              type="button"
              onClick={handleOwnerTypeAdd}
              disabled={isOwnerTypeAdded}
              className={`h-10 px-3.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isOwnerTypeAdded
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              {isOwnerTypeAdded ? `${ownerTypeCode} Added` : `Add ${ownerTypeCode}`}
            </button>
          </div>
        </div>

        {/* Recorded Entries for Selected Date */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Logged on this date</span>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => onClearDay(dateStr)}
                className="text-xs font-medium text-slate-500 hover:text-rose-700 transition-colors"
              >
                Clear day
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="py-5 px-4 border border-dashed border-slate-200 rounded-xl text-center">
              <p className="text-xs text-slate-500">
                No vehicles recorded. Empty dates do not count toward monthly expenses.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
              {entries.map((entry) => {
                const vehicle = VEHICLES[entry.code];
                const style = MEMBER_ACCENT_STYLES[vehicle.owner];

                return (
                  <li
                    key={entry.id}
                    className="px-3.5 py-2.5 bg-white flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-xs font-mono font-semibold border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {entry.code}
                        </span>
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {vehicle.label}
                        </span>
                        {entry.isSample && (
                          <span className="text-[11px] text-slate-400">· Sample</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Inline Edit / Swap vehicle */}
                      <select
                        aria-label={`Change ${entry.code} entry`}
                        value={entry.code}
                        onChange={(e) => {
                          const nextCode = e.target.value as VehicleCode;
                          if (nextCode !== entry.code) {
                            if (existingCodes.includes(nextCode)) {
                              setFeedback({
                                type: 'info',
                                message: `${nextCode} is already logged on this date.`,
                              });
                              return;
                            }
                            setFeedback(null);
                            onReplaceEntry(dateStr, entry.id, nextCode);
                          }
                        }}
                        className="h-9 px-2 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
                      >
                        {VEHICLE_LIST.map((option) => (
                          <option
                            key={option.code}
                            value={option.code}
                            disabled={option.code !== entry.code && existingCodes.includes(option.code)}
                          >
                            {option.code} ({formatINR(option.cost)})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setFeedback(null);
                          onRemoveEntry(dateStr, entry.id);
                        }}
                        aria-label={`Remove ${entry.code}`}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {entries.length > 0 && (
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">Day Total</span>
              <span className="font-semibold text-slate-900 tabular-nums">{formatINR(dayTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet Done Action */}
      {isMobileSheet && onCloseMobile && (
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
