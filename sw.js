const BUILD_ID = '0.127-fix3';
const CACHE_NAME = 'wieza-pwa-' + BUILD_ID;
const APP_SHELL = ['./','./index.html','./wieza.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
const LEGACY_APP_PATHS=['/wieza_v.0.125_PWA-1.html','/wieza_v.0.125_PWA-2.html','/wieza_v.0.125_PWA-3.html','/wieza_v.0.126_PWA-4.html','/wieza_v.0.126_PWA-5.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('wieza-pwa-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:'window',includeUncontrolled:true})).then(clients=>clients.forEach(client=>client.postMessage({type:'TOWER_SW_UPDATED',build:BUILD_ID}))));});
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});
function isLegacyPath(pathname){return LEGACY_APP_PATHS.some(path=>pathname.endsWith(path));}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const requestUrl=new URL(event.request.url); if(requestUrl.origin!==self.location.origin)return;
  const isNavigation=event.request.mode==='navigate'||(event.request.headers.get('accept')||'').includes('text/html');
  const isAppShellDocument=requestUrl.pathname.endsWith('/')||requestUrl.pathname.endsWith('/index.html')||requestUrl.pathname.endsWith('/wieza.html');
  if(isNavigation&&isLegacyPath(requestUrl.pathname)){event.respondWith(fetch(new Request(new URL('./index.html',self.location.origin),{cache:'no-store'})).catch(()=>caches.match('./index.html')));return;}
  if(isNavigation&&isAppShellDocument){
    const freshUrl=new URL(event.request.url); freshUrl.searchParams.set('__tower_build',BUILD_ID);
    const freshRequest=new Request(freshUrl.toString(),{method:'GET',headers:event.request.headers,mode:'same-origin',credentials:'same-origin',cache:'no-store'});
    event.respondWith(fetch(freshRequest).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>{cache.put('./index.html',copy.clone()).catch(()=>{});cache.put('./wieza.html',copy).catch(()=>{});}).catch(()=>{});}return response;}).catch(()=>caches.match('./index.html').then(cached=>cached||caches.match('./wieza.html'))));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});}return response;})));
});
