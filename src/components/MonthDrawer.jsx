import { useEffect, useMemo, useState } from 'react';
import { addMonths, format, getDay, isSameMonth, startOfMonth } from 'date-fns';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { fmtHours, fromKey, getMonthDays, hexA, toKey } from '../utils/helpers.js';
import { Dot, IconButton } from './ui.jsx';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function MonthDrawer({ open, onToggle, tasks, catMap, anchorDate, today, weekKeys, onOpenWeek }) {
  const anchorKey = toKey(startOfMonth(anchorDate));
  const [month, setMonth] = useState(() => startOfMonth(anchorDate));
  const [selected, setSelected] = useState(today);

  useEffect(() => {
    setMonth(fromKey(anchorKey));
  }, [anchorKey]);

  const days = useMemo(() => getMonthDays(month), [month]);
  const keys = useMemo(() => days.map(toKey), [days]);

  const perDay = useMemo(() => {
    const m = Object.fromEntries(keys.map((k) => [k, { total: 0, completed: 0, count: 0, done: 0 }]));
    for (const t of tasks) {
      const r = t.date && m[t.date];
      if (!r) continue;
      const d = Number(t.duration) || 0;
      r.total += d;
      r.count += 1;
      if (t.done) {
        r.completed += d;
        r.done += 1;
      }
    }
    return m;
  }, [tasks, keys]);

  const summary = useMemo(() => {
    let completed = 0;
    let done = 0;
    const byCat = {};
    const keySet = new Set(keys);
    for (const t of tasks) {
      if (!t.done || !keySet.has(t.date)) continue;
      completed += Number(t.duration) || 0;
      done += 1;
      const c = catMap[t.category];
      if (c && !c.rest) byCat[c.id] = (byCat[c.id] || 0) + (Number(t.duration) || 0);
    }
    const topId = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { completed, done, top: topId ? catMap[topId] : null };
  }, [tasks, keys, catMap]);

  const max = Math.max(1, ...keys.map((k) => perDay[k].completed));
  const lead = (getDay(days[0]) + 6) % 7;
  const weekSet = new Set(weekKeys);

  const selTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === selected && t.done)
        .sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0)),
    [tasks, selected],
  );
  const selAll = tasks.filter((t) => t.date === selected);
  const selCompleted = selTasks.reduce((s, t) => s + (Number(t.duration) || 0), 0);
  const selByCat = useMemo(() => {
    const m = {};
    for (const t of selTasks) m[t.category || '_none'] = (m[t.category || '_none'] || 0) + (Number(t.duration) || 0);
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [selTasks]);

  return (
    <section className="card mx-4 mb-8 sm:mx-6">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left sm:gap-4"
        title="Toggle month overview (M)"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-ink-400" />
        <span className="font-serif text-xl leading-none">{format(month, 'MMMM')}</span>
        <span className="hidden truncate text-[12px] text-ink-600 dark:text-stone-400 sm:inline">
          {fmtHours(summary.completed)} completed · {summary.done} tasks done
          {summary.top && (
            <>
              {' '}· top focus <span style={{ color: summary.top.color }}>{summary.top.short}</span>
            </>
          )}
        </span>
        <span className="flex-1 md:hidden" />
        <div className="hidden h-6 flex-1 items-end gap-[2px] md:flex" aria-hidden>
          {keys.map((k) => (
            <span
              key={k}
              className="flex-1 rounded-[2px]"
              style={{
                height: `${Math.max(10, (perDay[k].completed / max) * 100)}%`,
                background: k === today ? '#C2553B' : 'currentColor',
                opacity: k === today ? 1 : perDay[k].completed ? 0.28 : 0.07,
              }}
            />
          ))}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-6 border-t border-rule px-4 pb-5 pt-4 dark:border-white/[0.07] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
            {/* Calendar */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-serif text-2xl leading-none">
                  {format(month, 'MMMM')} <span className="italic text-ink-400">{format(month, 'yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <IconButton label="Previous month" className="!h-7 !w-7" onClick={() => setMonth((m) => addMonths(m, -1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </IconButton>
                  {!isSameMonth(month, fromKey(today)) && (
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-[12px] font-medium text-ink-600 hover:bg-black/5 dark:text-stone-400 dark:hover:bg-white/10"
                      onClick={() => {
                        setMonth(startOfMonth(fromKey(today)));
                        setSelected(today);
                      }}
                    >
                      Today
                    </button>
                  )}
                  <IconButton label="Next month" className="!h-7 !w-7" onClick={() => setMonth((m) => addMonths(m, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((w, i) => (
                  <div key={i} className="eyebrow pb-1">
                    {w}
                  </div>
                ))}
                {Array.from({ length: lead }, (_, i) => (
                  <div key={`b${i}`} />
                ))}
                {days.map((d, i) => {
                  const k = keys[i];
                  const r = perDay[k];
                  const ratio = r.completed / max;
                  const isSel = k === selected;
                  const isToday = k === today;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelected(k)}
                      aria-pressed={isSel}
                      aria-label={`${format(d, 'EEEE d MMMM')}: ${fmtHours(r.completed)} completed`}
                      className={`relative flex h-11 flex-col items-start justify-between rounded-lg p-1.5 text-left transition-all sm:h-12 ${
                        isSel
                          ? 'ring-[1.5px] ring-ink-900 dark:ring-stone-200'
                          : 'hover:ring-1 hover:ring-rule dark:hover:ring-white/15'
                      } ${weekSet.has(k) && !isSel ? 'bg-black/[0.035] dark:bg-white/[0.04]' : ''}`}
                      style={r.completed ? { backgroundColor: hexA('#C2553B', 0.05 + ratio * 0.24) } : undefined}
                    >
                      <span
                        className={`text-[12px] font-medium leading-none tabular-nums ${
                          isToday
                            ? 'rounded-full bg-accent px-1 py-0.5 text-white'
                            : r.count
                              ? ''
                              : 'text-ink-400 dark:text-stone-600'
                        }`}
                      >
                        {format(d, 'd')}
                      </span>
                      {r.completed > 0 && (
                        <span className="text-[9.5px] leading-none text-ink-600 tabular-nums dark:text-stone-300">
                          {fmtHours(r.completed)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day */}
            <div className="min-w-0">
              <div className="eyebrow">Day review</div>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-serif text-2xl leading-none">{format(fromKey(selected), 'EEEE, d MMMM')}</div>
                <button
                  type="button"
                  onClick={() => onOpenWeek(selected)}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-600 hover:text-ink-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  Open week <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 flex gap-6">
                <div>
                  <div className="font-serif text-4xl leading-none tabular-nums">{fmtHours(selCompleted)}</div>
                  <div className="mt-1 text-[11.5px] text-ink-400">time completed</div>
                </div>
                <div>
                  <div className="font-serif text-4xl leading-none tabular-nums">
                    {selTasks.length}
                    <span className="text-xl text-ink-400">/{selAll.length}</span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-ink-400">tasks done</div>
                </div>
              </div>
              {selCompleted > 0 && (
                <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                  {selByCat.map(([id, h]) => (
                    <span
                      key={id}
                      title={`${catMap[id]?.short || 'Untagged'} · ${fmtHours(h)}`}
                      style={{ width: `${(h / selCompleted) * 100}%`, background: catMap[id]?.color || '#9A9AA3' }}
                    />
                  ))}
                </div>
              )}
              <ul className="scroll-thin mt-3 max-h-52 overflow-y-auto">
                {selTasks.length === 0 && (
                  <li className="py-6 text-center text-[12.5px] text-ink-400">No completed tasks on this day.</li>
                )}
                {selTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2.5 border-b border-rule py-1.5 text-[13px] dark:border-white/[0.07]"
                  >
                    <Dot color={catMap[t.category]?.color || '#9A9AA3'} />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span className="text-[11.5px] tabular-nums text-ink-400">{fmtHours(t.duration, { zero: '—' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
