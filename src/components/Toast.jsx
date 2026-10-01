import { useEffect } from 'react';

export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(onDone, toast.action ? 5000 : 2600);
    return () => clearTimeout(id);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={toast.id}
        className="pointer-events-auto flex animate-rise items-center gap-3 rounded-full bg-ink-900 py-2 pl-4 pr-2 text-[13px] text-paper shadow-xl dark:bg-stone-100 dark:text-night"
      >
        <span>{toast.msg}</span>
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action.fn();
              onDone();
            }}
            className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium hover:bg-white/25 dark:bg-black/10 dark:hover:bg-black/20"
          >
            {toast.action.label}
          </button>
        ) : (
          <span className="w-2" />
        )}
      </div>
    </div>
  );
}
