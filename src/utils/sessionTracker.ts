export interface ActivityHistoryEntry {
  id: string;
  type: 'app_start' | 'pattern_load';
  title: string;
  keyName?: string;
  formula?: string;
  timestamp: number;
  timeString: string;
  dateString: string;
  isCurrentSession?: boolean;
}

const HISTORY_STORAGE_KEY = 'harmonix_app_activity_history_v2';
const SESSION_TOKEN_KEY = 'harmonix_session_active_token';
const MAX_HISTORY_ITEMS = 50;

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getActivityHistory(): ActivityHistoryEntry[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_HISTORY_ITEMS);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveActivityHistory(entries: ActivityHistoryEntry[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY_ITEMS)));
      window.dispatchEvent(new CustomEvent('harmonix:activity-updated'));
    }
  } catch {
    // ignore
  }
}

/**
 * Records the application start timestamp, ensuring at least 30+ items are kept in localStorage across sessions.
 */
export function recordSessionStart(): { current: ActivityHistoryEntry; history: ActivityHistoryEntry[] } {
  const now = new Date();
  const timeString = formatTime(now);
  const dateString = formatDate(now);

  const fallback: ActivityHistoryEntry = {
    id: `start_${now.getTime()}`,
    type: 'app_start',
    title: 'Uruchomienie aplikacji',
    timestamp: now.getTime(),
    timeString,
    dateString,
    isCurrentSession: true,
  };

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { current: fallback, history: [fallback] };
    }

    const sessionToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_TOKEN_KEY) : null;
    const existing = getActivityHistory();

    if (sessionToken) {
      const foundIdx = existing.findIndex((e) => e.id === sessionToken);
      if (foundIdx !== -1) {
        const marked = existing.map((e, idx) => ({ ...e, isCurrentSession: idx === foundIdx }));
        return { current: marked[foundIdx], history: marked };
      }
    }

    // New unique app launch
    const newId = `start_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`;
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_TOKEN_KEY, newId);
      } catch {
        // ignore
      }
    }

    const current: ActivityHistoryEntry = {
      id: newId,
      type: 'app_start',
      title: 'Uruchomienie aplikacji',
      timestamp: now.getTime(),
      timeString,
      dateString,
      isCurrentSession: true,
    };

    const updated = [current, ...existing.map((e) => ({ ...e, isCurrentSession: false }))].slice(0, MAX_HISTORY_ITEMS);
    saveActivityHistory(updated);

    return { current, history: updated };
  } catch {
    return { current: fallback, history: [fallback] };
  }
}

/**
 * Records whenever a pattern is loaded into the workshop.
 */
export function recordPatternLoad(name: string, keyName?: string, formula?: string): ActivityHistoryEntry[] {
  const now = new Date();
  const timeString = formatTime(now);
  const dateString = formatDate(now);

  const newEntry: ActivityHistoryEntry = {
    id: `load_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'pattern_load',
    title: name || 'Załadowano wzorzec',
    keyName,
    formula,
    timestamp: now.getTime(),
    timeString,
    dateString,
    isCurrentSession: true,
  };

  const existing = getActivityHistory();
  const updated = [newEntry, ...existing].slice(0, MAX_HISTORY_ITEMS);
  saveActivityHistory(updated);
  return updated;
}

export function clearActivityHistory(): ActivityHistoryEntry[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('harmonix:activity-updated'));
    }
  } catch {
    // ignore
  }
  return [];
}
