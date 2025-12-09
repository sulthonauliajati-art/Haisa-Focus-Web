'use client';

import { useEffect, useState } from 'react';
import { getTodayStats, getLastSession } from '@/lib/storage';
import { formatTime } from '@/lib/utils';
import type { DailyStats, SessionData } from '@/types';

export function StatsDisplay() {
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [lastSession, setLastSession] = useState<SessionData | null>(null);

  useEffect(() => {
    // Load stats on mount
    setTodayStats(getTodayStats());
    setLastSession(getLastSession());

    // Refresh stats periodically
    const interval = setInterval(() => {
      setTodayStats(getTodayStats());
      setLastSession(getLastSession());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 w-full max-w-md mx-auto mt-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Today&apos;s Stats</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Focus Time</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
            {formatTime(todayStats?.totalFocusMs || 0)}
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">Sessions</div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-300">
            {todayStats?.sessionCount || 0}
          </div>
        </div>
      </div>

      {lastSession && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Last Session</div>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {formatTime(lastSession.duration)}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
              ({lastSession.mode})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsDisplay;
