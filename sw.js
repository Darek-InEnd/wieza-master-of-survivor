const CACHE_NAME = 'wieza-pwa-0.127-india-defender-trainer';
const APP_SHELL = [
  './',
  './index.html',
  './wieza.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

const LEGACY_APP_PATHS = [
  '/wieza_v.0.125_PWA-1.html',
  '/wieza_v.0.125_PWA-2.html',
  '/wieza_v.0.125_PWA-3.html',
  '/wieza_v.0.126_PWA-4.html',
  '/wieza_v.0.126_PWA-5.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('wieza-pwa-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isLegacyPath(pathname) {
  return LEGACY_APP_PATHS.some(path => pathname.endsWith(path));
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');
  const isAppShellDocument = requestUrl.pathname.endsWith('/') ||
    requestUrl.pathname.endsWith('/index.html') ||
    requestUrl.pathname.endsWith('/wieza.html');

  // Stare adresy aplikacji są kompatybilnościowo kierowane na stabilny index.
  if (isNavigation && isLegacyPath(requestUrl.pathname)) {
    event.respondWith(
      caches.match('./index.html').then(cached => cached || fetch('./index.html'))
    );
    return;
  }

  // Główny adres aplikacji: online -> świeża wersja, offline -> ostatni cache.
  if (isNavigation && isAppShellDocument) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('./index.html', copy.clone()).catch(() => {});
            cache.put('./wieza.html', copy).catch(() => {});
          }).catch(() => {});
        }
        return response;
      }).catch(() => caches.match('./index.html').then(cached => cached || caches.match('./wieza.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      });
    })
  );
});
