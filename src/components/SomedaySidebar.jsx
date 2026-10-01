import { useMemo } from 'react';
import { Inbox, X } from 'lucide-react';
import { byOrder, fmtHours, sumHours } from '../utils/helpers.js';
import { IconButton } from './ui.jsx';
import TaskList from './TaskList.jsx';

function Body({ list, ctx, onClose }) {
  return (
    <div className="flex flex-col">
      <header className="flex items-end justify-between pb-2">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <Inbox className="h-3 w-3" /> Backlog
          </div>
          <div className="mt-1 font-serif text-[34px] italic leading-[0.85]">Someday</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="chip bg-black/[0.04] tabular-nums text-ink-600 dark:bg-white/[0.05] dark:text-stone-400">
            {list.length} · {fmtHours(sumHours(list))}
          </span>
          <IconButton label="Close Someday" onClick={onClose} className="!h-7 !w-7">
            <X className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </header>
      <div className="h-[2px] bg-ink-900 dark:bg-stone-300/80" />
      <p className="py-2 text-[11.5px] leading-snug text-ink-400 dark:text-stone-500">
        Ideas without a date. Drag onto any day — or use a task’s menu to schedule it.
      </p>
      <TaskList
        listKey={null}
        tasks={list}
        ctx={ctx}
        minLines={6}
        persistentComposer
        placeholder="Capture an idea…"
      />
    </div>
  );
}

export default function SomedaySidebar({ open, onClose, tasks, ctx, isDesktop }) {
  const list = useMemo(() => tasks.filter((t) => !t.date).sort(byOrder), [tasks]);
  if (!open) return null;

  if (isDesktop) {
    return (
      <aside className="w-64 shrink-0 xl:w-72">
        <div className="scroll-thin sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pb-6 pl-4 pr-1">
          <Body list={list} ctx={ctx} onClose={onClose} />
        </div>
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-30">
      <div className="absolute inset-0 animate-fade bg-[#1A1A1F]/25 dark:bg-black/60" onClick={onClose} />
      <aside className="scroll-thin absolute inset-y-0 right-0 w-[88%] max-w-sm animate-slide overflow-y-auto border-l border-rule bg-paper px-5 pb-10 pt-6 dark:border-white/10 dark:bg-night-2">
        <Body list={list} ctx={ctx} onClose={onClose} />
      </aside>
    </div>
  );
}
