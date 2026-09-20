self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Deliberately do not cache checkout, account or provider requests.
// The worker exists only to support installability and future safe offline UX.
self.addEventListener('fetch', () => {});
