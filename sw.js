/* Wieża PWA Service Worker, build 0.138.19. */
const BUILD_ID = '0.138.19';
const CACHE_NAME = 'wieza-v' + BUILD_ID;
const CORE_ASSETS = ['./', './index.html', './manifest.webmanifest', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_1star.png', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_2star.png', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_3star.png', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_4star.png', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_5star.png', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_6star.png', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_7star_metztli.png', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_7star_tonatiuh.png', './hero-portraits/aztekow/mag_kobieta_dps/aztec_mage_female_dps_7star_xiuhcatl.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_1star.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_2star.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_3star.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_4star.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_5star.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_6star.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_7star_ballor.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_7star_cernunnos.png', './hero-portraits/celtow/lotrzyk_mezczyzna_dps/celt_rogue_male_dps_7star_mannan_mac_lir.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_1star.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_2star.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_3star.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_4star.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_5star.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_6star.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_7star_eris.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_7star_hekate.png', './hero-portraits/grecji/mag_kobieta_dps/greek_mage_female_dps_7star_nyks.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_1star.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_2star.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_3star.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_4star.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_5star.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_6star.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_7star_futsunushi.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_7star_takemikazuchi.png', './hero-portraits/japonii/wojownik_mezczyzna_dps/japanese_warrior_male_dps_7star_yamato_takeru.png'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async url => { try { await cache.add(new Request(url, {cache:'reload'})); } catch (_) {} }));
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
      try { const fresh = await fetch(request, {cache:'no-store'}); const cache = await caches.open(CACHE_NAME); cache.put('./index.html', fresh.clone()).catch(()=>{}); return fresh; }
      catch (_) { return (await caches.match(request)) || (await caches.match('./index.html')) || Response.error(); }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try { const response = await fetch(request); if (response.ok) { const cache = await caches.open(CACHE_NAME); cache.put(request, response.clone()).catch(()=>{}); } return response; }
    catch (_) { return cached || Response.error(); }
  })());
});
