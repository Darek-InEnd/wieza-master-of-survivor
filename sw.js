const BUILD_ID = '0.134.2-talent-clarity';
const CACHE_NAME = 'wieza-pwa-' + BUILD_ID;

const CORE_ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './tower-manifest.json',
  './opening_1080p.mp4'
];

async function cacheIndividually(cache, urls) {
  for (const url of urls) {
    try { await cache.add(url); }
    catch (error) { console.warn('[Wieża SW] Pominięto plik podczas instalacji:', url, error); }
  }
}

self.addEventListener('install', event => { event.waitUntil((async () => { const cache = await caches.open(CACHE_NAME); await cacheIndividually(cache, CORE_ASSETS); await self.skipWaiting(); })()); });
self.addEventListener('activate', event => { event.waitUntil((async () => { const keys=await caches.keys(); await Promise.all(keys.filter(k=>k.startsWith('wieza-pwa-')&&k!==CACHE_NAME).map(k=>caches.delete(k))); await self.clients.claim(); const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true}); clients.forEach(client=>client.postMessage({type:'TOWER_SW_UPDATED',build:BUILD_ID})); })()); });
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url); if(url.origin!==self.location.origin)return;
  const isNavigation=event.request.mode==='navigate';
  const isAppDocument=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/wieza.html');
  if(isNavigation||isAppDocument){
    event.respondWith(fetch(new Request(event.request,{cache:'no-store'})).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy)).catch(()=>{});}return response;}).catch(()=>caches.match(event.request).then(c=>c||caches.match('./index.html')))); return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy)).catch(()=>{});}return response;})));
});
