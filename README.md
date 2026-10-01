# Paperweek

A tactile, Tweek-style weekly planner with categorical time tracking, a collapsible month review drawer, and an analytics dashboard. Built with **Vite + React 18 + Tailwind CSS 3 + lucide-react + date-fns**. All data lives in `localStorage` — no backend.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the build locally
```

## Deploy to Netlify

`netlify.toml` is already configured (build `npm run build`, publish `dist`, Node 20).

1. Push this folder to a GitHub repo.
2. Netlify → **Add new site → Import from Git** → pick the repo → **Deploy**.

Or drag-and-drop the `dist/` folder onto Netlify Drop after running `npm run build`.

## Features

**Weekly canvas** — Monday-to-Sunday ruled-paper columns with a logged-hours badge and a completion line per day. Click any line to type; `Enter` adds and keeps the input open for rapid entry.

**Natural-language entry**
| You type | Result |
|---|---|
| `Creator: Record reel 1.5h` | "Record reel", Creator, 1.5 h |
| `React study 45m` | "React study", Coding (keyword), 45 min |
| `Sleep 7.5h` | "Sleep", Sleep / Rest, 7.5 h |
| `#business Invoice run 1h 30m` | "Invoice run", Business, 1.5 h |

Durations accept `h`, `hr`, `hours`, `m`, `min`, `1h30m`, `1h 30m`. Category comes from a `Name:` prefix, a `#tag`, or the earliest matching keyword. Press `Tab` while typing to cycle the category.

**Organising** — drag tasks to reorder or move between days and the **Someday** backlog. Each task's `•••` menu (works on touch) sets duration, category, moves, duplicates or deletes (with undo). Click a title to edit inline.

**Push forward** — header `↪` menu: roll overdue tasks to today, or push this week's unfinished to next week. Hover a day for a per-day push button.

**Month drawer** — collapsed: month summary + daily sparkline. Expanded (`M`): heat-tinted calendar; click a day to review its completed tasks, time and category split.

**Analytics** (`A`) — This Week / This Month toggle, KPI cards, donut (done vs planned), per-category planned/done bars with target markers, 24-hour balance chart (rest / logged awake / unlogged), and target-vs-actual progress. Targets are edited in Settings.

**Settings** — paper/charcoal theme, sleep and weekly productive targets, per-category weekly targets, add/rename/recolour/delete categories, JSON export/import, reload demo data, clear all.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `N` | New task on today |
| `T` | Jump to this week |
| `←` / `→` | Previous / next week |
| `⌘K` / `Ctrl+K` | Search & quick add |
| `A` | Analytics |
| `M` | Month drawer |
| `S` | Someday backlog |
| `D` | Toggle dark mode |

## Project structure

```
src/
├── App.jsx                    # state, actions, shortcuts, layout
├── main.jsx · index.css
├── hooks/usePersistentState.js  # localStorage state, today key, media query
├── utils/helpers.js           # categories, NL parser, stats, mock data, normalisation
└── components/
    ├── Header.jsx             # month title, week nav, toolbar, push menu
    ├── MonthDrawer.jsx        # collapsible calendar + day review
    ├── WeekView.jsx · DayColumn.jsx
    ├── TaskList.jsx           # ruled list + drag/drop zone (days & Someday)
    ├── TaskItem.jsx · TaskMenu.jsx · Composer.jsx
    ├── SomedaySidebar.jsx
    ├── AnalyticsModal.jsx
    ├── SettingsDrawer.jsx · QuickAdd.jsx · Toast.jsx
    └── ui.jsx                 # Popover, Modal, Drawer, Segmented, IconButton…
```

## Data model

```js
task = { id, title, duration /* hours */, category /* id | null */, done, date /* 'yyyy-MM-dd' | null = Someday */, order }
```

State is saved under the `paperweek:v1` key. Imports are validated and normalised, so older or hand-edited backups load safely.

## Notes

- First load seeds five weeks of realistic demo data (so month view and analytics are populated) plus a Someday backlog. Settings → **Clear all tasks** starts fresh.
- Drag-and-drop uses native HTML5 DnD (desktop). On touch devices, use the task menu to move tasks.
