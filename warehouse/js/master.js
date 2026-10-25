/* اطلاعات پایه: کالا و واحد تبدیل، انبارها، طرف‌حساب‌ها، پروژه‌ها + صفحات موجودی، امانی و انبارگردانی */
'use strict';
const Items = {
  /* وزن لوله و شفت برای تبدیل خودکار کیلوگرم ↔ عدد/شاخه/متر */
  pipeKgPerM: (od, t) => Math.PI * (od - t) * t * 7.85 / 1000,
  shaftKgPerM: d => Math.PI * d * d / 4 * 7.85 / 1000,
  edit(id, done) {
    if (!Auth.can('items')) { UI.toast('دسترسی تعریف کالا ندارید', 'err'); return; }
    const old = id ? byId('items', id) : null;
    const it = old ? JSON.parse(JSON.stringify(old)) : {name: '', cat: (catByName('سایر') || {}).id, base: (unitByName('عدد') || {}).id, alt: [], active: true};
    const altRow = (a, i) => `<tr data-i="${i}"><td>هر</td><td><select class="au">${UI.opts(DB.units, a.unit)}</select></td><td>=</td><td><input class="af" inputmode="decimal" value="${a.f ? toFa(a.f) : ''}" style="width:90px"></td><td class="bu">${esc(unitName(it.base))}</td><td><button type="button" class="btn ghost sm adel">✕</button></td></tr>`;
    UI.modal(old ? 'ویرایش کالا' : 'تعریف کالای جدید', `<form id="itf"><div class="form">
      <label class="wide">نام / شرح کالا <b class="req">*</b><input id="i_name" required value="${esc(it.name)}" placeholder="مثال: هوزینگ 4*89 نافی بلند"></label>
      <label>گروه کالا<select id="i_cat">${UI.opts(DB.categories, it.cat)}</select></label>
      <label>کد کالا <small class="mut">(خالی = خودکار)</small><input id="i_code" value="${esc(it.code || '')}" dir="ltr"></label>
      <label>واحد اصلی (پایه شمارش موجودی) <b class="req">*</b><select id="i_base">${UI.opts(DB.units, it.base)}</select></label>
      <label>وزن هر واحد پایه (کیلوگرم)<input id="i_kg" inputmode="decimal" value="${it.kgPer ? toFa(it.kgPer) : ''}" placeholder="برای تبدیل کیلو ↔ عدد"></label>
      <label>انبار پیش‌فرض<select id="i_wh">${UI.whOpts(it.wh, '—', 1)}</select></label>
      <label>نقطه سفارش (حداقل)<input id="i_min" inputmode="decimal" value="${it.min ? toFa(it.min) : ''}"></label>
      <label>حداکثر موجودی<input id="i_max" inputmode="decimal" value="${it.max ? toFa(it.max) : ''}"></label>
      <label>کد کالای کارفرما / فنی<input id="i_ext" value="${esc(it.ext || '')}"></label>
      <label>محل نگهداری (قفسه/ردیف)<input id="i_loc" value="${esc(it.loc || '')}"></label>
      <label class="chk"><input type="checkbox" id="i_qc" ${(it.qc != null ? it.qc : DB.settings.qcDefault) ? 'checked' : ''}> هنگام ورود نیاز به تایید کنترل کیفی دارد</label>
      <label class="chk"><input type="checkbox" id="i_act" ${it.active !== false ? 'checked' : ''}> فعال</label>
      <label class="wide">توضیحات / مشخصات فنی<textarea id="i_note" rows="2">${esc(it.note || '')}</textarea></label></div>
      <h4>واحدهای فرعی و ضریب تبدیل <small class="mut">مثلاً: هر «شاخه» = ۶ «متر» یا هر «بسته» = ۵۰ «عدد»</small></h4>
      <table class="mini"><tbody id="i_alt">${(it.alt || []).map(altRow).join('')}</tbody></table>
      <div class="row"><button type="button" class="btn ghost sm" id="i_add">➕ افزودن واحد فرعی</button><button type="button" class="btn ghost sm" id="i_calc">🧮 محاسبه وزن لوله / شفت</button></div>
      <p class="note small" id="i_prev"></p></form>`,
      [{t: 'انصراف'}, ...(old && Auth.can('del') ? [{t: 'حذف کالا', c: 'danger', f: () => { if (DB.docs.some(d => d.lines.some(l => l.item === old.id))) { UI.toast('این کالا در اسناد استفاده شده؛ به‌جای حذف، غیرفعالش کنید', 'err'); return false; } removeRec('items', old.id); UI.refresh(); }}] : []), {t: 'ذخیره', c: 'pri', f: save}], true);
    const tb = $('i_alt');
    const readAlt = () => { it.alt = [...tb.querySelectorAll('tr')].map(tr => ({unit: tr.querySelector('.au').value, f: num(tr.querySelector('.af').value)})); };
    const prev = () => { readAlt(); it.base = $('i_base').value; it.kgPer = num($('i_kg').value); tb.querySelectorAll('.bu').forEach(e => e.textContent = unitName(it.base)); $('i_prev').innerHTML = 'واحدهای قابل استفاده در فرم‌ها: ' + itemUnits(it).map(u => '<b>' + esc(u.name) + '</b>' + (u.id === it.base ? '' : ' (= ' + fmt(unitFactor(it, u.id), 4) + ' ' + esc(unitName(it.base)) + ')')).join('، '); };
    $('itf').addEventListener('input', prev); $('itf').addEventListener('change', prev); prev();
    tb.onclick = e => { if (e.target.classList.contains('adel')) { e.target.closest('tr').remove(); prev(); } };
    $('i_add').onclick = () => { readAlt(); it.alt.push({unit: (unitByName('بسته') || {}).id, f: ''}); tb.innerHTML = it.alt.map(altRow).join(''); prev(); };
    $('i_calc').onclick = () => {
      const r = prompt('برای لوله: «قطر خارجی*ضخامت» مثل 89*4\nبرای شفت/میلگرد: فقط قطر مثل 25\n(میلی‌متر)'); if (!r) return;
      const p = toEn(r).split(/[*x×]/).map(Number); const kgm = p.length > 1 ? Items.pipeKgPerM(p[0], p[1]) : Items.shaftKgPerM(p[0]);
      if (!isFinite(kgm) || kgm <= 0) return;
      const mU = unitByName('متر'), shU = unitByName('شاخه'), base = unitName($('i_base').value);
      if (base === 'متر') $('i_kg').value = toFa(kgm.toFixed(3));
      else if (base === 'شاخه') { $('i_kg').value = toFa((kgm * 6).toFixed(2)); readAlt(); if (mU && !it.alt.some(a => a.unit === mU.id)) it.alt.push({unit: mU.id, f: 1 / 6}); tb.innerHTML = it.alt.map(altRow).join(''); }
      else if (base === 'کیلوگرم') { readAlt(); if (mU) it.alt = it.alt.filter(a => a.unit !== mU.id).concat([{unit: mU.id, f: +kgm.toFixed(3)}]); if (shU) it.alt = it.alt.filter(a => a.unit !== shU.id).concat([{unit: shU.id, f: +(kgm * 6).toFixed(2)}]); tb.innerHTML = it.alt.map(altRow).join(''); }
      else { alert('وزن هر متر: ' + kgm.toFixed(3) + ' کیلوگرم — وزن شاخه ۶ متری: ' + (kgm * 6).toFixed(2) + ' کیلوگرم'); return; }
      prev(); UI.toast('وزن هر متر ' + fmt(kgm, 3) + ' کیلوگرم محاسبه شد (چگالی فولاد ۷٫۸۵)', 'ok');
    };
    function save() {
      if (!$('itf').reportValidity()) return false;
      readAlt();
      const name = normName($('i_name').value);
      const dup = DB.items.find(x => x.id !== it.id && normKey(x.name) === normKey(name)); if (dup) { UI.toast('کالایی با همین نام وجود دارد: ' + dup.code, 'err'); return false; }
      Object.assign(it, {name, cat: $('i_cat').value, base: $('i_base').value, kgPer: num($('i_kg').value) || 0, wh: $('i_wh').value, min: num($('i_min').value), max: num($('i_max').value),
        ext: $('i_ext').value.trim(), loc: $('i_loc').value.trim(), qc: $('i_qc').checked, active: $('i_act').checked, note: $('i_note').value.trim(), alt: it.alt.filter(a => a.unit && a.f > 0 && a.unit !== $('i_base').value)});
      if (old && old.base !== it.base && DB.docs.some(d => d.lines.some(l => l.item === it.id))) { if (!confirm('تغییر واحد پایه کالایی که سند دارد، مقادیر قبلی را تغییر نمی‌دهد و ممکن است موجودی را نامعتبر کند. ادامه؟')) return false; }
      const code = toEn($('i_code').value).trim().toUpperCase() || it.code || newItemCode((byId('categories', it.cat) || {}).name);
      if (DB.items.some(x => x.id !== it.id && x.code === code)) { UI.toast('کد کالا تکراری است', 'err'); return false; }
      it.code = code; upsert('items', it); UI.toast('کالا ذخیره شد: ' + it.code, 'ok');
      if (done) done(it); else UI.refresh();
    }
  },
  quick(done) { Items.edit(null, it => { setTimeout(() => done(it), 0); }); }
};

const Base = {
  resolveParty(name, kind) {
    name = normName(name); if (!name) return '';
    const w = DB.warehouses.find(x => normKey(x.name) === normKey(name)); if (w) return w.id;
    let p = DB.parties.find(x => normKey(x.name) === normKey(name));
    if (!p) p = upsert('parties', {name, kind: kind || 'supplier', active: true}, 'ایجاد خودکار هنگام ثبت سند');
    return p.id;
  },
  resolveProject(s) {
    s = normName(s); if (!s) return '';
    let p = DB.projects.find(x => normKey(projName(x.id)) === normKey(s) || normKey(x.code) === normKey(s) || normKey(x.name) === normKey(s));
    if (!p) { const m = s.match(/^([\d\/\-,]+)\s*(?:—|-)?\s*(.*)$/); p = upsert('projects', m ? {code: m[1], name: m[2] || ''} : {code: '', name: s}, 'ایجاد خودکار هنگام ثبت سند'); }
    return p.id;
  },
  /* فرم عمومی ویرایش برای جداول ساده */
  simple(coll, id, fields, title) {
    const old = id ? byId(coll, id) : null; const r = old ? JSON.parse(JSON.stringify(old)) : {active: true};
    UI.modal((old ? 'ویرایش ' : 'افزودن ') + title, `<form id="sf"><div class="form">${fields.map(f => f.opts ? `<label>${f.t}<select data-k="${f.k}">${f.opts.map(o => `<option value="${o[0]}" ${r[f.k] === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>` : f.chk ? `<label class="chk"><input type="checkbox" data-k="${f.k}" ${r[f.k] !== false ? 'checked' : ''}> ${f.t}</label>` : `<label class="${f.wide ? 'wide' : ''}">${f.t}${f.req ? ' <b class="req">*</b>' : ''}<input data-k="${f.k}" value="${esc(r[f.k] || '')}" ${f.req ? 'required' : ''}></label>`).join('')}</div></form>`,
      [{t: 'انصراف'}, ...(old && Auth.can('del') ? [{t: 'حذف', c: 'danger', f: () => { const used = JSON.stringify(DB.docs).includes('"' + old.id + '"') || DB.items.some(i => i.base === old.id || i.cat === old.id || (i.alt || []).some(a => a.unit === old.id)); if (used) { UI.toast('در اسناد/کالاها استفاده شده؛ غیرفعالش کنید', 'err'); return false; } removeRec(coll, old.id); UI.refresh(); }}] : []),
        {t: 'ذخیره', c: 'pri', f: () => { if (!$('sf').reportValidity()) return false; $('sf').querySelectorAll('[data-k]').forEach(e => r[e.dataset.k] = e.type === 'checkbox' ? e.checked : normName(e.value)); upsert(coll, r); UI.toast('ذخیره شد', 'ok'); UI.refresh(); }}]);
  }
};
const PARTY_KINDS = [['supplier', 'تامین‌کننده / فروشنده'], ['contractor', 'پیمانکار'], ['customer', 'کارفرما / مشتری'], ['person', 'شخص / پرسنل'], ['company', 'شرکت / کارگاه دیگر']];
const WH_TYPES = [['stock', 'انبار عادی'], ['qc', 'قرنطینه QC'], ['scrap', 'ضایعات'], ['wip', 'خط تولید / نیمه‌ساخته'], ['ext', 'انبار بیرونی / امانی']];

Pages.items = el => {
  UI.head(el, 'کالاها و واحدهای تبدیل', 'items', Auth.can('items') ? `<button class="btn pri sm" onclick="Items.edit()">➕ کالای جدید</button><button class="btn ghost sm" onclick="Importer.open()">📂 ورود از اکسل</button><button class="btn ghost sm" onclick="Pages._dups()">🧹 یافتن نام‌های تکراری</button>` : '');
  const catF = Pages._catF || '';
  const c = UI.card(el, `<div class="filters"><select id="cf">${UI.opts(DB.categories, catF, 'همه گروه‌ها')}</select></div>`);
  $('cf').onchange = () => { Pages._catF = $('cf').value; UI.refresh(); };
  const rows = DB.items.filter(i => !catF || i.cat === catF);
  UI.table(c, [{t: 'کد', v: 'code'}, {t: 'نام کالا', v: 'name'}, {t: 'گروه', v: r => (byId('categories', r.cat) || {}).name || ''}, {t: 'واحد پایه', v: r => unitName(r.base)},
    {t: 'واحدهای تبدیل', v: r => itemUnits(r).filter(u => u.id !== r.base).map(u => u.name + '=' + fmt(unitFactor(r, u.id), 3)).join('، ')},
    {t: 'وزن واحد (kg)', n: 1, v: r => r.kgPer || 0}, {t: 'موجودی کل', n: 1, v: r => stockOf(r.id)}, {t: 'نقطه سفارش', n: 1, v: r => r.min || 0}, {t: 'QC', v: r => r.qc ? '✓' : ''}, {t: 'وضعیت', v: r => r.active === false ? 'غیرفعال' : 'فعال'}],
    rows, {name: 'فهرست کالاها', click: r => Auth.can('items') ? Items.edit(r.id) : Pages._card(r.id), empty: 'هنوز کالایی تعریف نشده. «کالای جدید» یا «ورود از اکسل» را بزنید.', rowClass: r => r.active === false ? 'off' : ''});
  const u = UI.card(el, '<h3>واحدهای اندازه‌گیری و گروه‌های کالا</h3><div class="grid2"><div id="ut"></div><div id="ct"></div></div>');
  UI.table($('ut'), [{t: 'واحد', v: 'name'}, {t: 'تعداد کالا', n: 1, v: r => DB.items.filter(i => i.base === r.id).length}], DB.units, {name: 'واحدها', noSearch: 1, limit: 50, tools: Auth.can('items') ? '<button class="btn ghost sm" onclick="Base.simple(\'units\',null,[{k:\'name\',t:\'نام واحد\',req:1}],\'واحد\')">➕ واحد</button>' : '', click: r => Auth.can('items') && Base.simple('units', r.id, [{k: 'name', t: 'نام واحد', req: 1}], 'واحد')});
  UI.table($('ct'), [{t: 'گروه', v: 'name'}, {t: 'تعداد کالا', n: 1, v: r => DB.items.filter(i => i.cat === r.id).length}], DB.categories, {name: 'گروه‌ها', noSearch: 1, limit: 50, tools: Auth.can('items') ? '<button class="btn ghost sm" onclick="Base.simple(\'categories\',null,[{k:\'name\',t:\'نام گروه\',req:1}],\'گروه\')">➕ گروه</button>' : '', click: r => Auth.can('items') && Base.simple('categories', r.id, [{k: 'name', t: 'نام گروه', req: 1}], 'گروه')});
};
/* یافتن و ادغام کالاهای تکراری (مثلاً «هوزینگ4*11» و «هوزینگ 4*11») */
Pages._dups = () => {
  const strip = s => normKey(s).replace(/[^\p{L}\p{N}*]/gu, '');
  const g = {}; DB.items.forEach(i => (g[strip(i.name)] = g[strip(i.name)] || []).push(i));
  const groups = Object.values(g).filter(a => a.length > 1);
  if (!groups.length) { UI.toast('کالای تکراری پیدا نشد', 'ok'); return; }
  UI.modal('کالاهای احتمالاً تکراری (' + toFa(groups.length) + ' گروه)', '<p class="small">در هر گروه، کالای اول باقی می‌ماند و اسناد بقیه به آن منتقل می‌شوند.</p>' + groups.map((a, gi) => `<label class="chk"><input type="checkbox" data-g="${gi}" checked> ${a.map(i => esc(itemLabel(i))).join(' ⟵ ')}</label>`).join(''),
    [{t: 'انصراف'}, {t: 'ادغام موارد انتخاب‌شده', c: 'pri', f: () => { let n = 0; document.querySelectorAll('[data-g]:checked').forEach(e => { const [keep, ...rest] = groups[+e.dataset.g]; rest.forEach(r => { DB.docs.forEach(d => { let ch = false; d.lines.forEach(l => { if (l.item === r.id) { l.item = keep.id; if (l.unit === r.base) l.unit = keep.base; ch = true; } }); if (ch) d.u = Date.now(); }); DB.caps.forEach(c => { if (c.item === r.id) c.item = keep.id; }); removeRec('items', r.id, 'ادغام در ' + keep.code); n++; }); }); saveDB(); UI.toast(toFa(n) + ' کالا ادغام شد', 'ok'); UI.refresh(); }}], true);
};
/* کاردکس کالا */
Pages._card = (itemId, whId) => {
  const it = itemOf(itemId); let bal = 0; const rows = [];
  DB.docs.filter(d => d.status === 'final').sort((a, b) => (a.date + (a.createdAt || '')).localeCompare(b.date + (b.createdAt || ''))).forEach(d => docMoves(d).forEach(m => { if (m.item === itemId && (!whId || m.wh === whId)) { bal += m.q; rows.push({d, m, bal}); } }));
  UI.modal('کاردکس کالا — ' + itemLabel(it), `<div class="kv"><div><small>موجودی کل</small><b>${qtyText(it, stockOf(itemId), true)}</b></div>${DB.warehouses.filter(w => stockOf(itemId, w.id)).map(w => `<div><small>${esc(w.name)}</small><b>${fmt(stockOf(itemId, w.id))}</b></div>`).join('')}<div><small>در انتظار QC</small><b>${fmt(qcPending(itemId))}</b></div><div><small>محل</small><b>${esc(it.loc || '—')}</b></div></div><div id="kdx"></div>`, [{t: 'بستن'}], true);
  UI.table($('kdx'), [{t: 'تاریخ', v: r => toFa(r.d.date)}, {t: 'سند', v: r => r.d.no}, {t: 'نوع', v: r => DOC_TYPES[r.d.type].t}, {t: 'انبار', v: r => whName(r.m.wh)}, {t: 'طرف حساب', v: r => [partyName(r.d.party), r.d.receiver, projName(r.d.project)].filter(Boolean).join(' / ')}, {t: 'وارده', n: 1, v: r => r.m.q > 0 ? r.m.q : 0}, {t: 'صادره', n: 1, v: r => r.m.q < 0 ? -r.m.q : 0}, {t: 'مانده', n: 1, v: r => r.bal}],
    rows.reverse(), {name: 'کاردکس ' + it.name, click: r => { UI.closeModal(); setTimeout(() => Docs.view(r.d.id), 50); }});
};

Pages.stock = el => {
  const wh = Pages._stWh || '', onlyLow = Pages._stLow || false, catF = Pages._stCat || '';
  UI.head(el, 'موجودی انبارها', 'stock');
  const whs = DB.warehouses.filter(w => w.active !== false && Auth.whAllowed(w.id));
  const tabs = UI.card(el, `<div class="chips"><button class="chip ${!wh ? 'on' : ''}" data-w="">همه انبارها</button>${whs.map(w => `<button class="chip ${wh === w.id ? 'on' : ''}" data-w="${w.id}">${esc(w.name)} <small>${toFa(DB.items.filter(i => Math.abs(stockOf(i.id, w.id)) > 1e-9).length)}</small></button>`).join('')}</div>
    <div class="filters"><select id="st_c">${UI.opts(DB.categories, catF, 'همه گروه‌ها')}</select><label class="chk"><input type="checkbox" id="st_l" ${onlyLow ? 'checked' : ''}> فقط زیر نقطه سفارش</label><label class="chk"><input type="checkbox" id="st_z" ${Pages._stZero ? 'checked' : ''}> نمایش موجودی صفر</label></div>`);
  tabs.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { Pages._stWh = b.dataset.w; UI.refresh(); });
  $('st_l').onchange = () => { Pages._stLow = $('st_l').checked; UI.refresh(); }; $('st_z').onchange = () => { Pages._stZero = $('st_z').checked; UI.refresh(); }; $('st_c').onchange = () => { Pages._stCat = $('st_c').value; UI.refresh(); };
  const rows = DB.items.filter(i => (!catF || i.cat === catF)).map(i => ({i, q: stockOf(i.id, wh || null), qc: qcPending(i.id)}))
    .filter(r => (Pages._stZero || Math.abs(r.q) > 1e-9 || r.qc) && (!onlyLow || (r.i.min > 0 && stockOf(r.i.id) < r.i.min)));
  const loanOut = {}; loanBalances().forEach(l => { if (l.open > 0 && (!wh || l.doc.wh === wh)) loanOut[l.line.item] = (loanOut[l.line.item] || 0) + l.open; });
  const cols = [{t: 'کد', v: r => r.i.code}, {t: 'کالا', v: r => r.i.name}, {t: 'گروه', v: r => (byId('categories', r.i.cat) || {}).name || ''}, {t: 'موجودی', n: 1, v: r => r.q, h: r => `<b class="${r.q < 0 ? 'err' : ''}">${fmt(r.q)}</b>`, sum: 1}, {t: 'واحد', v: r => unitName(r.i.base)},
    {t: 'معادل', v: r => itemUnits(r.i).filter(u => u.id !== r.i.base).slice(0, 2).map(u => fmt(r.q / unitFactor(r.i, u.id), 2) + ' ' + u.name).join('، ')},
    {t: 'وزن (kg)', n: 1, v: r => r.i.kgPer ? r.q * r.i.kgPer : 0, sum: 1}];
  if (!wh) whs.forEach(w => cols.push({t: w.name, n: 1, v: r => stockOf(r.i.id, w.id)}));
  cols.push({t: 'در انتظار QC', n: 1, v: r => r.qc}, {t: 'نزد امانت‌گیرنده', n: 1, v: r => loanOut[r.i.id] || 0}, {t: 'نقطه سفارش', n: 1, v: r => r.i.min || 0}, {t: 'وضعیت', v: r => r.i.min > 0 && stockOf(r.i.id) < r.i.min ? 'زیر نقطه سفارش' : '', h: r => r.i.min > 0 && stockOf(r.i.id) < r.i.min ? '<span class="st pending">کمبود</span>' : ''});
  UI.table(tabs, cols, rows, {name: 'موجودی ' + (wh ? whName(wh) : 'همه انبارها'), click: r => Pages._card(r.i.id, wh || null), foot: 1, empty: DB.items.length ? 'موردی با این فیلتر وجود ندارد.' : 'ابتدا کالاها را تعریف و «موجودی اول دوره» را ثبت کنید.'});
};

Pages.base = el => {
  UI.head(el, 'انبارها، طرف‌حساب‌ها و پروژه‌ها', 'base');
  const can = Auth.can('items');
  const wf = [{k: 'code', t: 'کد انبار', req: 1}, {k: 'name', t: 'نام انبار', req: 1}, {k: 'type', t: 'نوع', opts: WH_TYPES}, {k: 'keeper', t: 'انباردار مسئول'}, {k: 'place', t: 'محل / آدرس'}, {k: 'active', t: 'فعال', chk: 1}];
  const c1 = UI.card(el, '<h3>🏭 انبارها</h3>');
  UI.table(c1, [{t: 'کد', v: 'code'}, {t: 'نام', v: 'name'}, {t: 'نوع', v: r => (WH_TYPES.find(x => x[0] === r.type) || [, ''])[1]}, {t: 'انباردار', v: 'keeper'}, {t: 'اقلام دارای موجودی', n: 1, v: r => DB.items.filter(i => Math.abs(stockOf(i.id, r.id)) > 1e-9).length}, {t: 'وضعیت', v: r => r.active === false ? 'غیرفعال' : 'فعال'}],
    DB.warehouses, {name: 'انبارها', noSearch: 1, tools: can ? `<button class="btn pri sm" id="addwh">➕ انبار جدید</button>` : '', click: r => can && Base.simple('warehouses', r.id, wf, 'انبار')});
  if ($('addwh')) $('addwh').onclick = () => Base.simple('warehouses', null, wf, 'انبار');
  const pf = [{k: 'name', t: 'نام', req: 1}, {k: 'kind', t: 'نوع', opts: PARTY_KINDS}, {k: 'phone', t: 'تلفن'}, {k: 'code', t: 'کد / شناسه'}, {k: 'addr', t: 'آدرس', wide: 1}, {k: 'active', t: 'فعال', chk: 1}];
  const c2 = UI.card(el, '<h3>👤 تامین‌کنندگان، پیمانکاران، کارفرمایان و اشخاص</h3>');
  UI.table(c2, [{t: 'نام', v: 'name'}, {t: 'نوع', v: r => (PARTY_KINDS.find(x => x[0] === r.kind) || [, ''])[1]}, {t: 'تلفن', v: 'phone'}, {t: 'تعداد اسناد', n: 1, v: r => DB.docs.filter(d => d.party === r.id).length}],
    DB.parties, {name: 'طرف‌حساب‌ها', tools: can ? `<button class="btn pri sm" id="addp">➕ طرف حساب</button>` : '', click: r => can && Base.simple('parties', r.id, pf, 'طرف حساب')});
  if ($('addp')) $('addp').onclick = () => Base.simple('parties', null, pf, 'طرف حساب');
  const jf = [{k: 'code', t: 'شماره پروژه'}, {k: 'name', t: 'نام پروژه / کارفرما', req: 1}, {k: 'client', t: 'کارفرما'}, {k: 'note', t: 'توضیح', wide: 1}];
  const c3 = UI.card(el, '<h3>📁 پروژه‌ها</h3>');
  UI.table(c3, [{t: 'شماره', v: 'code'}, {t: 'نام', v: 'name'}, {t: 'کارفرما', v: 'client'}, {t: 'تعداد حواله', n: 1, v: r => DB.docs.filter(d => d.project === r.id).length}], DB.projects, {name: 'پروژه‌ها', tools: can ? `<button class="btn pri sm" id="addj">➕ پروژه</button>` : '', click: r => can && Base.simple('projects', r.id, jf, 'پروژه')});
  if ($('addj')) $('addj').onclick = () => Base.simple('projects', null, jf, 'پروژه');
};

Pages._loanCols = () => [{t: 'سند امانی', v: r => r.doc.no}, {t: 'تاریخ ارسال', v: r => toFa(r.doc.date)}, {t: 'از انبار', v: r => whName(r.doc.wh)}, {t: 'امانت‌گیرنده', v: r => partyName(r.doc.party) || whName(r.doc.toWh)}, {t: 'کالا', v: r => itemLabel(itemOf(r.line.item))},
  {t: 'ارسالی', n: 1, v: r => r.sent}, {t: 'برگشتی', n: 1, v: r => r.back}, {t: 'مانده', n: 1, v: r => r.open, h: r => '<b>' + fmt(r.open) + '</b> ' + esc(unitName((itemOf(r.line.item) || {}).base))}, {t: 'سررسید', v: r => toFa(r.due), h: r => r.due ? `<span class="${r.open > 0 && r.due < Jalali.today() ? 'err' : ''}">${toFa(r.due)}</span>` : '—'}];
Pages.loans = el => {
  UI.head(el, 'ارسال و برگشت امانی', 'loans', Auth.can('loan') ? `<button class="btn pri sm" onclick="Docs.edit(null,'LOAN_OUT')">🤝 ارسال امانی</button><button class="btn ghost sm" onclick="Docs.edit(null,'LOAN_RET')">🔙 برگشت امانی</button>` : '');
  const all = loanBalances(), open = all.filter(l => l.open > 1e-9);
  const c = UI.card(el, '<h3>امانی‌های باز <small class="mut">(نزد دیگران)</small></h3>');
  UI.table(c, Pages._loanCols().concat([{t: '', noX: 1, h: r => Auth.can('loan') ? `<button class="btn ghost sm" onclick="Docs.edit(null,'LOAN_RET',{wh:'${r.doc.wh}',party:'${r.doc.party || ''}',toWh:'${r.doc.toWh || ''}',lines:[{item:'${r.line.item}',unit:'${(itemOf(r.line.item) || {}).base}',qty:${r.open},loanRef:'${r.ref}'}]})">ثبت برگشت</button>` : ''}]), open, {name: 'امانی‌های باز', click: r => Docs.view(r.doc.id), empty: 'امانی بازی وجود ندارد.'});
  const c2 = UI.card(el, '<h3>همه سوابق امانی</h3>');
  UI.table(c2, Pages._loanCols().concat([{t: 'وضعیت', v: r => r.open > 1e-9 ? 'باز' : 'تسویه'}]), all, {name: 'سوابق امانی', click: r => Docs.view(r.doc.id), limit: 100});
};

/* ---------- انبارگردانی ---------- */
const Count = {
  start() {
    UI.modal('شروع انبارگردانی', `<div class="form one"><label>انبار<select id="c_wh">${UI.whOpts('', null)}</select></label><label>گروه کالا (اختیاری — برای انبارگردانی بخشی)<select id="c_cat">${UI.opts(DB.categories, '', 'همه گروه‌ها')}</select></label>
      <label>عنوان<input id="c_t" value="انبارگردانی ${toFa(Jalali.today())}"></label><label class="chk"><input type="checkbox" id="c_z"> شامل کالاهای با موجودی صفر</label><label class="chk"><input type="checkbox" id="c_b" checked> شمارش کور (موجودی سیستم در فرم شمارش چاپ نشود)</label></div>`,
      [{t: 'انصراف'}, {t: 'ایجاد', c: 'pri', f: () => {
        const wh = $('c_wh').value, cat = $('c_cat').value;
        const lines = DB.items.filter(i => i.active !== false && (!cat || i.cat === cat) && ($('c_z').checked || Math.abs(stockOf(i.id, wh)) > 1e-9)).map(i => ({item: i.id, sys: stockOf(i.id, wh), cnt: null}));
        const c = upsert('counts', {title: $('c_t').value, wh, cat, blind: $('c_b').checked, date: Jalali.today(), status: 'open', lines});
        UI.toast('برگه انبارگردانی با ' + toFa(lines.length) + ' قلم ایجاد شد', 'ok'); setTimeout(() => Count.open(c.id), 50);
      }}]);
  },
  sheet(id, blank) {
    const c = id ? byId('counts', id) : null;
    const lines = c ? c.lines : DB.items.filter(i => i.active !== false).map(i => ({item: i.id}));
    UI.printHTML(UI.printHead(c ? 'برگه شمارش انبار — ' + c.title : 'فرم خام شمارش انبار') + `<div class="pinfo"><div>انبار: <b>${c ? esc(whName(c.wh)) : '..........................'}</b></div><div>تاریخ: <b>${c ? toFa(c.date) : '..... / ..... / ...........'}</b></div><div>شمارنده: ..........................</div><div>کنترل‌کننده: ..........................</div></div>
      <table class="pt"><thead><tr><th>ردیف</th><th>کد</th><th>شرح کالا</th><th>محل</th><th>واحد</th>${c && !c.blind && !blank ? '<th>موجودی سیستم</th>' : ''}<th style="width:90px">شمارش اول</th><th style="width:90px">شمارش دوم</th><th style="width:120px">توضیح</th></tr></thead>
      <tbody>${lines.map((l, i) => { const it = itemOf(l.item) || {}; return `<tr><td>${toFa(i + 1)}</td><td>${esc(it.code || '')}</td><td>${esc(it.name || '')}</td><td>${esc(it.loc || '')}</td><td>${esc(unitName(it.base))}</td>${c && !c.blind && !blank ? '<td>' + fmt(l.sys) + '</td>' : ''}<td></td><td></td><td></td></tr>`; }).join('')}
      ${blank ? Array.from({length: 15}, () => '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('') : ''}</tbody></table>
      <div class="signs"><div><small>شمارنده</small><span>نام و امضا</span></div><div><small>انباردار</small><span>نام و امضا</span></div><div><small>ناظر / حسابرس</small><span>نام و امضا</span></div></div>`);
  },
  open(id) {
    const c = JSON.parse(JSON.stringify(byId('counts', id))); const ro = c.status !== 'open' || !Auth.can('count');
    UI.modal(c.title + ' — ' + whName(c.wh), `<p class="small mut">مقدار شمارش‌شده را در ستون «شمارش» وارد کنید (بر حسب واحد پایه). ردیف‌های خالی «شمارش‌نشده» حساب می‌شوند و اصلاحیه نمی‌خورند. ذخیره موقت هر زمان ممکن است.</p>
      <div class="tbar"><input type="search" id="cq" placeholder="🔍 جستجوی کالا"><span class="sp"></span><span id="cs" class="mut"></span></div>
      <div class="tw"><table><thead><tr><th>کالا</th><th>واحد</th><th class="n">سیستم</th><th>شمارش</th><th class="n">مغایرت</th></tr></thead><tbody id="cl">${c.lines.map((l, i) => { const it = itemOf(l.item) || {}; return `<tr data-i="${i}" data-s="${esc(normKey(itemLabel(it)))}"><td>${esc(itemLabel(it))}</td><td>${esc(unitName(it.base))}</td><td class="n">${fmt(l.sys)}</td><td><input class="cn" inputmode="decimal" value="${l.cnt != null ? toFa(l.cnt) : ''}" ${ro ? 'disabled' : ''} style="width:100px"></td><td class="n df">${l.cnt != null ? fmt(l.cnt - l.sys) : ''}</td></tr>`; }).join('')}</tbody></table></div>`,
      [{t: 'بستن'}, {t: '🖨 برگه شمارش', c: 'ghost', f: () => { Count.sheet(id); return false; }}, {t: '⬇ اکسل مغایرت', c: 'ghost', f: () => { UI.exportXlsx('مغایرت ' + c.title, [{t: 'کد', v: r => (itemOf(r.item) || {}).code}, {t: 'کالا', v: r => (itemOf(r.item) || {}).name}, {t: 'سیستم', v: 'sys'}, {t: 'شمارش', v: r => r.cnt == null ? '' : r.cnt}, {t: 'مغایرت', v: r => r.cnt == null ? '' : r.cnt - r.sys}], c.lines); return false; }},
        ...(ro ? [] : [{t: '💾 ذخیره موقت', c: 'ghost', f: () => { upsert('counts', c, 'ذخیره موقت شمارش'); UI.toast('ذخیره شد', 'ok'); return false; }}, {t: '✅ پایان و ثبت اصلاحیه', c: 'pri', f: () => Count.finish(c)}])], true);
    const stat = () => { const n = c.lines.filter(l => l.cnt != null).length, d = c.lines.filter(l => l.cnt != null && Math.abs(l.cnt - l.sys) > 1e-9).length; $('cs').textContent = 'شمارش‌شده ' + toFa(n) + ' از ' + toFa(c.lines.length) + ' — دارای مغایرت: ' + toFa(d); };
    stat();
    $('cl').addEventListener('change', e => { if (!e.target.classList.contains('cn')) return; const tr = e.target.closest('tr'), l = c.lines[+tr.dataset.i]; l.cnt = e.target.value.trim() === '' ? null : num(e.target.value); tr.querySelector('.df').textContent = l.cnt != null ? fmt(l.cnt - l.sys) : ''; stat(); });
    $('cl').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('cn')) { e.preventDefault(); e.target.dispatchEvent(new Event('change', {bubbles: true})); let n = e.target.closest('tr').nextElementSibling; while (n && n.style.display === 'none') n = n.nextElementSibling; if (n) n.querySelector('.cn').focus(); } });
    $('cq').oninput = () => { const q = normKey($('cq').value); $('cl').querySelectorAll('tr').forEach(tr => tr.style.display = !q || tr.dataset.s.includes(q) ? '' : 'none'); };
  },
  finish(c) {
    /* موجودی سیستم ممکن است از زمان شروع تغییر کرده باشد: مغایرت نسبت به موجودی فعلی محاسبه می‌شود */
    const diffs = c.lines.filter(l => l.cnt != null).map(l => ({item: l.item, q: l.cnt - stockOf(l.item, c.wh)})).filter(x => Math.abs(x.q) > 1e-9);
    if (!confirm('ثبت نهایی انبارگردانی: ' + toFa(diffs.length) + ' قلم دارای مغایرت است و سند اصلاحیه صادر می‌شود. ادامه؟')) return false;
    let adj = null;
    if (diffs.length) { adj = {type: 'ADJ', date: Jalali.today(), wh: c.wh, status: 'final', note: 'اصلاحیه انبارگردانی: ' + c.title, lines: diffs.map(x => ({item: x.item, qty: x.q, unit: itemOf(x.item).base, base: x.q}))}; adj.no = nextDocNo('ADJ', adj.date); upsert('docs', adj, 'اصلاحیه حاصل از انبارگردانی'); }
    c.status = 'done'; c.adj = adj && adj.id; c.closedBy = Auth.name(); c.closedAt = nowStamp(); upsert('counts', c, 'پایان انبارگردانی');
    UI.toast('انبارگردانی بسته شد' + (adj ? ' — سند ' + adj.no : ''), 'ok'); UI.refresh();
  }
};
Pages.count = el => {
  UI.head(el, 'انبارگردانی', 'count', (Auth.can('count') ? '<button class="btn pri sm" onclick="Count.start()">➕ انبارگردانی جدید</button>' : '') + '<button class="btn ghost sm" onclick="Count.sheet(null,true)">🖨 فرم خام شمارش</button>');
  UI.card(el, `<ol class="steps"><li><b>شروع:</b> انبار (و در صورت نیاز گروه کالا) را انتخاب کنید؛ موجودی سیستم در همان لحظه ثبت می‌شود.</li><li><b>چاپ برگه شمارش</b> و شمارش فیزیکی توسط دو نفر (شمارش کور توصیه می‌شود).</li><li><b>ورود اعداد</b> در برنامه (روی گوشی یا لپ‌تاپ) — با Enter به ردیف بعد بروید.</li><li><b>پایان:</b> مغایرت‌ها بررسی و سند «اصلاحیه انبارگردانی» خودکار صادر می‌شود.</li></ol>`, 'note');
  const c = UI.card(el, '');
  UI.table(c, [{t: 'عنوان', v: 'title'}, {t: 'انبار', v: r => whName(r.wh)}, {t: 'تاریخ', v: r => toFa(r.date)}, {t: 'اقلام', n: 1, v: r => r.lines.length}, {t: 'شمارش‌شده', n: 1, v: r => r.lines.filter(l => l.cnt != null).length}, {t: 'مغایرت', n: 1, v: r => r.lines.filter(l => l.cnt != null && Math.abs(l.cnt - l.sys) > 1e-9).length},
    {t: 'وضعیت', v: r => r.status === 'open' ? 'در حال انجام' : 'بسته‌شده', h: r => `<span class="st ${r.status === 'open' ? 'pending' : 'final'}">${r.status === 'open' ? 'در حال انجام' : 'بسته‌شده'}</span>`}, {t: 'ایجاد', v: 'createdBy'}], DB.counts.slice().reverse(), {name: 'انبارگردانی‌ها', click: r => Count.open(r.id), empty: 'هنوز انبارگردانی انجام نشده.'});
};
