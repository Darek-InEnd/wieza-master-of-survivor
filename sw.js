const BUILD_ID = '0.132.1-training-stamina';
const CACHE_NAME = 'wieza-pwa-' + BUILD_ID;
const APP_SHELL = ['./','./index.html','./wieza.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./screenshots/desktop.png','./screenshots/mobile.png','./enemy-portraits/jotunn_mrozny_oslonik_tier1.png?v=0.132.1','./enemy-portraits/jotunn_ciskacz_gromow_tier2.png?v=0.132.1','./enemy-portraits/jotunn_rzucacz_glazow_tier2.png?v=0.132.1','./enemy-portraits/jotunn_runotworca_mrozu_tier3.png?v=0.132.1','./enemy-portraits/jotunn_lodowy_zgniatacz_tier4.png?v=0.132.1','./enemy-portraits/jotunn_krol_zmarzliny_boss.png?v=0.132.1','./enemy-portraits/jotunn_ymir_boss.png?v=0.132.1','./enemy-portraits/jotunn_runiczny_jotunn_boss.png?v=0.132.1'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('wieza-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => clients.forEach(client => client.postMessage({ type: 'TOWER_SW_UPDATED', build: BUILD_ID })))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate';
  const isAppDocument = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/wieza.html');
  const isEnemyPortrait = url.pathname.includes('/enemy-portraits/');

  if (isEnemyPortrait) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(new Request(event.request, { cache: 'no-store' })).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      }))
    );
    return;
  }

  if (isNavigation || isAppDocument) {
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-store' }))
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            const cacheKey = isNavigation ? new URL(event.request.url).pathname : event.request.url;
            caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => {
          const path = new URL(event.request.url).pathname;
          return caches.match(path).then(cached => cached || caches.match('./index.html'));
        })
    );
    return;
  }

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
