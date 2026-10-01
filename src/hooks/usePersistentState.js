import { useEffect, useState } from 'react';
import { toKey } from '../utils/helpers.js';

/** localStorage-backed state. `init` runs only when nothing valid is stored. */
export function usePersistentState(key, init, normalize = (x) => x) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return normalize(JSON.parse(raw));
    } catch {
      /* corrupted or unavailable storage → fall through */
    }
    return typeof init === 'function' ? init() : init;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full or blocked — app keeps working in memory */
    }
  }, [key, state]);

  return [state, setState];
}

/** Today's yyyy-MM-dd key; rolls over at midnight. */
export function useToday() {
  const [k, setK] = useState(() => toKey(new Date()));
  useEffect(() => {
    const id = setInterval(() => {
      const n = toKey(new Date());
      setK((p) => (p === n ? p : n));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return k;
}

export function useMediaQuery(query) {
  const get = () => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };
  const [match, setMatch] = useState(get);
  useEffect(() => {
    let mql;
    try {
      mql = window.matchMedia(query);
    } catch {
      return undefined;
    }
    const on = () => setMatch(mql.matches);
    on();
    mql.addEventListener?.('change', on);
    return () => mql.removeEventListener?.('change', on);
  }, [query]);
  return match;
}
