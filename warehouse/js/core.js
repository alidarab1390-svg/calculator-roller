/* هسته برنامه: ابزارها، تاریخ شمسی، ذخیره‌سازی محلی (IndexedDB)، گزارش تغییرات */
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const FA_DIG = '۰۱۲۳۴۵۶۷۸۹', AR_DIG = '٠١٢٣٤٥٦٧٨٩';
const toEn = s => String(s == null ? '' : s).replace(/[۰-۹]/g, d => FA_DIG.indexOf(d)).replace(/[٠-٩]/g, d => AR_DIG.indexOf(d));
const toFa = s => String(s == null ? '' : s).replace(/\d/g, d => FA_DIG[d]);
const num = v => { const n = parseFloat(toEn(v).replace(/[,٬\s]/g, '').replace('/', '.')); return isFinite(n) ? n : 0; };
const fmt = (n, d = 3) => { n = +n || 0; const r = Math.round(n * 10 ** d) / 10 ** d; return toFa(r.toLocaleString('en-US', {maximumFractionDigits: d})); };
/* یکسان‌سازی نام کالا: ی/ک عربی، فاصله‌ها، ارقام، علامت ضرب */
const normName = s => toEn(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[×xX]/g, '*').replace(/‌/g, ' ')
  .replace(/\s*\*\s*/g, '*').replace(/\s+/g, ' ').trim();
const normKey = s => normName(s).replace(/\s+/g, '').toLowerCase();

/* ---------- تاریخ شمسی (الگوریتم جلالی) ---------- */
const Jalali = (() => {
  const div = (a, b) => ~~(a / b), mod = (a, b) => a - ~~(a / b) * b;
  function jalCal(jy) {
    const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    let bl = breaks.length, gy = jy + 621, leapJ = -14, jp = breaks[0], jm, jump, leap, n, i;
    for (i = 1; i < bl; i++) { jm = breaks[i]; jump = jm - jp; if (jy < jm) break; leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4); jp = jm; }
    n = jy - jp; leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ++;
    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150, march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4); if (leap === -1) leap = 4;
    return {leap, gy, march};
  }
  function g2d(gy, gm, gd) { let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408; return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752; }
  function d2g(jdn) { let j = 4 * jdn + 139361631; j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908; const i = div(mod(j, 1461), 4) * 5 + 308; const gd = div(mod(i, 153), 5) + 1, gm = mod(div(i, 153), 12) + 1, gy = div(j, 1461) - 100100 + div(8 - gm, 6); return [gy, gm, gd]; }
  function j2d(jy, jm, jd) { const r = jalCal(jy); return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1; }
  function d2j(jdn) {
    const gy = d2g(jdn)[0]; let jy = gy - 621; const r = jalCal(jy), jdn1f = g2d(gy, 3, r.march); let jd, jm, k = jdn - jdn1f;
    if (k >= 0) { if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return [jy, jm, jd]; } k -= 186; }
    else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1; return [jy, jm, jd];
  }
  const pad = n => String(n).padStart(2, '0');
  const str = a => a[0] + '/' + pad(a[1]) + '/' + pad(a[2]);
  return {
    today() { const d = new Date(); return str(d2j(g2d(d.getFullYear(), d.getMonth() + 1, d.getDate()))); },
    /* ورودی آزاد مثل 1402/9/4 یا ۱۴۰۲-۰۹-۰۴ → 1402/09/04 */
    parse(s) { const m = toEn(s).trim().match(/^(1[34]\d\d)[\/\-.](\d{1,2})[\/\-.](\d{1,2})/); if (!m) return null; const a = [+m[1], +m[2], +m[3]]; if (a[1] < 1 || a[1] > 12 || a[2] < 1 || a[2] > 31) return null; return str(a); },
    toDay(s) { const p = String(s).split('/').map(Number); return j2d(p[0], p[1], p[2]); },
    fromDay(d) { return str(d2j(d)); },
    add(s, n) { return this.fromDay(this.toDay(s) + n); },
    /* شروع هفته (شنبه) */
    weekStart(s) { const d = this.toDay(s); const g = d2g(d); const wd = (new Date(g[0], g[1] - 1, g[2]).getDay() + 1) % 7; return this.fromDay(d - wd); },
    month(s) { return String(s).slice(0, 7); },
    weekday(s) { const g = d2g(this.toDay(s)); return ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'][new Date(g[0], g[1] - 1, g[2]).getDay()]; }
  };
})();
const nowStamp = () => { const d = new Date(); return Jalali.today() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

/* ---------- ذخیره‌سازی محلی ---------- */
const Store = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('asaroul-warehouse', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('kv', mode); const q = fn(t.objectStore('kv')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  return {get: k => tx('readonly', s => s.get(k)), set: (k, v) => tx('readwrite', s => s.put(v, k))};
})();

/* ساختار کامل داده‌ها — هر رکورد شناسه یکتا و زمان آخرین تغییر (u) دارد تا همگام‌سازی چند دستگاه ادغام شود */
const COLLECTIONS = ['users', 'warehouses', 'units', 'categories', 'items', 'parties', 'projects', 'docs', 'counts', 'caps', 'forms', 'audit', 'logins'];
let DB = null;
function blankDB() {
  const t = Date.now();
  const mk = (arr, extra) => arr.map((x, i) => Object.assign({id: uid() + i, u: t}, extra, x));
  return {
    v: 1, created: t,
    settings: {company: 'شرکت آسارول', unit: 'واحد انبار', year: Jalali.today().slice(0, 4), requireApproval: false, qcDefault: true,
      allowNegative: false, sessionMin: 30, cloud: {mode: 'none', url: '', key: '', auto: true, last: 0}, printFooter: 'این سند بدون امضای انباردار و تحویل‌گیرنده فاقد اعتبار است.'},
    users: [],
    warehouses: mk([
      {code: 'RM', name: 'انبار مواد اولیه', type: 'stock'}, {code: 'CM', name: 'انبار مصرفی', type: 'stock'},
      {code: 'SP', name: 'انبار یدکی', type: 'stock'}, {code: 'FG', name: 'انبار محصول', type: 'stock'},
      {code: 'TL', name: 'انبار ابزار', type: 'stock'}, {code: 'QC', name: 'قرنطینه کنترل کیفی', type: 'qc'},
      {code: 'SC', name: 'ضایعات و برگشتی', type: 'scrap'}], {active: true, keeper: '', note: ''}),
    units: mk(['عدد', 'کیلوگرم', 'گرم', 'تن', 'متر', 'شاخه', 'بسته', 'کارتن', 'گونی', 'کیسه', 'رول', 'جفت', 'دست', 'لیتر', 'بشکه', 'گالن', 'قوطی', 'ورق', 'دستگاه', 'سری'].map(n => ({name: n}))),
    categories: mk(['بلبرینگ', 'هوزینگ', 'لاستیک', 'لوله', 'شفت', 'درپوش', 'لابیرنت', 'خار', 'حلقه', 'کاسه نمد', 'گردگیر', 'رولیک', 'پایه رولیک', 'رنگ و حلال', 'سیم جوش', 'ابزار و مصرفی', 'ایمنی', 'بسته‌بندی', 'سایر'].map(n => ({name: n}))),
    items: [], parties: [], projects: [], docs: [], counts: [], caps: [],
    forms: [], audit: [], logins: [], deleted: {}
  };
}
async function loadDB() {
  DB = await Store.get('db');
  if (!DB) { DB = blankDB(); await saveDB(); }
  COLLECTIONS.forEach(c => DB[c] = DB[c] || []);
  DB.deleted = DB.deleted || {};
}
let saveTimer = null;
function saveDB() { clearTimeout(saveTimer); return new Promise(res => { saveTimer = setTimeout(() => Store.set('db', DB).then(() => { res(); if (typeof Sync !== 'undefined') Sync.dirty(); }), 120); }); }

/* ثبت / ویرایش / حذف با گزارش تغییرات */
const LABELS = {users: 'کاربر', warehouses: 'انبار', units: 'واحد', categories: 'گروه کالا', items: 'کالا', parties: 'طرف حساب', projects: 'پروژه', docs: 'سند', counts: 'انبارگردانی', caps: 'سقف مصرف', forms: 'فرم'};
const FIELD_NAMES = {date: 'تاریخ', wh: 'انبار', toWh: 'انبار مقصد', party: 'طرف حساب', project: 'پروژه', receiver: 'تحویل‌گیرنده', deliverer: 'تحویل‌دهنده', ref: 'شماره مرجع', note: 'توضیحات', status: 'وضعیت', due: 'سررسید', name: 'نام', code: 'کد', base: 'واحد پایه', alt: 'واحدهای فرعی', min: 'نقطه سفارش', max: 'حداکثر', kgPer: 'وزن واحد', role: 'نقش', active: 'فعال', custom: 'فیلدهای اضافی'};
function diffText(a, b) {
  if (!a) return 'ایجاد';
  const out = [];
  Object.keys(Object.assign({}, a, b)).forEach(k => {
    if (['u', 'id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'pass'].includes(k)) return;
    const x = JSON.stringify(a[k]), y = JSON.stringify(b[k]);
    if (x === y) return;
    if (k === 'lines' && typeof linesText === 'function') out.push('اقلام: ' + linesText(a[k]) + ' ← ' + linesText(b[k]));
    else out.push((FIELD_NAMES[k] || k) + ': ' + (x || '—').slice(0, 60) + ' ← ' + (y || '—').slice(0, 60));
  });
  return out.join(' | ') || 'بدون تغییر';
}
function audit(action, coll, rec, detail) {
  DB.audit.unshift({id: uid(), u: Date.now(), at: nowStamp(), ts: Date.now(), user: Auth.name(), action, coll, rid: rec && rec.id, title: rec ? (rec.no || rec.code || rec.name || rec.username || '') : '', detail: detail || ''});
  if (DB.audit.length > 20000) DB.audit.length = 20000;
}
function upsert(coll, rec, note) {
  const list = DB[coll]; const i = rec.id ? list.findIndex(x => x.id === rec.id) : -1;
  const before = i >= 0 ? JSON.parse(JSON.stringify(list[i])) : null;
  rec.id = rec.id || uid(); rec.u = Date.now();
  if (!before) { rec.createdAt = nowStamp(); rec.createdBy = Auth.name(); list.push(rec); }
  else { rec.updatedAt = nowStamp(); rec.updatedBy = Auth.name(); list[i] = rec; }
  audit(before ? 'ویرایش' : 'ایجاد', coll, rec, note || diffText(before, rec));
  saveDB(); return rec;
}
function removeRec(coll, id, why) {
  const i = DB[coll].findIndex(x => x.id === id); if (i < 0) return;
  const rec = DB[coll][i]; DB[coll].splice(i, 1); DB.deleted[id] = Date.now();
  audit('حذف', coll, rec, why || ''); saveDB();
}
const byId = (coll, id) => DB[coll].find(x => x.id === id);
