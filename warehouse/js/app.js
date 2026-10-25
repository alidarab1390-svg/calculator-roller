/* راه‌اندازی برنامه، نصب (PWA) و اجرای آفلاین */
'use strict';
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; const b = $('instb'); if (b) b.classList.remove('hidden'); });
(async function boot() {
  try { await loadDB(); }
  catch (e) { document.body.innerHTML = '<p style="padding:30px;font-family:Tahoma">ذخیره‌سازی مرورگر در دسترس نیست (حالت ناشناس؟). برنامه را در پنجره عادی Chrome یا Edge باز کنید.<br>' + esc(e.message) + '</p>'; return; }
  const ib = $('instb'); ib.classList.add('hidden');
  ib.onclick = async () => { if (!installEvt) { Help.show('install'); return; } installEvt.prompt(); await installEvt.userChoice; installEvt = null; ib.classList.add('hidden'); };
  Sync.setNet();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (Auth.resume()) UI.enter(); else UI.showLogin();
  if (DB.settings.cloud.mode !== 'none' && DB.settings.cloud.auto && navigator.onLine) setTimeout(() => Sync.run(), 3000);
})();
