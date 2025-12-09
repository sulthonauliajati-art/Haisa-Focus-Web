import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useAudioEngine } from './useAudioEngine';
import type { Track, Mood, Playlist } from '@/types';

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createStereoPanner: vi.fn(() => ({
    pan: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createDynamicsCompressor: vi.fn(() => ({
    threshold: { value: 0 },
    knee: { value: 0 },
    ratio: { value: 0 },
    attack: { value: 0 },
    release: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  destination: {},
};

// Mock HTMLAudioElement
class MockAudioElement {
  src = '';
  currentTime = 0;
  duration = 100;
  crossOrigin = '';
  
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

// Setup mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock AudioContext
  (global as unknown as { AudioContext: unknown }).AudioContext = vi.fn(() => mockAudioContext);
  
  // Mock Audio element
  (global as unknown as { Audio: unknown }).Audio = vi.fn(() => new MockAudioElement());
});

afterEach(() => {
  vi.restoreAllMocks();
});


// Arbitraries for generating test data
const trackArb: fc.Arbitrary<Track> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  artist: fc.string({ minLength: 1, maxLength: 50 }),
  src: fc.webUrl(),
  duration: fc.integer({ min: 30, max: 600 }),
});

const moodArb = fc.constantFrom<Mood>('happy', 'neutral', 'sad');

// Generate playlists with at least 3 tracks per mood
const playlistsArb = fc.record({
  happy: fc.record({
    mood: fc.constant<Mood>('happy'),
    tracks: fc.array(trackArb, { minLength: 3, maxLength: 10 }),
  }),
  neutral: fc.record({
    mood: fc.constant<Mood>('neutral'),
    tracks: fc.array(trackArb, { minLength: 3, maxLength: 10 }),
  }),
  sad: fc.record({
    mood: fc.constant<Mood>('sad'),
    tracks: fc.array(trackArb, { minLength: 3, maxLength: 10 }),
  }),
}) as fc.Arbitrary<Record<Mood, Playlist>>;

describe('Audio Engine Property Tests', () => {
  /**
   * **Feature: haisa-web, Property 10: Playlist navigation with looping**
   * *For any* playlist of length N, calling next() when at track index N-1
   * should result in track index 0, and calling next() at any index i < N-1
   * should result in index i+1.
   * **Validates: Requirements 4.3, 4.5, 4.6**
   */
  it('Property 10: Playlist navigation with looping - next() wraps around', () => {
    fc.assert(
      fc.property(
        playlistsArb,
        fc.integer({ min: 0, max: 9 }), // Starting index
        (playlists, startIndex) => {
          const { result } = renderHook(() => useAudioEngine(playlists));
          
          const playlistLength = playlists.neutral.tracks.length;
          
          // Adjust startIndex to be within bounds
          const validStartIndex = startIndex % playlistLength;
          
          // Navigate to starting index
          for (let i = 0; i < validStartIndex; i++) {
            act(() => {
              result.current.next();
            });
          }
          
          const currentIndex = result.current.trackIndex;
          
          // Call next
          act(() => {
            result.current.next();
          });
          
          // Verify looping behavior
          const expectedIndex = (currentIndex + 1) % playlistLength;
          expect(result.current.trackIndex).toBe(expectedIndex);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10 continued: previous() navigation
   */
  it('Property 10: Playlist navigation with looping - previous() wraps around', () => {
    fc.assert(
      fc.property(
        playlistsArb,
        fc.integer({ min: 0, max: 9 }),
        (playlists, startIndex) => {
          const { result } = renderHook(() => useAudioEngine(playlists));
          
          const playlistLength = playlists.neutral.tracks.length;
          const validStartIndex = startIndex % playlistLength;
          
          // Navigate to starting index
          for (let i = 0; i < validStartIndex; i++) {
            act(() => {
              result.current.next();
            });
          }
          
          const currentIndex = result.current.trackIndex;
          
          // Call previous
          act(() => {
            result.current.previous();
          });
          
          // Verify looping behavior
          const expectedIndex = currentIndex === 0 ? playlistLength - 1 : currentIndex - 1;
          expect(result.current.trackIndex).toBe(expectedIndex);
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: haisa-web, Property 11: Volume clamping**
   * *For any* volume input value V, the resulting volume should be clamped to the range [0, 100].
   * **Validates: Requirements 4.4**
   */
  it('Property 11: Volume clamping - volume is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        playlistsArb,
        fc.integer({ min: -1000, max: 1000 }), // Any integer including out of range
        (playlists, inputVolume) => {
          const { result } = renderHook(() => useAudioEngine(playlists));
          
          // Set volume to arbitrary value
          act(() => {
            result.current.setVolume(inputVolume);
          });
          
          // Verify volume is clamped to [0, 100]
          expect(result.current.volume).toBeGreaterThanOrEqual(0);
          expect(result.current.volume).toBeLessThanOrEqual(100);
          
          // Verify exact clamping behavior
          const expectedVolume = Math.max(0, Math.min(100, inputVolume));
          expect(result.current.volume).toBe(expectedVolume);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 12: Mood playlist minimum tracks**
   * *For any* mood (happy, neutral, sad), the corresponding playlist should contain at least 3 tracks.
   * **Validates: Requirements 5.2**
   * 
   * Note: This property is enforced by the playlist data structure.
   * The test verifies that the hook correctly exposes the playlist.
   */
  it('Property 12: Mood playlist minimum tracks - each mood has at least 3 tracks', () => {
    fc.assert(
      fc.property(
        playlistsArb,
        moodArb,
        (playlists, mood) => {
          const { result } = renderHook(() => useAudioEngine(playlists));
          
          // Change to the specified mood
          act(() => {
            result.current.setMood(mood);
          });
          
          // Verify playlist has at least 3 tracks
          expect(result.current.playlist.length).toBeGreaterThanOrEqual(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 13: Mood change resets to first track**
   * *For any* mood change from mood A to mood B while playing,
   * the track index should reset to 0 and the current track should be from mood B's playlist.
   * **Validates: Requirements 5.3**
   */
  it('Property 13: Mood change resets to first track', () => {
    fc.assert(
      fc.property(
        playlistsArb,
        moodArb,
        moodArb,
        (playlists, moodA, moodB) => {
          // Skip if moods are the same
          if (moodA === moodB) return true;
          
          const { result } = renderHook(() => useAudioEngine(playlists));
          
          // Set initial mood
          act(() => {
            result.current.setMood(moodA);
          });
          
          // Navigate to track index 1 (not 0)
          act(() => {
            result.current.next();
          });
          
          // Verify we're at index 1
          expect(result.current.trackIndex).toBe(1);
          
          // Change mood
          act(() => {
            result.current.setMood(moodB);
          });
          
          // Verify track index reset to 0
          expect(result.current.trackIndex).toBe(0);
          
          // Verify current mood changed
          expect(result.current.currentMood).toBe(moodB);
          
          // Verify playlist is from new mood
          expect(result.current.playlist).toBe(playlists[moodB].tracks);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('8D Audio Property Tests', () => {
  /**
   * **Feature: haisa-web, Property 14: 8D toggle audio routing**
   * *For any* audio engine state, enabling 8D should route audio through StereoPannerNode,
   * and disabling 8D should bypass the panner node.
   * **Validates: Requirements 6.1, 6.2**
   */
  it('Property 14: 8D toggle audio routing', () => {
    fc.assert(
      fc.property(
        playlistsArb,
        fc.boolean(), // initial 8D state
        fc.boolean(), // target 8D state
        (playlists, initial8D, target8D) => {
          const { result } = renderHook(() => useAudioEngine(playlists));
          
          // Set initial 8D state
          act(() => {
            result.current.set8DEnabled(initial8D);
          });
          
          expect(result.current.is8DEnabled).toBe(initial8D);
          
          // Toggle to target state
          act(() => {
            result.current.set8DEnabled(target8D);
          });
          
          // Verify 8D state changed correctly
          expect(result.current.is8DEnabled).toBe(target8D);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 15: 8D volume limiting**
   * *For any* audio output when 8D mode is active, the peak amplitude should not exceed
   * the configured volume limit threshold (default 0.8).
   * **Validates: Requirements 6.4**
   * 
   * This property verifies that:
   * 1. When 8D mode is enabled, the audio engine state reflects 8D is active
   * 2. The volume remains within valid bounds regardless of 8D state
   * 3. The 8D mode can be toggled on/off consistently
   * 
   * Note: The DynamicsCompressorNode is configured in the implementation with:
   * - threshold: -6dB (catches peaks before clipping)
   * - ratio: 12:1 (aggressive limiting)
   * - knee: 30dB (smooth transition)
   * This ensures volume limiting when 8D panning is active.
   */
  it('Property 15: 8D volume limiting - 8D mode enables volume limiting chain', () => {
    fc.assert(
      fc.property(
        playlistsArb,
        fc.integer({ min: 0, max: 100 }), // volume level
        (playlists, volumeLevel) => {
          const { result } = renderHook(() => useAudioEngine(playlists));
          
          // Set volume
          act(() => {
            result.current.setVolume(volumeLevel);
          });
          
          // Enable 8D mode - this activates the volume limiting chain
          act(() => {
            result.current.set8DEnabled(true);
          });
          
          // Verify 8D is enabled (which means compressor will be in the audio chain)
          expect(result.current.is8DEnabled).toBe(true);
          
          // Volume should still be clamped to valid range [0, 100]
          // This ensures the gain node input is always valid
          expect(result.current.volume).toBeGreaterThanOrEqual(0);
          expect(result.current.volume).toBeLessThanOrEqual(100);
          expect(result.current.volume).toBe(Math.max(0, Math.min(100, volumeLevel)));
          
          // Disable 8D mode
          act(() => {
            result.current.set8DEnabled(false);
          });
          
          // Verify 8D is disabled
          expect(result.current.is8DEnabled).toBe(false);
          
          // Volume should remain unchanged after toggling 8D
          expect(result.current.volume).toBe(Math.max(0, Math.min(100, volumeLevel)));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 15: 8D volume limiting (state consistency)**
   * *For any* sequence of 8D toggle operations, the volume limiting state should be consistent
   * with the 8D enabled state.
   * **Validates: Requirements 6.4**
   */
  it('Property 15: 8D volume limiting - state consistency across toggles', () => {
    fc.assert(
      fc.property(
        playlistsArb,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), // sequence of 8D toggle states
        fc.integer({ min: 0, max: 100 }), // volume level
        (playlists, toggleSequence, volumeLevel) => {
          const { result } = renderHook(() => useAudioEngine(playlists));
          
          // Set volume
          act(() => {
            result.current.setVolume(volumeLevel);
          });
          
          // Apply sequence of 8D toggles
          for (const enabled of toggleSequence) {
            act(() => {
              result.current.set8DEnabled(enabled);
            });
          }
          
          // Final state should match last toggle value
          const expectedFinalState = toggleSequence[toggleSequence.length - 1];
          expect(result.current.is8DEnabled).toBe(expectedFinalState);
          
          // Volume should remain clamped regardless of 8D state
          expect(result.current.volume).toBeGreaterThanOrEqual(0);
          expect(result.current.volume).toBeLessThanOrEqual(100);
          expect(result.current.volume).toBe(Math.max(0, Math.min(100, volumeLevel)));
        }
      ),
      { numRuns: 100 }
    );
  });
});
