/* Wieża PWA Service Worker, build 0.141.9-frame-fit-fixed. */
const BUILD_ID='0.141.9-frame-fit-fixed';
const CACHE_NAME='wieza-v'+BUILD_ID;
const FRAME_ASSETS=['./hero-frames-auto-fit.js','./hero-frames-auto-fit.css'];

async function injectFrameFit(response){
 if(!response||!response.ok||!(response.headers.get('content-type')||'').includes('text/html'))return response;
 const html=await response.text();
 const clean=html
  .replace(/<script\b[^>]*src=["'][^"']*hero-frames-auto-fit\.js[^"']*["'][^>]*><\/script>/gi,'')
  .replace(/<link\b[^>]*href=["'][^"']*hero-frames-auto-fit\.css[^"']*["'][^>]*>/gi,'');
 const tags='<link rel="stylesheet" href="./hero-frames-auto-fit.css?v='+BUILD_ID+'"><script defer src="./hero-frames-auto-fit.js?v='+BUILD_ID+'"></script>';
 const patched=clean.includes('</head>')?clean.replace('</head>',tags+'</head>'):clean.replace('</body>',tags+'</body>');
 return new Response(patched,{status:response.status,statusText:response.statusText,headers:response.headers});
}
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const c=await caches.open(CACHE_NAME);
 await Promise.all(FRAME_ASSETS.map(async u=>{try{await c.add(new Request(u,{cache:'reload'}));}catch(_){}}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith('wieza-v')&&k!==CACHE_NAME).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;
 if(r.mode==='navigate'){
  e.respondWith((async()=>{try{
   const fresh=await fetch(r,{cache:'no-store'}),patched=await injectFrameFit(fresh);
   const c=await caches.open(CACHE_NAME);c.put('./index.html',patched.clone()).catch(()=>{});return patched;
  }catch(_){const c=(await caches.match(r))||(await caches.match('./index.html'));return c?injectFrameFit(c):Response.error();}})());return;
 }
 e.respondWith((async()=>{const cached=await caches.match(r);if(cached)return cached;try{
  const res=await fetch(r);if(res.ok){const c=await caches.open(CACHE_NAME);c.put(r,res.clone()).catch(()=>{});}return res;
 }catch(_){return cached||Response.error();}})());
});
