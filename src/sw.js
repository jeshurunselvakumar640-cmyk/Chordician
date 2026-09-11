import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkOnly, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Handle SKIP_WAITING message from PWA prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 1. Workbox precaching for all static build assets
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2. Navigation fallback for Single Page App routing
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api/]
  })
);

// 3. API & Backend endpoints: NetworkOnly (never cache dynamic server responses)
registerRoute(/^\/api\/.*/i, new NetworkOnly());

// 4. Firebase Auth, Firestore, Google APIs: NetworkOnly (never cache identity or database traffic)
registerRoute(/^https:\/\/(?:firestore|identitytoolkit|securetoken|firebaseinstallations)\.googleapis\.com\/.*/i, new NetworkOnly());

// 5. Google Fonts stylesheets: StaleWhileRevalidate
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets'
  })
);

// 6. Google Fonts webfonts: CacheFirst (1 year TTL)
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// 7. Web Push Notification Event Listener (Foreground & Background)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    try {
      payload = { notification: { body: event.data.text() } };
    } catch {
      payload = {};
    }
  }

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    payload.title ||
    '🎵 Chordician';

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    payload.body ||
    'A new song was added to the songbook!';

  const songId = payload.data?.songId || payload.songId || null;
  const targetUrl = payload.data?.url || payload.url || (songId ? `/songs/${songId}` : '/songs');

  const options = {
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

  event.waitUntil(self.registration.showNotification(title, options));
});

// 8. Notification Click & Deep-Link Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/songs';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a Chordician tab is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
