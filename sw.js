// App assets and all subject banks install atomically.
const VERSION = 'v84-practice';
const PREFIX = 'lawu-' + encodeURIComponent(self.registration.scope) + '-';
const CORE = PREFIX + VERSION;
// shell-1: tabbed app shell; no 3D globe, hive tutorial or old styles.
const PRECACHE = ["index.html", "essay.html", "manifest.json", "vendor/app-config.js", "vendor/countdown-data.js", "vendor/lexo.js", "pwa/lexo.css", "data/essay_packs.json", "data/DONE_data.txt", "essay-civil.html", "data/essay_civil_v2.json", "qb/administrative.js", "qb/bills.js", "qb/civil.js", "qb/civpro.js", "qb/company.js", "qb/constitution.js", "qb/criminal.js", "qb/crimpro.js", "qb/enforcement.js", "qb/english.js", "qb/ethics.js", "qb/insurance.js", "qb/pil.js", "qb/pvt.js", "qb/securities.js", "qb/tax.js", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-192.png", "icons/icon-maskable-512.png", "DONE_shell1.txt", "DONE_polish1.txt"];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE);
    await cache.addAll(PRECACHE.map(path => new Request(new URL(path, self.registration.scope), {cache: 'reload'})));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CORE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  // Classic must always use the network, outside the new app cache.
  if (url.pathname.startsWith(new URL('classic/', self.registration.scope).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CORE);
    const path = url.href.slice(self.registration.scope.length).split('?')[0];
    const isEntry = path === '' || path === 'index.html' || path === 'v68.html';
    const hit = await cache.match(isEntry ? new URL('index.html', self.registration.scope).href : event.request, {ignoreSearch: true});
    if (path === 'data/essay_packs.json' || path === 'data/DONE_data.txt') {
      try { const response = await fetch(event.request); if(response.ok) { await cache.put(event.request, response.clone()); return response; } return hit || response; }
      catch(error) { if(hit) return hit; throw error; }
    }
    return hit || fetch(event.request);
  })());
});
