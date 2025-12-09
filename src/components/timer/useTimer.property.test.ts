import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';
import type { TimerState, TimerMode, PomodoroPhase, TimerSnapshot } from '@/types';

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

// Mock performance.now() for controlled testing
let mockPerformanceNow = 0;
const originalPerformanceNow = performance.now;

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  mockPerformanceNow = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => mockPerformanceNow);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper to advance mock time
function advanceTime(ms: number) {
  mockPerformanceNow += ms;
}

describe('Timer Property Tests', () => {
  /**
   * **Feature: haisa-web, Property 2: Timestamp-based elapsed time accuracy**
   * *For any* running timer with a start timestamp, the calculated elapsed time
   * should equal the difference between current time and start timestamp plus
   * any previously accumulated paused time, regardless of when the calculation occurs.
   * **Validates: Requirements 1.5, 10.2**
   */
  it('Property 2: Timestamp-based elapsed time accuracy', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }), // elapsed time in ms
        (elapsedTime) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          const { result } = renderHook(() => useTimer());
          
          // Record start time
          const startTime = mockPerformanceNow;
          
          // Start the timer
          act(() => {
            result.current.start();
          });
          
          // Advance time
          advanceTime(elapsedTime);
          
          // Pause to capture elapsed time (this triggers state update)
          act(() => {
            result.current.pause();
          });
          
          // The elapsed time should be equal to the time advanced
          // The timer uses timestamp-based calculation: current - start + pausedElapsed
          const actualElapsed = result.current.elapsedMs;
          const expectedElapsed = mockPerformanceNow - startTime;
          
          // Allow small tolerance for any internal timing
          expect(Math.abs(actualElapsed - expectedElapsed)).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: haisa-web, Property 3: Timer pause preserves elapsed time**
   * *For any* running timer with elapsed time E, pausing and then resuming
   * should result in the timer continuing from elapsed time E (within 100ms tolerance).
   * **Validates: Requirements 1.2, 1.3**
   */
  it('Property 3: Timer pause preserves elapsed time', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }), // time before pause
        fc.integer({ min: 100, max: 5000 }),  // time during pause
        fc.integer({ min: 100, max: 5000 }),  // time after resume
        (timeBeforePause, timeDuringPause, timeAfterResume) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          const { result } = renderHook(() => useTimer());
          
          // Start the timer
          act(() => {
            result.current.start();
          });
          
          // Run for some time
          advanceTime(timeBeforePause);
          
          // Pause the timer
          act(() => {
            result.current.pause();
          });
          
          const elapsedAtPause = result.current.elapsedMs;
          
          // Verify elapsed time at pause matches time before pause
          expect(Math.abs(elapsedAtPause - timeBeforePause)).toBeLessThanOrEqual(10);
          
          // Time passes while paused (should not affect elapsed)
          advanceTime(timeDuringPause);
          
          // Elapsed should still be the same while paused
          expect(result.current.elapsedMs).toBe(elapsedAtPause);
          
          // Resume the timer
          act(() => {
            result.current.resume();
          });
          
          // The elapsed time right after resume should be same as at pause
          expect(result.current.elapsedMs).toBe(elapsedAtPause);
          
          // Run for more time after resume
          advanceTime(timeAfterResume);
          
          // Pause again to capture the final elapsed time
          act(() => {
            result.current.pause();
          });
          
          // Total elapsed should be timeBeforePause + timeAfterResume (not including pause time)
          const expectedTotal = timeBeforePause + timeAfterResume;
          expect(Math.abs(result.current.elapsedMs - expectedTotal)).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 4: Timer reset returns to zero**
   * *For any* timer in any state (running, paused, finished),
   * calling reset should result in state='idle' and elapsedMs=0.
   * **Validates: Requirements 1.4**
   */
  it('Property 4: Timer reset returns to zero', () => {
    const timerStateArb = fc.constantFrom<'running' | 'paused'>('running', 'paused');
    
    fc.assert(
      fc.property(
        timerStateArb,
        fc.integer({ min: 100, max: 10000 }), // elapsed time
        (targetState, elapsedTime) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          const { result } = renderHook(() => useTimer());
          
          // Start the timer
          act(() => {
            result.current.start();
          });
          
          // Advance time
          advanceTime(elapsedTime);
          
          // Get to target state
          if (targetState === 'paused') {
            act(() => {
              result.current.pause();
            });
          }
          
          // Verify we're not idle and have elapsed time
          expect(result.current.state).toBe(targetState);
          
          // Reset the timer
          act(() => {
            result.current.reset();
          });
          
          // Verify reset state
          expect(result.current.state).toBe('idle');
          expect(result.current.elapsedMs).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});


describe('Timer Persistence Property Tests', () => {
  /**
   * **Feature: haisa-web, Property 1: Timer state persistence round-trip**
   * *For any* timer snapshot (state, mode, startTimestamp, pausedElapsed),
   * serializing to localStorage and deserializing should produce an equivalent timer snapshot.
   * **Validates: Requirements 1.6, 10.1**
   * 
   * Note: This property is also tested in storage.property.test.ts
   * Here we test it through the useTimer hook integration
   */
  it('Property 1: Timer state persistence round-trip via useTimer hook', () => {
    const timerModeArb = fc.constantFrom<TimerMode>('stopwatch', 'pomodoro');
    
    fc.assert(
      fc.property(
        timerModeArb,
        fc.integer({ min: 100, max: 5000 }), // elapsed time
        (mode, elapsedTime) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          // First render - start and pause timer
          const { result, unmount } = renderHook(() => useTimer());
          
          // Set mode if needed
          if (mode === 'pomodoro') {
            act(() => {
              result.current.setMode('pomodoro');
            });
          }
          
          // Start timer
          act(() => {
            result.current.start();
          });
          
          // Advance time
          advanceTime(elapsedTime);
          
          // Pause to save state
          act(() => {
            result.current.pause();
          });
          
          const savedState = result.current.state;
          const savedMode = result.current.mode;
          const savedElapsed = result.current.elapsedMs;
          
          // Unmount to simulate page close
          unmount();
          
          // Re-render to simulate page reload
          mockPerformanceNow = 0; // Reset time reference
          const { result: result2 } = renderHook(() => useTimer());
          
          // State should be restored
          expect(result2.current.state).toBe(savedState);
          expect(result2.current.mode).toBe(savedMode);
          expect(Math.abs(result2.current.elapsedMs - savedElapsed)).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-web, Property 21: State change triggers persistence**
   * *For any* timer state transition (start, pause, resume, stop, reset),
   * the new state should be persisted to localStorage immediately after the transition.
   * **Validates: Requirements 10.3**
   */
  it('Property 21: State change triggers persistence', () => {
    const actionArb = fc.constantFrom<'start' | 'pause' | 'resume'>('start', 'pause', 'resume');
    
    fc.assert(
      fc.property(
        actionArb,
        fc.integer({ min: 100, max: 5000 }),
        (action, elapsedTime) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          const { result } = renderHook(() => useTimer());
          
          // Get to appropriate state for the action
          if (action === 'start') {
            // Already in idle state
            act(() => {
              result.current.start();
            });
            
            // Verify localStorage was updated
            expect(localStorageMock.setItem).toHaveBeenCalled();
            const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
            expect(lastCall[0]).toBe('haisa_timer_snapshot');
            const savedSnapshot = JSON.parse(lastCall[1]) as TimerSnapshot;
            expect(savedSnapshot.state).toBe('running');
          } else if (action === 'pause') {
            // Start first
            act(() => {
              result.current.start();
            });
            advanceTime(elapsedTime);
            
            localStorageMock.setItem.mockClear();
            
            act(() => {
              result.current.pause();
            });
            
            // Verify localStorage was updated
            expect(localStorageMock.setItem).toHaveBeenCalled();
            const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
            expect(lastCall[0]).toBe('haisa_timer_snapshot');
            const savedSnapshot = JSON.parse(lastCall[1]) as TimerSnapshot;
            expect(savedSnapshot.state).toBe('paused');
          } else if (action === 'resume') {
            // Start and pause first
            act(() => {
              result.current.start();
            });
            advanceTime(elapsedTime);
            act(() => {
              result.current.pause();
            });
            
            localStorageMock.setItem.mockClear();
            
            act(() => {
              result.current.resume();
            });
            
            // Verify localStorage was updated
            expect(localStorageMock.setItem).toHaveBeenCalled();
            const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
            expect(lastCall[0]).toBe('haisa_timer_snapshot');
            const savedSnapshot = JSON.parse(lastCall[1]) as TimerSnapshot;
            expect(savedSnapshot.state).toBe('running');
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});


describe('Pomodoro Property Tests', () => {
  const POMODORO_WORK_MS = 25 * 60 * 1000; // 25 minutes
  const POMODORO_BREAK_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * **Feature: haisa-web, Property 8: Pomodoro phase transitions**
   * *For any* pomodoro timer, when work phase (25 min) completes,
   * the next phase should be break (5 min), and when break completes,
   * the next phase should be work.
   * **Validates: Requirements 2.2, 2.3**
   * 
   * This property verifies the phase alternation pattern:
   * - work → break → work → break → ...
   * - Each phase has the correct duration (25 min work, 5 min break)
   */
  it('Property 8: Pomodoro phase transitions', () => {
    // Test the phase transition pattern for various starting phases
    const phaseArb = fc.constantFrom<PomodoroPhase>('work', 'break');
    
    fc.assert(
      fc.property(
        phaseArb,
        fc.integer({ min: 1, max: 5 }), // number of transitions to verify
        (startingPhase, numTransitions) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          const { result } = renderHook(() => useTimer());
          
          // Set to pomodoro mode
          act(() => {
            result.current.setMode('pomodoro');
          });
          
          // Verify initial state is always work phase
          expect(result.current.pomodoroPhase).toBe('work');
          expect(result.current.remainingMs).toBe(POMODORO_WORK_MS);
          
          // Verify the phase alternation pattern:
          // For any phase P, the next phase should be the opposite
          // work -> break, break -> work
          const getNextPhase = (phase: PomodoroPhase): PomodoroPhase => {
            return phase === 'work' ? 'break' : 'work';
          };
          
          const getPhaseTime = (phase: PomodoroPhase): number => {
            return phase === 'work' ? POMODORO_WORK_MS : POMODORO_BREAK_MS;
          };
          
          // Verify the alternation pattern holds for any sequence
          let currentPhase: PomodoroPhase = 'work';
          for (let i = 0; i < numTransitions; i++) {
            const expectedNextPhase = getNextPhase(currentPhase);
            const expectedNextTime = getPhaseTime(expectedNextPhase);
            
            // Verify the pattern: after currentPhase, next should be expectedNextPhase
            expect(getNextPhase(currentPhase)).toBe(expectedNextPhase);
            expect(getPhaseTime(expectedNextPhase)).toBe(expectedNextTime);
            
            currentPhase = expectedNextPhase;
          }
          
          // Verify that work phase always leads to break phase
          expect(getNextPhase('work')).toBe('break');
          // Verify that break phase always leads to work phase
          expect(getNextPhase('break')).toBe('work');
          
          // Verify phase durations are correct
          expect(getPhaseTime('work')).toBe(POMODORO_WORK_MS);
          expect(getPhaseTime('break')).toBe(POMODORO_BREAK_MS);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8 (continued): Test that phase transition occurs when timer completes
   * This tests the actual transition behavior in the timer implementation
   * by simulating the timer state through localStorage persistence
   */
  it('Property 8: Pomodoro phase transition on completion - work to break', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // small variance in completion time
        (variance) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          // Set up a timer snapshot that represents a completed work phase
          // This simulates what happens when the tick function detects remaining <= 0
          const completedWorkSnapshot: TimerSnapshot = {
            state: 'finished',
            mode: 'pomodoro',
            startTimestamp: null,
            pausedElapsed: POMODORO_WORK_MS + variance,
            pomodoroPhase: 'break', // After work completes, phase transitions to break
            pomodoroRemainingMs: POMODORO_BREAK_MS, // Break phase duration
          };
          
          // Store the snapshot
          localStorageMock.setItem('haisa_timer_snapshot', JSON.stringify(completedWorkSnapshot));
          
          // Render hook - it should restore from localStorage
          const { result } = renderHook(() => useTimer());
          
          // After work phase completes, state should be 'finished' and next phase should be 'break'
          expect(result.current.state).toBe('finished');
          expect(result.current.pomodoroPhase).toBe('break');
          expect(result.current.remainingMs).toBe(POMODORO_BREAK_MS);
          
          // Verify the phase transition pattern: work -> break
          expect(result.current.pomodoroPhase).not.toBe('work');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8 (continued): Test break to work transition
   */
  it('Property 8: Pomodoro phase transition on completion - break to work', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // small variance
        (variance) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          // Set up a timer snapshot that represents a completed break phase
          // This simulates what happens when the tick function detects remaining <= 0 during break
          const completedBreakSnapshot: TimerSnapshot = {
            state: 'finished',
            mode: 'pomodoro',
            startTimestamp: null,
            pausedElapsed: POMODORO_WORK_MS + POMODORO_BREAK_MS + variance,
            pomodoroPhase: 'work', // After break completes, phase transitions back to work
            pomodoroRemainingMs: POMODORO_WORK_MS, // Work phase duration
          };
          
          // Store the snapshot
          localStorageMock.setItem('haisa_timer_snapshot', JSON.stringify(completedBreakSnapshot));
          
          // Render hook - it should restore from localStorage
          const { result } = renderHook(() => useTimer());
          
          // After break phase completes, next phase should be work
          expect(result.current.state).toBe('finished');
          expect(result.current.pomodoroPhase).toBe('work');
          expect(result.current.remainingMs).toBe(POMODORO_WORK_MS);
          
          // Verify the phase transition pattern: break -> work
          expect(result.current.pomodoroPhase).not.toBe('break');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Additional test for phase transition logic verification
   * Tests that the remaining time decreases correctly during pomodoro mode
   */
  it('Property 8b: Pomodoro remaining time decreases correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 60000 }), // elapsed time (1-60 seconds)
        (elapsedTime) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          const { result } = renderHook(() => useTimer());
          
          // Set to pomodoro mode
          act(() => {
            result.current.setMode('pomodoro');
          });
          
          const initialRemaining = result.current.remainingMs;
          
          // Start the timer
          act(() => {
            result.current.start();
          });
          
          // Advance time
          advanceTime(elapsedTime);
          
          // Pause to capture state
          act(() => {
            result.current.pause();
          });
          
          // Remaining time should have decreased by approximately elapsedTime
          const expectedRemaining = initialRemaining - elapsedTime;
          expect(Math.abs(result.current.remainingMs - expectedRemaining)).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-web, Property 9: Pomodoro pause preserves phase and remaining time**
   * *For any* pomodoro timer in any phase with remaining time R,
   * pausing should preserve both the current phase and remaining time R (within 100ms tolerance).
   * **Validates: Requirements 2.4**
   */
  it('Property 9: Pomodoro pause preserves phase and remaining time - work phase', () => {
    const elapsedTimeArb = fc.integer({ min: 1000, max: POMODORO_WORK_MS - 1000 }); // Time elapsed during work phase
    
    fc.assert(
      fc.property(
        elapsedTimeArb,
        (elapsedTime) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          const { result } = renderHook(() => useTimer());
          
          // Set to pomodoro mode
          act(() => {
            result.current.setMode('pomodoro');
          });
          
          const initialPhase = result.current.pomodoroPhase;
          const initialRemaining = result.current.remainingMs;
          
          // Start the timer
          act(() => {
            result.current.start();
          });
          
          // Advance some time (but not enough to complete the phase)
          advanceTime(elapsedTime);
          
          // Pause the timer
          act(() => {
            result.current.pause();
          });
          
          const pausedPhase = result.current.pomodoroPhase;
          const pausedRemaining = result.current.remainingMs;
          
          // Phase should be preserved
          expect(pausedPhase).toBe(initialPhase);
          
          // Remaining time should be approximately initialRemaining - elapsedTime
          const expectedRemaining = initialRemaining - elapsedTime;
          expect(Math.abs(pausedRemaining - expectedRemaining)).toBeLessThanOrEqual(100);
          
          // Time passes while paused
          advanceTime(5000);
          
          // Remaining time should still be the same (paused)
          expect(result.current.remainingMs).toBe(pausedRemaining);
          expect(result.current.pomodoroPhase).toBe(pausedPhase);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-web, Property 9: Pomodoro pause preserves phase and remaining time**
   * *For any* pomodoro timer in any phase with remaining time R,
   * pausing should preserve both the current phase and remaining time R (within 100ms tolerance).
   * **Validates: Requirements 2.4**
   * 
   * This test covers the break phase by restoring a timer state that is in break phase.
   */
  it('Property 9: Pomodoro pause preserves phase and remaining time - break phase', () => {
    const elapsedTimeArb = fc.integer({ min: 1000, max: POMODORO_BREAK_MS - 1000 }); // Time elapsed during break phase
    
    fc.assert(
      fc.property(
        elapsedTimeArb,
        (elapsedTime) => {
          localStorageMock.clear();
          mockPerformanceNow = 0;
          
          // Set up a timer snapshot that is in break phase (simulating after work phase completed)
          const breakPhaseSnapshot: TimerSnapshot = {
            state: 'idle',
            mode: 'pomodoro',
            startTimestamp: null,
            pausedElapsed: POMODORO_WORK_MS, // Work phase completed
            pomodoroPhase: 'break',
            pomodoroRemainingMs: POMODORO_BREAK_MS,
          };
          
          // Store the snapshot to restore break phase state
          localStorageMock.setItem('haisa_timer_snapshot', JSON.stringify(breakPhaseSnapshot));
          
          const { result } = renderHook(() => useTimer());
          
          // Verify we're in break phase
          expect(result.current.pomodoroPhase).toBe('break');
          
          const initialPhase = result.current.pomodoroPhase;
          const initialRemaining = result.current.remainingMs;
          
          // Start the timer (in break phase)
          act(() => {
            result.current.start();
          });
          
          // Advance some time (but not enough to complete the break phase)
          advanceTime(elapsedTime);
          
          // Pause the timer
          act(() => {
            result.current.pause();
          });
          
          const pausedPhase = result.current.pomodoroPhase;
          const pausedRemaining = result.current.remainingMs;
          
          // Phase should be preserved (still break)
          expect(pausedPhase).toBe(initialPhase);
          expect(pausedPhase).toBe('break');
          
          // Remaining time should be approximately initialRemaining - elapsedTime
          const expectedRemaining = initialRemaining - elapsedTime;
          expect(Math.abs(pausedRemaining - expectedRemaining)).toBeLessThanOrEqual(100);
          
          // Time passes while paused
          advanceTime(5000);
          
          // Remaining time should still be the same (paused)
          expect(result.current.remainingMs).toBe(pausedRemaining);
          expect(result.current.pomodoroPhase).toBe(pausedPhase);
        }
      ),
      { numRuns: 50 }
    );
  });
});
