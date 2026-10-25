/* منطق انبار: انواع سند، تبدیل واحد، محاسبه موجودی، امانی‌ها، سقف مصرف */
'use strict';
const DOC_TYPES = {
  IN:       {t: 'رسید انبار (ورود کالا)', p: 'IN',  sign: +1, party: 'supplier', icon: '📥', print: 'رسید انبار'},
  RET_IN:   {t: 'برگشت به انبار / مرجوعی', p: 'RT', sign: +1, party: 'any', icon: '↩️', print: 'رسید برگشت به انبار'},
  OUT:      {t: 'حواله خروج (مصرف / تحویل)', p: 'OUT', sign: -1, party: 'receiver', icon: '📤', print: 'حواله خروج کالا'},
  TRANSFER: {t: 'انتقال بین انبارها', p: 'TR', sign: 0, party: 'none', icon: '🔁', print: 'برگه انتقال بین انبارها'},
  LOAN_OUT: {t: 'ارسال امانی', p: 'LN', sign: -1, party: 'any', icon: '🤝', print: 'برگه ارسال امانی'},
  LOAN_RET: {t: 'برگشت امانی', p: 'LR', sign: +1, party: 'any', icon: '🔙', print: 'رسید برگشت امانی'},
  ADJ:      {t: 'اصلاحیه / انبارگردانی', p: 'ADJ', sign: 1, party: 'none', icon: '⚖️', print: 'سند اصلاحیه موجودی'},
  OPEN:     {t: 'موجودی اول دوره', p: 'OP', sign: +1, party: 'none', icon: '🏁', print: 'سند موجودی اول دوره'}
};
const STATUS = {pending: 'در انتظار مجوز', final: 'قطعی', cancelled: 'ابطال‌شده'};
const QC = {pending: 'در انتظار QC', ok: 'تایید QC', rej: 'رد QC', cond: 'قبول مشروط'};

const unitName = id => { const u = byId('units', id); return u ? u.name : (id || ''); };
const whName = id => { const w = byId('warehouses', id); return w ? w.name : '—'; };
const itemOf = id => byId('items', id);
const itemLabel = it => it ? (it.code ? it.code + ' — ' : '') + it.name : '؟';
const partyName = id => { const p = byId('parties', id) || byId('warehouses', id) || byId('projects', id); return p ? p.name : (id || ''); };
const projName = id => { const p = byId('projects', id); return p ? [p.code, p.name].filter(Boolean).join(' — ') : (id || ''); };

/* ضریب تبدیل: هر «unit» برابر چند «واحد پایه» کالاست */
function unitFactor(it, unitId) {
  if (!it || !unitId || unitId === it.base) return 1;
  const a = (it.alt || []).find(x => x.unit === unitId); if (a && a.f) return +a.f;
  const kg = DB.units.find(u => u.name === 'کیلوگرم'), g = DB.units.find(u => u.name === 'گرم'), ton = DB.units.find(u => u.name === 'تن');
  const baseU = unitName(it.base);
  if (it.kgPer > 0) {
    if (kg && unitId === kg.id) return 1 / it.kgPer;
    if (g && unitId === g.id) return 1 / (it.kgPer * 1000);
    if (ton && unitId === ton.id) return 1000 / it.kgPer;
  }
  if (baseU === 'کیلوگرم') { if (g && unitId === g.id) return 0.001; if (ton && unitId === ton.id) return 1000; }
  return null;
}
function itemUnits(it) {
  if (!it) return [];
  return DB.units.filter(u => unitFactor(it, u.id) != null);
}
const toBase = (it, qty, unit) => { const f = unitFactor(it, unit); return f == null ? null : qty * f; };
const linesText = ls => (ls || []).map(l => { const it = itemOf(l.item); return (it ? it.name : '?') + ' ' + fmt(l.qty) + ' ' + unitName(l.unit) + (l.qc ? ' [' + QC[l.qc] + ']' : ''); }).join('، ') || '—';
/* نمایش مقدار در واحد پایه + معادل در واحدهای دیگر (مثلاً ۳۷ شاخه ≈ ۲۲۲ متر ≈ ۱٬۸۵۰ کیلوگرم) */
function qtyText(it, base, withAlt) {
  if (!it) return fmt(base);
  let s = fmt(base) + ' ' + unitName(it.base);
  if (withAlt) {
    const alts = itemUnits(it).filter(u => u.id !== it.base).slice(0, 2).map(u => '≈ ' + fmt(base / unitFactor(it, u.id), 2) + ' ' + u.name);
    if (alts.length) s += ' <small class="mut">(' + alts.join('، ') + ')</small>';
  }
  return s;
}

function nextDocNo(type, date) {
  const p = DOC_TYPES[type].p, y = (date || Jalali.today()).slice(0, 4), pre = (DB.settings.prefix || 'ASR') + '-' + p + '-' + y + '-';
  let max = 0; DB.docs.forEach(d => { if (d.no && d.no.startsWith(pre)) max = Math.max(max, parseInt(d.no.slice(pre.length)) || 0); });
  return pre + String(max + 1).padStart(4, '0');
}

/* حرکت‌های موجودی یک سند: [{item, wh, q}] (q بر حسب واحد پایه، با علامت) */
function docMoves(d) {
  if (d.status !== 'final') return [];
  const m = [];
  (d.lines || []).forEach(l => {
    if (!l.item || !l.base) return;
    if (d.type === 'IN' && l.qc && l.qc !== 'ok' && l.qc !== 'cond') return;
    const T = DOC_TYPES[d.type];
    if (d.type === 'TRANSFER') { m.push({item: l.item, wh: d.wh, q: -l.base}); if (d.toWh) m.push({item: l.item, wh: d.toWh, q: l.base}); }
    else if (d.type === 'ADJ') m.push({item: l.item, wh: d.wh, q: l.base});
    else m.push({item: l.item, wh: d.wh, q: T.sign * l.base});
    if (d.type === 'LOAN_OUT' && d.toWh) m.push({item: l.item, wh: d.toWh, q: l.base});
    if (d.type === 'LOAN_RET' && d.toWh) m.push({item: l.item, wh: d.toWh, q: -l.base});
  });
  return m;
}
let _stockCache = null, _stockVer = -1;
function stockMap() {
  const ver = DB.docs.reduce((a, d) => a + d.u, DB.docs.length);
  if (_stockCache && _stockVer === ver) return _stockCache;
  const m = {};
  DB.docs.forEach(d => docMoves(d).forEach(x => { const k = x.item + '|' + x.wh; m[k] = (m[k] || 0) + x.q; }));
  _stockCache = m; _stockVer = ver; return m;
}
const stockOf = (item, wh) => { const m = stockMap(); if (wh) return m[item + '|' + wh] || 0; let s = 0; for (const k in m) if (k.startsWith(item + '|')) s += m[k]; return s; };
function qcPending(item) {
  let s = 0; DB.docs.forEach(d => { if (d.type === 'IN' && d.status !== 'cancelled') d.lines.forEach(l => { if (l.item === item && l.qc === 'pending') s += l.base; }); }); return s;
}

/* مانده امانی‌ها: هر خط ارسال امانی منهای برگشت‌های مرتبط */
function loanBalances() {
  const out = [];
  DB.docs.filter(d => d.type === 'LOAN_OUT' && d.status === 'final').forEach(d => d.lines.forEach((l, i) => {
    const ref = d.id + ':' + i; let back = 0;
    DB.docs.forEach(r => { if (r.type === 'LOAN_RET' && r.status === 'final') r.lines.forEach(rl => { if (rl.loanRef === ref) back += rl.base; }); });
    out.push({doc: d, line: l, ref, sent: l.base, back, open: l.base - back, due: d.due || ''});
  }));
  return out;
}

/* مصرف (خروج قطعی) یک کالا در بازه */
function consumption(item, from, to, wh, exclude) {
  let s = 0;
  DB.docs.forEach(d => { if (d.type === 'OUT' && d.status === 'final' && d.id !== exclude && d.date >= from && d.date <= to && (!wh || d.wh === wh)) d.lines.forEach(l => { if (l.item === item) s += l.base; }); });
  return s;
}
const PERIODS = {day: 'روزانه', week: 'هفتگی', month: 'ماهانه'};
function periodRange(period, date) {
  if (period === 'day') return [date, date];
  if (period === 'week') { const s = Jalali.weekStart(date); return [s, Jalali.add(s, 6)]; }
  return [date.slice(0, 8) + '01', date.slice(0, 8) + '31'];
}
/* بررسی سقف مصرف هنگام صدور حواله: هشدارها را برمی‌گرداند */
function capWarnings(doc) {
  const w = [];
  if (doc.type !== 'OUT') return w;
  const sums = {}; doc.lines.forEach(l => { if (l.item) sums[l.item] = (sums[l.item] || 0) + (l.base || 0); });
  Object.keys(sums).forEach(item => DB.caps.filter(c => c.item === item && (!c.wh || c.wh === doc.wh)).forEach(c => {
    const [a, b] = periodRange(c.period, doc.date);
    const used = consumption(item, a, b, c.wh, doc.id);
    if (used + sums[item] > c.max) w.push(itemLabel(itemOf(item)) + ': سقف ' + PERIODS[c.period] + ' ' + fmt(c.max) + ' — مصرف با این حواله ' + fmt(used + sums[item]));
  }));
  return w;
}
/* کنترل موجودی منفی */
function negativeWarnings(doc) {
  const w = [], need = {};
  const tmp = Object.assign({}, doc, {status: 'final'});
  docMoves(tmp).forEach(x => { if (x.q < 0) { const k = x.item + '|' + x.wh; need[k] = (need[k] || 0) - x.q; } });
  const old = DB.docs.find(x => x.id === doc.id);
  const oldM = {}; if (old) docMoves(old).forEach(x => { const k = x.item + '|' + x.wh; oldM[k] = (oldM[k] || 0) + x.q; });
  Object.keys(need).forEach(k => {
    const [item, wh] = k.split('|'); const have = (stockMap()[k] || 0) - (oldM[k] || 0);
    if (have - need[k] < -1e-9) w.push(itemLabel(itemOf(item)) + ' در «' + whName(wh) + '»: موجودی ' + fmt(have) + '، درخواست ' + fmt(need[k]));
  });
  return w;
}

function newItemCode(catName) {
  const map = {'بلبرینگ': 'BRG', 'هوزینگ': 'HSG', 'لاستیک': 'RUB', 'لوله': 'PIP', 'شفت': 'SHF', 'درپوش': 'CAP', 'لابیرنت': 'LAB', 'خار': 'CLP', 'حلقه': 'RNG', 'کاسه نمد': 'SEL', 'گردگیر': 'DST', 'رولیک': 'ROL', 'پایه رولیک': 'FRM', 'رنگ و حلال': 'PNT', 'سیم جوش': 'WLD', 'ابزار و مصرفی': 'TLS', 'ایمنی': 'SAF', 'بسته‌بندی': 'PKG'};
  const pre = map[catName] || 'GEN'; let max = 0;
  DB.items.forEach(i => { if (i.code && i.code.startsWith(pre + '-')) max = Math.max(max, parseInt(i.code.slice(pre.length + 1)) || 0); });
  return pre + '-' + String(max + 1).padStart(4, '0');
}
function guessCategory(name) {
  const n = normName(name);
  const rules = [[/^بلبرینگ|^بلبرینک|^ball/i, 'بلبرینگ'], [/^هوزینگ/, 'هوزینگ'], [/^لاستیک/, 'لاستیک'], [/^لوله/, 'لوله'], [/^شفت|^میلگرد/, 'شفت'], [/^درپوش/, 'درپوش'], [/^لابیرنت/, 'لابیرنت'], [/^خار/, 'خار'], [/^حلقه|^وی ?رینگ|^اورینگ|^رینگ/, 'حلقه'], [/^کاسه|^نمد/, 'کاسه نمد'], [/^گردگیر/, 'گردگیر'], [/^پایه/, 'پایه رولیک'], [/^رولیک/, 'رولیک'], [/^رنگ|^تینر|^اسپری/, 'رنگ و حلال'], [/^سیم ?جوش|^الکترود/, 'سیم جوش'], [/^دستکش|^عینک|^ماسک|^کفش|^مچی|^شیشه/, 'ایمنی'], [/^پالت|^جعبه|^کارتن|^تسمه|^چسب|^نایلون/, 'بسته‌بندی'], [/^تیغ|^سنگ|^سمباده|^فرز|^مته|^الماس|^گریس|^واشر|^پیچ|^مهره|^بوش/, 'ابزار و مصرفی']];
  for (const [re, c] of rules) if (re.test(n)) return c;
  return 'سایر';
}
const catByName = n => DB.categories.find(c => c.name === n);
const unitByName = n => { n = normName(n).replace(/^کیلو$/, 'کیلوگرم'); return DB.units.find(u => u.name === n); };
