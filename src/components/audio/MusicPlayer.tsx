'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAudioEngine } from './useAudioEngine';
import type { Mood, Playlist } from '@/types';

const PAN_CYCLE_SECONDS = 8; // 8D panning cycle duration

interface MusicPlayerProps {
  playlists: Record<Mood, Playlist>;
}

type CovidTrack = 'night' | 'day' | null;

// Covid-19 Special Edition tracks - Night version has 28 tracks
const COVID_NIGHT_TRACKS = Array.from({ length: 28 }, (_, i) => ({
  id: `covid-night-${i + 1}`,
  src: `/audio/track${i + 1}.mp3`,
  title: `Covid-19 Night - Track ${i + 1}`,
  artist: 'Special Edition',
}));

// Day version coming soon
const COVID_DAY_AVAILABLE = false;

export function MusicPlayer({ playlists }: MusicPlayerProps) {
  const {
    play,
    pause,
    next,
    previous,
    setVolume,
    set8DEnabled,
    setMood,
    isPlaying,
    currentTrack,
    currentMood,
    is8DEnabled,
    volume,
    progress,
  } = useAudioEngine(playlists);

  // Covid-19 Special Edition state
  const [covidTrack, setCovidTrack] = useState<CovidTrack>(null);
  const [covidPlaying, setCovidPlaying] = useState(false);
  const [covidProgress, setCovidProgress] = useState(0);
  const [covidCurrentTrackIndex, setCovidCurrentTrackIndex] = useState(0);
  const covidAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Web Audio API refs for Covid 8D audio
  const covidAudioContextRef = useRef<AudioContext | null>(null);
  const covidSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const covidGainNodeRef = useRef<GainNode | null>(null);
  const covidPannerNodeRef = useRef<StereoPannerNode | null>(null);
  const covidPanAnimationRef = useRef<number | null>(null);

  // Initialize Covid Audio Context
  const initCovidAudioContext = useCallback(() => {
    if (covidAudioContextRef.current) return;
    
    try {
      covidAudioContextRef.current = new AudioContext();
      covidGainNodeRef.current = covidAudioContextRef.current.createGain();
      covidGainNodeRef.current.gain.value = volume / 100;
      covidPannerNodeRef.current = covidAudioContextRef.current.createStereoPanner();
      covidPannerNodeRef.current.pan.value = 0;
    } catch (error) {
      console.warn('Failed to create Covid AudioContext:', error);
    }
  }, [volume]);

  // Connect Covid audio nodes
  const connectCovidNodes = useCallback(() => {
    if (!covidAudioContextRef.current || !covidSourceNodeRef.current || !covidGainNodeRef.current) return;
    
    covidSourceNodeRef.current.disconnect();
    covidGainNodeRef.current.disconnect();
    covidPannerNodeRef.current?.disconnect();
    
    if (is8DEnabled && covidPannerNodeRef.current) {
      // 8D mode: source -> gain -> panner -> destination
      covidSourceNodeRef.current.connect(covidGainNodeRef.current);
      covidGainNodeRef.current.connect(covidPannerNodeRef.current);
      covidPannerNodeRef.current.connect(covidAudioContextRef.current.destination);
    } else {
      // Normal mode: source -> gain -> destination
      covidSourceNodeRef.current.connect(covidGainNodeRef.current);
      covidGainNodeRef.current.connect(covidAudioContextRef.current.destination);
    }
  }, [is8DEnabled]);

  // Start 8D panning animation for Covid
  const startCovidPanAnimation = useCallback(() => {
    if (!covidPannerNodeRef.current || !is8DEnabled) return;
    
    const startTime = performance.now();
    
    const animate = () => {
      if (!covidPannerNodeRef.current || !is8DEnabled) return;
      
      const elapsed = (performance.now() - startTime) / 1000;
      const panValue = Math.sin((elapsed / PAN_CYCLE_SECONDS) * 2 * Math.PI);
      covidPannerNodeRef.current.pan.value = panValue;
      
      covidPanAnimationRef.current = requestAnimationFrame(animate);
    };
    
    covidPanAnimationRef.current = requestAnimationFrame(animate);
  }, [is8DEnabled]);

  // Stop 8D panning animation for Covid
  const stopCovidPanAnimation = useCallback(() => {
    if (covidPanAnimationRef.current) {
      cancelAnimationFrame(covidPanAnimationRef.current);
      covidPanAnimationRef.current = null;
    }
    if (covidPannerNodeRef.current) {
      covidPannerNodeRef.current.pan.value = 0;
    }
  }, []);

  const playCovidTrack = async (track: CovidTrack) => {
    if (!track) return;
    
    // Day version not available yet
    if (track === 'day' && !COVID_DAY_AVAILABLE) return;
    
    // Stop regular music
    pause();
    
    // Stop current covid track and cleanup
    stopCovidPanAnimation();
    if (covidAudioRef.current) {
      covidAudioRef.current.pause();
    }
    
    // Reset source node for new audio element
    covidSourceNodeRef.current = null;
    
    // Initialize audio context
    initCovidAudioContext();
    
    // Resume audio context if suspended
    if (covidAudioContextRef.current?.state === 'suspended') {
      await covidAudioContextRef.current.resume();
    }
    
    // For night, start from first track
    const trackIdx = track === 'night' ? 0 : 0;
    setCovidCurrentTrackIndex(trackIdx);
    
    // Create new audio element
    const trackSrc = track === 'night' ? COVID_NIGHT_TRACKS[trackIdx].src : '';
    covidAudioRef.current = new Audio(trackSrc);
    covidAudioRef.current.crossOrigin = 'anonymous';
    
    // Connect to Web Audio API
    if (covidAudioContextRef.current && covidGainNodeRef.current) {
      covidSourceNodeRef.current = covidAudioContextRef.current.createMediaElementSource(covidAudioRef.current);
      covidGainNodeRef.current.gain.value = volume / 100;
      connectCovidNodes();
    }
    
    covidAudioRef.current.addEventListener('timeupdate', () => {
      if (covidAudioRef.current) {
        const prog = (covidAudioRef.current.currentTime / covidAudioRef.current.duration) * 100;
        setCovidProgress(prog || 0);
      }
    });
    
    covidAudioRef.current.addEventListener('ended', () => {
      // Auto-play next track for night version
      if (track === 'night') {
        const nextIndex = trackIdx + 1;
        if (nextIndex < COVID_NIGHT_TRACKS.length) {
          playCovidNightTrack(nextIndex);
        } else {
          playCovidNightTrack(0);
        }
      } else {
        setCovidPlaying(false);
        setCovidProgress(0);
      }
    });
    
    await covidAudioRef.current.play();
    setCovidTrack(track);
    setCovidPlaying(true);
    
    // Start 8D panning if enabled
    if (is8DEnabled) {
      startCovidPanAnimation();
    }
  };

  const playCovidNightTrack = async (index: number) => {
    // Stop current audio and animation
    stopCovidPanAnimation();
    if (covidAudioRef.current) {
      covidAudioRef.current.pause();
    }
    
    // Reset source node for new audio element
    covidSourceNodeRef.current = null;
    
    setCovidCurrentTrackIndex(index);
    covidAudioRef.current = new Audio(COVID_NIGHT_TRACKS[index].src);
    covidAudioRef.current.crossOrigin = 'anonymous';
    
    // Connect to Web Audio API
    if (covidAudioContextRef.current && covidGainNodeRef.current) {
      covidSourceNodeRef.current = covidAudioContextRef.current.createMediaElementSource(covidAudioRef.current);
      covidGainNodeRef.current.gain.value = volume / 100;
      connectCovidNodes();
    }
    
    covidAudioRef.current.addEventListener('timeupdate', () => {
      if (covidAudioRef.current) {
        const prog = (covidAudioRef.current.currentTime / covidAudioRef.current.duration) * 100;
        setCovidProgress(prog || 0);
      }
    });
    
    covidAudioRef.current.addEventListener('ended', () => {
      const nextIndex = index + 1;
      if (nextIndex < COVID_NIGHT_TRACKS.length) {
        playCovidNightTrack(nextIndex);
      } else {
        playCovidNightTrack(0); // Loop
      }
    });
    
    await covidAudioRef.current.play();
    setCovidPlaying(true);
    
    // Start 8D panning if enabled
    if (is8DEnabled) {
      startCovidPanAnimation();
    }
  };

  const covidNextTrack = () => {
    if (covidTrack !== 'night') return;
    const nextIndex = (covidCurrentTrackIndex + 1) % COVID_NIGHT_TRACKS.length;
    playCovidNightTrack(nextIndex);
  };

  const covidPrevTrack = () => {
    if (covidTrack !== 'night') return;
    const prevIndex = covidCurrentTrackIndex === 0 ? COVID_NIGHT_TRACKS.length - 1 : covidCurrentTrackIndex - 1;
    playCovidNightTrack(prevIndex);
  };

  const stopCovidTrack = () => {
    stopCovidPanAnimation();
    if (covidAudioRef.current) {
      covidAudioRef.current.pause();
      covidAudioRef.current.currentTime = 0;
    }
    setCovidPlaying(false);
    setCovidTrack(null);
    setCovidProgress(0);
    setCovidCurrentTrackIndex(0);
  };

  const toggleCovidPlayPause = () => {
    if (!covidAudioRef.current || !covidTrack) return;
    
    if (covidPlaying) {
      covidAudioRef.current.pause();
      setCovidPlaying(false);
    } else {
      covidAudioRef.current.play();
      setCovidPlaying(true);
    }
  };

  // Effect: Handle 8D mode changes for Covid player
  useEffect(() => {
    if (covidTrack && covidPlaying && covidSourceNodeRef.current) {
      connectCovidNodes();
      
      if (is8DEnabled) {
        startCovidPanAnimation();
      } else {
        stopCovidPanAnimation();
      }
    }
  }, [is8DEnabled, covidTrack, covidPlaying, connectCovidNodes, startCovidPanAnimation, stopCovidPanAnimation]);

  // Effect: Update Covid volume when volume changes
  useEffect(() => {
    if (covidGainNodeRef.current) {
      covidGainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCovidPanAnimation();
      if (covidAudioRef.current) {
        covidAudioRef.current.pause();
        covidAudioRef.current.src = '';
      }
      if (covidAudioContextRef.current) {
        covidAudioContextRef.current.close().catch(console.warn);
      }
    };
  }, [stopCovidPanAnimation]);

  const moods: { mood: Mood; label: string; emoji: string }[] = [
    { mood: 'happy', label: 'Happy', emoji: '😊' },
    { mood: 'neutral', label: 'Neutral', emoji: '😌' },
    { mood: 'sad', label: 'Sad', emoji: '😢' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
      {/* Mood Selector */}
      <div className="flex justify-center gap-3 mb-6">
        {moods.map(({ mood, label, emoji }) => (
          <button
            key={mood}
            onClick={() => setMood(mood)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentMood === mood
                ? 'bg-purple-500 text-white scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Current Track Info */}
      <div className="text-center mb-4">
        {currentTrack ? (
          <>
            <div className="text-lg font-semibold text-gray-800 dark:text-white truncate">
              {currentTrack.title}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {currentTrack.artist}
            </div>
          </>
        ) : (
          <div className="text-gray-400 dark:text-gray-500">No track selected</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-4">
        <div
          className="bg-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Player Controls */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <button
          onClick={previous}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          aria-label="Previous track"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={isPlaying ? pause : play}
          className="p-4 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={next}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          aria-label="Next track"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 w-8">{volume}%</span>
      </div>

      {/* 8D Audio Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <div className="font-medium text-gray-700 dark:text-gray-200">8D Audio</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">🎧 Best with headphones</div>
        </div>
        <button
          onClick={() => set8DEnabled(!is8DEnabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            is8DEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              is8DEnabled ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Covid-19 Special Edition */}
      <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🦠</span>
          <div className="font-semibold text-red-700 dark:text-red-400">Covid-19 Special Edition</div>
        </div>
        
        {/* Covid Track Selector */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => playCovidTrack('night')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
              covidTrack === 'night'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-gray-600'
            }`}
          >
            🌙 Night
          </button>
          <button
            disabled={!COVID_DAY_AVAILABLE}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
              COVID_DAY_AVAILABLE
                ? covidTrack === 'day'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-gray-600'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            ☀️ Day {!COVID_DAY_AVAILABLE && <span className="text-xs block">Coming Soon</span>}
          </button>
        </div>

        {/* Covid Player Controls */}
        {covidTrack === 'night' && (
          <div className="space-y-2">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {COVID_NIGHT_TRACKS[covidCurrentTrackIndex].title}
            </div>
            <div className="text-center text-xs text-gray-500 dark:text-gray-500">
              Track {covidCurrentTrackIndex + 1} / {COVID_NIGHT_TRACKS.length}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div
                className="bg-red-500 h-1.5 rounded-full transition-all"
                style={{ width: `${covidProgress}%` }}
              />
            </div>
            
            {/* Controls */}
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={covidPrevTrack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                aria-label="Previous track"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button
                onClick={toggleCovidPlayPause}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                {covidPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={covidNextTrack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                aria-label="Next track"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
              <button
                onClick={stopCovidTrack}
                className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MusicPlayer;
