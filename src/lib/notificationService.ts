/**
 * Web Notification & Push Notification Service
 * Handles notification permission, Service Worker registration,
 * background notification dispatch, foreground control, and click routing.
 */

export interface IncomingNotificationPayload {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  imageUrl?: string;
  partnerId: string;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export function getNotificationPermissionState(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Register Service Worker for background push and notification clicks
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser environment');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerNotificationServiceWorker();
    }
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

/**
 * Show notification when message arrives
 * Control logic:
 * - If app is foreground AND user is actively viewing this conversation -> Do NOT show OS notification.
 * - If app is background (document.hidden) OR viewing a different screen/partner -> Show notification.
 */
export async function triggerIncomingMessageNotification(
  payload: IncomingNotificationPayload,
  options?: {
    isCurrentChatActive?: boolean;
    onNotificationClick?: (partnerId: string) => void;
  }
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  // Foreground control: Check if tab is active and visible
  const isTabHidden = document.visibilityState === 'hidden' || document.hidden;
  const isViewingCurrentChat = !isTabHidden && Boolean(options?.isCurrentChatActive);

  // If the user is actively in the chat right now, suppress OS notification
  if (isViewingCurrentChat) {
    return false;
  }

  const title = `${payload.senderName}`;
  const excerpt = payload.text 
    ? (payload.text.length > 60 ? `${payload.text.slice(0, 60)}...` : payload.text)
    : (payload.imageUrl ? '📷 写真が届きました' : '新しいメッセージがあります');

  const notificationOptions: NotificationOptions & { renotify?: boolean } = {
    body: excerpt,
    icon: payload.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    badge: payload.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    tag: `chat_${payload.partnerId}`,
    renotify: true,
    data: {
      partnerId: payload.partnerId,
      url: window.location.origin
    }
  };

  // Try via ServiceWorkerRegistration first (better for background & mobile PWA)
  if (isServiceWorkerSupported()) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (e) {
      console.warn('ServiceWorker showNotification failed, falling back to Notification API:', e);
    }
  }

  // Standard Notification API fallback
  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options?.onNotificationClick) {
        options.onNotificationClick(payload.partnerId);
      }
    };
    return true;
  } catch (err) {
    console.error('Failed to display Notification:', err);
    return false;
  }
}
