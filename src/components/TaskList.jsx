import { Fragment } from 'react';
import { SOMEDAY } from '../utils/helpers.js';
import Composer from './Composer.jsx';
import TaskItem from './TaskItem.jsx';

function DropLine() {
  return <div className="relative z-10 -my-px h-[2px] rounded-full bg-accent" />;
}

/**
 * A ruled "paper" list used by every day column and by the Someday drawer.
 * listKey is a yyyy-MM-dd date, or null for Someday.
 */
export default function TaskList({ listKey, tasks, ctx, minLines = 8, placeholder, persistentComposer = false }) {
  const { drag, setDrag, actions, composing, setComposing, categories, catMap } = ctx;
  const dropKey = listKey ?? SOMEDAY;
  const isComposing = persistentComposer || composing === dropKey;
  const over = drag && drag.overKey === dropKey;
  const fillers = Math.max(1, minLines - tasks.length - (isComposing ? 1 : 0));

  const onDragOver = (e) => {
    if (!drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (drag.overKey !== dropKey || drag.beforeId !== null) {
      setDrag((d) => (d ? { ...d, overKey: dropKey, beforeId: null } : d));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const id = drag?.id || e.dataTransfer.getData('text/plain');
    if (!id) return;
    const before = drag && drag.overKey === dropKey ? drag.beforeId : null;
    if (before !== id) actions.move(id, listKey, before);
    setDrag(null);
  };

  const showLine = (beforeId) => over && drag.beforeId === beforeId && beforeId !== drag.id;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-sm transition-colors ${over ? 'bg-black/[0.025] dark:bg-white/[0.025]' : ''}`}
    >
      {persistentComposer && (
        <Composer
          categories={categories}
          catMap={catMap}
          persistent
          autoFocus={false}
          placeholder={placeholder}
          onSubmit={(raw, cat) => actions.add(listKey, raw, cat)}
        />
      )}
      {tasks.map((t, i) => (
        <Fragment key={t.id}>
          {showLine(t.id) && <DropLine />}
          <TaskItem task={t} nextId={tasks[i + 1]?.id ?? null} dropKey={dropKey} ctx={ctx} />
        </Fragment>
      ))}
      {over && drag.beforeId === null && <DropLine />}
      {isComposing && !persistentComposer && (
        <Composer
          categories={categories}
          catMap={catMap}
          placeholder={placeholder}
          onSubmit={(raw, cat) => actions.add(listKey, raw, cat)}
          onClose={() => setComposing((c) => (c === dropKey ? null : c))}
        />
      )}
      {Array.from({ length: fillers }, (_, i) => (
        <button
          key={i}
          type="button"
          tabIndex={i === 0 ? 0 : -1}
          aria-label={i === 0 ? 'Add a task' : undefined}
          onClick={() => setComposing(dropKey)}
          className="block h-[38px] w-full cursor-text border-b border-rule dark:border-white/[0.07]"
        />
      ))}
    </div>
  );
}
