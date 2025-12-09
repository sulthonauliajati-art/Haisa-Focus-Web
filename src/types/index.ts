// Timer Types
export type TimerState = 'idle' | 'running' | 'paused' | 'finished';
export type TimerMode = 'stopwatch' | 'pomodoro';
export type PomodoroPhase = 'work' | 'break';

export interface TimerConfig {
  mode: TimerMode;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
}

export interface TimerSnapshot {
  state: TimerState;
  mode: TimerMode;
  startTimestamp: number | null;
  pausedElapsed: number;
  pomodoroPhase: PomodoroPhase;
  pomodoroRemainingMs: number;
}

// Audio Types
export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  duration: number;
}

export type Mood = 'happy' | 'neutral' | 'sad';

export interface Playlist {
  mood: Mood;
  tracks: Track[];
}

export interface AudioEngineConfig {
  enable8D: boolean;
  panCycleSeconds: number;
  volumeLimit: number;
}

// Session & Stats Types
export interface SessionData {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  mode: TimerMode;
  completed: boolean;
}

export interface DailyStats {
  date: string;
  totalFocusMs: number;
  sessionCount: number;
  sessions: SessionData[];
}

// Storage Types
export interface StorageSchema {
  timerSnapshot: TimerSnapshot | null;
  dailyStats: Record<string, DailyStats>;
  lastSession: SessionData | null;
  preferences: {
    timerMode: TimerMode;
    selectedMood: Mood;
    volume: number;
    is8DEnabled: boolean;
  };
}

// Ad Types
export type AdProvider = 'adsense' | 'adsterra' | 'monetag';
export type AdSlotId =
  | 'AD_TOP_LEADERBOARD'
  | 'AD_SIDE_RAIL_1'
  | 'AD_SIDE_RAIL_2'
  | 'AD_INCONTENT_1'
  | 'AD_BOTTOM';

export interface AdSlotConfig {
  id: AdSlotId;
  sizes: {
    desktop: [number, number][];
    mobile: [number, number][];
  };
  providers: AdProvider[];
  enabledDevices: ('desktop' | 'mobile')[];
  enabledPages: ('app' | 'blog' | 'landing')[];
  lazy: boolean;
  sticky: boolean;
}
