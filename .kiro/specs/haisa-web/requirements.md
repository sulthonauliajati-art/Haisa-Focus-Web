# Requirements Document

## Introduction

Haisa Web adalah aplikasi web fokus yang menyediakan timer (stopwatch dan pomodoro), music player dengan efek 8D, dan sistem monetisasi iklan yang tidak mengganggu pengalaman pengguna. Target pengguna adalah pelajar, mahasiswa, dan pekerja yang membutuhkan sesi fokus 5-60 menit. Aplikasi ini mengutamakan pengalaman simple, cepat, dan tanpa login (default).

## Glossary

- **Haisa_Web**: Sistem aplikasi web fokus utama
- **Focus_Timer**: Komponen timer yang menghitung waktu fokus pengguna
- **Stopwatch_Mode**: Mode timer yang menghitung waktu dari nol ke atas tanpa batas
- **Pomodoro_Mode**: Mode timer dengan siklus kerja 25 menit dan istirahat 5 menit
- **Music_Player**: Komponen pemutar musik dengan dukungan efek 8D
- **8D_Audio_Effect**: Efek audio yang menciptakan ilusi suara bergerak secara sinusoidal dari kiri ke kanan menggunakan StereoPannerNode
- **Mood**: Kategori musik berdasarkan suasana hati (Happy, Neutral, Sad)
- **Ad_Slot**: Area penempatan iklan yang dikonfigurasi untuk menampilkan iklan dari provider tertentu
- **Ad_Orchestrator**: Sistem yang mengatur waterfall loading iklan dari multiple provider
- **Local_Stats**: Statistik fokus yang disimpan di localStorage tanpa memerlukan akun
- **Session**: Satu periode fokus dari start hingga stop

## Requirements

### Requirement 1: Focus Timer - Stopwatch Mode

**User Story:** As a user, I want to use a stopwatch timer, so that I can track my focus time without preset limits.

#### Acceptance Criteria

1. WHEN a user clicks the start button on stopwatch mode THEN the Focus_Timer SHALL begin counting time from zero and display elapsed time in HH:MM:SS format
2. WHEN a user clicks the pause button while timer is running THEN the Focus_Timer SHALL pause the countdown and preserve the current elapsed time
3. WHEN a user clicks the resume button while timer is paused THEN the Focus_Timer SHALL continue counting from the paused time
4. WHEN a user clicks the reset button THEN the Focus_Timer SHALL stop the timer and reset the display to 00:00:00
5. WHEN the browser tab loses focus or goes to background THEN the Focus_Timer SHALL maintain accurate time using performance.now() and timestamp comparison
6. WHEN the user refreshes the page while timer is running THEN the Focus_Timer SHALL restore the timer state from localStorage and continue from the correct elapsed time
7. WHEN a user clicks stop THEN the Focus_Timer SHALL display a session summary showing duration and update daily total

### Requirement 2: Focus Timer - Pomodoro Mode

**User Story:** As a user, I want to use pomodoro technique with preset work/break intervals, so that I can maintain structured focus sessions.

#### Acceptance Criteria

1. WHEN a user selects pomodoro mode THEN the Focus_Timer SHALL set the initial countdown to 25 minutes for work phase
2. WHEN the work phase countdown reaches zero THEN the Focus_Timer SHALL automatically transition to a 5-minute break phase and notify the user
3. WHEN the break phase countdown reaches zero THEN the Focus_Timer SHALL automatically transition back to work phase and notify the user
4. WHEN a user pauses during any phase THEN the Focus_Timer SHALL preserve the current phase and remaining time
5. WHEN the user grants notification permission THEN the Focus_Timer SHALL send browser notifications at phase transitions

### Requirement 3: Local Statistics

**User Story:** As a user, I want to see my focus statistics without creating an account, so that I can track my productivity locally.

#### Acceptance Criteria

1. WHEN a focus session completes THEN the Haisa_Web SHALL store the session duration in localStorage
2. WHEN a user views the timer page THEN the Haisa_Web SHALL display total focus time for the current day
3. WHEN a user views the timer page THEN the Haisa_Web SHALL display the last session duration
4. WHEN a new day begins THEN the Haisa_Web SHALL reset the daily total while preserving historical data

### Requirement 4: Music Player Core

**User Story:** As a user, I want to play background music while focusing, so that I can enhance my concentration.

#### Acceptance Criteria

1. WHEN a user clicks play on the Music_Player THEN the Music_Player SHALL start playing the current track from the selected mood playlist
2. WHEN a user clicks pause THEN the Music_Player SHALL pause the current track and preserve playback position
3. WHEN a user clicks next THEN the Music_Player SHALL skip to the next track in the current mood playlist
4. WHEN a user adjusts the volume slider THEN the Music_Player SHALL update the audio output level between 0 and 100 percent
5. WHEN a track finishes playing THEN the Music_Player SHALL automatically play the next track in the playlist
6. WHEN the playlist reaches the end THEN the Music_Player SHALL loop back to the first track

### Requirement 5: Mood Selection

**User Story:** As a user, I want to select music based on my mood, so that I can listen to appropriate background music for my current state.

#### Acceptance Criteria

1. WHEN the Music_Player loads THEN the Music_Player SHALL display three mood options: Happy, Neutral, and Sad
2. WHEN a user selects a mood THEN the Music_Player SHALL load the corresponding playlist with minimum 3 tracks
3. WHEN a user changes mood while music is playing THEN the Music_Player SHALL switch to the new mood playlist and start playing from the first track
4. WHEN a mood is selected THEN the Music_Player SHALL visually indicate the active mood selection

### Requirement 6: 8D Audio Effect

**User Story:** As a user, I want to enable 8D audio effect, so that I can experience immersive spatial audio while focusing.

#### Acceptance Criteria

1. WHEN a user enables the 8D toggle THEN the Music_Player SHALL route audio through StereoPannerNode with sinusoidal panning automation cycling every 6-12 seconds
2. WHEN a user disables the 8D toggle THEN the Music_Player SHALL route audio directly without spatial effects
3. WHEN 8D mode is enabled THEN the Music_Player SHALL display a recommendation to use headphones
4. WHEN 8D mode is active THEN the Music_Player SHALL apply volume limiting to prevent audio clipping
5. WHEN audio context is created THEN the Music_Player SHALL handle browser autoplay restrictions by requiring user interaction before playback

### Requirement 7: Ad Slot System

**User Story:** As a site operator, I want to display ads from multiple providers with fallback support, so that I can maximize ad revenue without disrupting user experience.

#### Acceptance Criteria

1. WHEN the page loads THEN the Ad_Orchestrator SHALL load ad scripts lazily after user interaction or idle state to maintain LCP under 2.5 seconds
2. WHEN an ad slot becomes visible THEN the Ad_Orchestrator SHALL use IntersectionObserver to trigger ad loading
3. WHEN the primary ad provider fails to fill a slot THEN the Ad_Orchestrator SHALL attempt the next provider in the configured waterfall sequence
4. WHEN rendering ads THEN the Ad_Orchestrator SHALL ensure no ad overlay covers timer controls or music player buttons
5. WHEN on mobile device THEN the Ad_Orchestrator SHALL limit ad slots and avoid aggressive sticky positioning
6. WHEN AdSense is displayed on a page THEN the Ad_Orchestrator SHALL disable popunder and onClick ad formats on that page

### Requirement 8: Responsive Layout

**User Story:** As a user, I want to use the app on any device, so that I can focus whether on desktop or mobile.

#### Acceptance Criteria

1. WHEN viewing on desktop THEN the Haisa_Web SHALL display timer card centered with side rails for ads (300x600 or 160x600)
2. WHEN viewing on mobile THEN the Haisa_Web SHALL display timer card at top, music player below, and ads in non-intrusive positions (320x100 bottom, 300x250 between components)
3. WHEN viewing on any device THEN the Haisa_Web SHALL render timer and music player UI before loading ad scripts
4. WHEN the layout renders THEN the Haisa_Web SHALL maintain CLS below 0.1 by reserving space for ad slots

### Requirement 9: Legal Pages

**User Story:** As a site operator, I want to provide legal documentation, so that I can comply with regulations and ad network policies.

#### Acceptance Criteria

1. WHEN a user navigates to privacy policy THEN the Haisa_Web SHALL display information about cookies, analytics, and ad partners
2. WHEN a user navigates to terms of service THEN the Haisa_Web SHALL display usage terms and conditions
3. WHEN required by user location THEN the Haisa_Web SHALL display a consent banner for personalized vs non-personalized ads

### Requirement 10: Timer State Persistence

**User Story:** As a user, I want my timer to survive page refreshes and device sleep, so that I don't lose my focus session progress.

#### Acceptance Criteria

1. WHEN the timer is running and page refreshes THEN the Focus_Timer SHALL restore state from localStorage including start timestamp and mode
2. WHEN the device wakes from sleep THEN the Focus_Timer SHALL calculate correct elapsed time based on stored timestamp rather than setInterval ticks
3. WHEN timer state changes THEN the Focus_Timer SHALL immediately persist the new state to localStorage
4. WHEN restoring timer state THEN the Focus_Timer SHALL validate stored data and handle corrupted data gracefully by resetting to idle state
