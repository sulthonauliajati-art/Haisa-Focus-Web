'use client';

export type NotificationPermission = 'granted' | 'denied' | 'default';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

// Check if notifications are supported
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission as NotificationPermission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch {
    console.warn('Failed to request notification permission');
    return 'denied';
  }
}

// Send a notification
export function sendNotification(options: NotificationOptions): Notification | null {
  if (!isNotificationSupported()) return null;
  if (getNotificationPermission() !== 'granted') return null;
  
  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    return notification;
  } catch {
    console.warn('Failed to send notification');
    return null;
  }
}

// Pomodoro-specific notifications
export function sendPomodoroWorkCompleteNotification(): Notification | null {
  return sendNotification({
    title: '🎉 Work Phase Complete!',
    body: 'Great job! Time for a 5-minute break.',
    tag: 'pomodoro-phase',
    requireInteraction: true,
  });
}

export function sendPomodoroBreakCompleteNotification(): Notification | null {
  return sendNotification({
    title: '⏰ Break Over!',
    body: 'Ready to focus again? Start your next work session.',
    tag: 'pomodoro-phase',
    requireInteraction: true,
  });
}

export function sendSessionCompleteNotification(durationMinutes: number): Notification | null {
  return sendNotification({
    title: '✅ Focus Session Complete',
    body: `You focused for ${durationMinutes} minutes. Well done!`,
    tag: 'session-complete',
  });
}
