import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  saveTimerSnapshot,
  getTimerSnapshot,
  clearTimerSnapshot,
  saveSession,
  saveSessionForDate,
  getTodayStats,
  getStatsForDate,
  getLastSession,
} from './storage';
import type { TimerSnapshot, SessionData, TimerState, TimerMode, PomodoroPhase } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Arbitraries for generating test data
const timerStateArb = fc.constantFrom<TimerState>('idle', 'running', 'paused', 'finished');
const timerModeArb = fc.constantFrom<TimerMode>('stopwatch', 'pomodoro');
const pomodoroPhaseArb = fc.constantFrom<PomodoroPhase>('work', 'break');

const timerSnapshotArb: fc.Arbitrary<TimerSnapshot> = fc.record({
  state: timerStateArb,
  mode: timerModeArb,
  startTimestamp: fc.option(fc.integer({ min: 0 }), { nil: null }),
  pausedElapsed: fc.integer({ min: 0, max: 3600000 }),
  pomodoroPhase: pomodoroPhaseArb,
  pomodoroRemainingMs: fc.integer({ min: 0, max: 1800000 }),
});


const sessionDataArb: fc.Arbitrary<SessionData> = fc.record({
  id: fc.uuid(),
  startTime: fc.integer({ min: 0, max: Date.now() }),
  endTime: fc.integer({ min: 0, max: Date.now() }),
  duration: fc.integer({ min: 0, max: 3600000 }),
  mode: timerModeArb,
  completed: fc.boolean(),
});

describe('Storage Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  /**
   * **Feature: haisa-web, Property 6: Session storage round-trip**
   * *For any* session data (id, startTime, endTime, duration, mode, completed),
   * storing and retrieving should produce an equivalent session object.
   * **Validates: Requirements 3.1, 3.3**
   */
  it('Property 6: Session storage round-trip - storing and retrieving session produces equivalent object', () => {
    fc.assert(
      fc.property(sessionDataArb, (session) => {
        // Clear storage before each test
        localStorageMock.clear();
        
        // Save the session
        saveSession(session);
        
        // Retrieve the last session
        const retrieved = getLastSession();
        
        // Verify round-trip produces equivalent object
        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(session.id);
        expect(retrieved?.startTime).toBe(session.startTime);
        expect(retrieved?.endTime).toBe(session.endTime);
        expect(retrieved?.duration).toBe(session.duration);
        expect(retrieved?.mode).toBe(session.mode);
        expect(retrieved?.completed).toBe(session.completed);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 1: Timer state persistence round-trip**
   * *For any* timer snapshot (state, mode, startTimestamp, pausedElapsed),
   * serializing to localStorage and deserializing should produce an equivalent timer snapshot.
   * **Validates: Requirements 1.6, 10.1**
   */
  it('Property 1: Timer state persistence round-trip - storing and retrieving timer snapshot produces equivalent object', () => {
    fc.assert(
      fc.property(timerSnapshotArb, (snapshot) => {
        // Clear storage before each test
        localStorageMock.clear();
        
        // Save the snapshot
        saveTimerSnapshot(snapshot);
        
        // Retrieve the snapshot
        const retrieved = getTimerSnapshot();
        
        // Verify round-trip produces equivalent object
        expect(retrieved).not.toBeNull();
        expect(retrieved?.state).toBe(snapshot.state);
        expect(retrieved?.mode).toBe(snapshot.mode);
        expect(retrieved?.startTimestamp).toBe(snapshot.startTimestamp);
        expect(retrieved?.pausedElapsed).toBe(snapshot.pausedElapsed);
        expect(retrieved?.pomodoroPhase).toBe(snapshot.pomodoroPhase);
        expect(retrieved?.pomodoroRemainingMs).toBe(snapshot.pomodoroRemainingMs);
      }),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: haisa-web, Property 5: Session completion updates daily total correctly**
   * *For any* completed session with duration D, the daily total focus time should increase by exactly D milliseconds.
   * **Validates: Requirements 1.7, 3.2**
   */
  it('Property 5: Session completion updates daily total correctly', () => {
    fc.assert(
      fc.property(sessionDataArb, (session) => {
        // Clear storage before each test
        localStorageMock.clear();
        
        // Get initial stats
        const initialStats = getTodayStats();
        const initialTotal = initialStats.totalFocusMs;
        
        // Save the session
        saveSession(session);
        
        // Get updated stats
        const updatedStats = getTodayStats();
        
        // Verify daily total increased by exactly the session duration
        expect(updatedStats.totalFocusMs).toBe(initialTotal + session.duration);
        expect(updatedStats.sessionCount).toBe(initialStats.sessionCount + 1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 7: Daily stats date partitioning**
   * *For any* two sessions with different dates (YYYY-MM-DD),
   * they should be stored in separate daily stats entries and not affect each other's totals.
   * **Validates: Requirements 3.4**
   */
  it('Property 7: Daily stats date partitioning - sessions on different dates are stored separately', () => {
    // Generate valid date strings in YYYY-MM-DD format
    const dateArb = fc.tuple(
      fc.integer({ min: 2024, max: 2025 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }) // Use 28 to avoid invalid dates
    ).map(([year, month, day]) => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    );

    // Use sessions with non-zero duration to make the test meaningful
    const sessionWithDurationArb: fc.Arbitrary<SessionData> = fc.record({
      id: fc.uuid(),
      startTime: fc.integer({ min: 0, max: Date.now() }),
      endTime: fc.integer({ min: 0, max: Date.now() }),
      duration: fc.integer({ min: 1000, max: 3600000 }), // At least 1 second
      mode: timerModeArb,
      completed: fc.boolean(),
    });

    fc.assert(
      fc.property(
        sessionWithDurationArb,
        sessionWithDurationArb,
        dateArb,
        dateArb,
        (session1, session2, date1, date2) => {
          // Skip if dates are the same
          if (date1 === date2) return true;

          localStorageMock.clear();

          // Save session1 to date1
          saveSessionForDate(session1, date1);

          // Save session2 to date2
          saveSessionForDate(session2, date2);

          // Get stats for both dates
          const stats1 = getStatsForDate(date1);
          const stats2 = getStatsForDate(date2);

          // Verify date1 stats only contain session1
          expect(stats1.date).toBe(date1);
          expect(stats1.totalFocusMs).toBe(session1.duration);
          expect(stats1.sessionCount).toBe(1);
          expect(stats1.sessions).toHaveLength(1);
          expect(stats1.sessions[0].id).toBe(session1.id);

          // Verify date2 stats only contain session2
          expect(stats2.date).toBe(date2);
          expect(stats2.totalFocusMs).toBe(session2.duration);
          expect(stats2.sessionCount).toBe(1);
          expect(stats2.sessions).toHaveLength(1);
          expect(stats2.sessions[0].id).toBe(session2.id);

          // Verify sessions are stored in separate entries (different dates)
          expect(stats1.date).not.toBe(stats2.date);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Clear timer snapshot should remove the snapshot from storage
   */
  it('clearTimerSnapshot removes snapshot from storage', () => {
    fc.assert(
      fc.property(timerSnapshotArb, (snapshot) => {
        localStorageMock.clear();
        
        // Save and then clear
        saveTimerSnapshot(snapshot);
        clearTimerSnapshot();
        
        // Should return null after clearing
        const retrieved = getTimerSnapshot();
        expect(retrieved).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});


describe('Corrupted State Recovery Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  /**
   * **Feature: haisa-web, Property 20: Corrupted state recovery**
   * *For any* invalid or corrupted timer snapshot in localStorage,
   * restoring should result in a safe default state (null) rather than throwing an error.
   * **Validates: Requirements 10.4**
   */
  it('Property 20: Corrupted state recovery - invalid data returns null without throwing', () => {
    // Test with various types of corrupted data (all as strings for localStorage)
    const corruptedDataArb = fc.oneof(
      fc.string(), // Random strings
      fc.integer().map(n => String(n)), // Numbers as strings
      fc.constant('null'),
      fc.constant('undefined'),
      fc.constant('{}'),
      fc.constant('[]'),
      fc.constant('{invalid json'),
      fc.constant('{"state": "invalid_state", "mode": "stopwatch"}'), // Invalid state value
      fc.constant('{"state": "idle"}'), // Missing required fields
      fc.record({
        state: fc.string().filter(s => !['idle', 'running', 'paused', 'finished'].includes(s)),
        mode: fc.string(),
      }).map(obj => JSON.stringify(obj)),
      fc.record({
        state: fc.constantFrom('idle', 'running'),
        mode: fc.constantFrom('stopwatch', 'pomodoro'),
        // Missing pausedElapsed, pomodoroPhase, pomodoroRemainingMs
      }).map(obj => JSON.stringify(obj)),
    );

    fc.assert(
      fc.property(corruptedDataArb, (corruptedData) => {
        localStorageMock.clear();
        
        // Directly set corrupted data in localStorage
        localStorageMock.setItem('haisa_timer_snapshot', corruptedData);
        
        // Should not throw and should return null for invalid data
        let result: unknown;
        let didThrow = false;
        
        try {
          result = getTimerSnapshot();
        } catch {
          didThrow = true;
        }
        
        expect(didThrow).toBe(false);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Corrupted session data should be handled gracefully
   */
  it('Corrupted session data returns null without throwing', () => {
    const corruptedDataArb = fc.oneof(
      fc.string(),
      fc.integer().map(n => String(n)), // Numbers as strings
      fc.constant('{invalid json'),
      fc.record({
        id: fc.integer(), // Wrong type for id (should be string)
        startTime: fc.string(), // Wrong type (should be number)
      }).map(obj => JSON.stringify(obj)),
    );

    fc.assert(
      fc.property(corruptedDataArb, (corruptedData) => {
        localStorageMock.clear();
        
        localStorageMock.setItem('haisa_last_session', corruptedData);
        
        let result: unknown;
        let didThrow = false;
        
        try {
          result = getLastSession();
        } catch {
          didThrow = true;
        }
        
        expect(didThrow).toBe(false);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
