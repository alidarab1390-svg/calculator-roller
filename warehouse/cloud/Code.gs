/**
 * سرور ابری رایگان «سامانه انبار آسارول» روی Google Apps Script
 * نصب: راهنمای داخل برنامه (آموزش ← راه‌اندازی ابر) یا README.md
 *  1) در یک Google Sheet خالی: Extensions ← Apps Script ، این کد را جایگزین کنید.
 *  2) KEY را به یک رمز طولانی تغییر دهید (همین رمز را در برنامه وارد می‌کنید).
 *  3) Deploy ← New deployment ← Web app ← Execute as: Me ، Who has access: Anyone
 */
const KEY = 'CHANGE-ME-to-a-long-secret';
const REPORT_EMAIL = '';           // ایمیل مدیر برای گزارش روزانه (اختیاری)
const DATA_FILE = 'asaroul-warehouse-data.json';
const COLLS = ['users', 'warehouses', 'units', 'categories', 'items', 'parties', 'projects', 'docs', 'counts', 'caps', 'forms', 'audit', 'logins'];

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function folder_() { const f = DriveApp.getFileById(SpreadsheetApp.getActive().getId()).getParents(); return f.hasNext() ? f.next() : DriveApp.getRootFolder(); }
function load_() { const it = folder_().getFilesByName(DATA_FILE); return it.hasNext() ? JSON.parse(it.next().getBlob().getDataAsString('UTF-8')) : null; }
function store_(db) {
  const s = JSON.stringify(db), it = folder_().getFilesByName(DATA_FILE);
  if (it.hasNext()) it.next().setContent(s); else folder_().createFile(DATA_FILE, s, 'application/json');
  /* نسخه پشتیبان روزانه */
  const day = Utilities.formatDate(new Date(), 'Asia/Tehran', 'yyyy-MM-dd'), name = 'backup-' + day + '.json';
  if (!folder_().getFilesByName(name).hasNext()) folder_().createFile(name, s, 'application/json');
}
/* همان منطق ادغام برنامه: رکورد با زمان تغییر (u) جدیدتر برنده است */
function merge_(a, b) {
  if (!a) return b; if (!b) return a;
  const del = Object.assign({}, a.deleted || {}, b.deleted || {});
  COLLS.forEach(c => {
    const m = {};
    (a[c] || []).forEach(r => m[r.id] = r);
    (b[c] || []).forEach(r => { const o = m[r.id]; if (!o || (r.u || 0) >= (o.u || 0)) m[r.id] = r; });
    let arr = Object.keys(m).map(k => m[k]).filter(r => !del[r.id]);
    if (c === 'audit' || c === 'logins') arr.sort((x, y) => (y.ts || y.u) - (x.ts || x.u));
    a[c] = arr;
  });
  if ((b.settings.u || 0) > (a.settings.u || 0)) a.settings = b.settings;
  a.deleted = del; return a;
}
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.key !== KEY) return out_({ok: false, error: 'کلید امنیتی نادرست است'});
    const lock = LockService.getScriptLock(); lock.waitLock(30000);
    try {
      let db = load_();
      if (req.action === 'sync' && req.data) { db = merge_(db, req.data); store_(db); writeSheets_(db); }
      log_(req);
      return out_({ok: true, data: db});
    } finally { lock.releaseLock(); }
  } catch (err) { return out_({ok: false, error: String(err)}); }
}
function log_(req) {
  const sh = sheet_('همگام‌سازی', ['زمان', 'عمل', 'کاربر', 'دستگاه']);
  sh.insertRowAfter(1); sh.getRange(2, 1, 1, 4).setValues([[new Date(), req.action, req.user || '', req.device || '']]);
  if (sh.getLastRow() > 2000) sh.deleteRows(2001, sh.getLastRow() - 2000);
}
function sheet_(name, header) {
  const ss = SpreadsheetApp.getActive(); let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.setRightToLeft(true); sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#f3ecf5'); sh.setFrozenRows(1); }
  return sh;
}
function fill_(name, header, rows) {
  const sh = sheet_(name, header); sh.getRange(2, 1, Math.max(1, sh.getMaxRows() - 1), sh.getMaxColumns()).clearContent();
  if (rows.length) { if (sh.getMaxRows() < rows.length + 1) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 1 - sh.getMaxRows()); sh.getRange(2, 1, rows.length, header.length).setValues(rows); }
}
/* محاسبه موجودی (همان قواعد برنامه) */
function stock_(db) {
  const m = {};
  db.docs.forEach(d => {
    if (d.status !== 'final') return;
    d.lines.forEach(l => {
      if (!l.item || !l.base) return;
      if (d.type === 'IN' && l.qc && l.qc !== 'ok' && l.qc !== 'cond') return;
      const add = (wh, q) => { if (!wh) return; const k = l.item + '|' + wh; m[k] = (m[k] || 0) + q; };
      const sign = {IN: 1, RET_IN: 1, OUT: -1, LOAN_OUT: -1, LOAN_RET: 1, OPEN: 1, ADJ: 1}[d.type];
      if (d.type === 'TRANSFER') { add(d.wh, -l.base); add(d.toWh, l.base); }
      else add(d.wh, sign * l.base);
      if (d.type === 'LOAN_OUT') add(d.toWh, l.base); if (d.type === 'LOAN_RET') add(d.toWh, -l.base);
    });
  });
  return m;
}
const T_ = {IN: 'رسید انبار', RET_IN: 'برگشت به انبار', OUT: 'حواله خروج', TRANSFER: 'انتقال', LOAN_OUT: 'ارسال امانی', LOAN_RET: 'برگشت امانی', ADJ: 'اصلاحیه', OPEN: 'اول دوره'};
const S_ = {pending: 'در انتظار مجوز', final: 'قطعی', cancelled: 'ابطال'};
function writeSheets_(db) {
  const by = c => { const o = {}; (db[c] || []).forEach(r => o[r.id] = r); return o; };
  const I = by('items'), W = by('warehouses'), U = by('units'), P = by('parties'), J = by('projects');
  const nm = (o, id) => o[id] ? (o[id].name || '') : '';
  const st = stock_(db), whs = db.warehouses;
  fill_('موجودی', ['کد', 'کالا', 'واحد', 'موجودی کل', 'نقطه سفارش'].concat(whs.map(w => w.name)), db.items.map(i => {
    const per = whs.map(w => st[i.id + '|' + w.id] || 0); return [i.code, i.name, nm(U, i.base), per.reduce((a, b) => a + b, 0), i.min || ''].concat(per);
  }));
  const rows = [];
  db.docs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20000).forEach(d => d.lines.forEach(l => {
    const it = I[l.item] || {}; rows.push([d.no, d.date, T_[d.type], S_[d.status], it.code || '', it.name || '', l.qty, nm(U, l.unit), l.base, nm(U, it.base), nm(W, d.wh), nm(W, d.toWh), nm(P, d.party) || nm(W, d.party), J[d.project] ? (J[d.project].code + ' ' + J[d.project].name) : '', d.receiver || '', d.createdBy || '']);
  }));
  fill_('اسناد', ['شماره', 'تاریخ', 'نوع', 'وضعیت', 'کد', 'کالا', 'مقدار', 'واحد', 'مقدار پایه', 'واحد پایه', 'انبار', 'انبار مقصد', 'طرف حساب', 'پروژه', 'تحویل‌گیرنده', 'ثبت‌کننده'], rows);
  fill_('ورود کاربران', ['زمان', 'کاربر', 'نتیجه', 'دستگاه', 'آنلاین', 'توضیح'], (db.logins || []).slice(0, 3000).map(l => [l.at, l.user, l.ok ? 'موفق' : 'ناموفق', l.device, l.online ? 'بله' : 'خیر', l.note || '']));
  fill_('تغییرات', ['زمان', 'کاربر', 'عمل', 'بخش', 'مورد', 'جزئیات'], (db.audit || []).slice(0, 5000).map(a => [a.at, a.user, a.action, a.coll, a.title, String(a.detail || '').slice(0, 500)]));
}
/* صفحه گزارش آنلاین فقط‌خواندنی: <آدرس وب‌اپ>?key=KEY */
function doGet(e) {
  if (!e.parameter || e.parameter.key !== KEY) return HtmlService.createHtmlOutput('<p style="font-family:Tahoma;direction:rtl">برای مشاهده گزارش، آدرس را همراه با ?key=… باز کنید.</p>');
  const db = load_(); if (!db) return HtmlService.createHtmlOutput('هنوز داده‌ای همگام نشده است.');
  return HtmlService.createHtmlOutput(reportHtml_(db)).setTitle('گزارش انبار آسارول').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function reportHtml_(db) {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const by = c => { const o = {}; (db[c] || []).forEach(r => o[r.id] = r); return o; };
  const I = by('items'), U = by('units'), W = by('warehouses'), st = stock_(db);
  const tot = id => db.warehouses.reduce((a, w) => a + (st[id + '|' + w.id] || 0), 0);
  const last = db.docs.filter(d => d.status !== 'cancelled').sort((a, b) => (b.date + b.no).localeCompare(a.date + a.no)).slice(0, 40);
  const low = db.items.filter(i => i.min > 0 && tot(i.id) < i.min);
  const tb = (h, rows) => '<table><tr>' + h.map(x => '<th>' + x + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map(x => '<td>' + esc(x) + '</td>').join('') + '</tr>').join('') + '</table>';
  return '<html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:Tahoma;margin:12px;color:#241a26}h2{color:#44214b}table{border-collapse:collapse;width:100%;font-size:13px;margin-bottom:20px}td,th{border:1px solid #ddd;padding:4px 6px}th{background:#f3ecf5}</style></head><body>' +
    '<h2>گزارش انبار ' + esc(db.settings.company) + '</h2><p>به‌روزرسانی: ' + new Date().toLocaleString('fa-IR') + '</p>' +
    '<h3>کالاهای زیر نقطه سفارش (' + low.length + ')</h3>' + tb(['کد', 'کالا', 'موجودی', 'حداقل'], low.map(i => [i.code, i.name, tot(i.id), i.min])) +
    '<h3>آخرین اسناد</h3>' + tb(['شماره', 'تاریخ', 'نوع', 'انبار', 'اقلام', 'ثبت‌کننده'], last.map(d => [d.no, d.date, T_[d.type], (W[d.wh] || {}).name, d.lines.map(l => (I[l.item] || {}).name + ' ' + l.qty).join('، '), d.createdBy])) +
    '<h3>آخرین ورود کاربران</h3>' + tb(['زمان', 'کاربر', 'نتیجه', 'دستگاه'], (db.logins || []).slice(0, 20).map(l => [l.at, l.user, l.ok ? 'موفق' : 'ناموفق', l.device])) +
    '<h3>موجودی</h3>' + tb(['کد', 'کالا', 'واحد', 'موجودی'], db.items.filter(i => tot(i.id)).map(i => [i.code, i.name, (U[i.base] || {}).name, tot(i.id)])) + '</body></html>';
}
/* گزارش روزانه ایمیلی — یک‌بار اجرا کنید تا هر روز ساعت ۱۸ ارسال شود */
function installDailyReport() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'dailyReport').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyReport').timeBased().everyDays(1).atHour(18).inTimezone('Asia/Tehran').create();
}
function dailyReport() {
  if (!REPORT_EMAIL) return; const db = load_(); if (!db) return;
  MailApp.sendEmail({to: REPORT_EMAIL, subject: 'گزارش روزانه انبار ' + db.settings.company, htmlBody: reportHtml_(db)});
}
