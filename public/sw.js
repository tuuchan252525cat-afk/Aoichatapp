// Service Worker for Web Push and Chat Notifications
const CACHE_NAME = '1on1-chat-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Background Push Events (Web Push / FCM)
self.addEventListener('push', (event) => {
  let data = {
    title: '新しいメッセージ',
    body: '新着メッセージが届きました',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    partnerId: '',
    url: '/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || data.senderAvatar,
    badge: data.badge || data.icon,
    data: {
      partnerId: data.partnerId || data.senderId,
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
    tag: `chat_${data.partnerId || data.senderId || 'msg'}`,
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || `${data.senderName}さんからのメッセージ`, options)
  );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPartnerId = event.notification.data?.partnerId;
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a chat tab is already open, focus it and post a message to switch chat
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (targetPartnerId) {
            client.postMessage({
              type: 'OPEN_CHAT_PARTNER',
              partnerId: targetPartnerId
            });
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        const urlToOpen = targetPartnerId ? `${targetUrl}#partner=${targetPartnerId}` : targetUrl;
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
