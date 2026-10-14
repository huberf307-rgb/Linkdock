// Linkdock service worker — makes the app installable and usable offline.
// Pages load network-first (so new deployments show up immediately);
// images and other assets are served from cache once they've been seen.

const CACHE = 'linkdock-v4';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './vendor/qrcode.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) || cache.match('./index.html');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  // Opaque (no-cors) responses are skipped — they cost a lot of quota.
  // Icon requests are only kept when they really are images: a host without
  // the /api/icon function answers with the HTML page instead.
  const isImage = (response.headers.get('content-type') || '').startsWith('image/');
  const isIcon = request.url.includes('/api/icon') || new URL(request.url).hostname === 'icon.horse';
  if (response.ok && (!isIcon || isImage)) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.webmanifest')) {
    event.respondWith(networkFirst(request));
  } else if (url.origin === location.origin || url.hostname.endsWith('fonts.gstatic.com')
             || url.hostname === 'icon.horse') {
    event.respondWith(cacheFirst(request));
  }
});
