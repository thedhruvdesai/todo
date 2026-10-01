import { useState } from 'react';
import { addDays, format } from 'date-fns';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Forward,
  Inbox,
  Moon,
  Search,
  Settings2,
  Sun,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import { fmtHours } from '../utils/helpers.js';
import { IconButton, Kbd, Popover } from './ui.jsx';

export default function Header({
  weekStart,
  weekEnd,
  weekOffset,
  weekTotals,
  onPrev,
  onNext,
  onToday,
  theme,
  onTheme,
  somedayOpen,
  onSomeday,
  onAnalytics,
  onSettings,
  onSearch,
  onRollOverdue,
  onPushWeek,
  overdueCount,
}) {
  const [pushMenu, setPushMenu] = useState(null);
  const monthAnchor = addDays(weekStart, 3);
  const sameMonth = format(weekStart, 'MMM') === format(weekEnd, 'MMM');
  const range = sameMonth
    ? `${format(weekStart, 'd')} – ${format(weekEnd, 'd MMM')}`
    : `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM')}`;
  const relative =
    weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : null;

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-4 pb-5 pt-6 sm:px-6 lg:pt-8">
      <div className="flex min-w-0 items-end gap-4">
        <div className="min-w-0">
          <div className="eyebrow flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Paperweek
            <span className="text-ink-400/60">/</span>
            <span className="normal-case tracking-normal">{relative || `Week ${format(weekStart, 'I')}`}</span>
          </div>
          <h1 className="mt-1.5 font-serif text-[44px] leading-[0.9] sm:text-[56px]">
            {format(monthAnchor, 'MMMM')}{' '}
            <span className="italic text-ink-400 dark:text-stone-500">{format(monthAnchor, 'yyyy')}</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-600 dark:text-stone-400">
            <span className="tabular-nums">{range}</span>
            <span className="text-ink-400/50">•</span>
            <span className="tabular-nums">
              {fmtHours(weekTotals.completed)} done / {fmtHours(weekTotals.total)} logged
            </span>
            <span className="text-ink-400/50">•</span>
            <span className="tabular-nums">
              {weekTotals.doneCount}/{weekTotals.count} tasks
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-between sm:w-auto sm:justify-end sm:gap-1">
        <div className="mr-auto flex sm:mr-1 items-center rounded-xl border border-rule p-0.5 dark:border-white/10">
          <IconButton label="Previous week (←)" onClick={onPrev} className="!h-8 !w-8">
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <button
            type="button"
            onClick={onToday}
            title="Go to today (T)"
            className={`h-8 rounded-lg px-3 text-[12.5px] font-medium transition-colors ${
              weekOffset === 0
                ? 'text-ink-400 dark:text-stone-500'
                : 'text-ink-900 hover:bg-black/5 dark:text-stone-100 dark:hover:bg-white/10'
            }`}
          >
            Today
          </button>
          <IconButton label="Next week (→)" onClick={onNext} className="!h-8 !w-8">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>

        <IconButton label="Search & quick add (⌘K)" onClick={onSearch}>
          <Search className="h-4 w-4" />
        </IconButton>
        <div className="relative">
          <IconButton
            label="Push unfinished tasks"
            onClick={(e) => setPushMenu(pushMenu ? null : e.currentTarget)}
            active={!!pushMenu}
          >
            <Forward className="h-4 w-4" />
          </IconButton>
          {overdueCount > 0 && (
            <span className="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
          )}
        </div>
        <IconButton label="Analytics (A)" onClick={onAnalytics}>
          <BarChart3 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Someday backlog (S)" onClick={onSomeday} active={somedayOpen}>
          <Inbox className="h-4 w-4" />
        </IconButton>
        <IconButton label="Toggle theme (D)" onClick={onTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </IconButton>
        <IconButton label="Settings" onClick={onSettings}>
          <Settings2 className="h-4 w-4" />
        </IconButton>
      </div>

      {pushMenu && (
        <Popover anchor={pushMenu} onClose={() => setPushMenu(null)} width={270}>
          <div className="p-1.5">
            <div className="eyebrow px-2.5 pb-1 pt-1.5">Push unfinished</div>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                onRollOverdue();
                setPushMenu(null);
              }}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              <span className="flex-1">Roll overdue → today</span>
              {overdueCount > 0 && <span className="chip bg-accent/10 text-accent">{overdueCount}</span>}
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                onPushWeek();
                setPushMenu(null);
              }}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="flex-1">This week’s unfinished → next week</span>
            </button>
            <p className="px-2.5 pb-1.5 pt-1 text-[11px] leading-snug text-ink-400 dark:text-stone-500">
              Tip: hover a day and use its <ArrowRight className="inline h-3 w-3" /> button to push just that day. Press{' '}
              <Kbd>N</Kbd> to add a task to today.
            </p>
          </div>
        </Popover>
      )}
    </header>
  );
}
