// Asaroll Rollers & Standards — offline service worker (build 4.0)
const CACHE = 'asaroll-rs-e9df55a8c1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const page = e.request.mode === 'navigate';
  e.respondWith(page
    ? fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); return r; }).catch(() => caches.match('index.html'))
    : caches.match(e.request, {ignoreSearch: true}).then(h => h || fetch(e.request)));
});
