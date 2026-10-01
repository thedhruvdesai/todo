import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { fmtHours, sumHours } from '../utils/helpers.js';
import TaskList from './TaskList.jsx';

export default function DayColumn({ date, dateKey, tasks, isToday, isPast, ctx }) {
  const total = sumHours(tasks);
  const done = sumHours(tasks.filter((t) => t.done));
  const pct = total ? Math.round((done / total) * 100) : 0;
  const unfinished = tasks.filter((t) => !t.done).length;

  return (
    <section className={`group/day flex min-w-0 flex-col ${isPast ? 'opacity-[0.82]' : ''}`} aria-label={format(date, 'EEEE d MMMM')}>
      <header className="relative flex items-end justify-between gap-2 pb-2">
        <button
          type="button"
          onClick={() => ctx.setComposing(dateKey)}
          className="min-w-0 text-left"
          title="Add a task"
        >
          <div className={`eyebrow ${isToday ? '!text-accent' : ''}`}>
            {format(date, 'EEEE')}
            {isToday && <span className="ml-1.5 normal-case tracking-normal">· Today</span>}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`font-serif text-[34px] leading-[0.85] ${isToday ? 'text-accent' : ''}`}>{format(date, 'd')}</span>
            <span className="font-serif text-lg italic leading-none text-ink-400 dark:text-stone-500">{format(date, 'MMM')}</span>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {unfinished > 0 && (
            <button
              type="button"
              onClick={() => ctx.actions.pushDay(dateKey)}
              title={`Push ${unfinished} unfinished to next day`}
              aria-label="Push unfinished tasks to next day"
              className="grid h-6 w-6 place-items-center rounded-md text-ink-400 opacity-0 transition-opacity hover:bg-black/5 hover:text-ink-900 focus:opacity-100 group-hover/day:opacity-100 dark:hover:bg-white/10 dark:hover:text-stone-200 [@media(hover:none)]:opacity-60"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <span
            title={`${fmtHours(done)} done of ${fmtHours(total)} logged`}
            className={`chip tabular-nums ${
              total
                ? 'bg-ink-900 text-paper dark:bg-stone-200 dark:text-night'
                : 'bg-black/[0.04] text-ink-400 dark:bg-white/[0.05] dark:text-stone-500'
            }`}
          >
            {fmtHours(total)}
          </span>
        </div>
      </header>

      <div className="relative h-[2px] bg-ink-900 dark:bg-stone-300/80">
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <TaskList listKey={dateKey} tasks={tasks} ctx={ctx} minLines={9} />
    </section>
  );
}
