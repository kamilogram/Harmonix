import { SessionHistoryEntry } from '../components/SessionHistoryModal';

const HISTORY_STORAGE_KEY = 'harmonix_session_start_history_v1';
const SESSION_TOKEN_KEY = 'harmonix_session_active_token';
const CLOSED_TIME_STORAGE_KEY = 'harmonix_last_closed_time';

export function getSessionStartHistory(): SessionHistoryEntry[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 10);
    }
  } catch {
    // ignore
  }
  return [];
}

export function recordSessionStart(): { current: SessionHistoryEntry; history: SessionHistoryEntry[] } {
  const now = new Date();
  const timeString = now.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateString = now.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const fallback: SessionHistoryEntry = {
    id: `sess_${now.getTime()}`,
    timestamp: now.getTime(),
    timeString,
    dateString,
    isCurrent: true,
  };

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { current: fallback, history: [fallback] };
    }

    const sessionToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_TOKEN_KEY) : null;
    const existing = getSessionStartHistory();

    if (sessionToken) {
      const foundIdx = existing.findIndex((e) => e.id === sessionToken);
      if (foundIdx !== -1) {
        const marked = existing.map((e, idx) => ({ ...e, isCurrent: idx === foundIdx }));
        return { current: marked[foundIdx], history: marked };
      }
    }

    // New unique session
    const newId = `sess_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`;
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_TOKEN_KEY, newId);
      } catch {
        // ignore
      }
    }

    const current: SessionHistoryEntry = {
      id: newId,
      timestamp: now.getTime(),
      timeString,
      dateString,
      isCurrent: true,
    };

    const updated = [current, ...existing.map((e) => ({ ...e, isCurrent: false }))].slice(0, 10);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));

    return { current, history: updated };
  } catch {
    return { current: fallback, history: [fallback] };
  }
}

export function clearPreviousSessionHistory(currentSession: SessionHistoryEntry): SessionHistoryEntry[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const onlyCurrent = [currentSession];
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(onlyCurrent));
      return onlyCurrent;
    }
  } catch {
    // ignore
  }
  return [currentSession];
}

export function getLastClosedTime(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(CLOSED_TIME_STORAGE_KEY) || '';
    }
  } catch {
    // ignore
  }
  return '';
}

export function recordCurrentClosedTime(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateStr = now.toLocaleDateString('pl-PL');
      localStorage.setItem(CLOSED_TIME_STORAGE_KEY, `${timeStr} (${dateStr})`);
    }
  } catch {
    // ignore
  }
}
