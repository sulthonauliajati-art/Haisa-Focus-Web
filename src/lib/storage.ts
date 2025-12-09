import type {
  TimerSnapshot,
  SessionData,
  DailyStats,
  TimerMode,
  Mood,
  StorageSchema,
} from '@/types';

const STORAGE_KEYS = {
  TIMER_SNAPSHOT: 'haisa_timer_snapshot',
  DAILY_STATS: 'haisa_daily_stats',
  LAST_SESSION: 'haisa_last_session',
  PREFERENCES: 'haisa_preferences',
} as const;

const DEFAULT_PREFERENCES: StorageSchema['preferences'] = {
  timerMode: 'stopwatch',
  selectedMood: 'neutral',
  volume: 80,
  is8DEnabled: false,
};

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Timer Snapshot validation
function isValidTimerSnapshot(data: unknown): data is TimerSnapshot {
  if (!data || typeof data !== 'object') return false;
  const snapshot = data as Record<string, unknown>;
  
  const validStates = ['idle', 'running', 'paused', 'finished'];
  const validModes = ['stopwatch', 'pomodoro'];
  const validPhases = ['work', 'break'];
  
  return (
    validStates.includes(snapshot.state as string) &&
    validModes.includes(snapshot.mode as string) &&
    (snapshot.startTimestamp === null || typeof snapshot.startTimestamp === 'number') &&
    typeof snapshot.pausedElapsed === 'number' &&
    validPhases.includes(snapshot.pomodoroPhase as string) &&
    typeof snapshot.pomodoroRemainingMs === 'number'
  );
}


// Session validation
function isValidSessionData(data: unknown): data is SessionData {
  if (!data || typeof data !== 'object') return false;
  const session = data as Record<string, unknown>;
  
  const validModes = ['stopwatch', 'pomodoro'];
  
  return (
    typeof session.id === 'string' &&
    typeof session.startTime === 'number' &&
    typeof session.endTime === 'number' &&
    typeof session.duration === 'number' &&
    validModes.includes(session.mode as string) &&
    typeof session.completed === 'boolean'
  );
}

// Daily stats validation
function isValidDailyStats(data: unknown): data is DailyStats {
  if (!data || typeof data !== 'object') return false;
  const stats = data as Record<string, unknown>;
  
  return (
    typeof stats.date === 'string' &&
    typeof stats.totalFocusMs === 'number' &&
    typeof stats.sessionCount === 'number' &&
    Array.isArray(stats.sessions)
  );
}

// Preferences validation
function isValidPreferences(data: unknown): data is StorageSchema['preferences'] {
  if (!data || typeof data !== 'object') return false;
  const prefs = data as Record<string, unknown>;
  
  const validModes = ['stopwatch', 'pomodoro'];
  const validMoods = ['happy', 'neutral', 'sad'];
  
  return (
    validModes.includes(prefs.timerMode as string) &&
    validMoods.includes(prefs.selectedMood as string) &&
    typeof prefs.volume === 'number' &&
    typeof prefs.is8DEnabled === 'boolean'
  );
}

// ============ Timer Snapshot Functions ============

export function saveTimerSnapshot(snapshot: TimerSnapshot): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.TIMER_SNAPSHOT, JSON.stringify(snapshot));
  } catch {
    console.warn('Failed to save timer snapshot');
  }
}

export function getTimerSnapshot(): TimerSnapshot | null {
  if (!isLocalStorageAvailable()) return null;
  
  const data = safeJsonParse<unknown>(
    localStorage.getItem(STORAGE_KEYS.TIMER_SNAPSHOT),
    null
  );
  
  if (data && isValidTimerSnapshot(data)) {
    return data;
  }
  
  // Handle corrupted data gracefully - clear and return null
  clearTimerSnapshot();
  return null;
}

export function clearTimerSnapshot(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.TIMER_SNAPSHOT);
  } catch {
    console.warn('Failed to clear timer snapshot');
  }
}


// ============ Session & Stats Functions ============

function getAllDailyStats(): Record<string, DailyStats> {
  if (!isLocalStorageAvailable()) return {};
  
  const data = safeJsonParse<unknown>(
    localStorage.getItem(STORAGE_KEYS.DAILY_STATS),
    {}
  );
  
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const stats: Record<string, DailyStats> = {};
    for (const [date, value] of Object.entries(data as Record<string, unknown>)) {
      if (isValidDailyStats(value)) {
        stats[date] = value;
      }
    }
    return stats;
  }
  
  return {};
}

function saveDailyStats(stats: Record<string, DailyStats>): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
  } catch {
    console.warn('Failed to save daily stats');
  }
}

export function saveSession(session: SessionData): void {
  if (!isLocalStorageAvailable()) return;
  
  const today = getTodayDateString();
  const allStats = getAllDailyStats();
  
  // Get or create today's stats
  const todayStats: DailyStats = allStats[today] || {
    date: today,
    totalFocusMs: 0,
    sessionCount: 0,
    sessions: [],
  };
  
  // Update stats
  todayStats.totalFocusMs += session.duration;
  todayStats.sessionCount += 1;
  todayStats.sessions.push(session);
  
  allStats[today] = todayStats;
  saveDailyStats(allStats);
  
  // Save as last session
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify(session));
  } catch {
    console.warn('Failed to save last session');
  }
}

// For testing: save session to a specific date
export function saveSessionForDate(session: SessionData, date: string): void {
  if (!isLocalStorageAvailable()) return;
  
  const allStats = getAllDailyStats();
  
  // Get or create stats for the specified date
  const dateStats: DailyStats = allStats[date] || {
    date,
    totalFocusMs: 0,
    sessionCount: 0,
    sessions: [],
  };
  
  // Update stats
  dateStats.totalFocusMs += session.duration;
  dateStats.sessionCount += 1;
  dateStats.sessions.push(session);
  
  allStats[date] = dateStats;
  saveDailyStats(allStats);
}

export function getTodayStats(): DailyStats {
  const today = getTodayDateString();
  const allStats = getAllDailyStats();
  
  return allStats[today] || {
    date: today,
    totalFocusMs: 0,
    sessionCount: 0,
    sessions: [],
  };
}

export function getStatsForDate(date: string): DailyStats {
  const allStats = getAllDailyStats();
  
  return allStats[date] || {
    date,
    totalFocusMs: 0,
    sessionCount: 0,
    sessions: [],
  };
}

export function getLastSession(): SessionData | null {
  if (!isLocalStorageAvailable()) return null;
  
  const data = safeJsonParse<unknown>(
    localStorage.getItem(STORAGE_KEYS.LAST_SESSION),
    null
  );
  
  if (data && isValidSessionData(data)) {
    return data;
  }
  
  return null;
}


// ============ Preferences Functions ============

export function savePreferences(prefs: Partial<StorageSchema['preferences']>): void {
  if (!isLocalStorageAvailable()) return;
  
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  } catch {
    console.warn('Failed to save preferences');
  }
}

export function getPreferences(): StorageSchema['preferences'] {
  if (!isLocalStorageAvailable()) return { ...DEFAULT_PREFERENCES };
  
  const data = safeJsonParse<unknown>(
    localStorage.getItem(STORAGE_KEYS.PREFERENCES),
    null
  );
  
  if (data && isValidPreferences(data)) {
    return data;
  }
  
  return { ...DEFAULT_PREFERENCES };
}

// ============ Storage Service Interface ============

export interface StorageService {
  saveTimerSnapshot: (snapshot: TimerSnapshot) => void;
  getTimerSnapshot: () => TimerSnapshot | null;
  clearTimerSnapshot: () => void;
  saveSession: (session: SessionData) => void;
  saveSessionForDate: (session: SessionData, date: string) => void;
  getTodayStats: () => DailyStats;
  getStatsForDate: (date: string) => DailyStats;
  getLastSession: () => SessionData | null;
  savePreferences: (prefs: Partial<StorageSchema['preferences']>) => void;
  getPreferences: () => StorageSchema['preferences'];
}

export const storageService: StorageService = {
  saveTimerSnapshot,
  getTimerSnapshot,
  clearTimerSnapshot,
  saveSession,
  saveSessionForDate,
  getTodayStats,
  getStatsForDate,
  getLastSession,
  savePreferences,
  getPreferences,
};

export default storageService;
