/**
 * Firebase Cloud Messaging Background Service Worker
 * Chordician - Every Chord, For Him
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCaxt7IyXNAm5N41gWX0AJA3iJsq9_O-Cc",
  authDomain: "authentication-2708d.firebaseapp.com",
  projectId: "authentication-2708d",
  storageBucket: "authentication-2708d.firebasestorage.app",
  messagingSenderId: "101323771563",
  appId: "1:101323771563:web:68073d61462d90b39471ee"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '🎵 Chordician';
  const body = payload.notification?.body || payload.data?.body || 'A new song was added to the songbook!';
  const songId = payload.data?.songId || null;
  const targetUrl = payload.data?.url || (songId ? `/songs/${songId}` : '/songs');

  const notificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.svg',
    tag: songId ? `chordician-song-${songId}` : 'chordician-notification',
    renotify: true,
    data: {
      songId,
      url: targetUrl,
      timestamp: Date.now()
    }
  };

  return self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/songs';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
