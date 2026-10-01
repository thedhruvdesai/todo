import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function IconButton({ label, active = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
        active
          ? 'bg-black/[0.06] text-ink-900 dark:bg-white/10 dark:text-stone-100'
          : 'text-ink-600 hover:bg-black/5 hover:text-ink-900 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-stone-100'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Dot({ color, className = 'h-2 w-2' }) {
  return <span className={`inline-block shrink-0 rounded-full ${className}`} style={{ background: color }} />;
}

function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}

function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Floating menu anchored to an element, rendered in a portal so it never gets clipped. */
export function Popover({ anchor, onClose, width = 248, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const r = anchor.getBoundingClientRect();
    const h = ref.current.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = r.bottom + 6;
    if (top + h > vh - 8) top = Math.max(8, r.top - h - 6);
    const left = Math.min(Math.max(8, r.right - width), vw - width - 8);
    setPos({ top, left: Math.max(8, left) });
  }, [anchor, width]);

  useEffect(() => {
    const down = (e) => {
      if (ref.current?.contains(e.target) || anchor?.contains(e.target)) return;
      onClose();
    };
    const key = (e) => e.key === 'Escape' && onClose();
    const resize = () => onClose();
    document.addEventListener('mousedown', down);
    document.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('keydown', key);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('touchstart', down);
      window.removeEventListener('keydown', key);
      window.removeEventListener('resize', resize);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width }}
      className="z-[60] max-w-[calc(100vw-16px)] animate-rise overflow-hidden rounded-xl border border-rule bg-paper shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-night-3 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]"
    >
      {children}
    </div>,
    document.body,
  );
}

export function Modal({ open, onClose, children, className = '', position = 'center', label }) {
  useEscape(open, onClose);
  useScrollLock(open);
  if (!open) return null;
  return createPortal(
    <div
      className={`fixed inset-0 z-40 flex justify-center sm:p-6 ${
        position === 'top' ? 'items-start p-3 pt-[10vh]' : 'items-end sm:items-center'
      }`}
    >
      <div
        className="absolute inset-0 animate-fade bg-[#1A1A1F]/25 backdrop-blur-[2px] dark:bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative w-full animate-rise border border-rule bg-paper shadow-2xl dark:border-white/10 dark:bg-night-2 ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, width = 'max-w-md' }) {
  useEscape(open, onClose);
  useScrollLock(open);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 animate-fade bg-[#1A1A1F]/25 backdrop-blur-[2px] dark:bg-black/60"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 right-0 flex w-full ${width} animate-slide flex-col border-l border-rule bg-paper dark:border-white/10 dark:bg-night-2`}
      >
        <header className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="font-serif text-[28px] leading-none">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-10">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

export function Segmented({ value, onChange, options, className = '' }) {
  return (
    <div
      className={`inline-flex rounded-lg border border-rule bg-black/[0.03] p-0.5 dark:border-white/10 dark:bg-white/[0.04] ${className}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1 text-[12.5px] font-medium transition-all ${
            value === o.value
              ? 'bg-paper text-ink-900 shadow-sm dark:bg-night-3 dark:text-stone-100'
              : 'text-ink-400 hover:text-ink-900 dark:text-stone-500 dark:hover:text-stone-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Kbd({ children }) {
  return (
    <kbd className="inline-flex min-w-[18px] items-center justify-center rounded border border-rule bg-white/70 px-1 font-sans text-[10px] font-medium text-ink-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-400">
      {children}
    </kbd>
  );
}
