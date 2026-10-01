import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Clock, CornerDownLeft, Search } from 'lucide-react';
import { fmtHours, fromKey, hexA, parseTaskInput, shiftKey } from '../utils/helpers.js';
import { Dot, Kbd, Modal, Segmented } from './ui.jsx';

export default function QuickAdd({ open, onClose, tasks, categories, catMap, today, onAdd, onJump }) {
  const [q, setQ] = useState('');
  const [target, setTarget] = useState('today');
  const [sel, setSel] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(-1);
      setTarget('today');
      setTimeout(() => ref.current?.focus(), 30);
    }
  }, [open]);

  const parsed = useMemo(() => parseTaskInput(q, categories), [q, categories]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return tasks
      .filter((t) => t.title.toLowerCase().includes(s))
      .sort((a, b) => (b.date || '9999').localeCompare(a.date || '9999'))
      .slice(0, 7);
  }, [q, tasks]);

  const dateFor = (t) => (t === 'today' ? today : t === 'tomorrow' ? shiftKey(today, 1) : null);
  const cat = parsed.category ? catMap[parsed.category] : null;

  const submit = () => {
    if (sel >= 0 && results[sel]) {
      onJump(results[sel]);
      onClose();
      return;
    }
    if (!q.trim()) return;
    onAdd(dateFor(target), q);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} position="top" label="Quick add" className="max-w-xl rounded-2xl">
      <div className="flex items-center gap-3 border-b border-rule px-4 py-3 dark:border-white/10">
        <Search className="h-4 w-4 shrink-0 text-ink-400" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSel((s) => Math.min(results.length - 1, s + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSel((s) => Math.max(-1, s - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add a task or search…  e.g. “Business: invoice run 1h”"
          className="w-full bg-transparent py-1 text-[15px] outline-none placeholder:text-ink-400"
        />
        <Kbd>esc</Kbd>
      </div>

      {q.trim() && (
        <div className="border-b border-rule px-4 py-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              setSel(-1);
              submit();
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
              sel === -1 ? 'bg-black/[0.04] dark:bg-white/[0.06]' : ''
            }`}
          >
            <CornerDownLeft className="h-4 w-4 shrink-0 text-ink-400" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px]">
                Add “{parsed.title || cat?.short || q.trim()}”
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-400">
                <span
                  className="chip"
                  style={{ background: cat ? hexA(cat.color, 0.16) : 'rgba(138,138,147,0.12)', color: cat?.color }}
                >
                  <Dot color={cat?.color || '#8A8A93'} className="h-1.5 w-1.5" /> {cat ? cat.short : 'No tag'}
                </span>
                {parsed.hasDuration && (
                  <span className="chip bg-black/[0.04] dark:bg-white/[0.06]">
                    <Clock className="h-3 w-3" /> {fmtHours(parsed.hours)}
                  </span>
                )}
              </span>
            </span>
          </button>
          <div className="mt-2 flex items-center justify-between gap-2 pl-2">
            <span className="text-[11.5px] text-ink-400">Add to</span>
            <Segmented
              value={target}
              onChange={setTarget}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'tomorrow', label: 'Tomorrow' },
                { value: 'someday', label: 'Someday' },
              ]}
            />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <ul className="scroll-thin max-h-72 overflow-y-auto p-2">
          <li className="eyebrow px-2 pb-1 pt-1">Matching tasks</li>
          {results.map((t, i) => {
            const c = catMap[t.category];
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    onJump(t);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[13px] ${
                    sel === i ? 'bg-black/[0.05] dark:bg-white/[0.07]' : ''
                  }`}
                >
                  <Dot color={c?.color || '#9A9AA3'} />
                  <span className={`min-w-0 flex-1 truncate ${t.done ? 'text-ink-400 line-through' : ''}`}>{t.title}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-ink-400">
                    {t.date ? format(fromKey(t.date), 'EEE d MMM') : 'Someday'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!q.trim() && (
        <div className="px-5 py-5 text-[12.5px] leading-relaxed text-ink-600 dark:text-stone-400">
          Type a task and press <Kbd>↵</Kbd>. End with a duration like <b className="font-medium">45m</b> or{' '}
          <b className="font-medium">1.5h</b>; start with <b className="font-medium">Creator:</b> or add{' '}
          <b className="font-medium">#coding</b> to pick a category. Use <Kbd>↑</Kbd> <Kbd>↓</Kbd> to jump to an
          existing task.
        </div>
      )}
    </Modal>
  );
}
