/* پشتیبان‌گیری و همگام‌سازی ابری (Google Apps Script یا پوشه همگام Drive/OneDrive) */
'use strict';
/* ادغام دو نسخه: هر رکورد با زمان تغییر جدیدتر برنده است؛ رکوردهای حذف‌شده حذف می‌مانند */
function mergeDB(local, remote) {
  if (!remote || !remote.settings) return local;
  const del = Object.assign({}, remote.deleted || {}, local.deleted || {});
  COLLECTIONS.forEach(c => {
    const m = new Map();
    (remote[c] || []).forEach(r => m.set(r.id, r));
    (local[c] || []).forEach(r => { const o = m.get(r.id); if (!o || (r.u || 0) >= (o.u || 0)) m.set(r.id, r); });
    let arr = [...m.values()].filter(r => !del[r.id]);
    if (c === 'audit' || c === 'logins') arr.sort((a, b) => (b.ts || b.u) - (a.ts || a.u));
    local[c] = arr;
  });
  const cloud = local.settings.cloud;
  if ((remote.settings.u || 0) > (local.settings.u || 0)) local.settings = Object.assign({}, remote.settings);
  local.settings.cloud = cloud; local.deleted = del;
  return local;
}
const exportable = () => { const d = JSON.parse(JSON.stringify(DB)); d.settings.cloud = {mode: 'none', url: '', key: '', auto: true, last: 0}; return d; };

const Backup = {
  download() {
    const blob = new Blob([JSON.stringify(exportable())], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'پشتیبان-انبار-آسارول-' + Jalali.today().replace(/\//g, '-') + '.json'; a.click();
    audit('پشتیبان‌گیری', 'settings', {name: 'فایل پشتیبان'}); saveDB(); UI.toast('فایل پشتیبان دانلود شد', 'ok');
  },
  restorePrompt(fromLogin) {
    UI.modal('بازیابی اطلاعات', `<p>یکی از روش‌ها را انتخاب کنید:</p><div class="form one"><label>از فایل پشتیبان (.json)<input type="file" id="rb_f" accept=".json,application/json"></label>
      <label class="chk"><input type="checkbox" id="rb_m" checked> ادغام با اطلاعات فعلی (اگر تیک نخورد، اطلاعات فعلی جایگزین می‌شود)</label>
      <hr><b>یا از ابر (Google Sheets)</b><label>آدرس وب‌اپ<input id="rb_u" dir="ltr" placeholder="https://script.google.com/macros/s/…/exec"></label><label>کلید امنیتی<input id="rb_k" dir="ltr"></label></div>`,
      [{t: 'انصراف'}, {t: 'بازیابی', c: 'pri', f: async () => {
        const file = $('rb_f').files[0]; let remote = null;
        try {
          if (file) remote = JSON.parse(await file.text());
          else if ($('rb_u').value.trim()) { DB.settings.cloud = Object.assign(DB.settings.cloud, {mode: 'gas', url: $('rb_u').value.trim(), key: $('rb_k').value.trim(), auto: true}); remote = await Sync.gasCall('pull'); }
          else { UI.toast('فایل یا آدرس ابر را وارد کنید', 'err'); return false; }
        } catch (e) { UI.toast('خطا: ' + e.message, 'err'); return false; }
        if (!remote || !remote.settings) { UI.toast('فایل/پاسخ معتبر نیست', 'err'); return false; }
        if ($('rb_m').checked || fromLogin) mergeDB(DB, remote); else { const cl = DB.settings.cloud; DB = remote; COLLECTIONS.forEach(c => DB[c] = DB[c] || []); DB.deleted = DB.deleted || {}; DB.settings.cloud = cl; }
        await Store.set('db', DB); UI.toast('اطلاعات بازیابی شد: ' + toFa(DB.items.length) + ' کالا، ' + toFa(DB.docs.length) + ' سند', 'ok');
        setTimeout(() => location.reload(), 900);
      }}]);
  },
  excel() {
    if (typeof XLSX === 'undefined') { UI.toast('کتابخانه اکسل بارگذاری نشده', 'err'); return; }
    const wb = XLSX.utils.book_new(); wb.Workbook = {Views: [{RTL: true}]};
    const sheet = (name, aoa) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
    const docRows = t => DB.docs.filter(d => t.includes(d.type)).sort((a, b) => a.date.localeCompare(b.date)).flatMap(d => d.lines.map(l => { const it = itemOf(l.item) || {}; return [d.no, d.date, DOC_TYPES[d.type].t, it.code, it.name, l.qty, unitName(l.unit), l.base, unitName(it.base), whName(d.wh), d.toWh ? whName(d.toWh) : '', partyName(d.party), projName(d.project), d.receiver || d.deliverer || '', d.ref || '', l.qc ? QC[l.qc] : '', STATUS[d.status], d.note || '', d.createdBy || '']; }));
    const H = ['شماره سند', 'تاریخ', 'نوع', 'کد کالا', 'شرح کالا', 'مقدار', 'واحد', 'مقدار پایه', 'واحد پایه', 'انبار', 'انبار مقصد', 'طرف حساب', 'پروژه', 'تحویل‌گیرنده/دهنده', 'شماره مرجع', 'QC', 'وضعیت', 'توضیحات', 'ثبت‌کننده'];
    sheet('ورودی', [H].concat(docRows(['IN', 'RET_IN', 'LOAN_RET', 'OPEN'])));
    sheet('خروجی', [H].concat(docRows(['OUT', 'LOAN_OUT'])));
    sheet('انتقال و اصلاحیه', [H].concat(docRows(['TRANSFER', 'ADJ'])));
    sheet('موجودی انبارها', [['کد', 'کالا', 'واحد', 'موجودی کل'].concat(DB.warehouses.map(w => w.name))].concat(DB.items.map(i => [i.code, i.name, unitName(i.base), stockOf(i.id)].concat(DB.warehouses.map(w => stockOf(i.id, w.id))))));
    sheet('کالاها', [['کد', 'نام', 'گروه', 'واحد پایه', 'وزن واحد', 'نقطه سفارش', 'حداکثر', 'واحدهای فرعی']].concat(DB.items.map(i => [i.code, i.name, (byId('categories', i.cat) || {}).name, unitName(i.base), i.kgPer || '', i.min || '', i.max || '', (i.alt || []).map(a => unitName(a.unit) + '=' + a.f).join(' ، ')])));
    XLSX.writeFile(wb, 'انبار آسارول ' + Jalali.today().replace(/\//g, '-') + '.xlsx');
  },
  wipe() {
    const t = prompt('برای پاک کردن کامل همه اطلاعات این دستگاه، عبارت «پاک شود» را بنویسید. (ابتدا پشتیبان بگیرید!)');
    if (t !== 'پاک شود') return;
    Store.set('db', null).then(() => { try { sessionStorage.clear(); } catch (e) {} location.reload(); });
  }
};

const Sync = (() => {
  let timer = null, busy = false, lastErr = '', dirHandle = null;
  const cl = () => DB.settings.cloud;
  async function gasCall(action, data) {
    const r = await fetch(cl().url, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify({key: cl().key, action, device: Auth.device(), user: Auth.name(), data})});
    const j = await r.json(); if (!j.ok) throw new Error(j.error || 'خطای سرور'); return j.data;
  }
  async function folder() {
    if (!dirHandle) dirHandle = await Store.get('dir');
    if (!dirHandle) throw new Error('پوشه انتخاب نشده');
    if ((await dirHandle.queryPermission({mode: 'readwrite'})) !== 'granted') throw new Error('برای دسترسی به پوشه، یک‌بار دکمه «همگام‌سازی الان» را بزنید');
    let remote = null;
    try { const fh = await dirHandle.getFileHandle('asaroul-warehouse-data.json'); remote = JSON.parse(await (await fh.getFile()).text()); } catch (e) {}
    mergeDB(DB, remote);
    const fh = await dirHandle.getFileHandle('asaroul-warehouse-data.json', {create: true}); const w = await fh.createWritable(); await w.write(JSON.stringify(exportable())); await w.close();
    /* نسخه روزانه برای اطمینان */
    try { const bh = await dirHandle.getDirectoryHandle('backups', {create: true}); const f2 = await bh.getFileHandle('backup-' + Jalali.today().replace(/\//g, '-') + '.json', {create: true}); const w2 = await f2.createWritable(); await w2.write(JSON.stringify(exportable())); await w2.close(); } catch (e) {}
  }
  async function run(manual) {
    if (busy || cl().mode === 'none') return; if (!navigator.onLine && cl().mode === 'gas') { lastErr = 'اینترنت قطع است؛ تغییرات در صف ارسال ماند'; if (manual) UI.toast(lastErr, 'err'); return; }
    busy = true; setBadge('…');
    try {
      if (cl().mode === 'gas') { if (!cl().url) throw new Error('آدرس وب‌اپ وارد نشده'); const remote = await gasCall('sync', exportable()); mergeDB(DB, remote); }
      else { if (manual && dirHandle && (await dirHandle.queryPermission({mode: 'readwrite'})) !== 'granted') await dirHandle.requestPermission({mode: 'readwrite'}); await folder(); }
      cl().last = Date.now(); lastErr = ''; await Store.set('db', DB); pending = false;
      if (manual) UI.toast('همگام‌سازی انجام شد', 'ok');
      if (Auth.user()) { const u = byId('users', Auth.user().id); if (!u || !u.active) Auth.logout(true); else UI.nav(); }
    } catch (e) { lastErr = e.message; if (manual) UI.toast('همگام‌سازی ناموفق: ' + e.message, 'err'); }
    busy = false; setBadge();
  }
  let pending = false;
  function setBadge(t) { const b = $('syncb'); if (!b) return; const m = cl().mode; b.textContent = t || (m === 'none' ? '💾 محلی' : lastErr ? '⚠️ ابر' : pending ? '⏳ ابر' : '☁️ ابر'); b.title = Sync.status(); b.className = 'hb ' + (lastErr ? 'bad' : ''); }
  addEventListener('online', () => { setNet(); if (cl().auto) run(); }); addEventListener('offline', setNet);
  function setNet() { const n = $('netb'); if (n) { n.textContent = navigator.onLine ? '🟢 آنلاین' : '🔴 آفلاین'; n.className = 'hb ' + (navigator.onLine ? '' : 'bad'); } setBadge(); }
  setInterval(() => { if (DB && cl().auto && cl().mode !== 'none' && Auth.user()) run(); }, 5 * 60000);
  return {
    gasCall, run, setNet, setBadge,
    dirty() { pending = true; setBadge(); if (cl().auto && cl().mode !== 'none') { clearTimeout(timer); timer = setTimeout(run, 15000); } },
    status() { const c = cl(); if (c.mode === 'none') return 'همگام‌سازی غیرفعال — اطلاعات فقط روی همین دستگاه'; return (c.last ? 'آخرین همگام‌سازی: ' + new Date(c.last).toLocaleString('fa-IR') : 'هنوز همگام نشده') + (lastErr ? ' — خطا: ' + lastErr : '') + (pending ? ' — تغییرات ارسال‌نشده وجود دارد' : ''); },
    async pickFolder() {
      if (!window.showDirectoryPicker) { UI.toast('این مرورگر انتخاب پوشه را پشتیبانی نمی‌کند (Chrome یا Edge روی لپ‌تاپ لازم است)', 'err'); return; }
      try { dirHandle = await showDirectoryPicker({id: 'asaroul-wh', mode: 'readwrite'}); await Store.set('dir', dirHandle); cl().mode = 'folder'; saveDB(); UI.toast('پوشه انتخاب شد: ' + dirHandle.name, 'ok'); run(true); } catch (e) {}
    }
  };
})();
