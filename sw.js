// LEXO 已下架（2026-10-31 Jeffrey 裁）：本檔只做自我註銷。
// 只刪 LEXO 根目錄與 classic/ 自己的快取；dark/（法學宇宙）、高大（pqn-*）的快取與 localStorage 一律不碰。
const ROOT = 'lawu-' + encodeURIComponent(self.registration.scope) + '-';
const CLASSIC = 'lawu-' + encodeURIComponent(self.registration.scope + 'classic/') + '-';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(ROOT) || key.startsWith(CLASSIC)) await caches.delete(key);
    }
    await self.registration.unregister();
  })());
});
