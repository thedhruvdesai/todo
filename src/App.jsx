import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays } from 'date-fns';
import Header from './components/Header.jsx';
import MonthDrawer from './components/MonthDrawer.jsx';
import WeekView from './components/WeekView.jsx';
import SomedaySidebar from './components/SomedaySidebar.jsx';
import AnalyticsModal from './components/AnalyticsModal.jsx';
import SettingsDrawer from './components/SettingsDrawer.jsx';
import QuickAdd from './components/QuickAdd.jsx';
import Toast from './components/Toast.jsx';
import { Kbd } from './components/ui.jsx';
import { useMediaQuery, usePersistentState, useToday } from './hooks/usePersistentState.js';
import {
  STORAGE_KEY,
  byOrder,
  createEmptyState,
  createInitialState,
  downloadJSON,
  fromKey,
  getWeekDays,
  getWeekStart,
  normalizeState,
  parseTaskInput,
  shiftKey,
  sumHours,
  toKey,
  uid,
  weekOffsetFor,
  buildMockTasks,
} from './utils/helpers.js';

export default function App() {
  const [state, setState] = usePersistentState(STORAGE_KEY, createInitialState, normalizeState);
  const { tasks, categories, theme, weekOffset, targets } = state;
  const stateRef = useRef(state);
  stateRef.current = state;

  const today = useToday();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const weekStart = useMemo(() => getWeekStart(weekOffset, fromKey(today)), [weekOffset, today]);
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const dayKeys = useMemo(() => days.map(toKey), [days]);
  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  // UI state (not persisted)
  const [composing, setComposing] = useState(null);
  const [drag, setDrag] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [somedayOpen, setSomedayOpen] = useState(() => {
    try {
      return window.innerWidth >= 1024;
    } catch {
      return true;
    }
  });
  const [monthOpen, setMonthOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, action) => setToast({ msg, action, id: uid() }), []);
  const clearToast = useCallback(() => setToast(null), []);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0D0D11' : '#FAF9F6');
  }, [theme]);

  const setWeekOffset = useCallback(
    (n) => setState((s) => ({ ...s, weekOffset: typeof n === 'function' ? n(s.weekOffset) : n })),
    [setState],
  );

  const flash = useCallback((id) => {
    setHighlight(id);
    setTimeout(() => setHighlight((h) => (h === id ? null : h)), 1900);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */
  const actions = useMemo(() => {
    const setTasks = (fn) => setState((s) => ({ ...s, tasks: fn(s.tasks) }));
    const nextOrder = (list, date) => {
      const same = list.filter((t) => t.date === date);
      return same.length ? Math.max(...same.map((t) => t.order ?? 0)) + 1 : 0;
    };
    const relocate = (pred, mapDate, label) => {
      const movers = stateRef.current.tasks.filter(pred);
      if (!movers.length) {
        notify('Nothing unfinished to move');
        return;
      }
      const ids = new Set(movers.map((t) => t.id));
      setTasks((list) =>
        list.map((t) => (ids.has(t.id) ? { ...t, date: mapDate(t), order: (t.order ?? 0) + 1000 } : t)),
      );
      notify(`${movers.length} task${movers.length > 1 ? 's' : ''} ${label}`);
    };

    return {
      add(date, raw, overrideCat) {
        const p = parseTaskInput(raw, stateRef.current.categories);
        const category = overrideCat !== undefined ? overrideCat : p.category;
        const title = p.title || stateRef.current.categories.find((c) => c.id === category)?.short || '';
        if (!title) return;
        const id = uid();
        setTasks((list) => [
          ...list,
          { id, title, duration: p.hours, category, done: false, date: date ?? null, order: nextOrder(list, date ?? null) },
        ]);
        return id;
      },
      update(id, patch) {
        setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      },
      toggle(id) {
        setTasks((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      },
      remove(id) {
        const task = stateRef.current.tasks.find((t) => t.id === id);
        if (!task) return;
        setTasks((list) => list.filter((t) => t.id !== id));
        notify('Task deleted', { label: 'Undo', fn: () => setTasks((list) => [...list, task]) });
      },
      duplicate(id) {
        setTasks((list) => {
          const t = list.find((x) => x.id === id);
          if (!t) return list;
          return [...list, { ...t, id: uid(), done: false, order: (t.order ?? 0) + 0.5 }];
        });
      },
      move(id, date, beforeId) {
        const target = date ?? null;
        setTasks((list) => {
          const task = list.find((t) => t.id === id);
          if (!task) return list;
          const rest = list.filter((t) => t.id !== id);
          const lane = rest.filter((t) => t.date === target).sort(byOrder);
          let idx = beforeId ? lane.findIndex((t) => t.id === beforeId) : -1;
          if (idx < 0) idx = lane.length;
          lane.splice(idx, 0, { ...task, date: target });
          const orders = new Map(lane.map((t, i) => [t.id, i]));
          return [...rest.filter((t) => t.date !== target), ...lane].map((t) =>
            orders.has(t.id) ? { ...t, order: orders.get(t.id) } : t,
          );
        });
      },
      pushDay(key) {
        relocate((t) => t.date === key && !t.done, (t) => shiftKey(t.date, 1), 'pushed to the next day');
      },
      rollOverdue() {
        const t0 = toKey(new Date());
        relocate((t) => t.date && t.date < t0 && !t.done, () => t0, 'rolled over to today');
      },
      pushWeek() {
        const set = new Set(dayKeys);
        relocate((t) => set.has(t.date) && !t.done, (t) => shiftKey(t.date, 7), 'pushed to next week');
      },
      addCategory({ name, color }) {
        const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cat'}-${uid().slice(0, 4)}`;
        setState((s) => ({
          ...s,
          categories: [...s.categories, { id, name, short: name.split(/[\s(/]/)[0] || name, color, keywords: [] }],
        }));
        notify(`Category “${name}” added`);
      },
      updateCategory(id, patch) {
        setState((s) => ({
          ...s,
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...patch, ...(patch.name !== undefined && !c.builtin ? { short: patch.name.split(/[\s(/]/)[0] || patch.name } : {}) } : c,
          ),
        }));
      },
      removeCategory(id) {
        setState((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
          tasks: s.tasks.map((t) => (t.category === id ? { ...t, category: null } : t)),
        }));
      },
      setTargets(patch) {
        setState((s) => ({ ...s, targets: { ...s.targets, ...patch } }));
      },
      setTheme(next) {
        setState((s) => ({ ...s, theme: next }));
      },
      exportData() {
        downloadJSON(stateRef.current, `paperweek-backup-${toKey(new Date())}.json`);
        notify('Backup downloaded');
      },
      importData(file) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const next = normalizeState(JSON.parse(String(reader.result)));
            setState(next);
            notify(`Imported ${next.tasks.length} tasks`);
          } catch {
            notify('That file isn’t a valid Paperweek backup');
          }
        };
        reader.readAsText(file);
      },
      resetDemo() {
        setState((s) => ({ ...s, tasks: buildMockTasks(), weekOffset: 0 }));
        notify('Demo data loaded');
      },
      clearAll() {
        setState((s) => ({ ...createEmptyState(s.theme), categories: s.categories, targets: s.targets }));
        notify('All tasks cleared');
      },
    };
  }, [setState, notify, dayKeys]);

  const jumpToTask = useCallback(
    (t) => {
      if (t.date) setWeekOffset(weekOffsetFor(fromKey(t.date), fromKey(today)));
      else setSomedayOpen(true);
      flash(t.id);
    },
    [setWeekOffset, today, flash],
  );

  /* ---------------------------------------------------------------- */
  /* Keyboard shortcuts                                                */
  /* ---------------------------------------------------------------- */
  const overlayOpen = analyticsOpen || settingsOpen || quickOpen;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickOpen((o) => !o);
        return;
      }
      const el = e.target;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey || overlayOpen) return;
      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          setWeekOffset(0);
          setComposing(toKey(new Date()));
          break;
        case 't':
        case 'T':
          setWeekOffset(0);
          break;
        case 'ArrowLeft':
          setWeekOffset((o) => o - 1);
          break;
        case 'ArrowRight':
          setWeekOffset((o) => o + 1);
          break;
        case 'a':
        case 'A':
          setAnalyticsOpen(true);
          break;
        case 'm':
        case 'M':
          setMonthOpen((o) => !o);
          break;
        case 's':
        case 'S':
          setSomedayOpen((o) => !o);
          break;
        case 'd':
        case 'D':
          setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
          break;
        case 'Escape':
          setComposing(null);
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlayOpen, setWeekOffset, setState]);

  /* ---------------------------------------------------------------- */
  /* Derived                                                           */
  /* ---------------------------------------------------------------- */
  const weekTotals = useMemo(() => {
    const set = new Set(dayKeys);
    const list = tasks.filter((t) => set.has(t.date));
    const done = list.filter((t) => t.done);
    return { total: sumHours(list), completed: sumHours(done), count: list.length, doneCount: done.length };
  }, [tasks, dayKeys]);

  const overdueCount = useMemo(() => tasks.filter((t) => t.date && t.date < today && !t.done).length, [tasks, today]);

  const ctx = { categories, catMap, actions, drag, setDrag, highlight, today, composing, setComposing };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        weekStart={weekStart}
        weekEnd={addDays(weekStart, 6)}
        weekOffset={weekOffset}
        weekTotals={weekTotals}
        onPrev={() => setWeekOffset((o) => o - 1)}
        onNext={() => setWeekOffset((o) => o + 1)}
        onToday={() => setWeekOffset(0)}
        theme={theme}
        onTheme={() => actions.setTheme(theme === 'dark' ? 'light' : 'dark')}
        somedayOpen={somedayOpen}
        onSomeday={() => setSomedayOpen((o) => !o)}
        onAnalytics={() => setAnalyticsOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onSearch={() => setQuickOpen(true)}
        onRollOverdue={actions.rollOverdue}
        onPushWeek={actions.pushWeek}
        overdueCount={overdueCount}
      />

      <MonthDrawer
        open={monthOpen}
        onToggle={() => setMonthOpen((o) => !o)}
        tasks={tasks}
        catMap={catMap}
        anchorDate={addDays(weekStart, 3)}
        today={today}
        weekKeys={dayKeys}
        onOpenWeek={(k) => setWeekOffset(weekOffsetFor(fromKey(k), fromKey(today)))}
      />

      <main className="flex flex-1 items-start px-4 pb-16 sm:px-6 lg:pl-8">
        <WeekView
          days={days}
          dayKeys={dayKeys}
          tasks={tasks}
          today={today}
          ctx={ctx}
          compact={somedayOpen && isDesktop}
        />
        <SomedaySidebar
          open={somedayOpen}
          onClose={() => setSomedayOpen(false)}
          tasks={tasks}
          ctx={ctx}
          isDesktop={isDesktop}
        />
      </main>

      <footer className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 pb-6 text-[11px] text-ink-400 dark:text-stone-500 md:flex">
        <span className="flex items-center gap-1.5"><Kbd>N</Kbd> new task</span>
        <span className="flex items-center gap-1.5"><Kbd>T</Kbd> today</span>
        <span className="flex items-center gap-1.5"><Kbd>←</Kbd><Kbd>→</Kbd> weeks</span>
        <span className="flex items-center gap-1.5"><Kbd>⌘K</Kbd> search & add</span>
        <span className="flex items-center gap-1.5"><Kbd>A</Kbd> analytics</span>
        <span className="flex items-center gap-1.5"><Kbd>M</Kbd> month</span>
        <span className="flex items-center gap-1.5"><Kbd>S</Kbd> someday</span>
        <span className="flex items-center gap-1.5"><Kbd>D</Kbd> theme</span>
      </footer>

      <AnalyticsModal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        tasks={tasks}
        categories={categories}
        catMap={catMap}
        weekStart={weekStart}
        today={today}
        targets={targets}
      />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} state={state} actions={actions} />
      <QuickAdd
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        tasks={tasks}
        categories={categories}
        catMap={catMap}
        today={today}
        onAdd={(date, raw) => {
          const id = actions.add(date, raw);
          if (date) setWeekOffset(weekOffsetFor(fromKey(date), fromKey(today)));
          else setSomedayOpen(true);
          if (id) flash(id);
        }}
        onJump={jumpToTask}
      />
      <Toast toast={toast} onDone={clearToast} />
    </div>
  );
}
