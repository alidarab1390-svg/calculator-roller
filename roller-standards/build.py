#!/usr/bin/env python3
"""ساخت «رولیک و استانداردها — آسارول».
Usage: python3 build.py [admin-password]   (کتابخانه اکسل و فونت از src/vendor خوانده می‌شوند)

خروجی‌ها:
  Roller-Standards.html   فایل تکی و آفلاین (برای فرستادن و باز کردن مستقیم)
  app/                    نسخه نصبی وب (PWA) برای iOS، اندروید، ویندوز و مک
عکس محصولات: فایل‌های jpg/png/webp داخل src/photos با نام کلید (مثلاً roller-carry.jpg ، frame-t3-2.jpg)."""
import base64, hashlib, json, os, shutil, sys
here = os.path.dirname(os.path.abspath(__file__)); src = os.path.join(here, 'src')
rd = lambda p: open(p, encoding='utf-8').read()
xlsx = rd(os.path.join(src, 'vendor', 'xlsx.full.min.js')).replace('</script', '<\\/script')
font64 = base64.b64encode(open(os.path.join(src, 'vendor', 'Vazirmatn-wght.woff2'), 'rb').read()).decode()
pw = sys.argv[1] if len(sys.argv) > 1 else 'asaroul'
VERSION = '1.1'
font_css = "@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,%s) format('woff2');font-weight:100 900;font-display:swap}" % font64
mime = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}
photos = {}
pdir = os.path.join(src, 'photos')
for f in sorted(os.listdir(pdir)) if os.path.isdir(pdir) else []:
    k, ext = os.path.splitext(f)
    if ext.lower() in mime:
        photos[k] = 'data:%s;base64,%s' % (mime[ext.lower()], base64.b64encode(open(os.path.join(pdir, f), 'rb').read()).decode())
js = '\n'.join(rd(os.path.join(src, f)) for f in ['sha256.js', 'data_rollers.js', 'data_other.js', 'i18n.js', 'svg.js', 'app.js'])
js = js.replace('%%PW_HASH%%', hashlib.sha256(pw.encode()).hexdigest())

def page(head):
    html = rd(os.path.join(src, 'template.html'))
    for k, v in {'<!--HEAD-->': head, '/*FONT*/': font_css, '/*CSS*/': rd(os.path.join(src, 'style.css')), '/*XLSX*/': xlsx,
                 '/*LOGO*/': rd(os.path.join(src, 'logo.b64')).strip(), '/*FONTCSS*/': font_css.replace('"', '\\"'),
                 '/*PHOTOS*/': json.dumps(photos), '/*JS*/': js}.items():
        assert html.count(k) == 1, k
        html = html.replace(k, v)
    return html

single = os.path.join(here, 'Roller-Standards.html')
open(single, 'w', encoding='utf-8').write(page('<link rel="icon" href="' + rd(os.path.join(src, 'logo.b64')).strip() + '">'))
print(single, round(os.path.getsize(single) / 1024), 'KB,', len(photos), 'photos')

app = os.path.join(here, 'app'); os.makedirs(app, exist_ok=True)
head = '\n'.join(['<link rel="manifest" href="manifest.webmanifest">', '<meta name="theme-color" content="#3b1f47">',
    '<link rel="icon" href="icon-192.png">', '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
    '<meta name="apple-mobile-web-app-capable" content="yes">', '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">', '<meta name="apple-mobile-web-app-title" content="Asaroll">',
    '<meta name="application-name" content="Asaroll">'])
open(os.path.join(app, 'index.html'), 'w', encoding='utf-8').write(page(head))
for f in os.listdir(os.path.join(src, 'icons')): shutil.copy(os.path.join(src, 'icons', f), app)
json.dump({'id': 'asaroll-roller-standards', 'name': 'رولیک و استانداردها — آسارول | Asaroll Rollers & Standards', 'short_name': 'Asaroll',
    'description': 'Asaroll engineering reference: rollers, tubes, shafts, rubber, frames, tests, DIN/ISO/CEMA calculations',
    'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'any', 'dir': 'rtl', 'lang': 'fa',
    'background_color': '#f3eff5', 'theme_color': '#3b1f47',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]},
    open(os.path.join(app, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
ver = hashlib.sha256(open(os.path.join(app, 'index.html'), 'rb').read()).hexdigest()[:10]
open(os.path.join(app, 'sw.js'), 'w', encoding='utf-8').write("""// Asaroll Rollers & Standards — offline service worker (build %s)
const CACHE = 'asaroll-rs-%s';
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
""" % (VERSION, ver))
print(app, 'PWA build', ver)
