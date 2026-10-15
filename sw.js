/* Wieża PWA service worker — release 0.138.
 * BUILD_ID musi odpowiadać PWA_BUILD/GAME_VERSION w index.html.
 */
const BUILD_ID = '0.138.7';
const CACHE_NAME = 'wieza-pwa-' + BUILD_ID;
const CORE_ASSETS = ['./index.html', './manifest.webmanifest', './opening_1080p.mp4',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_1star.png',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_2star.png',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_3star.png',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_4star.png',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_5star.png',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_6star.png',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_7star_al_kahf.png',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_7star_al_kahhar.png',
  './hero-portraits/arabii/obronca_mezczyzna_tank/arabian_defender_tank_7star_shams.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_1star.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_2star.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_3star.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_4star.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_5star.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_6star.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_7star_durga.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_7star_lakshmi.png',
  './hero-portraits/indii/lucznik_kobieta_support/indi_archer_support_7star_saraswati.png',
  './enemy-portraits/draugi_zardzewialy_pancerz.png',
  './enemy-portraits/anunnaki_archaniol_kosmosu.png',
  './enemy-portraits/anunnaki_enlil.png',
  './enemy-portraits/anunnaki_gwiezdny_straznik.png',
  './enemy-portraits/anunnaki_ninurta.png',
  './enemy-portraits/anunnaki_ostrze_niebios.png',
  './enemy-portraits/anunnaki_promienny_strzelec.png',
  './enemy-portraits/anunnaki_utu.png',
  './enemy-portraits/spriggany_cierniowy_wladca.png',
  './enemy-portraits/spriggany_ciskacz_cierni.png',
  './enemy-portraits/spriggany_debowy_kolos.png',
  './enemy-portraits/spriggany_debowy_krol.png',
  './enemy-portraits/spriggany_druid_wiezy.png',
  './enemy-portraits/spriggany_greenman.png',
  './enemy-portraits/spriggany_ozywiony_konar.png',
  './enemy-portraits/draugi_kosciany_lucznik.png',
  './enemy-portraits/draugi_nekromanta_kurhanu.png',
  './enemy-portraits/draugi_zamrozony_topornik.png',
  './enemy-portraits/draugi_glamr.png',
  './enemy-portraits/draugi_haugbui.png',
  './enemy-portraits/draugi_krol_draugrow.png',
  './enemy-portraits/centaurowie_opancerzony_stratywaz.png',
  './enemy-portraits/centaurowie_komandor_lukow.png',
  './enemy-portraits/centaurowie_szaman_kopyt.png',
  './enemy-portraits/centaurowie_startujacy_szazownik.png',
  './enemy-portraits/centaurowie_chiron.png',
  './enemy-portraits/centaurowie_nessos.png',
  './enemy-portraits/centaurowie_pholos.png',
  './enemy-portraits/naga_krolewski_waz.png',
  './enemy-portraits/naga_zmyslny_lucznik.png',
  './enemy-portraits/naga_kobra_magus.png',
  './enemy-portraits/naga_wezowy_zbrojny.png',
  './enemy-portraits/naga_shesha.png',
  './enemy-portraits/naga_takshaka.png',
  './enemy-portraits/naga_vasuki.png'];

async function cacheIndividually(cache, urls) {
  for (const url of urls) {
    try { await cache.add(url); }
    catch (error) { console.warn('[Wieża SW] Pominięto plik podczas instalacji:', url, error); }
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cacheIndividually(cache, CORE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('wieza-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)));
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
  const isAppDocument = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/wieza.html');
  if (isNavigation || isAppDocument) {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-store' })).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
    }
    return response;
  })));
});
