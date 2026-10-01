import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { fmtHours, hexA, parseTaskInput } from '../utils/helpers.js';
import { Dot } from './ui.jsx';

/**
 * Inline, frictionless task input.
 * Enter adds (and stays open for rapid entry), Tab cycles the category, Esc closes.
 */
export default function Composer({
  categories,
  catMap,
  onSubmit,
  onClose,
  placeholder = 'New task… try "Record reel 1.5h"',
  persistent = false,
  autoFocus = true,
}) {
  const [value, setValue] = useState('');
  const [override, setOverride] = useState(undefined);
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const parsed = useMemo(() => parseTaskInput(value, categories), [value, categories]);
  const catId = override !== undefined ? override : parsed.category;
  const cat = catId ? catMap[catId] : null;

  const submit = (close = false) => {
    if (!value.trim()) {
      if (!persistent || close) onClose?.();
      return;
    }
    onSubmit(value, override);
    setValue('');
    setOverride(undefined);
    if (close && !persistent) onClose?.();
  };

  const cycle = (dir) => {
    const ids = [null, ...categories.map((c) => c.id)];
    const i = ids.indexOf(catId ?? null);
    setOverride(ids[(i + dir + ids.length) % ids.length]);
  };

  return (
    <div className="border-b border-rule py-2 dark:border-white/[0.07]">
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setValue('');
            onClose?.();
          } else if (e.key === 'Tab' && value.trim()) {
            e.preventDefault();
            cycle(e.shiftKey ? -1 : 1);
          }
        }}
        onBlur={() => submit(true)}
        placeholder={placeholder}
        aria-label="New task"
        className="w-full bg-transparent text-[13.5px] leading-snug outline-none placeholder:text-ink-400/80 dark:placeholder:text-stone-600"
      />
      {value.trim() && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-400 dark:text-stone-500">
          <span
            className="chip"
            style={{
              background: cat ? hexA(cat.color, 0.16) : 'rgba(138,138,147,0.12)',
              color: cat ? cat.color : undefined,
            }}
          >
            <Dot color={cat ? cat.color : '#8A8A93'} className="h-1.5 w-1.5" />
            {cat ? cat.short || cat.name : 'No tag'}
          </span>
          {parsed.hasDuration && (
            <span className="chip bg-black/[0.04] dark:bg-white/[0.06]">
              <Clock className="h-3 w-3" />
              {fmtHours(parsed.hours)}
            </span>
          )}
          <span className="ml-auto hidden xl:inline">⇥ tag · ↵ add</span>
        </div>
      )}
    </div>
  );
}
