import { precacheAndRoute } from 'workbox-precaching';

// Força o Service Worker a atualizar imediatamente todas as abas abertas
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Precaching from workbox (Vite PWA injects the manifest here)
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', function(event) {
  let payload = { title: 'Homeo Performance', body: 'Lembrete de Turno' };
  try {
    payload = event.data.json();
  } catch (e) {
    if (event.data) {
      payload = { title: 'Homeo Performance', body: event.data.text() };
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: payload.data || { url: '/' }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
