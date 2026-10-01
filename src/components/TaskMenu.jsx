import { ArrowRight, CalendarPlus, Check, Copy, Inbox, Minus, Plus, Trash2 } from 'lucide-react';
import { fmtHours, round, shiftKey } from '../utils/helpers.js';
import { Dot, Popover } from './ui.jsx';

const QUICK = [0.25, 0.5, 1, 2];

export default function TaskMenu({ anchor, onClose, task, ctx }) {
  const { categories, actions, today } = ctx;
  const d = Number(task.duration) || 0;
  const set = (patch) => actions.update(task.id, patch);
  const run = (fn) => () => {
    fn();
    onClose();
  };

  return (
    <Popover anchor={anchor} onClose={onClose} width={252}>
      <div className="border-b border-rule p-3 dark:border-white/10">
        <div className="eyebrow mb-2">Duration</div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn-outline h-8 w-8 p-0"
            aria-label="Decrease 15 minutes"
            onClick={() => set({ duration: Math.max(0, round(d - 0.25)) })}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 text-center font-serif text-2xl leading-none tabular-nums">
            {fmtHours(d, { zero: '—' })}
          </div>
          <button
            type="button"
            className="btn-outline h-8 w-8 p-0"
            aria-label="Increase 15 minutes"
            onClick={() => set({ duration: Math.min(24, round(d + 0.25)) })}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {QUICK.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => set({ duration: h })}
              className={`rounded-md py-1 text-[11.5px] font-medium transition-colors ${
                d === h
                  ? 'bg-ink-900 text-paper dark:bg-stone-100 dark:text-night'
                  : 'bg-black/[0.04] text-ink-600 hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-stone-300 dark:hover:bg-white/10'
              }`}
            >
              {fmtHours(h)}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-thin max-h-52 overflow-y-auto p-1.5">
        <div className="eyebrow px-2.5 pb-1 pt-1">Category</div>
        {categories.map((c) => (
          <button key={c.id} type="button" className="menu-item" onClick={run(() => set({ category: c.id }))}>
            <Dot color={c.color} />
            <span className="flex-1 truncate">{c.name}</span>
            {task.category === c.id && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
        <button type="button" className="menu-item" onClick={run(() => set({ category: null }))}>
          <Dot color="transparent" className="h-2 w-2 border border-ink-400" />
          <span className="flex-1">No category</span>
          {!task.category && <Check className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="border-t border-rule p-1.5 dark:border-white/10">
        {task.date ? (
          <>
            <button
              type="button"
              className="menu-item"
              onClick={run(() => actions.move(task.id, shiftKey(task.date, 1), null))}
            >
              <ArrowRight className="h-3.5 w-3.5" /> Move to next day
            </button>
            <button type="button" className="menu-item" onClick={run(() => actions.move(task.id, null, null))}>
              <Inbox className="h-3.5 w-3.5" /> Move to Someday
            </button>
          </>
        ) : (
          <button type="button" className="menu-item" onClick={run(() => actions.move(task.id, today, null))}>
            <CalendarPlus className="h-3.5 w-3.5" /> Schedule for today
          </button>
        )}
        <button type="button" className="menu-item" onClick={run(() => actions.duplicate(task.id))}>
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </button>
        <button
          type="button"
          className="menu-item !text-accent hover:!bg-accent/10"
          onClick={run(() => actions.remove(task.id))}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </Popover>
  );
}
