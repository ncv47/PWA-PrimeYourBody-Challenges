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
