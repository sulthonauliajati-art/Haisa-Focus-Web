'use client';

import { useState, useEffect } from 'react';
import { useTimer } from './useTimer';
import { formatTime } from '@/lib/utils';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission 
} from '@/lib/notifications';

export function TimerCard() {
  const {
    state,
    mode,
    elapsedMs,
    remainingMs,
    pomodoroPhase,
    start,
    pause,
    resume,
    stop,
    reset,
    setMode,
  } = useTimer();

  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  useEffect(() => {
    if (isNotificationSupported()) {
      setNotificationPermission(getNotificationPermission());
    }
  }, []);

  const handleRequestNotification = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };

  const displayTime = mode === 'pomodoro' ? remainingMs : elapsedMs;
  const formattedTime = formatTime(displayTime);

  const isIdle = state === 'idle';
  const isRunning = state === 'running';
  const isPaused = state === 'paused';
  const isFinished = state === 'finished';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md mx-auto">
      {/* Mode Selector */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setMode('stopwatch')}
          disabled={!isIdle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'stopwatch'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          } ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Stopwatch
        </button>
        <button
          onClick={() => setMode('pomodoro')}
          disabled={!isIdle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'pomodoro'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          } ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Pomodoro
        </button>
      </div>

      {/* Pomodoro Phase Indicator */}
      {mode === 'pomodoro' && (
        <div className="text-center mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            pomodoroPhase === 'work'
              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
          }`}>
            {pomodoroPhase === 'work' ? '🎯 Focus Time' : '☕ Break Time'}
          </span>
        </div>
      )}

      {/* Notification Permission Request */}
      {mode === 'pomodoro' && isNotificationSupported() && notificationPermission === 'default' && (
        <div className="text-center mb-4">
          <button
            onClick={handleRequestNotification}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
          >
            🔔 Enable notifications for phase alerts
          </button>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold text-gray-800 dark:text-white tracking-wider">
          {formattedTime}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {isIdle && (
          <button
            onClick={start}
            className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
          >
            Start
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={pause}
              className="px-8 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={stop}
              className="px-8 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={resume}
              className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
            >
              Resume
            </button>
            <button
              onClick={reset}
              className="px-8 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </>
        )}

        {isFinished && (
          <>
            <button
              onClick={start}
              className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
            >
              {mode === 'pomodoro' ? `Start ${pomodoroPhase === 'work' ? 'Focus' : 'Break'}` : 'Start'}
            </button>
            <button
              onClick={reset}
              className="px-8 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TimerCard;
