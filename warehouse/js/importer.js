/* ورود اطلاعات از اکسل‌های قدیمی انبار (شیت‌های «ورودی» و «خروجی») یا فهرست کالا */
'use strict';
const Importer = {
  open() {
    if (!Auth.can('items')) { UI.toast('دسترسی لازم را ندارید', 'err'); return; }
    UI.modal('ورود اطلاعات از اکسل', `<div class="form one"><p class="small">فایل اکسل انبار (با شیت‌های <b>ورودی</b> و <b>خروجی</b>، همان قالب فعلی شما) یا یک فهرست کالا (ستون‌های «نام کالا / کد / واحد / گروه») را انتخاب کنید. قبل از ثبت، پیش‌نمایش و مشکلات نشان داده می‌شود.</p>
      <label>فایل اکسل<input type="file" id="im_f" accept=".xlsx,.xls,.csv"></label>
      <label>انبار پیش‌فرض برای ردیف‌های خروجی (اگر انبار کالا مشخص نباشد)<select id="im_w">${UI.whOpts((DB.warehouses.find(w => w.name === 'انبار مواد اولیه') || {}).id)}</select></label>
      <p class="small mut">ردیف‌های تکراری (قبلاً واردشده) خودکار نادیده گرفته می‌شوند؛ ورود دوباره همان فایل مشکلی ایجاد نمی‌کند. اگر چند فایل دارید که بخشی از آنها تکراری است (مثل فایل ۱۴۰۴ و فایل کامل)، فقط فایل کامل‌تر را وارد کنید.</p></div><div id="im_r"></div>`,
      [{t: 'بستن'}, {t: 'بررسی فایل', c: 'pri', f: () => { Importer.read(); return false; }}], true);
  },
  async read() {
    const f = $('im_f').files[0]; if (!f) { UI.toast('فایل را انتخاب کنید', 'err'); return; }
    if (typeof XLSX === 'undefined') { UI.toast('کتابخانه اکسل بارگذاری نشده', 'err'); return; }
    const wb = XLSX.read(await f.arrayBuffer(), {type: 'array'});
    const plan = Importer.plan(wb, $('im_w').value);
    Importer._plan = plan; Importer.preview(plan);
  },
  /* «۳۷شاخه» ، «9/5کیلوگرم» ، 120 → {q, unit} */
  parseQty(v) {
    if (typeof v === 'number') return {q: v, unit: ''};
    const s = normName(v); if (!s) return null;
    const m = s.match(/^(?:حدودا\s*)?([\d.,\/]+)\s*(.*)$/); if (!m) return null;
    const q = num(m[1].replace(/,/g, '')); if (!q) return null;
    let u = m[2].replace(/[+\s]+$/g, '').trim();
    u = {'کیلو': 'کیلوگرم', 'کیلوگرم': 'کیلوگرم', 'ابسته': 'بسته', 'نصفگونی': 'گونی', 'نصف گونی': 'گونی'}[u.replace(/\s/g, '')] || u;
    if (/نصف ?گونی/.test(m[2])) return {q: q * 0.5, unit: 'گونی'};
    return {q, unit: u};
  },
  plan(wb, defWh) {
    const P = {items: {}, newItems: [], docs: [], issues: [], dup: 0, units: {}, whs: {}, rows: {in: 0, out: 0}, dates: [], itemList: false};
    const existingSrc = new Set(); DB.docs.forEach(d => d.lines.forEach(l => l.src && existingSrc.add(l.src)));
    const seen = new Set();
    const findSheet = re => wb.SheetNames.find(n => re.test(n.trim()));
    const rowsOf = n => XLSX.utils.sheet_to_json(wb.Sheets[n], {header: 1, raw: true, defval: null});
    const getItem = name => {
      const key = normKey(name); if (P.items[key]) return P.items[key];
      const ex = DB.items.find(i => normKey(i.name) === key);
      return P.items[key] = ex ? {ex, name: ex.name, units: {}} : {name: normName(name), units: {}, cat: guessCategory(name), whs: {}};
    };
    const inS = findSheet(/^ورودی/), outS = findSheet(/^خروجی/);
    if (!inS && !outS) {
      /* فهرست کالا */
      const rows = rowsOf(wb.SheetNames[0]); const h = rows.findIndex(r => r.some(c => /نام|شرح/.test(String(c || ''))));
      if (h < 0) { P.issues.push('ستون «نام کالا» یا شیت‌های «ورودی/خروجی» پیدا نشد.'); return P; }
      const H = rows[h].map(c => String(c || '').trim()), ci = re => H.findIndex(x => re.test(x));
      const cN = ci(/نام|شرح/), cC = ci(/^کد/), cU = ci(/واحد/), cG = ci(/گروه|دسته/), cM = ci(/حداقل|نقطه/), cK = ci(/وزن/);
      P.itemList = true;
      rows.slice(h + 1).forEach(r => { const n = r[cN]; if (!n || !String(n).trim()) return; const it = getItem(n); if (it.ex) return; it.code = cC >= 0 && r[cC] ? toEn(r[cC]).trim() : ''; if (cU >= 0 && r[cU]) it.units[normName(r[cU])] = 1; if (cG >= 0 && r[cG]) it.cat = normName(r[cG]); if (cM >= 0) it.min = num(r[cM]); if (cK >= 0) it.kgPer = num(r[cK]); });
      return Importer.finish(P);
    }
    const parseRows = (sheet, kind) => {
      const rows = rowsOf(sheet); let h = rows.findIndex(r => r.some(c => /شرح کالا/.test(String(c || ''))));
      let H = h >= 0 ? rows[h].map(c => String(c || '').trim()) : null;
      const ci = (re, def) => { if (!H) return def; const i = H.findIndex(x => re.test(x)); return i >= 0 ? i : def; };
      const C = kind === 'in' ? {d: ci(/تاریخ/, 1), n: ci(/شرح/, 2), q: ci(/تعداد|مقدار/, 3), ref: ci(/درخواست/, 4), p: ci(/فروشنده|تامین/, 5), w: ci(/انبار/, 6), note: ci(/توضیح/, 7)}
        : {d: ci(/تاریخ/, 1), n: ci(/شرح/, 2), q: ci(/تعداد|مقدار/, 3), proj: ci(/پروژه/, 4), emp: ci(/کد کالا/, 5), ref: ci(/درخواست/, 6), rc: ci(/تحویل/, 7), note: ci(/توضیح/, 8)};
      let lastDate = null;
      rows.slice(h + 1).forEach((r, ri) => {
        const name = r[C.n]; if (name == null || !String(name).trim() || /^شرح/.test(String(name))) return;
        const rowNo = ri + h + 2;
        let date = r[C.d] != null ? Jalali.parse(String(r[C.d])) : null;
        if (!date && typeof r[C.d] === 'number') date = null;
        if (!date) { if (lastDate) { date = lastDate; if (r[C.d] != null && String(r[C.d]).trim()) P.issues.push(`${sheet} ردیف ${rowNo}: تاریخ «${r[C.d]}» نامعتبر بود؛ تاریخ ردیف قبل (${lastDate}) استفاده شد.`); } else { P.issues.push(`${sheet} ردیف ${rowNo}: بدون تاریخ — رد شد`); return; } }
        lastDate = date;
        const qq = Importer.parseQty(r[C.q]); if (!qq) { P.issues.push(`${sheet} ردیف ${rowNo}: مقدار «${r[C.q] == null ? 'خالی' : r[C.q]}» برای «${name}» نامعتبر — رد شد`); return; }
        const s = (v) => v == null ? '' : normName(String(v));
        const src = [kind, date, normKey(name), qq.q, qq.unit, s(r[C.p] || r[C.rc]), s(r[C.proj] || r[C.ref])].join('|');
        let src2 = src, k = 1; while (seen.has(src2)) src2 = src + '#' + (++k); seen.add(src2);
        if (existingSrc.has(src2)) { P.dup++; return; }
        const it = getItem(name); it.units[qq.unit] = (it.units[qq.unit] || 0) + 1;
        P.dates.push(date); P.rows[kind]++;
        const row = {kind, date, it, q: qq.q, unit: qq.unit, src: src2, note: s(r[C.note])};
        if (kind === 'in') { row.ref = s(r[C.ref]); row.party = s(r[C.p]); row.wh = s(r[C.w]) || 'انبار مواد اولیه'; P.whs[row.wh] = 1; if (!it.ex) it.whs[row.wh] = (it.whs[row.wh] || 0) + 1; }
        else { row.proj = s(r[C.proj]); row.emp = s(r[C.emp]); row.ref = s(r[C.ref]); row.rc = s(r[C.rc]); }
        (P._rows = P._rows || []).push(row);
      });
    };
    if (inS) parseRows(inS, 'in'); if (outS) parseRows(outS, 'out');
    P.defWh = defWh;
    return Importer.finish(P);
  },
  finish(P) {
    Object.values(P.items).forEach(it => {
      if (it.ex) { it.base = unitName(it.ex.base); return; }
      const us = Object.entries(it.units).sort((a, b) => b[1] - a[1]); it.base = (us[0] && us[0][0]) || 'عدد'; if (!it.base) it.base = 'عدد';
      P.newItems.push(it);
    });
    /* جفت‌های (کالا، واحد) که ضریب تبدیلشان معلوم نیست */
    P.need = [];
    Object.values(P.items).forEach(it => Object.keys(it.units).forEach(u => {
      const uu = u || 'عدد'; const bb = it.base || 'عدد'; if (uu === bb) return;
      if (it.ex) { const U = unitByName(uu); if (U && unitFactor(it.ex, U.id) != null) return; }
      P.need.push({it, unit: uu, base: bb, n: it.units[u], f: uu === 'کیلوگرم' && it.kgPer ? 1 / it.kgPer : ''});
    }));
    return P;
  },
  preview(P) {
    const ds = P.dates.slice().sort();
    $('im_r').innerHTML = `<h4>پیش‌نمایش</h4><div class="kv">
      ${P.itemList ? '' : `<div><small>ردیف ورودی</small><b>${toFa(P.rows.in)}</b></div><div><small>ردیف خروجی</small><b>${toFa(P.rows.out)}</b></div><div><small>بازه تاریخ</small><b>${ds.length ? toFa(ds[0]) + ' تا ' + toFa(ds[ds.length - 1]) : '—'}</b></div><div><small>تکراری (نادیده)</small><b>${toFa(P.dup)}</b></div>`}
      <div><small>کالای جدید</small><b>${toFa(P.newItems.length)}</b></div><div><small>کالای موجود</small><b>${toFa(Object.keys(P.items).length - P.newItems.length)}</b></div><div><small>انبارها</small><b>${esc(Object.keys(P.whs).join('، ') || '—')}</b></div><div><small>هشدارها</small><b>${toFa(P.issues.length)}</b></div></div>
      ${P.need.length ? `<h4>ضریب تبدیل واحدها <small class="mut">(بعضی ردیف‌ها با واحد دیگری ثبت شده‌اند، مثلاً «شاخه» به‌جای «عدد». بگویید هر واحد چند واحد اصلی است؛ بعداً هم در تعریف کالا قابل اصلاح است)</small></h4>
      <div class="tw" style="max-height:260px"><table class="mini"><thead><tr><th>کالا</th><th>هر</th><th>=</th><th>واحد اصلی</th><th>ردیف‌ها</th></tr></thead><tbody>${P.need.map((x, i) => `<tr><td>${esc(x.it.name)}</td><td>${esc(x.unit)}</td><td><input data-nf="${i}" inputmode="decimal" value="${x.f ? toFa(x.f) : ''}" placeholder="مثلاً ۶" style="width:80px"></td><td><select data-nb="${i}">${['عدد', 'کیلوگرم', 'متر', 'شاخه', 'بسته'].concat([x.base]).filter((v, j, a) => a.indexOf(v) === j).map(u => `<option ${u === x.base ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></td><td>${toFa(x.n)}</td></tr>`).join('')}</tbody></table></div><p class="small mut">اگر ضریب خالی بماند، آن ردیف‌ها وارد نمی‌شوند و در هشدارها فهرست می‌شوند؛ بعداً پس از تعریف واحد در کارت کالا، با ورود دوباره همین فایل فقط همان ردیف‌ها اضافه می‌شوند.</p>` : ''}
      ${P.issues.length ? `<details><summary>هشدارها و ردیف‌های ردشده (${toFa(P.issues.length)})</summary><ul class="small">${P.issues.slice(0, 400).map(i => '<li>' + esc(toFa(i)) + '</li>').join('')}</ul></details>` : ''}
      <div class="row"><span class="sp"></span><button class="btn pri" id="im_go">✅ ثبت در برنامه</button></div>`;
    $('im_go').onclick = () => Importer.commit(P);
  },
  commit(P) {
    document.querySelectorAll('[data-nf]').forEach(e => { const x = P.need[+e.dataset.nf]; x.f = num(e.value); x.base = document.querySelector(`[data-nb="${e.dataset.nf}"]`).value; });
    const uOf = n => unitByName(n || 'عدد') || upsert('units', {name: normName(n)}, 'ایجاد هنگام ورود از اکسل');
    /* ثبت کالاهای جدید */
    P.newItems.forEach(it => {
      const cat = catByName(it.cat) || upsert('categories', {name: it.cat}, 'ایجاد هنگام ورود از اکسل');
      const whN = Object.entries(it.whs || {}).sort((a, b) => b[1] - a[1])[0];
      const wh = whN && DB.warehouses.find(w => normKey(w.name) === normKey(whN[0]));
      const rec = {name: it.name, cat: cat.id, base: uOf(it.base).id, alt: [], active: true, qc: false, wh: wh ? wh.id : P.defWh, min: it.min || 0, kgPer: it.kgPer || 0};
      rec.code = it.code || newItemCode(cat.name);
      DB.items.push(Object.assign(rec, {id: uid(), u: Date.now(), createdAt: nowStamp(), createdBy: Auth.name()}));
      it.ex = rec;
    });
    P.need.forEach(x => { if (!x.f) return; const it = x.it.ex; const U = uOf(x.unit), B = uOf(x.base); if (U.id === it.base) return;
      const fb = B.id === it.base ? 1 : unitFactor(it, B.id); if (fb == null) return; it.alt = (it.alt || []).filter(a => a.unit !== U.id).concat([{unit: U.id, f: x.f * fb}]); it.u = Date.now(); });
    /* انبارها */
    Object.keys(P.whs).forEach(n => { if (!DB.warehouses.find(w => normKey(w.name) === normKey(n))) upsert('warehouses', {code: 'W' + (DB.warehouses.length + 1), name: n, type: 'stock', active: true}, 'ایجاد هنگام ورود از اکسل'); });
    /* اسناد: ردیف‌های هم‌تاریخ و هم‌طرف در یک سند */
    const groups = new Map(); let skipped = 0;
    (P._rows || []).forEach(r => {
      const it = r.it.ex; let U = uOf(r.unit || unitName(it.base)); let f = unitFactor(it, U.id);
      if (f == null) { skipped++; P.issues.push('واحد «' + U.name + '» برای «' + it.name + '» ضریب ندارد — ردیف ' + r.date + ' رد شد'); return; }
      let type, wh, key;
      if (r.kind === 'in') { type = /مرجوع|برگشت/.test(r.ref) ? 'RET_IN' : 'IN'; wh = (DB.warehouses.find(w => normKey(w.name) === normKey(r.wh)) || {}).id || P.defWh; key = [type, r.date, r.party, wh].join('|'); }
      else { type = 'OUT'; wh = it.wh || P.defWh; key = [type, r.date, r.proj, r.rc, wh].join('|'); }
      let d = groups.get(key);
      if (!d) { d = {id: uid(), u: Date.now(), type, date: r.date, wh, status: 'final', lines: [], custom: {}, imported: true, createdAt: nowStamp(), createdBy: Auth.name() + ' (ورود از اکسل)'};
        if (r.kind === 'in') { d.party = r.party ? Base.resolveParty(r.party, 'supplier') : ''; d.ref = r.ref && r.ref !== 'موجودی انبار' ? r.ref : ''; }
        else { d.project = r.proj ? Base.resolveProject(r.proj) : ''; d.receiver = r.rc; d.ref = r.ref; }
        groups.set(key, d); }
      d.lines.push({item: it.id, qty: r.q, unit: U.id, base: r.q * f, note: r.note, empCode: r.emp || '', src: r.src});
    });
    const docs = [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
    const seq = {}; DB.docs.forEach(d => { const m = d.no && d.no.match(/^(.*-)(\d+)$/); if (m) seq[m[1]] = Math.max(seq[m[1]] || 0, +m[2]); });
    docs.forEach(d => { const pre = (DB.settings.prefix || 'ASR') + '-' + DOC_TYPES[d.type].p + '-' + d.date.slice(0, 4) + '-'; seq[pre] = (seq[pre] || 0) + 1; d.no = pre + String(seq[pre]).padStart(4, '0'); DB.docs.push(d); });
    audit('ورود از اکسل', 'docs', {name: 'اکسل'}, toFa(P.newItems.length) + ' کالای جدید، ' + toFa(docs.length) + ' سند، ' + toFa((P._rows || []).length - skipped) + ' ردیف');
    saveDB();
    UI.closeModal(); UI.toast('ورود انجام شد: ' + toFa(P.newItems.length) + ' کالا و ' + toFa(docs.length) + ' سند', 'ok'); UI.refresh();
    const negs = DB.items.filter(i => DB.warehouses.some(w => stockOf(i.id, w.id) < -1e-9));
    if (negs.length) setTimeout(() => UI.modal('نتیجه ورود اطلاعات', `<p>اطلاعات وارد شد. <b>${toFa(negs.length)}</b> کالا موجودی منفی دارند؛ یعنی در اکسل قدیمی خروج بیشتری از ورود ثبت شده (معمولاً به‌خاطر نام‌های متفاوت یک کالا یا ثبت‌نشدن موجودی اول دوره).</p><ol class="small"><li>از «کالاها ← یافتن نام‌های تکراری» کالاهای هم‌نام را ادغام کنید.</li><li>سپس یک «انبارگردانی» انجام دهید تا موجودی واقعی جایگزین شود.</li></ol>`, [{t: 'بستن'}, {t: 'یافتن تکراری‌ها', c: 'pri', f: () => setTimeout(Pages._dups, 50)}]), 400);
  }
};
