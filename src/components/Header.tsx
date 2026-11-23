import { CalendarDays, CheckCircle2, Clock, FileSpreadsheet } from 'lucide-react';
import { AppTab } from '../types/ridesplit';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenSpentUntilNow: () => void;
}

export function Header({ activeTab, onTabChange, onOpenSpentUntilNow }: HeaderProps) {
  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'summary', label: 'Summary' },
    { id: 'settlement', label: 'Settlement' },
  ];

  return (
    <header className="bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onTabChange('calendar')}
          className="flex items-center gap-2.5 text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-md py-1"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="text-slate-900 shrink-0"
          >
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.75" />
            <path
              d="M12 2.5V21.5M12 12L19.5 6.5M12 12L4.5 17.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight">RideSplit</span>
        </button>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-sm ${
                  isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-slate-900 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenSpentUntilNow}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] rounded-lg transition-all whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Spent Until Now</span>
          </button>
        </div>
      </div>
    </header>
  );
}

interface MobileBottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const items: Array<{ id: AppTab; label: string; icon: typeof CalendarDays }> = [
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'summary', label: 'Summary', icon: FileSpreadsheet },
    { id: 'settlement', label: 'Settlement', icon: CheckCircle2 },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
    >
      <div className="grid grid-cols-3 h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.75]'}`}
                aria-hidden="true"
              />
              <span className={`text-[11px] mt-0.5 leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
