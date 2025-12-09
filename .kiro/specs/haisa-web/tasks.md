# Implementation Plan

## Sprint 1: Core Infrastructure & Timer

- [x] 1. Set up project structure and dependencies





  - Initialize Next.js 14 project with App Router and TypeScript
  - Install and configure Tailwind CSS and shadcn/ui
  - Install fast-check for property-based testing
  - Set up Vitest for testing
  - Create directory structure as per design document
  - _Requirements: 8.1, 8.2_

- [x] 2. Implement Storage Module




  - [x] 2.1 Create storage service with localStorage wrapper

    - Implement `saveTimerSnapshot`, `getTimerSnapshot`, `clearTimerSnapshot`
    - Implement `saveSession`, `getTodayStats`, `getLastSession`
    - Implement `savePreferences`, `getPreferences`
    - Add JSON serialization/deserialization with validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.1, 10.3_
  - [x] 2.2 Write property test for storage round-trip








    - **Property 6: Session storage round-trip**
    - **Validates: Requirements 3.1, 3.3**
  - [x] 2.3 Write property test for corrupted state recovery








    - **Property 20: Corrupted state recovery**
    - **Validates: Requirements 10.4**

- [x] 3. Implement Timer Core (Stopwatch Mode)


  - [x] 3.1 Create useTimer hook with state machine


    - Implement state transitions: idle → running → paused → idle
    - Use performance.now() for timestamp-based elapsed time calculation
    - Implement start, pause, resume, stop, reset actions
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x]* 3.2 Write property test for timestamp accuracy


    - **Property 2: Timestamp-based elapsed time accuracy**
    - **Validates: Requirements 1.5, 10.2**

  - [x]* 3.3 Write property test for pause preservation

    - **Property 3: Timer pause preserves elapsed time**

    - **Validates: Requirements 1.2, 1.3**

  - [x]* 3.4 Write property test for reset behavior
    - **Property 4: Timer reset returns to zero**
    - **Validates: Requirements 1.4**

- [x] 4. Implement Timer Persistence



  - [x] 4.1 Add localStorage persistence to timer

    - Persist state on every transition
    - Restore state on page load
    - Handle page refresh during running timer
    - _Requirements: 1.6, 10.1, 10.2, 10.3_

  - [x]* 4.2 Write property test for state persistence round-trip

    - **Property 1: Timer state persistence round-trip**
    - **Validates: Requirements 1.6, 10.1**


  - [x]* 4.3 Write property test for state change persistence
    - **Property 21: State change triggers persistence**
    - **Validates: Requirements 10.3**



- [x] 5. Implement Pomodoro Mode


  - [x] 5.1 Extend useTimer for pomodoro functionality

    - Add pomodoro phase (work/break) tracking
    - Implement 25-minute work and 5-minute break cycles
    - Add automatic phase transitions
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.2 Write property test for phase transitions







    - **Property 8: Pomodoro phase transitions**
    - **Validates: Requirements 2.2, 2.3**

  - [x] 5.3 Write property test for pomodoro pause






    - **Property 9: Pomodoro pause preserves phase and remaining time**
    - **Validates: Requirements 2.4**

- [x] 6. Implement Session Statistics


  - [x] 6.1 Create session tracking and daily stats


    - Record session on stop/finish
    - Calculate daily totals
    - Handle date boundaries
    - _Requirements: 1.7, 3.1, 3.2, 3.3, 3.4_

  - [x] 6.2 Write property test for session updates







    - **Property 5: Session completion updates daily total correctly**
    - **Validates: Requirements 1.7, 3.2**

  - [x] 6.3 Write property test for date partitioning







    - **Property 7: Daily stats date partitioning**
    - **Validates: Requirements 3.4**

- [x] 7. Checkpoint - Timer Module Complete


  - Ensure all tests pass, ask the user if questions arise.

## Sprint 2: Audio & Music Player


- [x] 8. Implement Audio Engine Core

  - [x] 8.1 Create useAudioEngine hook with Web Audio API


    - Set up AudioContext and audio element
    - Implement play, pause, stop, next, previous
    - Implement volume control with GainNode
    - Handle browser autoplay restrictions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.5_

  - [x] 8.2 Write property test for playlist navigation


    - **Property 10: Playlist navigation with looping**
    - **Validates: Requirements 4.3, 4.5, 4.6**

  - [x] 8.3 Write property test for volume clamping






    - **Property 11: Volume clamping**
    - **Validates: Requirements 4.4**



- [x] 9. Implement Mood Selection
  - [x] 9.1 Create mood-based playlist system
    - Define track data structure and playlists per mood
    - Implement mood switching logic
    - Load tracks from /public/audio/{mood}/ directories
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 9.2 Write property test for minimum tracks






    - **Property 12: Mood playlist minimum tracks**
    - **Validates: Requirements 5.2**
  - [x] 9.3 Write property test for mood change behavior

    - **Property 13: Mood change resets to first track**
    - **Validates: Requirements 5.3**

- [x] 10. Implement 8D Audio Effect
  - [x] 10.1 Create 8D audio processing chain
    - Implement StereoPannerNode with sinusoidal automation
    - Add DynamicsCompressorNode for volume limiting
    - Create toggle for enabling/disabling 8D routing
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 10.2 Write property test for 8D toggle routing

    - **Property 14: 8D toggle audio routing**
    - **Validates: Requirements 6.1, 6.2**
  - [x] 10.3 Write property test for volume limiting






    - **Property 15: 8D volume limiting**
    - **Validates: Requirements 6.4**

- [x] 11. Checkpoint - Audio Module Complete
  - Ensure all tests pass, ask the user if questions arise.

## Sprint 3: UI Components

- [x] 12. Create Timer UI Components

  - [x] 12.1 Build TimerCard component
    - Display elapsed/remaining time in HH:MM:SS format
    - Add start/pause/resume/stop/reset buttons
    - Add mode selector (stopwatch/pomodoro)
    - Show session summary on completion
    - _Requirements: 1.1, 1.7, 2.1, 8.1, 8.2_
  - [x] 12.2 Build StatsDisplay component
    - Show today's total focus time
    - Show last session duration
    - _Requirements: 3.2, 3.3_

- [x] 13. Create Music Player UI Components
  - [x] 13.1 Build MusicPlayer component
    - Create mood selector buttons (Happy/Neutral/Sad)
    - Add player bar with play/pause, next, volume slider
    - Add 8D toggle with headphone recommendation
    - Show current track info
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.4, 6.1, 6.3_

- [x] 14. Create App Page Layout
  - [x] 14.1 Build responsive app page
    - Desktop: Timer centered, side rails for ads
    - Mobile: Timer top, music player below
    - Add header with logo and navigation
    - Add footer with legal links
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 15. Checkpoint - UI Complete
  - Ensure all tests pass, ask the user if questions arise.

## Sprint 4: Ad System

- [x] 16. Implement Ad Orchestrator



  - [x] 16.1 Create AdSlot component and orchestrator

    - Implement slot configuration system
    - Add IntersectionObserver for lazy loading
    - Implement waterfall fallback logic
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 16.2 Write property test for waterfall fallback


    - **Property 16: Ad waterfall fallback sequence**
    - **Validates: Requirements 7.3**

  - [ ]* 16.3 Write property test for visibility loading
    - **Property 17: Ad slot visibility-triggered loading**
    - **Validates: Requirements 7.2**

- [x] 17. Implement Ad Providers



  - [x] 17.1 Create provider adapters

    - Implement AdSense adapter
    - Implement Adsterra adapter
    - Implement Monetag adapter
    - Add environment variable configuration
    - _Requirements: 7.3, 7.6_

  - [ ]* 17.2 Write property test for mobile slot limiting
    - **Property 18: Mobile ad slot limiting**

    - **Validates: Requirements 7.5**
  - [ ]* 17.3 Write property test for AdSense policy compliance
    - **Property 19: AdSense policy compliance**
    - **Validates: Requirements 7.6**

- [x] 18. Integrate Ads into Layout



  - [x] 18.1 Add ad slots to app page

    - Add AD_TOP_LEADERBOARD slot
    - Add AD_SIDE_RAIL slots (desktop only)
    - Add AD_BOTTOM slot
    - Reserve space to prevent CLS
    - _Requirements: 7.4, 7.5, 8.4_

- [x] 19. Checkpoint - Ad System Complete


  - Ensure all tests pass, ask the user if questions arise.

## Sprint 5: Legal & Polish

- [x] 20. Create Legal Pages



  - [x] 20.1 Build legal page templates

    - Create Privacy Policy page with cookies, analytics, ad partners info
    - Create Terms of Service page
    - _Requirements: 9.1, 9.2_

- [x] 21. Implement Consent Banner



  - [x] 21.1 Create consent management

    - Build consent banner component
    - Implement personalized vs non-personalized ads toggle
    - Store consent preference
    - _Requirements: 9.3_

- [x] 22. Add Browser Notifications



  - [x] 22.1 Implement notification system

    - Request notification permission
    - Send notifications on pomodoro phase transitions
    - _Requirements: 2.5_

- [x] 23. Final Integration & Polish


  - [x] 23.1 Wire all components together


    - Ensure timer and music player work together
    - Verify ad loading doesn't block core UI
    - Test responsive layout on various devices
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 24. Final Checkpoint - All Tests Pass



  - Ensure all tests pass, ask the user if questions arise.
