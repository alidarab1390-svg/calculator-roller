#!/usr/bin/env python3
"""ساخت نسخه تک‌فایلی و آفلاین «سامانه انبار آسارول» برای باز کردن مستقیم در Microsoft Edge / Chrome.
Usage: python3 build.py
Output: Asaroul-Warehouse.html (CSS، کد، کتابخانه اکسل و آیکون داخل همین یک فایل)."""
import base64, os, re
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(here, p), encoding='utf-8').read()
safe = lambda s: s.replace('</script', '<\\/script')
icon = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(here, 'icon-192.png'), 'rb').read()).decode()
html = rd('index.html')
html = re.sub(r'<link rel="(manifest|apple-touch-icon)"[^>]*>\n', '', html)
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + rd('style.css') + '</style>')
html = html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" defer></script>',
                    '<script>' + safe(rd('vendor/xlsx.full.min.js')) + '</script>')
html = re.sub(r'<script src="(js/[a-z0-9]+\.js)"></script>', lambda m: '<script>\n' + safe(rd(m.group(1))) + '</script>', html)
html = html.replace('icon-192.png', icon)
assert 'src="js/' not in html and 'style.css' not in html
out = os.path.join(here, 'Asaroul-Warehouse.html')
open(out, 'w', encoding='utf-8').write(html)
print(out, round(len(html.encode()) / 1024), 'KB')
