# رولیک و استانداردها — Rollers & Standards (Asaroll)

نرم‌افزار مرجع مهندسی مستقل (بدون قیمت‌گذاری)، دو زبانه و کاملاً آفلاین.
خروجی نهایی: `Roller-Standards.html` (فونت، کتابخانه اکسل، لوگو و کد داخل همین یک فایل).

ساخت دوباره پس از تغییر سورس‌ها:

    python3 build.py [admin-password]

- خروجی `Roller-Standards.html`: فایل تکی و آفلاین برای ارسال
- خروجی `app/`: نسخه نصبی (PWA) برای iOS، اندروید، ویندوز و مک — روی GitHub Pages منتشر می‌شود
- کتابخانه اکسل (SheetJS 0.18.5، Apache-2.0) و فونت وزیرمتن (OFL) در `src/vendor`
- عکس محصولات: فایل‌های jpg/png/webp در `src/photos` با نام کلید؛ مثلاً `roller-carry.jpg`، `roller-retring-2.jpg`، `frame-t3.jpg`، `rubber-NL.jpg`، `shaft-flat.jpg`
- رمز پیش‌فرض مدیر در صورت عدم ذکر: `asaroul` (فقط هش آن در فایل قرار می‌گیرد)
