'use client';

import { TimerCard, StatsDisplay } from '@/components/timer';
import { MusicPlayer } from '@/components/audio';

import { AdsterraNativeBanner } from '@/components/ads/AdsterraNativeBanner';
import { MonetagInPagePush } from '@/components/ads/MonetagInPagePush';
import { 
  MonetagBanner728x90, 
  MonetagBanner320x50, 
  MonetagBanner468x60, 
  MonetagBanner160x600,
  MonetagBanner160x300,
  MonetagBanner300x250,
  MonetagVignette 
} from '@/components/ads/MonetagBanners';
import { ThemeToggle } from '@/components/theme';
import type { Mood, Playlist } from '@/types';

// Audio files hosted on Supabase Storage
const SUPABASE_AUDIO_URL = 'https://xaegqmtikhrlkbgrlseq.supabase.co/storage/v1/object/public/audio';

const samplePlaylists: Record<Mood, Playlist> = {
  happy: {
    mood: 'happy',
    tracks: [
      { id: '1', title: 'Sunny Day', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/happy-track1.mp3`, duration: 180 },
      { id: '2', title: 'Good Vibes', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/happy-track2.mp3`, duration: 200 },
      { id: '3', title: 'Positive Energy', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/happy-track3.mp3`, duration: 220 },
    ],
  },
  neutral: {
    mood: 'neutral',
    tracks: [
      { id: '4', title: 'Calm Focus', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/neutral-track1.mp3`, duration: 240 },
      { id: '5', title: 'Deep Work', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/neutral-track2.mp3`, duration: 260 },
      { id: '6', title: 'Flow State', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/neutral-track3.mp3`, duration: 280 },
    ],
  },
  sad: {
    mood: 'sad',
    tracks: [
      { id: '7', title: 'Rainy Afternoon', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/sad-track1.mp3`, duration: 300 },
      { id: '8', title: 'Melancholy', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/sad-track2.mp3`, duration: 320 },
      { id: '9', title: 'Reflection', artist: 'Haisa Music', src: `${SUPABASE_AUDIO_URL}/sad-track3.mp3`, duration: 340 },
    ],
  },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Monetag In-Page Push & Vignette */}
      <MonetagInPagePush />
      <MonetagVignette />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            🎯 Haisa Focus
          </h1>
          <nav className="flex items-center gap-4">
            <a href="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Privacy
            </a>
            <a href="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Terms
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Banner below header - Desktop 728x90, Mobile 320x50 */}
      <div className="bg-gray-100 dark:bg-gray-800 py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="hidden md:block">
            <MonetagBanner728x90 />
          </div>
          <div className="md:hidden">
            <MonetagBanner320x50 />
          </div>
        </div>
      </div>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Ad Rail - Desktop Only */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-8 space-y-4">
              <MonetagBanner160x600 />
              <MonetagBanner160x300 />
            </div>
          </aside>

          {/* Center Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Timer Section */}
            <section>
              <TimerCard />
              <StatsDisplay />
            </section>

            {/* Banner between Timer and Music Player - 468x60 */}
            <section className="flex justify-center">
              <MonetagBanner468x60 />
            </section>

            {/* Music Player Section */}
            <section>
              <MusicPlayer playlists={samplePlaylists} />
            </section>

            {/* Adsterra Native Banner */}
            <section className="mt-6">
              <AdsterraNativeBanner className="rounded-lg overflow-hidden" />
            </section>
          </div>

          {/* Right Ad Rail - Desktop Only */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-8 space-y-4">
              <MonetagBanner160x600 />
              <MonetagBanner160x300 />
            </div>
          </aside>
        </div>

        {/* Bottom Ad - Mobile */}
        <div className="lg:hidden mt-8 flex justify-center">
          <MonetagBanner300x250 />
        </div>
      </main>

      {/* Banner above footer - Desktop 728x90, Mobile 320x50 */}
      <div className="bg-gray-100 dark:bg-gray-800 py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="hidden md:block">
            <MonetagBanner728x90 />
          </div>
          <div className="md:hidden">
            <MonetagBanner320x50 />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 Haisa Focus. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Terms of Service
              </a>
              <a 
                href="https://otieu.com/4/10302352" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
              >
                Support Us ❤️
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
