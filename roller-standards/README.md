# رولیک و استانداردها — Rollers & Standards (Asaroul)

نرم‌افزار مرجع مهندسی مستقل (بدون قیمت‌گذاری)، دو زبانه و کاملاً آفلاین.
خروجی نهایی: `Roller-Standards.html` (فونت، کتابخانه اکسل، لوگو و کد داخل همین یک فایل).

ساخت دوباره پس از تغییر سورس‌ها:

    python3 build.py <xlsx.full.min.js> <Vazirmatn[wght].woff2> [admin-password]

- `xlsx.full.min.js`: SheetJS 0.18.5 (`npm pack xlsx@0.18.5`)
- `Vazirmatn[wght].woff2`: بسته npm `vazirmatn`
- رمز پیش‌فرض مدیر در صورت عدم ذکر: `asaroul` (فقط هش آن در فایل قرار می‌گیرد)
