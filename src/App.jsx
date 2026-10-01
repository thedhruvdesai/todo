import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format } from 'date-fns';
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
  /* Undo / redo history                                               */
  /* ---------------------------------------------------------------- */
  // Snapshots cover the data (tasks, categories, targets) — not view state like week or theme.
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const lastCommit = useRef({ key: null, at: 0 });
  const [history, setHistory] = useState({ undo: 0, redo: 0 });
  const syncHistory = useCallback(
    () => setHistory({ undo: pastRef.current.length, redo: futureRef.current.length }),
    [],
  );
  const snap = (s) => ({ tasks: s.tasks, categories: s.categories, targets: s.targets });
  const applySnap = useCallback(
    (d) => {
      stateRef.current = { ...stateRef.current, ...d };
      setState((s) => ({ ...s, ...d }));
    },
    [setState],
  );

  /** Apply a data change and record it. Rapid edits sharing `key` (typing, ± clicks) merge into one step. */
  const commit = useCallback(
    (fn, key = null) => {
      const prev = stateRef.current;
      const next = fn(prev);
      if (!next || next === prev) return;
      const now = Date.now();
      const merge = key && lastCommit.current.key === key && now - lastCommit.current.at < 1500;
      if (!merge) {
        pastRef.current = [...pastRef.current.slice(-79), snap(prev)];
      }
      futureRef.current = [];
      lastCommit.current = { key, at: now };
      applySnap(snap(next));
      syncHistory();
    },
    [applySnap, syncHistory],
  );

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) {
      notify('Nothing to undo');
      return;
    }
    futureRef.current.push(snap(stateRef.current));
    lastCommit.current = { key: null, at: 0 };
    applySnap(prev);
    syncHistory();
    notify('Undone', { label: 'Redo', fn: () => redoRef.current() });
  }, [applySnap, syncHistory, notify]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) {
      notify('Nothing to redo');
      return;
    }
    pastRef.current.push(snap(stateRef.current));
    lastCommit.current = { key: null, at: 0 };
    applySnap(next);
    syncHistory();
    notify('Redone', { label: 'Undo', fn: () => undoRef.current() });
  }, [applySnap, syncHistory, notify]);
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */
  const actions = useMemo(() => {
    const setTasks = (fn, key) => commit((s) => ({ ...s, tasks: fn(s.tasks) }), key);
    const withUndo = (msg) => notify(msg, { label: 'Undo', fn: () => undoRef.current() });
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
      withUndo(`${movers.length} task${movers.length > 1 ? 's' : ''} ${label}`);
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
        setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)), `update:${id}:${Object.keys(patch).join()}`);
      },
      toggle(id) {
        setTasks((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      },
      remove(id) {
        if (!stateRef.current.tasks.some((t) => t.id === id)) return;
        setTasks((list) => list.filter((t) => t.id !== id));
        withUndo('Task deleted');
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
        const task = stateRef.current.tasks.find((t) => t.id === id);
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
        if (task && task.date !== target) {
          withUndo(target ? `Moved to ${format(fromKey(target), 'EEE d MMM')}` : 'Moved to Someday');
        }
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
        commit((s) => ({
          ...s,
          categories: [...s.categories, { id, name, short: name.split(/[\s(/]/)[0] || name, color, keywords: [] }],
        }));
        withUndo(`Category “${name}” added`);
      },
      updateCategory(id, patch) {
        commit(
          (s) => ({
            ...s,
            categories: s.categories.map((c) =>
              c.id === id ? { ...c, ...patch, ...(patch.name !== undefined && !c.builtin ? { short: patch.name.split(/[\s(/]/)[0] || patch.name } : {}) } : c,
            ),
          }),
          `cat:${id}:${Object.keys(patch).join()}`,
        );
      },
      removeCategory(id) {
        commit((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
          tasks: s.tasks.map((t) => (t.category === id ? { ...t, category: null } : t)),
        }));
        withUndo('Category deleted');
      },
      setTargets(patch) {
        commit((s) => ({ ...s, targets: { ...s.targets, ...patch } }), `targets:${JSON.stringify(Object.keys(patch.weekly || patch))}`);
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
            commit((s) => ({ ...s, tasks: next.tasks, categories: next.categories, targets: next.targets }));
            withUndo(`Imported ${next.tasks.length} tasks`);
          } catch {
            notify('That file isn’t a valid Paperweek backup');
          }
        };
        reader.readAsText(file);
      },
      resetDemo() {
        commit((s) => ({ ...s, tasks: buildMockTasks() }));
        setWeekOffset(0);
        withUndo('Demo data loaded');
      },
      clearAll() {
        commit((s) => ({ ...s, tasks: [] }));
        withUndo('All tasks cleared');
      },
    };
  }, [commit, setState, setWeekOffset, notify, dayKeys]);

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
      // Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z or Ctrl+Y redo (inputs keep their own text undo).
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !typing) {
        const k = e.key.toLowerCase();
        if (k === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if (k === 'y') {
          e.preventDefault();
          redo();
          return;
        }
      }
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
  }, [overlayOpen, setWeekOffset, setState, undo, redo]);

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
        canUndo={history.undo > 0}
        canRedo={history.redo > 0}
        onUndo={undo}
        onRedo={redo}
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
        <span className="flex items-center gap-1.5"><Kbd>⌘Z</Kbd> undo</span>
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
