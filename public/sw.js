/* PalmChef service worker: cache-first for static, network-first for HTML/API.
   This SW also supports manual updates via postMessage({type:'SKIP_WAITING'}) */

const CACHE_PREFIX = 'palmchef';
const STATIC_CACHE = `${CACHE_PREFIX}-static-v3`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v3`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo.png'
  // Vite will add hashed assets automatically at build time; this list is a minimal bootstrap.
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network helpers
const isHtmlRequest = (req) =>
  req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Bypass non-GET
  if (request.method !== 'GET') return;

  // HTML: network-first (fallback to cache)
  if (isHtmlRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, net.clone());
          return net;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match('/index.html');
        }
      })()
    );
    return;
  }

  // Static assets: cache-first
  if (request.url.startsWith(self.location.origin)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const net = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, net.clone());
        return net;
      })()
    );
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith(
    (async () => {
      try {
        const net = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, net.clone());
        return net;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error('Network error and no cached response.');
      }
    })()
  );
});

// Allow page to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
