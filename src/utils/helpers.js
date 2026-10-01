import {
  addDays,
  addWeeks,
  differenceInCalendarWeeks,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const STORAGE_KEY = 'paperweek:v1';
export const SOMEDAY = '__someday';

export const DEFAULT_CATEGORIES = [
  { id: 'sleep', name: 'Sleep / Rest', short: 'Sleep', color: '#8A9BC9', rest: true,
    keywords: ['sleep', 'nap', 'rest', 'bed', 'lie in'] },
  { id: 'creator', name: 'Creator (Music / Insta)', short: 'Creator', color: '#D58AB1', productive: true,
    keywords: ['creator', 'reel', 'insta', 'instagram', 'music', 'beat', 'track', 'vocal', 'mix', 'master', 'content', 'post', 'record', 'audio', 'song', 'caption', 'shoot', 'thumbnail'] },
  { id: 'business', name: 'Business', short: 'Business', color: '#C49A3E', productive: true,
    keywords: ['business', 'client', 'invoice', 'strategy', 'proposal', 'meeting', 'consult', 'bookkeeping', 'pricing', 'pitch', 'quote', 'weekly review'] },
  { id: 'work', name: 'Shift / Work', short: 'Shift', color: '#7D8B98', productive: true,
    keywords: ['shift', 'work', 'roster', 'patrol', 'site', 'office'] },
  { id: 'study', name: 'Study & Upskilling', short: 'Study', color: '#5FA39A', productive: true,
    keywords: ['study', 'course', 'lecture', 'class', 'upskill', 'learn', 'exam', 'module', 'tutorial', 'certification'] },
  { id: 'coding', name: 'Skills & Coding Practice', short: 'Coding', color: '#7B88DD', productive: true,
    keywords: ['code', 'coding', 'react', 'typescript', 'javascript', 'leetcode', 'kata', 'debug', 'node', 'refactor', 'deploy', 'build', 'api', 'css', 'git'] },
  { id: 'foodprep', name: 'Food Prep & Cooking', short: 'Food prep', color: '#D38B55',
    keywords: ['cook', 'meal prep', 'prep', 'groceries', 'grocery', 'bake', 'kitchen'] },
  { id: 'meal', name: 'Meal Time', short: 'Meal', color: '#DDB062',
    keywords: ['breakfast', 'brunch', 'lunch', 'dinner', 'meal', 'eat', 'snack', 'coffee break'] },
  { id: 'exercise', name: 'Exercise & Fitness', short: 'Fitness', color: '#63AE78',
    keywords: ['gym', 'run', 'workout', 'exercise', 'walk', 'yoga', 'swim', 'lift', 'cardio', 'stretch', 'push day', 'pull day', 'leg day'] },
  { id: 'travel', name: 'Travel & Commute', short: 'Commute', color: '#9C9A8C',
    keywords: ['commute', 'drive', 'train', 'bus', 'travel', 'flight', 'uber', 'tram'] },
  { id: 'reading', name: 'Reading', short: 'Reading', color: '#A88760',
    keywords: ['read', 'book', 'chapter', 'article', 'newsletter'] },
  { id: 'podcasts', name: 'Podcasts', short: 'Podcasts', color: '#9A80C6',
    keywords: ['podcast', 'episode', 'listen'] },
  { id: 'connect', name: 'Connect & Networking', short: 'Connect', color: '#5A9FC7',
    keywords: ['network', 'linkedin', 'coffee chat', 'catch up', 'catch-up', 'call mum', 'call dad', 'meetup', 'connect', 'friends', 'outreach'] },
  { id: 'jobs', name: 'Job Applications', short: 'Jobs', color: '#C77766', productive: true,
    keywords: ['apply', 'application', 'resume', 'cv', 'cover letter', 'job', 'interview', 'recruiter', 'seek'] },
].map((c) => ({ ...c, builtin: true }));

export const PRESET_COLORS = [
  '#8A9BC9', '#D58AB1', '#C49A3E', '#7D8B98', '#5FA39A', '#7B88DD', '#D38B55',
  '#DDB062', '#63AE78', '#9C9A8C', '#A88760', '#9A80C6', '#5A9FC7', '#C77766',
];

export function defaultTargets() {
  return {
    sleepPerDay: 8,
    weeklyProductive: 40,
    weekly: { creator: 10, business: 10, coding: 14, study: 6, exercise: 5, jobs: 5 },
  };
}

/* ------------------------------------------------------------------ */
/* Small utils                                                         */
/* ------------------------------------------------------------------ */

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);

export const toKey = (d) => format(d, 'yyyy-MM-dd');
export const fromKey = (k) => parseISO(k);
export const shiftKey = (key, n) => toKey(addDays(fromKey(key), n));

export const getWeekStart = (offset = 0, base = new Date()) =>
  addWeeks(startOfWeek(base, { weekStartsOn: 1 }), offset);
export const getWeekDays = (start) => Array.from({ length: 7 }, (_, i) => addDays(start, i));
export const getMonthDays = (date) =>
  eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });
export const weekOffsetFor = (date, base = new Date()) =>
  differenceInCalendarWeeks(date, base, { weekStartsOn: 1 });

export const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
export const sumHours = (list) => list.reduce((s, t) => s + (Number(t.duration) || 0), 0);
export const round = (n, p = 2) => Math.round(n * 10 ** p) / 10 ** p;
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

/** Compact hour formatting: 0.75 → "45m", 1.5 → "1.5h", 8 → "8h". */
export function fmtHours(h, { zero = '0h' } = {}) {
  const n = Number(h) || 0;
  if (n <= 0) return zero;
  if (n < 1) return `${Math.round(n * 60)}m`;
  return `${parseFloat(n.toFixed(2))}h`;
}

/** Duration as it would be typed back into an input. */
export function fmtDurInput(h) {
  const n = Number(h) || 0;
  if (n <= 0) return '';
  if (n < 1) return `${Math.round(n * 60)}m`;
  const whole = Math.floor(n);
  const mins = Math.round((n - whole) * 60);
  if (mins === 0) return `${whole}h`;
  if (mins % 15 === 0) return `${parseFloat(n.toFixed(2))}h`;
  return `${whole}h${mins}m`;
}

export const hexA = (hex, a) => {
  const h = (hex || '#999999').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/* ------------------------------------------------------------------ */
/* Natural-language parsing                                            */
/* ------------------------------------------------------------------ */

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function matchCategoryName(token, categories) {
  const t = String(token || '').trim().toLowerCase();
  if (!t) return null;
  const exact = categories.find((c) =>
    [c.id, c.name, c.short].filter(Boolean).some((n) => n.toLowerCase() === t),
  );
  if (exact) return exact;
  if (t.length < 3) return null;
  return (
    categories.find(
      (c) => c.name.toLowerCase().startsWith(t) || (c.short || '').toLowerCase().startsWith(t),
    ) || null
  );
}

function categoryTerms(c) {
  const terms = [...(c.keywords || [])];
  if (c.short) terms.push(c.short.toLowerCase());
  if (!c.builtin) {
    // Custom categories: let words of their name act as keywords.
    c.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3)
      .forEach((w) => terms.push(w));
  }
  return terms;
}

/** Pick the category whose keyword appears earliest in the title. */
export function detectCategory(title, categories) {
  const lower = String(title || '').toLowerCase();
  let best = null;
  let bestIdx = Infinity;
  for (const c of categories) {
    for (const kw of categoryTerms(c)) {
      const re = new RegExp(`(^|[^a-z0-9])${escapeRe(kw.toLowerCase())}`, 'i');
      const m = re.exec(lower);
      if (m) {
        const idx = m.index + m[1].length;
        if (idx < bestIdx) {
          best = c.id;
          bestIdx = idx;
        }
      }
    }
  }
  return best;
}

const COMBO_RE = /(?:^|\s)(\d+(?:[.,]\d+)?)\s*h(?:ours?|rs?)?\s*(\d{1,3})\s*m(?:in(?:ute)?s?)?\.?$/i;
const SINGLE_RE = /(?:^|\s)(\d+(?:[.,]\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\.?$/i;

/**
 * Parse free text like "Creator: Record reel 1.5h", "React study 45m",
 * "Sleep 7.5h", "#coding Kata 1h 30m".
 */
export function parseTaskInput(raw, categories) {
  let text = String(raw || '').replace(/\s+/g, ' ').trim();
  let hours = 0;
  let hasDuration = false;
  let category = null;
  let explicitCategory = false;

  // #hashtag categories
  text = text
    .replace(/(^|\s)#([\w-]+)/g, (m, sp, tag) => {
      const c = matchCategoryName(tag.replace(/[-_]/g, ' '), categories);
      if (c && !category) {
        category = c.id;
        explicitCategory = true;
        return sp;
      }
      return m;
    })
    .replace(/\s+/g, ' ')
    .trim();

  // Trailing durations
  let m = text.match(COMBO_RE);
  if (m) {
    hours = parseFloat(m[1].replace(',', '.')) + parseInt(m[2], 10) / 60;
    text = text.slice(0, m.index).trim();
    hasDuration = true;
  } else {
    for (let i = 0; i < 2; i++) {
      m = text.match(SINGLE_RE);
      if (!m) break;
      const n = parseFloat(m[1].replace(',', '.'));
      hours += m[2].toLowerCase().startsWith('h') ? n : n / 60;
      text = text.slice(0, m.index).trim();
      hasDuration = true;
    }
  }
  text = text.replace(/\s+(for|·|-|–|—)$/i, '').replace(/[\s:,·\-–—]+$/, '').trim();

  // "Category: title" prefix
  const pm = text.match(/^([^:]{2,32}):\s*(.*)$/);
  if (pm) {
    const c = matchCategoryName(pm[1], categories);
    if (c) {
      if (!category) {
        category = c.id;
        explicitCategory = true;
      }
      text = pm[2].trim();
    }
  }

  if (!category) category = detectCategory(text, categories);

  return {
    title: text,
    hours: round(clamp(hours, 0, 24), 2),
    hasDuration,
    category,
    explicitCategory,
  };
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

export function computeStats(tasks, keys, categories) {
  const keySet = new Set(keys);
  const list = tasks.filter((t) => t.date && keySet.has(t.date));
  const catIndex = new Map(categories.map((c) => [c.id, c]));
  const rows = new Map();
  const ensure = (id) => {
    if (!rows.has(id)) rows.set(id, { id, scheduled: 0, completed: 0, count: 0, doneCount: 0 });
    return rows.get(id);
  };
  let productiveCompleted = 0;
  let productiveScheduled = 0;
  for (const t of list) {
    const id = t.category && catIndex.has(t.category) ? t.category : '_none';
    const r = ensure(id);
    const d = Number(t.duration) || 0;
    r.scheduled += d;
    r.count += 1;
    if (t.done) {
      r.completed += d;
      r.doneCount += 1;
    }
    if (catIndex.get(id)?.productive) {
      productiveScheduled += d;
      if (t.done) productiveCompleted += d;
    }
  }
  const isRest = (t) => !!catIndex.get(t.category)?.rest;
  const byDay = keys.map((k) => {
    const day = list.filter((t) => t.date === k);
    const sleep = sumHours(day.filter(isRest));
    const total = sumHours(day);
    return {
      key: k,
      sleep,
      waking: total - sleep,
      total,
      completed: sumHours(day.filter((t) => t.done)),
      free: Math.max(0, 24 - total),
      count: day.length,
      doneCount: day.filter((t) => t.done).length,
    };
  });
  const rowList = [...rows.values()].sort((a, b) => b.scheduled - a.scheduled);
  return {
    rows: rowList,
    totalScheduled: rowList.reduce((s, r) => s + r.scheduled, 0),
    totalCompleted: rowList.reduce((s, r) => s + r.completed, 0),
    taskCount: list.length,
    doneCount: list.filter((t) => t.done).length,
    productiveCompleted,
    productiveScheduled,
    byDay,
  };
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

// [title, category, hours] for Monday → Sunday
const MOCK_WEEK = [
  [
    ['Sleep', 'sleep', 7.5],
    ['Gym — push day', 'exercise', 1],
    ['Breakfast & coffee', 'meal', 0.5],
    ['React hooks deep-dive', 'coding', 2],
    ['Client call — eyewear site revamp', 'business', 1],
    ['Edit reel: Gold Coast sunset', 'creator', 1.5],
    ['Apply: 3 front-end roles', 'jobs', 1.5],
    ['Dinner', 'meal', 0.75],
    ['Podcast: system design episode', 'podcasts', 0.75],
  ],
  [
    ['Sleep', 'sleep', 7],
    ['Meal prep for the week', 'foodprep', 1.5],
    ['Commute to site', 'travel', 0.5],
    ['Night shift', 'work', 8],
    ['Read: design systems book, ch. 4', 'reading', 0.5],
    ['Draft caption ideas for 3 posts', 'creator', 0.5],
  ],
  [
    ['Sleep', 'sleep', 8],
    ['Morning run', 'exercise', 0.75],
    ['TypeScript generics practice', 'coding', 1.5],
    ['Record vocal take for new track', 'creator', 2],
    ['Invoice clients + bookkeeping', 'business', 1],
    ['Lunch', 'meal', 0.5],
    ['Coffee chat with PM from meetup', 'connect', 1],
    ['Professional Year class', 'study', 3],
  ],
  [
    ['Sleep', 'sleep', 6.5],
    ['Commute', 'travel', 1],
    ['Day shift — patrol', 'work', 8],
    ['Cover letter: SaaS front-end role', 'jobs', 1],
    ['Dinner', 'meal', 0.75],
    ['Podcast on the drive home', 'podcasts', 0.5],
  ],
  [
    ['Sleep', 'sleep', 7.5],
    ['Gym — pull day', 'exercise', 1],
    ['Build Netlify deploy pipeline', 'coding', 2],
    ['Business strategy: Q4 offers', 'business', 1.5],
    ['Plan Insta content calendar', 'creator', 1],
    ['LinkedIn outreach — 5 messages', 'connect', 0.75],
    ['Lunch', 'meal', 0.5],
    ['Read before bed', 'reading', 0.5],
  ],
  [
    ['Sleep', 'sleep', 8.5],
    ['Brunch', 'meal', 1],
    ['Music production session', 'creator', 3],
    ['Groceries + cook', 'foodprep', 1.5],
    ['Long walk on the beach', 'exercise', 1],
    ['AWS course — module 3', 'study', 2],
  ],
  [
    ['Sleep', 'sleep', 8],
    ['Weekly review & planning', 'business', 0.75],
    ['Mix & master track', 'creator', 2],
    ['Coding kata', 'coding', 1],
    ['Meal prep', 'foodprep', 1.5],
    ['Dinner with friends', 'connect', 1.5],
    ['Reading', 'reading', 1],
  ],
];

const MOCK_SOMEDAY = [
  ['Launch beat pack on Insta', 'creator', 0],
  ['Redesign portfolio site', 'coding', 4],
  ['Pitch AI automation package to local cafés', 'business', 2],
  ['Learn Three.js basics', 'study', 0],
  ['Read: Deep Work', 'reading', 0],
  ['Batch-shoot 5 reels in one afternoon', 'creator', 3],
];

export function buildMockTasks(base = new Date()) {
  const todayKey = toKey(base);
  const tasks = [];
  for (let offset = -4; offset <= 0; offset++) {
    getWeekDays(getWeekStart(offset, base)).forEach((d, di) => {
      const key = toKey(d);
      MOCK_WEEK[di].forEach(([title, category, duration], i) => {
        // Gentle variation for past weeks so charts don't look copy-pasted.
        let dur = duration;
        if (offset !== 0 && category !== 'work') {
          const wobble = ((di * 7 + i * 3 + offset * 5) % 5) - 2; // -2..2
          dur = Math.max(0.25, round(duration + wobble * 0.25, 2));
        }
        let done = false;
        if (key < todayKey) done = (di * 3 + i + offset) % 9 !== 4;
        else if (key === todayKey) done = i < Math.ceil(MOCK_WEEK[di].length / 2);
        tasks.push({ id: uid(), title, category, duration: dur, done, date: key, order: i });
      });
    });
  }
  MOCK_SOMEDAY.forEach(([title, category, duration], i) =>
    tasks.push({ id: uid(), title, category, duration, done: false, date: null, order: i }),
  );
  return tasks;
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const prefersDark = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

export function createInitialState() {
  return {
    version: 1,
    tasks: buildMockTasks(),
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    theme: prefersDark() ? 'dark' : 'light',
    weekOffset: 0,
    targets: defaultTargets(),
  };
}

export function createEmptyState(theme = 'light') {
  return {
    version: 1,
    tasks: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    theme,
    weekOffset: 0,
    targets: defaultTargets(),
  };
}

const isKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Coerce anything (old saves, imported JSON) into a valid state shape. */
export function normalizeState(s) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.tasks)) throw new Error('Invalid data');
  const categories =
    Array.isArray(s.categories) && s.categories.length
      ? s.categories
          .filter((c) => c && c.id && c.name)
          .map((c) => ({
            ...c,
            id: String(c.id),
            name: String(c.name),
            short: c.short ? String(c.short) : String(c.name),
            color: /^#[0-9a-f]{3,8}$/i.test(c.color) ? c.color : '#9C9A8C',
            keywords: Array.isArray(c.keywords) ? c.keywords.map(String) : [],
          }))
      : DEFAULT_CATEGORIES.map((c) => ({ ...c }));
  const dt = defaultTargets();
  return {
    version: 1,
    tasks: s.tasks
      .filter((t) => t && typeof t === 'object')
      .map((t, i) => ({
        id: String(t.id || uid()),
        title: String(t.title || 'Untitled'),
        duration: clamp(Number(t.duration) || 0, 0, 24),
        category: t.category ? String(t.category) : null,
        done: !!t.done,
        date: isKey(t.date) ? t.date : null,
        order: Number.isFinite(Number(t.order)) ? Number(t.order) : i,
      })),
    categories,
    theme: s.theme === 'dark' ? 'dark' : 'light',
    weekOffset: Number.isFinite(s.weekOffset) ? s.weekOffset : 0,
    targets: {
      ...dt,
      ...(s.targets || {}),
      weekly: { ...dt.weekly, ...((s.targets && s.targets.weekly) || {}) },
    },
  };
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
