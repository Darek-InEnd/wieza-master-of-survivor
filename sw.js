/* Wieża PWA Service Worker, build 0.141.10-recovery. */
const BUILD_ID = '0.141.10-recovery';
const CACHE_NAME = 'wieza-v' + BUILD_ID;
const CORE_ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './hero-frames-auto-fit.js', './hero-frames-auto-fit.css',
  './hero-frame-autofit.js', './hero-frame-autofit.css'
];

async function injectFrameFit(response) {
  if (!response || !response.ok ||
      !(response.headers.get('content-type') || '').includes('text/html')) return response;

  const html = await response.text();
  const clean = html
    .replace(/<script\b[^>]*src=["'][^"']*hero-frames-auto-fit\.js[^"']*["'][^>]*><\/script>/gi, '')
    .replace(/<link\b[^>]*href=["'][^"']*hero-frames-auto-fit\.css[^"']*["'][^>]*>/gi, '');
  const tags = '<link rel="stylesheet" href="./hero-frames-auto-fit.css?v=' + BUILD_ID +
    '"><script defer src="./hero-frames-auto-fit.js?v=' + BUILD_ID + '"></script>';
  const patched = clean.includes('</head>')
    ? clean.replace('</head>', tags + '</head>')
    : clean.replace('</body>', tags + '</body>');

  // HTML body changed, so remove body-specific headers from the original response.
  const headers = new Headers(response.headers);
  ['content-length', 'content-encoding', 'transfer-encoding', 'content-md5',
   'etag', 'content-range', 'accept-ranges'].forEach(name => headers.delete(name));
  return new Response(patched, { status: response.status, statusText: response.statusText, headers });
}

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
    // Keep old caches during recovery to preserve saved offline assets.
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
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
