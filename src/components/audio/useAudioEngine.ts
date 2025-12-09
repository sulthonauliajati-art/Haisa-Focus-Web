'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Track, Mood, Playlist } from '@/types';

export interface UseAudioEngineReturn {
  // Playback
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  
  // Settings
  setVolume: (level: number) => void;
  set8DEnabled: (enabled: boolean) => void;
  setMood: (mood: Mood) => void;
  
  // State
  isPlaying: boolean;
  currentTrack: Track | null;
  currentMood: Mood;
  is8DEnabled: boolean;
  volume: number;
  progress: number;
  playlist: Track[];
  trackIndex: number;
}

// Default playlists - will be populated from /public/audio/{mood}/
const DEFAULT_PLAYLISTS: Record<Mood, Playlist> = {
  happy: { mood: 'happy', tracks: [] },
  neutral: { mood: 'neutral', tracks: [] },
  sad: { mood: 'sad', tracks: [] },
};

const PAN_CYCLE_SECONDS = 8; // 8D panning cycle duration

export function useAudioEngine(playlists: Record<Mood, Playlist> = DEFAULT_PLAYLISTS): UseAudioEngineReturn {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [is8DEnabled, setIs8DEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Refs for Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);

  const panAnimationRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get current playlist and track
  const playlist = playlists[currentMood]?.tracks || [];
  const currentTrack = playlist[trackIndex] || null;

  // Initialize Audio Context and nodes
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return;
    
    try {
      audioContextRef.current = new AudioContext();
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume / 100;
      
      // Create stereo panner for 8D effect
      pannerNodeRef.current = audioContextRef.current.createStereoPanner();
      pannerNodeRef.current.pan.value = 0;
      
      // Create compressor for volume limiting (8D mode)
      compressorNodeRef.current = audioContextRef.current.createDynamicsCompressor();
      compressorNodeRef.current.threshold.value = -6;
      compressorNodeRef.current.knee.value = 30;
      compressorNodeRef.current.ratio.value = 12;
      compressorNodeRef.current.attack.value = 0.003;
      compressorNodeRef.current.release.value = 0.25;
      
    } catch (error) {
      console.warn('Failed to create AudioContext:', error);
    }
  }, [volume]);

  // Connect audio nodes based on 8D mode
  const connectNodes = useCallback(() => {
    if (!audioContextRef.current || !sourceNodeRef.current || !gainNodeRef.current) return;
    
    // Disconnect all existing connections
    sourceNodeRef.current.disconnect();
    gainNodeRef.current.disconnect();
    pannerNodeRef.current?.disconnect();
    compressorNodeRef.current?.disconnect();
    
    if (is8DEnabled && pannerNodeRef.current && compressorNodeRef.current) {
      // 8D mode: source -> gain -> panner -> compressor -> destination
      sourceNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(pannerNodeRef.current);
      pannerNodeRef.current.connect(compressorNodeRef.current);
      compressorNodeRef.current.connect(audioContextRef.current.destination);
    } else {
      // Normal mode: source -> gain -> destination
      sourceNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, [is8DEnabled]);

  // 8D panning animation
  const startPanAnimation = useCallback(() => {
    if (!pannerNodeRef.current || !is8DEnabled) return;
    
    const startTime = performance.now();
    
    const animate = () => {
      if (!pannerNodeRef.current || !is8DEnabled) return;
      
      const elapsed = (performance.now() - startTime) / 1000;
      // Sinusoidal panning: -1 to 1 over PAN_CYCLE_SECONDS
      const panValue = Math.sin((elapsed / PAN_CYCLE_SECONDS) * 2 * Math.PI);
      pannerNodeRef.current.pan.value = panValue;
      
      panAnimationRef.current = requestAnimationFrame(animate);
    };
    
    panAnimationRef.current = requestAnimationFrame(animate);
  }, [is8DEnabled]);

  const stopPanAnimation = useCallback(() => {
    if (panAnimationRef.current) {
      cancelAnimationFrame(panAnimationRef.current);
      panAnimationRef.current = null;
    }
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.value = 0;
    }
  }, []);


  // Update progress
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (audioElementRef.current && audioElementRef.current.duration) {
        const progressPercent = (audioElementRef.current.currentTime / audioElementRef.current.duration) * 100;
        setProgress(progressPercent);
      }
    }, 100);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Load and play track
  const loadTrack = useCallback((track: Track) => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.crossOrigin = 'anonymous';
      
      // Handle track end - auto play next
      audioElementRef.current.addEventListener('ended', () => {
        setTrackIndex(prev => {
          const nextIndex = (prev + 1) % playlist.length;
          return nextIndex;
        });
      });
      
      // Handle errors
      audioElementRef.current.addEventListener('error', (e) => {
        console.warn('Audio error:', e);
        // Skip to next track on error
        setTrackIndex(prev => (prev + 1) % playlist.length);
      });
    }
    
    audioElementRef.current.src = track.src;
    audioElementRef.current.load();
    setProgress(0);
  }, [playlist.length]);

  // Connect audio element to Web Audio API
  const connectAudioElement = useCallback(() => {
    if (!audioContextRef.current || !audioElementRef.current || sourceNodeRef.current) return;
    
    try {
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
      connectNodes();
    } catch (error) {
      console.warn('Failed to connect audio element:', error);
    }
  }, [connectNodes]);

  // Play
  const play = useCallback(async () => {
    if (!currentTrack) return;
    
    // Initialize audio context on first play (handles autoplay restrictions)
    initAudioContext();
    
    // Resume audio context if suspended
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    // Load track if not loaded
    if (!audioElementRef.current || audioElementRef.current.src !== currentTrack.src) {
      loadTrack(currentTrack);
    }
    
    // Connect to Web Audio API if not connected
    if (!sourceNodeRef.current) {
      connectAudioElement();
    }
    
    try {
      await audioElementRef.current?.play();
      setIsPlaying(true);
      startProgressTracking();
      
      if (is8DEnabled) {
        startPanAnimation();
      }
    } catch (error) {
      console.warn('Playback failed:', error);
    }
  }, [currentTrack, initAudioContext, loadTrack, connectAudioElement, startProgressTracking, is8DEnabled, startPanAnimation]);

  // Pause
  const pause = useCallback(() => {
    audioElementRef.current?.pause();
    setIsPlaying(false);
    stopProgressTracking();
    stopPanAnimation();
  }, [stopProgressTracking, stopPanAnimation]);

  // Stop
  const stop = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    stopProgressTracking();
    stopPanAnimation();
  }, [stopProgressTracking, stopPanAnimation]);


  // Next track
  const next = useCallback(() => {
    const nextIndex = (trackIndex + 1) % playlist.length;
    setTrackIndex(nextIndex);
  }, [trackIndex, playlist.length]);

  // Previous track
  const previous = useCallback(() => {
    const prevIndex = trackIndex === 0 ? playlist.length - 1 : trackIndex - 1;
    setTrackIndex(prevIndex);
  }, [trackIndex, playlist.length]);

  // Set volume (0-100)
  const setVolume = useCallback((level: number) => {
    // Clamp volume to 0-100
    const clampedVolume = Math.max(0, Math.min(100, level));
    setVolumeState(clampedVolume);
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clampedVolume / 100;
    }
  }, []);

  // Toggle 8D mode
  const set8DEnabled = useCallback((enabled: boolean) => {
    setIs8DEnabled(enabled);
  }, []);

  // Set mood (changes playlist)
  const setMood = useCallback((mood: Mood) => {
    if (mood === currentMood) return;
    
    // Stop current playback
    stop();
    
    // Change mood and reset to first track
    setCurrentMood(mood);
    setTrackIndex(0);
  }, [currentMood, stop]);

  // Effect: Reconnect nodes when 8D mode changes
  useEffect(() => {
    if (sourceNodeRef.current) {
      connectNodes();
      
      if (is8DEnabled && isPlaying) {
        startPanAnimation();
      } else {
        stopPanAnimation();
      }
    }
  }, [is8DEnabled, connectNodes, isPlaying, startPanAnimation, stopPanAnimation]);

  // Effect: Load new track when trackIndex changes
  useEffect(() => {
    if (currentTrack && audioElementRef.current) {
      const wasPlaying = isPlaying;
      loadTrack(currentTrack);
      
      if (wasPlaying) {
        audioElementRef.current.play().catch(console.warn);
      }
    }
  }, [trackIndex, currentTrack, loadTrack, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
      stopPanAnimation();
      
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.warn);
      }
    };
  }, [stopProgressTracking, stopPanAnimation]);

  return {
    play,
    pause,
    stop,
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
    playlist,
    trackIndex,
  };
}

export default useAudioEngine;
