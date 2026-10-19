#!/usr/bin/env python3
"""ساخت فایل تک‌فایلی و آفلاین «رولیک و استانداردها».
Usage: python3 build.py <xlsx.full.min.js> <Vazirmatn[wght].woff2> [password]
Output: Roller-Standards.html (font, Excel library, logo and code all embedded)."""
import base64, hashlib, json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); src = os.path.join(here, 'src')
rd = lambda p: open(p, encoding='utf-8').read()
xlsx = rd(sys.argv[1]).replace('</script', '<\\/script')
font64 = base64.b64encode(open(sys.argv[2], 'rb').read()).decode()
pw = sys.argv[3] if len(sys.argv) > 3 else 'asaroul'
font_css = "@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,%s) format('woff2');font-weight:100 900;font-display:swap}" % font64
js = '\n'.join(rd(os.path.join(src, f)) for f in ['sha256.js', 'data_rollers.js', 'data_other.js', 'i18n.js', 'svg.js', 'app.js'])
js = js.replace('%%PW_HASH%%', hashlib.sha256(pw.encode()).hexdigest())
html = rd(os.path.join(src, 'template.html'))
for k, v in {'/*FONT*/': font_css, '/*CSS*/': rd(os.path.join(src, 'style.css')), '/*XLSX*/': xlsx,
             '/*LOGO*/': rd(os.path.join(src, 'logo.b64')).strip(), '/*FONTCSS*/': font_css.replace('"', '\\"'), '/*JS*/': js}.items():
    assert html.count(k) == 1, k
    html = html.replace(k, v)
out = os.path.join(here, 'Roller-Standards.html')
open(out, 'w', encoding='utf-8').write(html)
print(out, round(len(html.encode()) / 1024), 'KB')
