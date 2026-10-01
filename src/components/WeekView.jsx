import { useMemo } from 'react';
import { byOrder } from '../utils/helpers.js';
import DayColumn from './DayColumn.jsx';

export default function WeekView({ days, dayKeys, tasks, today, ctx, compact }) {
  const byDay = useMemo(() => {
    const m = Object.fromEntries(dayKeys.map((k) => [k, []]));
    for (const t of tasks) if (t.date && m[t.date]) m[t.date].push(t);
    for (const k of dayKeys) m[k].sort(byOrder);
    return m;
  }, [tasks, dayKeys]);

  return (
    <div
      className={`grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 ${
        compact ? '2xl:grid-cols-7' : 'xl:grid-cols-7'
      }`}
    >
      {days.map((d, i) => {
        const k = dayKeys[i];
        return (
          <DayColumn
            key={k}
            date={d}
            dateKey={k}
            tasks={byDay[k]}
            isToday={k === today}
            isPast={k < today}
            ctx={ctx}
          />
        );
      })}
    </div>
  );
}
