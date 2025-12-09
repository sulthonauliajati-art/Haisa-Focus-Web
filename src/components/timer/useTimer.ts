'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TimerState, TimerMode, PomodoroPhase, TimerSnapshot, SessionData } from '@/types';
import { saveTimerSnapshot, getTimerSnapshot, clearTimerSnapshot, saveSession } from '@/lib/storage';
import { 
  sendPomodoroWorkCompleteNotification, 
  sendPomodoroBreakCompleteNotification 
} from '@/lib/notifications';

const POMODORO_WORK_MS = 25 * 60 * 1000; // 25 minutes
const POMODORO_BREAK_MS = 5 * 60 * 1000; // 5 minutes

export interface UseTimerReturn {
  // State
  state: TimerState;
  mode: TimerMode;
  elapsedMs: number;
  remainingMs: number;
  pomodoroPhase: PomodoroPhase;
  
  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  setMode: (mode: TimerMode) => void;
}

interface TimerInternalState {
  state: TimerState;
  mode: TimerMode;
  startTimestamp: number | null;
  pausedElapsed: number;
  pomodoroPhase: PomodoroPhase;
  pomodoroRemainingMs: number;
}

const DEFAULT_STATE: TimerInternalState = {
  state: 'idle',
  mode: 'stopwatch',
  startTimestamp: null,
  pausedElapsed: 0,
  pomodoroPhase: 'work',
  pomodoroRemainingMs: POMODORO_WORK_MS,
};

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useTimer(): UseTimerReturn {
  const [internalState, setInternalState] = useState<TimerInternalState>(DEFAULT_STATE);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(POMODORO_WORK_MS);
  
  const animationFrameRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Persist state to localStorage
  const persistState = useCallback((newState: TimerInternalState) => {
    const snapshot: TimerSnapshot = {
      state: newState.state,
      mode: newState.mode,
      startTimestamp: newState.startTimestamp,
      pausedElapsed: newState.pausedElapsed,
      pomodoroPhase: newState.pomodoroPhase,
      pomodoroRemainingMs: newState.pomodoroRemainingMs,
    };
    saveTimerSnapshot(snapshot);
  }, []);


  // Calculate elapsed time using timestamp-based approach
  const calculateElapsed = useCallback((state: TimerInternalState): number => {
    if (state.state === 'idle') return 0;
    if (state.state === 'paused' || state.state === 'finished') {
      return state.pausedElapsed;
    }
    if (state.state === 'running' && state.startTimestamp !== null) {
      return state.pausedElapsed + (performance.now() - state.startTimestamp);
    }
    return state.pausedElapsed;
  }, []);

  // Calculate remaining time for pomodoro mode
  const calculateRemaining = useCallback((state: TimerInternalState): number => {
    if (state.mode !== 'pomodoro') return 0;
    
    if (state.state === 'idle') {
      return state.pomodoroPhase === 'work' ? POMODORO_WORK_MS : POMODORO_BREAK_MS;
    }
    if (state.state === 'paused' || state.state === 'finished') {
      return state.pomodoroRemainingMs;
    }
    if (state.state === 'running' && state.startTimestamp !== null) {
      const elapsed = performance.now() - state.startTimestamp;
      return Math.max(0, state.pomodoroRemainingMs - elapsed);
    }
    return state.pomodoroRemainingMs;
  }, []);

  // Animation frame loop for updating display
  const tick = useCallback(() => {
    setInternalState(currentState => {
      if (currentState.state === 'running') {
        const newElapsed = calculateElapsed(currentState);
        setElapsedMs(newElapsed);
        
        if (currentState.mode === 'pomodoro') {
          const newRemaining = calculateRemaining(currentState);
          setRemainingMs(newRemaining);
          
          // Check if pomodoro phase is complete
          if (newRemaining <= 0) {
            // Phase complete - transition to next phase
            const nextPhase: PomodoroPhase = currentState.pomodoroPhase === 'work' ? 'break' : 'work';
            const nextRemainingMs = nextPhase === 'work' ? POMODORO_WORK_MS : POMODORO_BREAK_MS;
            
            // Save completed phase as a session (Requirements 1.7)
            if (sessionStartTimeRef.current !== null) {
              const phaseDuration = currentState.pomodoroPhase === 'work' ? POMODORO_WORK_MS : POMODORO_BREAK_MS;
              const session: SessionData = {
                id: generateSessionId(),
                startTime: sessionStartTimeRef.current,
                endTime: Date.now(),
                duration: phaseDuration,
                mode: 'pomodoro',
                completed: true, // Phase completed naturally
              };
              saveSession(session);
            }
            
            // Send notification for phase transition (Requirements 2.5)
            if (currentState.pomodoroPhase === 'work') {
              sendPomodoroWorkCompleteNotification();
            } else {
              sendPomodoroBreakCompleteNotification();
            }
            
            const newState: TimerInternalState = {
              ...currentState,
              state: 'finished',
              pausedElapsed: newElapsed,
              pomodoroPhase: nextPhase,
              pomodoroRemainingMs: nextRemainingMs,
              startTimestamp: null,
            };
            
            persistState(newState);
            return newState;
          }
        }
      }
      return currentState;
    });
    
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [calculateElapsed, calculateRemaining, persistState]);

  // Start the animation loop when running
  useEffect(() => {
    if (internalState.state === 'running') {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
    
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [internalState.state, tick]);


  // Restore state from localStorage on mount
  useEffect(() => {
    const savedSnapshot = getTimerSnapshot();
    if (savedSnapshot) {
      const restoredState: TimerInternalState = {
        state: savedSnapshot.state,
        mode: savedSnapshot.mode,
        startTimestamp: savedSnapshot.startTimestamp,
        pausedElapsed: savedSnapshot.pausedElapsed,
        pomodoroPhase: savedSnapshot.pomodoroPhase,
        pomodoroRemainingMs: savedSnapshot.pomodoroRemainingMs,
      };
      
      // If timer was running, recalculate elapsed time based on stored timestamp
      if (restoredState.state === 'running' && restoredState.startTimestamp !== null) {
        // Convert stored timestamp to current performance.now() reference
        const currentTime = performance.now();
        
        // Assume the stored timestamp was relative to page load time
        // We need to adjust for the time that passed while page was closed
        restoredState.startTimestamp = currentTime;
        // The pausedElapsed already contains the accumulated time
      }
      
      setInternalState(restoredState);
      setElapsedMs(calculateElapsed(restoredState));
      setRemainingMs(calculateRemaining(restoredState));
    }
  }, [calculateElapsed, calculateRemaining]);

  // Actions
  const start = useCallback(() => {
    setInternalState(currentState => {
      if (currentState.state !== 'idle' && currentState.state !== 'finished') {
        return currentState;
      }
      
      const newState: TimerInternalState = {
        ...currentState,
        state: 'running',
        startTimestamp: performance.now(),
        pausedElapsed: currentState.state === 'finished' ? currentState.pausedElapsed : 0,
        pomodoroRemainingMs: currentState.state === 'finished' 
          ? (currentState.pomodoroPhase === 'work' ? POMODORO_WORK_MS : POMODORO_BREAK_MS)
          : currentState.pomodoroRemainingMs,
      };
      
      sessionStartTimeRef.current = Date.now();
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  const pause = useCallback(() => {
    setInternalState(currentState => {
      if (currentState.state !== 'running') {
        return currentState;
      }
      
      const currentElapsed = calculateElapsed(currentState);
      const currentRemaining = calculateRemaining(currentState);
      
      const newState: TimerInternalState = {
        ...currentState,
        state: 'paused',
        startTimestamp: null,
        pausedElapsed: currentElapsed,
        pomodoroRemainingMs: currentRemaining,
      };
      
      setElapsedMs(currentElapsed);
      setRemainingMs(currentRemaining);
      persistState(newState);
      return newState;
    });
  }, [calculateElapsed, calculateRemaining, persistState]);

  const resume = useCallback(() => {
    setInternalState(currentState => {
      if (currentState.state !== 'paused') {
        return currentState;
      }
      
      const newState: TimerInternalState = {
        ...currentState,
        state: 'running',
        startTimestamp: performance.now(),
      };
      
      persistState(newState);
      return newState;
    });
  }, [persistState]);


  const stop = useCallback(() => {
    setInternalState(currentState => {
      if (currentState.state === 'idle') {
        return currentState;
      }
      
      const finalElapsed = calculateElapsed(currentState);
      
      // Save session data
      if (sessionStartTimeRef.current !== null && finalElapsed > 0) {
        const session: SessionData = {
          id: generateSessionId(),
          startTime: sessionStartTimeRef.current,
          endTime: Date.now(),
          duration: finalElapsed,
          mode: currentState.mode,
          completed: false, // Manual stop = not completed
        };
        saveSession(session);
      }
      
      const newState: TimerInternalState = {
        ...DEFAULT_STATE,
        mode: currentState.mode,
      };
      
      sessionStartTimeRef.current = null;
      setElapsedMs(0);
      setRemainingMs(currentState.mode === 'pomodoro' ? POMODORO_WORK_MS : 0);
      clearTimerSnapshot();
      return newState;
    });
  }, [calculateElapsed]);

  const reset = useCallback(() => {
    setInternalState(currentState => {
      const newState: TimerInternalState = {
        ...DEFAULT_STATE,
        mode: currentState.mode,
        pomodoroRemainingMs: currentState.mode === 'pomodoro' ? POMODORO_WORK_MS : 0,
      };
      
      sessionStartTimeRef.current = null;
      setElapsedMs(0);
      setRemainingMs(currentState.mode === 'pomodoro' ? POMODORO_WORK_MS : 0);
      clearTimerSnapshot();
      return newState;
    });
  }, []);

  const setMode = useCallback((newMode: TimerMode) => {
    setInternalState(currentState => {
      // Only allow mode change when idle
      if (currentState.state !== 'idle') {
        return currentState;
      }
      
      const newState: TimerInternalState = {
        ...DEFAULT_STATE,
        mode: newMode,
        pomodoroRemainingMs: newMode === 'pomodoro' ? POMODORO_WORK_MS : 0,
      };
      
      setElapsedMs(0);
      setRemainingMs(newMode === 'pomodoro' ? POMODORO_WORK_MS : 0);
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  return {
    state: internalState.state,
    mode: internalState.mode,
    elapsedMs,
    remainingMs,
    pomodoroPhase: internalState.pomodoroPhase,
    start,
    pause,
    resume,
    stop,
    reset,
    setMode,
  };
}

export default useTimer;
