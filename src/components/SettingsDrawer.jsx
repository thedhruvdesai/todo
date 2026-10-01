import { useRef, useState } from 'react';
import { Download, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { PRESET_COLORS } from '../utils/helpers.js';
import { Drawer, Kbd, Segmented } from './ui.jsx';

function Section({ title, hint, children }) {
  return (
    <section className="border-t border-rule py-5 first:border-t-0 dark:border-white/10">
      <h3 className="eyebrow">{title}</h3>
      {hint && <p className="mt-1 text-[12px] leading-snug text-ink-400 dark:text-stone-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function NumberField({ value, onChange, suffix, label }) {
  return (
    <label className="flex items-center gap-1.5 rounded-lg border border-rule bg-white/70 px-2 py-1 dark:border-white/10 dark:bg-white/[0.04]">
      <input
        type="number"
        min="0"
        step="0.5"
        aria-label={label}
        value={value ?? 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-10 bg-transparent text-right text-[12.5px] tabular-nums outline-none"
      />
      <span className="text-[11px] text-ink-400">{suffix}</span>
    </label>
  );
}

const SHORTCUTS = [
  ['N', 'New task on today'],
  ['T', 'Jump to this week'],
  ['← →', 'Previous / next week'],
  ['⌘/Ctrl K', 'Search & quick add'],
  ['A', 'Analytics'],
  ['M', 'Month drawer'],
  ['S', 'Someday backlog'],
  ['D', 'Toggle dark mode'],
  ['Tab', 'Cycle category while typing'],
];

export default function SettingsDrawer({ open, onClose, state, actions }) {
  const { categories, targets, theme } = state;
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[5]);
  const fileRef = useRef(null);

  const addCategory = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    actions.addCategory({ name: name.trim(), color });
    setName('');
    setColor(PRESET_COLORS[(PRESET_COLORS.indexOf(color) + 3) % PRESET_COLORS.length]);
  };

  return (
    <Drawer open={open} onClose={onClose} title="Settings">
      <Section title="Appearance">
        <Segmented
          value={theme}
          onChange={actions.setTheme}
          options={[
            { value: 'light', label: 'Paper' },
            { value: 'dark', label: 'Charcoal' },
          ]}
        />
      </Section>

      <Section title="Daily & weekly targets" hint="Used by the analytics dashboard. Productive = Creator, Business, Shift, Study, Coding and Jobs.">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span>Sleep per night</span>
            <NumberField label="Sleep per night" value={targets.sleepPerDay} suffix="h" onChange={(v) => actions.setTargets({ sleepPerDay: v })} />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span>Productive hours per week</span>
            <NumberField label="Productive hours per week" value={targets.weeklyProductive} suffix="h" onChange={(v) => actions.setTargets({ weeklyProductive: v })} />
          </div>
        </div>
      </Section>

      <Section title="Categories" hint="Tweak colours, names and weekly targets. Type a category name followed by a colon (e.g. “Business: …”) or a #tag to file a task instantly.">
        <ul className="space-y-1.5">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <label className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/15" style={{ background: c.color }} title="Change colour">
                <input
                  type="color"
                  value={c.color}
                  onChange={(e) => actions.updateCategory(c.id, { color: e.target.value })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={`${c.name} colour`}
                />
              </label>
              <input
                value={c.name}
                onChange={(e) => actions.updateCategory(c.id, { name: e.target.value })}
                onBlur={(e) => !e.target.value.trim() && actions.updateCategory(c.id, { name: c.short || 'Untitled' })}
                aria-label="Category name"
                className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-[13px] outline-none hover:bg-black/[0.04] focus:bg-black/[0.04] dark:hover:bg-white/5 dark:focus:bg-white/5"
              />
              <NumberField
                label={`${c.name} weekly target`}
                value={targets.weekly[c.id] || 0}
                suffix="h/wk"
                onChange={(v) => actions.setTargets({ weekly: { ...targets.weekly, [c.id]: v } })}
              />
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete “${c.name}”? Its tasks will become untagged.`)) actions.removeCategory(c.id);
                }}
                aria-label={`Delete ${c.name}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-400 hover:bg-accent/10 hover:text-accent"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addCategory} className="mt-4 rounded-xl border border-dashed border-rule p-3 dark:border-white/15">
          <div className="eyebrow mb-2">New category</div>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Specs business" className="field" />
            <button type="submit" className="btn-solid shrink-0" disabled={!name.trim()}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setColor(p)}
                aria-label={`Colour ${p}`}
                className={`h-5 w-5 rounded-full transition-transform ${color === p ? 'scale-110 ring-2 ring-ink-900 ring-offset-2 ring-offset-paper dark:ring-stone-100 dark:ring-offset-night-2' : ''}`}
                style={{ background: p }}
              />
            ))}
            <label className="relative h-5 w-5 cursor-pointer overflow-hidden rounded-full border border-dashed border-ink-400" title="Custom colour" style={{ background: PRESET_COLORS.includes(color) ? 'transparent' : color }}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Custom colour" />
            </label>
          </div>
        </form>
      </Section>

      <Section title="Backup" hint="Everything is stored in this browser. Export a JSON backup to move it to another device.">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={actions.exportData}>
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) actions.importData(f);
              e.target.value = '';
            }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => window.confirm('Replace everything with fresh demo data?') && actions.resetDemo()}
          >
            <RotateCcw className="h-4 w-4" /> Load demo data
          </button>
          <button
            type="button"
            className="btn-ghost !text-accent hover:!bg-accent/10"
            onClick={() => window.confirm('Delete all tasks? This cannot be undone (export first!).') && actions.clearAll()}
          >
            <Trash2 className="h-4 w-4" /> Clear all tasks
          </button>
        </div>
      </Section>

      <Section title="Keyboard shortcuts">
        <ul className="space-y-1.5">
          {SHORTCUTS.map(([k, d]) => (
            <li key={k} className="flex items-center justify-between text-[12.5px] text-ink-600 dark:text-stone-400">
              <span>{d}</span>
              <Kbd>{k}</Kbd>
            </li>
          ))}
        </ul>
      </Section>
    </Drawer>
  );
}
