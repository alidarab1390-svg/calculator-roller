// Service Worker — اجرای آفلاین سامانه انبار آسارول
// فایل‌های برنامه: اول شبکه (برای دریافت نسخه جدید)، در نبود اینترنت از حافظه
// کتابخانه‌ها و فونت‌ها: اول حافظه، سپس شبکه
const CACHE = 'asaroul-wh-v2';
const JS = ['sha256', 'core', 'auth', 'domain', 'ui', 'docs', 'master', 'reports', 'admin', 'sync', 'importer', 'help', 'app'].map(f => 'js/' + f + '.js');
const CORE = ['./', 'index.html', 'style.css', 'manifest.json', 'icon-192.png', 'icon-512.png', ...JS,
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u =>
    c.add(new Request(u, {mode: u.startsWith('http') ? 'no-cors' : 'same-origin'})).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  const own = url.origin === location.origin;
  if (own) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
