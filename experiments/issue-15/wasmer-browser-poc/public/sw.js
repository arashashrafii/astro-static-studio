const CACHE = 'issue-15-wasmer-shell-v1';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch('/asset-manifest.json', { cache: 'no-store' });
    const assets = await response.json();
    const cache = await caches.open(CACHE);
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(event.request) ?? fetch(event.request);
  })());
});
