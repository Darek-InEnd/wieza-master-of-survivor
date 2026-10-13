/* Wieża PWA service worker — release 0.136.
 * Release rule: after 0.135.9 the next release is 0.136; then use
 * 0.136.1 ... 0.136.9, followed by 0.137. Keep in sync with index.html.
 */
const BUILD_ID = '0.136';
const CACHE_NAME = 'wieza-pwa-' + BUILD_ID;

const CORE_ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './opening_1080p.mp4'
];

async function cacheIndividually(cache, urls) {
  for (const url of urls) {
    try {
      await cache.add(url);
    } catch (error) {
      console.warn('[Wieża SW] Pominięto plik podczas instalacji:', url, error);
    }
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cacheIndividually(cache, CORE_ASSETS);
    // Activate the new worker without waiting for every old tab to close.
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('wieza-pwa-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type: 'TOWER_SW_UPDATED', build: BUILD_ID }));
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate';
  const isAppDocument = url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') || url.pathname.endsWith('/wieza.html');

  if (isNavigation || isAppDocument) {
    // Network-first for the app document: prefer the latest published index.html.
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-store' }))
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for assets; new asset URLs should include the release query string.
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    }))
  );
});
