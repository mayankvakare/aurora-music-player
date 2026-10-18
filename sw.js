/* AURORA PWA service worker. Music files remain in IndexedDB, never in this cache. */
const CACHE_PREFIX = 'aurora-app-shell-';
const CACHE_VERSION = 'v1';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const APP_SHELL = [
  './', './index.html', './manifest.json',
  './css/tokens.css', './css/base.css', './css/layout.css',
  './css/components.css', './css/playlists.css', './css/responsive.css',
  './css/dashboard.css', './css/aurora-fixes.css', './css/glassclay.css',
  './js/config.js', './js/storage.js', './js/state.js', './js/utils.js',
  './js/dom.js', './js/audio.js', './js/visualizer.js', './js/render.js',
  './js/import.js', './js/playlists.js', './js/search.js', './js/modals.js',
  './js/keyboard.js', './js/main.js',
  './icons/aurora-192.png', './icons/aurora-512.png', './icons/aurora-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
