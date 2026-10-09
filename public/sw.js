/* Zeshu navigation resilience. Only cache this public offline information page.
   NEVER cache HTML responses, API calls, user sessions, checkout, payments,
   account pages or other private customer content. */
const OFFLINE_CACHE = 'zeshu-public-offline-v2';
const OFFLINE_PAGE = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(OFFLINE_CACHE);
      await cache.add(new Request(OFFLINE_PAGE, { cache: 'reload' }));
    } catch {
      // Some browsers disable storage. Never block site or installation.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('zeshu-public-offline-') && name !== OFFLINE_CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  const destination = new URL(request.url);
  if (destination.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      // Network-first. Successful navigation is NEVER stored by this worker.
      const response = await fetch(request);
      // A temporary Cloudflare gateway failure should show a branded retry
      // rather than a browser-black-screen. Never cache customer HTML or APIs.
      if ([502, 503, 504].includes(response.status)) {
        const cached = await caches.match(OFFLINE_PAGE, { cacheName: OFFLINE_CACHE });
        if (cached) return cached;
      }
      return response;
    } catch (error) {
      const cached = await caches.match(OFFLINE_PAGE, { cacheName: OFFLINE_CACHE });
      if (cached) return cached;
      // A first-time offline visit has no cache; preserve the genuine failure.
      throw error;
    }
  })());
});
