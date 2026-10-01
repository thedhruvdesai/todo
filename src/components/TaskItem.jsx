import { memo, useEffect, useRef, useState } from 'react';
import { Check, GripVertical, MoreHorizontal } from 'lucide-react';
import { fmtDurInput, fmtHours, parseTaskInput } from '../utils/helpers.js';
import TaskMenu from './TaskMenu.jsx';

function EditInput({ task, categories, onCommit, onCancel }) {
  const [v, setV] = useState(() => [task.title, fmtDurInput(task.duration)].filter(Boolean).join(' '));
  const ref = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    if (!v.trim()) return onCancel();
    const p = parseTaskInput(v, categories);
    onCommit({
      title: p.title || task.title,
      duration: p.hours,
      ...(p.explicitCategory ? { category: p.category } : {}),
    });
  };

  return (
    <input
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          done.current = true;
          onCancel();
        }
      }}
      aria-label="Edit task"
      className="w-full bg-transparent text-[13.5px] leading-snug outline-none"
    />
  );
}

function TaskItem({ task, nextId, dropKey, ctx }) {
  const { catMap, categories, actions, drag, setDrag, highlight } = ctx;
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(null);
  const cat = task.category ? catMap[task.category] : null;
  const color = cat?.color || '#9A9AA3';
  const dragging = drag?.id === task.id;

  const onDragOver = (e) => {
    if (!drag) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const r = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    const beforeId = after ? nextId : task.id;
    if (drag.overKey !== dropKey || drag.beforeId !== beforeId) {
      setDrag((d) => (d ? { ...d, overKey: dropKey, beforeId } : d));
    }
  };

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        // Defer the re-render: mutating the DOM inside dragstart makes Chrome cancel the drag.
        requestAnimationFrame(() => setDrag({ id: task.id, overKey: dropKey, beforeId: task.id }));
      }}
      onDragEnd={() => setDrag(null)}
      onDragOver={onDragOver}
      className={`group relative flex min-h-[38px] items-start gap-2.5 border-b border-rule py-2 transition-opacity dark:border-white/[0.07] ${
        dragging ? 'opacity-30' : ''
      } ${highlight === task.id ? 'animate-flash rounded' : ''}`}
    >
      <GripVertical
        aria-hidden
        className="absolute -left-[15px] top-[11px] hidden h-3.5 w-3.5 cursor-grab text-ink-400 opacity-0 transition-opacity group-hover:opacity-70 lg:block"
      />

      <button
        type="button"
        onClick={() => actions.toggle(task.id)}
        aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
        className="mt-[2px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border-[1.5px] transition-[transform,background-color] duration-200 hover:scale-110 active:scale-90"
        style={{ borderColor: color, backgroundColor: task.done ? color : 'transparent' }}
      >
        {task.done && <Check className="h-2.5 w-2.5 animate-pop text-white" strokeWidth={3.5} />}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <EditInput
            task={task}
            categories={categories}
            onCommit={(patch) => {
              actions.update(task.id, patch);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="block w-full cursor-text text-left text-[13.5px] leading-snug [overflow-wrap:anywhere]"
          >
            <span className={`strike ${task.done ? 'strike-on' : ''}`}>{task.title}</span>
          </button>
        )}
        {!editing && (cat || task.duration > 0) && (
          <div className="mt-[3px] flex items-center gap-2 text-[11px] leading-none text-ink-400 dark:text-stone-500">
            <button
              type="button"
              onClick={(e) => setMenu(e.currentTarget)}
              className="inline-flex items-center gap-1 rounded transition-colors hover:text-ink-900 dark:hover:text-stone-200"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {cat ? cat.short || cat.name : 'Tag'}
            </button>
            {task.duration > 0 && <span className="tabular-nums">{fmtHours(task.duration)}</span>}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Task options"
        onClick={(e) => setMenu(e.currentTarget)}
        className={`-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-400 transition-opacity hover:bg-black/5 hover:text-ink-900 focus:opacity-100 dark:hover:bg-white/10 dark:hover:text-stone-200 [@media(hover:none)]:opacity-60 ${
          menu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menu && <TaskMenu anchor={menu} onClose={() => setMenu(null)} task={task} ctx={ctx} />}
    </div>
  );
}

export default memo(TaskItem);
