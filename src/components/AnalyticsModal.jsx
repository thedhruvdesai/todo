import { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { X } from 'lucide-react';
import { computeStats, fmtHours, fromKey, getMonthDays, getWeekDays, round, toKey } from '../utils/helpers.js';
import { Dot, IconButton, Modal, Segmented } from './ui.jsx';

const NONE = { id: '_none', name: 'Untagged', short: 'Untagged', color: '#9A9AA3' };

function Donut({ segments, total, size = 168, stroke = 20 }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth={stroke} />
      {total > 0 &&
        segments.map((s) => {
          const len = (s.value / total) * C;
          const gap = segments.length > 1 ? Math.min(2, len / 2) : 0;
          const el = (
            <circle
              key={s.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - gap)} ${C}`}
              strokeDashoffset={-acc}
              className="transition-all duration-500"
            >
              <title>{`${s.label}: ${fmtHours(s.value)}`}</title>
            </circle>
          );
          acc += len;
          return el;
        })}
    </svg>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="card px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className="mt-1.5 font-serif text-[32px] leading-none tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-[11.5px] text-ink-400 dark:text-stone-500">{sub}</div>}
    </div>
  );
}

function TargetRow({ label, color, actual, target, unit = 'h' }) {
  const pct = target ? Math.min(100, (actual / target) * 100) : 0;
  const diff = round(actual - target, 2);
  const status =
    target <= 0 ? '' : diff >= 0 ? 'On target' : `${unit === 'h' ? fmtHours(-diff) : `${-diff}${unit}`} to go`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className="flex items-center gap-2">
          {color && <Dot color={color} />}
          {label}
        </span>
        <span className="tabular-nums text-ink-600 dark:text-stone-400">
          <span className="font-medium text-ink-900 dark:text-stone-100">
            {unit === 'h' ? fmtHours(actual) : `${round(actual, 1)}${unit}`}
          </span>{' '}
          / {unit === 'h' ? fmtHours(target) : `${round(target, 1)}${unit}`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: diff >= 0 ? '#63AE78' : color || '#C2553B' }}
        />
      </div>
      <div className={`mt-1 text-[11px] ${diff >= 0 ? 'text-[#4F9A64]' : 'text-ink-400 dark:text-stone-500'}`}>{status}</div>
    </div>
  );
}

export default function AnalyticsModal({ open, onClose, tasks, categories, catMap, weekStart, today, targets }) {
  const [range, setRange] = useState('week');
  const [metric, setMetric] = useState('completed');

  const monthAnchor = addDays(weekStart, 3);
  const keys = useMemo(
    () => (range === 'week' ? getWeekDays(weekStart) : getMonthDays(monthAnchor)).map(toKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, toKey(weekStart)],
  );
  const stats = useMemo(() => computeStats(tasks, keys, categories), [tasks, keys, categories]);
  const scale = keys.length / 7;
  const rangeLabel =
    range === 'week'
      ? `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM')}`
      : format(monthAnchor, 'MMMM yyyy');

  const rows = stats.rows.map((r) => ({ ...r, cat: catMap[r.id] || NONE }));
  const donutTotal = metric === 'completed' ? stats.totalCompleted : stats.totalScheduled;
  const segments = rows
    .filter((r) => r[metric] > 0)
    .sort((a, b) => b[metric] - a[metric])
    .map((r) => ({ id: r.id, value: r[metric], color: r.cat.color, label: r.cat.short }));
  const barMax = Math.max(
    1,
    ...rows.map((r) => Math.max(r.scheduled, (targets.weekly[r.id] || 0) * scale)),
  );

  const sleepDays = stats.byDay.filter((d) => d.sleep > 0);
  const avgSleep = sleepDays.length ? sleepDays.reduce((s, d) => s + d.sleep, 0) / sleepDays.length : 0;
  const loggedDays = stats.byDay.filter((d) => d.total > 0);
  const avgWaking = loggedDays.length ? loggedDays.reduce((s, d) => s + d.waking, 0) / loggedDays.length : 0;
  const avgFree = loggedDays.length ? loggedDays.reduce((s, d) => s + d.free, 0) / loggedDays.length : 24;
  const chartMax = Math.max(24, ...stats.byDay.map((d) => d.total));
  const sleepColor = catMap.sleep?.color || '#8A9BC9';

  const completion = stats.totalScheduled ? Math.round((stats.totalCompleted / stats.totalScheduled) * 100) : 0;
  const categoryTargets = Object.entries(targets.weekly || {})
    .filter(([id, v]) => v > 0 && catMap[id])
    .map(([id, v]) => ({
      id,
      label: catMap[id].short,
      color: catMap[id].color,
      target: v * scale,
      actual: stats.rows.find((r) => r.id === id)?.completed || 0,
    }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Analytics"
      className="flex max-h-[94vh] max-w-5xl flex-col rounded-t-2xl sm:max-h-[90vh] sm:rounded-2xl"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule px-5 pb-4 pt-5 dark:border-white/10 sm:px-7">
        <div>
          <div className="eyebrow">Time analytics · {rangeLabel}</div>
          <h2 className="mt-1 font-serif text-[38px] leading-none">
            Where the hours <span className="italic text-ink-400">went</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
            ]}
          />
          <IconButton label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      <div className="scroll-thin flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Logged" value={fmtHours(stats.totalScheduled)} sub={`${stats.taskCount} tasks scheduled`} />
          <Stat label="Completed" value={fmtHours(stats.totalCompleted)} sub={`${stats.doneCount} tasks done · ${completion}%`} />
          <Stat
            label="Productive"
            value={fmtHours(stats.productiveCompleted)}
            sub={`of ${fmtHours(targets.weeklyProductive * scale)} target`}
          />
          <Stat label="Avg sleep" value={fmtHours(avgSleep, { zero: '—' })} sub={`target ${fmtHours(targets.sleepPerDay)} / night`} />
        </div>

        {/* Distribution + breakdown */}
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="eyebrow">Distribution</h3>
              <Segmented
                value={metric}
                onChange={setMetric}
                options={[
                  { value: 'completed', label: 'Done' },
                  { value: 'scheduled', label: 'Planned' },
                ]}
              />
            </div>
            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
              <div className="relative shrink-0">
                <Donut segments={segments} total={donutTotal} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-serif text-[30px] leading-none tabular-nums">{fmtHours(donutTotal)}</div>
                  <div className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-ink-400">
                    {metric === 'completed' ? 'completed' : 'planned'}
                  </div>
                </div>
              </div>
              <ul className="w-full min-w-0 space-y-1.5">
                {segments.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-[12.5px]">
                    <Dot color={s.color} />
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    <span className="tabular-nums text-ink-400">{Math.round((s.value / donutTotal) * 100)}%</span>
                  </li>
                ))}
                {segments.length === 0 && <li className="text-[12.5px] text-ink-400">Nothing logged yet.</li>}
              </ul>
            </div>
          </section>

          <section className="card p-5 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="eyebrow">By category</h3>
              <div className="flex items-center gap-3 text-[11px] text-ink-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-sm bg-ink-400/30" /> planned
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-sm bg-ink-600 dark:bg-stone-300" /> done
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-[2px] bg-ink-900 dark:bg-stone-100" /> target
                </span>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {rows.length === 0 && <li className="text-[12.5px] text-ink-400">No tasks in this range.</li>}
              {rows.map((r) => {
                const target = (targets.weekly[r.id] || 0) * scale;
                const share = stats.totalCompleted ? Math.round((r.completed / stats.totalCompleted) * 100) : 0;
                return (
                  <li key={r.id}>
                    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <span className="flex min-w-0 items-center gap-2">
                        <Dot color={r.cat.color} />
                        <span className="truncate">{r.cat.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-600 dark:text-stone-400">
                        <span className="font-medium text-ink-900 dark:text-stone-100">{fmtHours(r.completed)}</span>
                        <span className="text-ink-400"> / {fmtHours(r.scheduled)}</span>
                        <span className="ml-2 inline-block w-9 text-right text-ink-400">{share}%</span>
                      </span>
                    </div>
                    <div className="relative mt-1.5 h-2 rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                        style={{ width: `${(r.scheduled / barMax) * 100}%`, background: r.cat.color, opacity: 0.3 }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                        style={{ width: `${(r.completed / barMax) * 100}%`, background: r.cat.color }}
                      />
                      {target > 0 && (
                        <div
                          title={`Target ${fmtHours(target)}`}
                          className="absolute -inset-y-1 w-[2px] rounded bg-ink-900 dark:bg-stone-100"
                          style={{ left: `calc(${(target / barMax) * 100}% - 1px)` }}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* 24-hour balance */}
        <section className="card p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="eyebrow">24-hour daily balance</h3>
              <p className="mt-1 text-[12.5px] text-ink-600 dark:text-stone-400">
                Avg day: <b className="font-medium">{fmtHours(avgSleep, { zero: '0h' })}</b> rest ·{' '}
                <b className="font-medium">{fmtHours(avgWaking)}</b> logged awake ·{' '}
                <b className="font-medium">{fmtHours(avgFree)}</b> unlogged
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-ink-400">
              <span className="flex items-center gap-1.5">
                <Dot color={sleepColor} /> Rest
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ink-600 dark:bg-stone-300" /> Awake, logged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-dashed border-ink-400" /> Unlogged
              </span>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <div className="flex h-44 flex-col justify-between pb-5 text-right text-[10px] tabular-nums text-ink-400">
              <span>{chartMax}h</span>
              <span>{Math.round(chartMax / 2)}h</span>
              <span>0</span>
            </div>
            <div className={`flex h-44 flex-1 items-end ${keys.length > 7 ? 'gap-[3px]' : 'gap-2 sm:gap-4'}`}>
              {stats.byDay.map((d) => {
                const isToday = d.key === today;
                return (
                  <div key={d.key} className="flex h-full min-w-0 flex-1 flex-col items-center">
                    <div
                      className="relative flex w-full flex-1 flex-col-reverse overflow-hidden rounded-md border border-dashed border-ink-400/30"
                      title={`${format(fromKey(d.key), 'EEE d MMM')} — rest ${fmtHours(d.sleep)}, awake ${fmtHours(d.waking)}, unlogged ${fmtHours(d.free)}`}
                    >
                      <div style={{ height: `${(d.sleep / chartMax) * 100}%`, background: sleepColor }} />
                      <div className="bg-ink-600 dark:bg-stone-300" style={{ height: `${(d.waking / chartMax) * 100}%` }} />
                    </div>
                    <div
                      className={`mt-1.5 h-3.5 text-[10px] leading-none tabular-nums ${
                        isToday ? 'font-semibold text-accent' : 'text-ink-400'
                      }`}
                    >
                      {keys.length > 7
                        ? Number(d.key.slice(8)) % 5 === 1 || isToday
                          ? Number(d.key.slice(8))
                          : ''
                        : format(fromKey(d.key), 'EEEEE')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Targets */}
        <section className="card p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="eyebrow">Target vs actual</h3>
            <span className="text-[11px] text-ink-400">
              {range === 'month' ? 'Weekly targets pro-rated to the month' : 'Weekly targets'} · edit in Settings
            </span>
          </div>
          <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <TargetRow label="Sleep per night (avg)" color={sleepColor} actual={avgSleep} target={targets.sleepPerDay} />
            <TargetRow
              label="Productive hours"
              color="#C2553B"
              actual={stats.productiveCompleted}
              target={targets.weeklyProductive * scale}
            />
            {categoryTargets.map((t) => (
              <TargetRow key={t.id} label={t.label} color={t.color} actual={t.actual} target={t.target} />
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
