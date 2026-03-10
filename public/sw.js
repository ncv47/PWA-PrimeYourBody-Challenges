// public/sw.js - Voor background notificaties (app gesloten)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/challenges'));
});

// Push notificaties ontvangen (toekomstig)
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'Nieuwe challenge!',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };
  event.waitUntil(self.registration.showNotification('Prime Your Body', options));
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Dit zorgt dat notificaties ook werken als app gesloten is
self.addEventListener('push', function (event) {
  const data = event.data?.json() || {
    title: 'Reminder',
    body: 'Je challenge wacht op je 💪',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});