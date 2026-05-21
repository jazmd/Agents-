/* Tickra service worker — minimal offline shell + cache-first for static assets. */
const VERSION = 'tickra-v1';
const SHELL = [
  '/',
  '/en',
  '/fr',
  '/manifest.webmanifest',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache cross-origin, API, auth callbacks or Supabase tokens.
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/monitoring')
  ) {
    return;
  }

  // Cache-first for static assets and locale roots.
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname === '/' ||
    url.pathname === '/en' ||
    url.pathname === '/fr' ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.svg' ||
    url.pathname.startsWith('/icon') ||
    url.pathname.startsWith('/apple-icon')
  ) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok && res.type === 'basic') cache.put(req, res.clone());
          return res;
        } catch {
          return hit ?? new Response('', { status: 504, statusText: 'offline' });
        }
      }),
    );
    return;
  }

  // Network-first with cache fallback for everything else
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        return res;
      } catch {
        const cache = await caches.open(VERSION);
        const hit = await cache.match(req);
        return hit ?? new Response('', { status: 504, statusText: 'offline' });
      }
    })(),
  );
});

// Push event placeholder — wired in Phase 18+ when push is enabled server-side.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch { payload = { title: 'Tickra', body: event.data.text() }; }
  const title = payload.title || 'Tickra';
  const options = {
    body: payload.body || '',
    icon: '/apple-icon',
    badge: '/icon',
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(self.clients.openWindow(url));
});
