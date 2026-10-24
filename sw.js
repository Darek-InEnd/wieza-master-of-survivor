/* Wieża PWA Service Worker, build 0.141.8-frame-fit. */
const BUILD_ID = '0.141.8-frame-fit';
const CACHE_NAME = 'wieza-v' + BUILD_ID;
const FRAME_ASSETS = ['./hero-frames-auto-fit.js', './hero-frames-auto-fit.css'];

async function injectFrameFit(response) {
  if (!response || !response.ok || !(response.headers.get('content-type') || '').includes('text/html')) return response;
  const html = await response.text();
  if (html.includes('hero-frames-auto-fit.js')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  const tags = '<link rel="stylesheet" href="./hero-frames-auto-fit.css?v=' + BUILD_ID + '"><script defer src="./hero-frames-auto-fit.js?v=' + BUILD_ID + '"></script>';
  const patched = html.includes('</head>') ? html.replace('</head>', tags + '</head>') : html.replace('</body>', tags + '</body>');
  return new Response(patched, { status: response.status, statusText: response.statusText, headers: response.headers });
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(FRAME_ASSETS.map(async url => {
      try { await cache.add(new Request(url, { cache: 'reload' })); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('wieza-v') && key !== CACHE_NAME).map(key => caches.delete(key)));
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
        const patched = await injectFrameFit(fresh);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', patched.clone()).catch(() => {});
        return patched;
      } catch (_) {
        const cached = (await caches.match(request)) || (await caches.match('./index.html'));
        return cached ? await injectFrameFit(cached) : Response.error();
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
    } catch (_) { return cached || Response.error(); }
  })());
});
