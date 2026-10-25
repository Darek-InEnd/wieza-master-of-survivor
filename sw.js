/* Wieża PWA Service Worker, build 0.141.11-framefit-test.
   Diagnostyka: tymczasowo nie wstrzykujemy skryptu automatycznego dopasowania ramek. */
const BUILD_ID = '0.141.11-framefit-test';
const CACHE_NAME = 'wieza-v' + BUILD_ID;
const CORE_ASSETS = [
  './', './index.html', './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async url => {
      try { await cache.add(new Request(url, { cache: 'reload' })); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Keep old caches during diagnosis to preserve saved offline assets.
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        const cached = (await caches.match(request)) || (await caches.match('./index.html'));
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
