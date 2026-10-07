const CACHE = 'rus-v12-pages';
const FILES = ['index.html', 'manifest.webmanifest', 'metu-logo.jpg', 'models/tutor.glb'];
const scoped = path => new URL(path, self.registration.scope).href;
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(scoped))).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('rus-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(scoped('index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) event.waitUntil(caches.open(CACHE).then(c => c.put(request, response.clone())));
    return response;
  })).catch(() => new Response('Offline', { status: 503 })));
});
