/* گزارش‌ها: گردش کالا، مصرف روزانه/هفتگی/ماهانه، سقف مصرف، پروژه/تحویل‌گیرنده، راکد، QC */
'use strict';
const REPORTS = {
  flow: 'گردش کالا در بازه (اول دوره، ورود، خروج، مانده)',
  cons: 'مصرف روزانه / هفتگی / ماهانه (آیتم به آیتم)',
  caps: 'سقف مصرف و مقایسه با مصرف واقعی',
  byproj: 'مصرف به تفکیک پروژه',
  byrecv: 'خروج به تفکیک تحویل‌گیرنده',
  bysup: 'ورود به تفکیک تامین‌کننده',
  card: 'کاردکس یک کالا',
  idle: 'کالاهای راکد (بدون گردش)',
  reorder: 'پیشنهاد خرید (زیر نقطه سفارش)',
  qc: 'آمار کنترل کیفی به تفکیک تامین‌کننده',
  whsum: 'خلاصه موجودی هر انبار'
};
Pages.reports = el => {
  const R = Pages._rep || (Pages._rep = {k: 'cons', from: Jalali.add(Jalali.today(), -29), to: Jalali.today(), wh: '', per: 'week', cat: '', item: ''});
  UI.head(el, 'گزارش‌ها', 'reports');
  const f = UI.card(el, `<div class="chips">${Object.keys(REPORTS).map(k => `<button class="chip ${R.k === k ? 'on' : ''}" data-k="${k}">${REPORTS[k]}</button>`).join('')}</div>
    <div class="filters"><label>از <input id="r_f" value="${toFa(R.from)}" size="10"></label><label>تا <input id="r_t" value="${toFa(R.to)}" size="10"></label>
    <span class="chips sm">${[['امروز', 0], ['۷ روز', 6], ['۳۰ روز', 29], ['۹۰ روز', 89]].map(x => `<button class="chip" data-d="${x[1]}">${x[0]}</button>`).join('')}<button class="chip" data-d="m">ماه جاری</button></span>
    <select id="r_w">${UI.whOpts(R.wh, 'همه انبارها', 1)}</select><select id="r_c">${UI.opts(DB.categories, R.cat, 'همه گروه‌ها')}</select>
    ${R.k === 'cons' ? `<select id="r_p">${Object.keys(PERIODS).map(p => `<option value="${p}" ${R.per === p ? 'selected' : ''}>${PERIODS[p]}</option>`).join('')}</select>` : ''}
    ${R.k === 'card' ? `<input id="r_i" list="dl_ri" placeholder="کالا" value="${esc(R.item ? itemLabel(itemOf(R.item)) : '')}"><datalist id="dl_ri">${DB.items.map(i => `<option value="${esc(itemLabel(i))}">`).join('')}</datalist>` : ''}
    <button class="btn pri sm" id="r_go">نمایش</button></div>`);
  f.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { R.k = b.dataset.k; UI.refresh(); });
  f.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { R.to = Jalali.today(); R.from = b.dataset.d === 'm' ? R.to.slice(0, 8) + '01' : Jalali.add(R.to, -b.dataset.d); UI.refresh(); });
  $('r_go').onclick = () => { R.from = Jalali.parse($('r_f').value) || R.from; R.to = Jalali.parse($('r_t').value) || R.to; R.wh = $('r_w').value; R.cat = $('r_c').value; if ($('r_p')) R.per = $('r_p').value; if ($('r_i')) { const k = normKey($('r_i').value); const it = DB.items.find(i => normKey(itemLabel(i)) === k); R.item = it ? it.id : ''; } UI.refresh(); };
  ['r_w', 'r_c', 'r_p'].forEach(i => $(i) && ($(i).onchange = () => $('r_go').click()));
  const out = UI.card(el, '');
  const inCat = it => it && (!R.cat || it.cat === R.cat);
  const fin = d => d.status === 'final' && (!R.wh || d.wh === R.wh || d.toWh === R.wh);
  const lbl = `${REPORTS[R.k]} — ${toFa(R.from)} تا ${toFa(R.to)}${R.wh ? ' — ' + whName(R.wh) : ''}`;
  const itemCols = [{t: 'کد', v: r => r.it.code}, {t: 'کالا', v: r => r.it.name}, {t: 'واحد', v: r => unitName(r.it.base)}];
  if (R.k === 'flow') {
    const m = {}; const g = id => m[id] || (m[id] = {it: itemOf(id), open: 0, in: 0, out: 0});
    DB.docs.filter(d => d.status === 'final').forEach(d => docMoves(d).forEach(x => {
      if (R.wh && x.wh !== R.wh) return; const r = g(x.item); if (!inCat(r.it)) return;
      if (d.date < R.from) r.open += x.q; else if (d.date <= R.to) { if (x.q > 0) r.in += x.q; else r.out -= x.q; }
    }));
    const rows = Object.values(m).filter(r => r.it && inCat(r.it)).map(r => Object.assign(r, {close: r.open + r.in - r.out}));
    UI.table(out, itemCols.concat([{t: 'اول دوره', n: 1, v: 'open'}, {t: 'ورود', n: 1, v: 'in', sum: 1}, {t: 'خروج', n: 1, v: 'out', sum: 1}, {t: 'مانده', n: 1, v: 'close'}, {t: 'وزن مانده (kg)', n: 1, v: r => r.close * (r.it.kgPer || 0), sum: 1}]), rows, {name: lbl, foot: 1, click: r => Pages._card(r.it.id, R.wh || null)});
  }
  if (R.k === 'cons') {
    const keyOf = d => R.per === 'day' ? d : R.per === 'week' ? Jalali.weekStart(d) : Jalali.month(d);
    const keys = []; let d = R.from; while (d <= R.to && keys.length < 400) { const k = keyOf(d); if (!keys.includes(k)) keys.push(k); d = Jalali.add(d, 1); }
    const m = {};
    DB.docs.filter(x => x.type === 'OUT' && fin(x) && x.date >= R.from && x.date <= R.to).forEach(x => x.lines.forEach(l => { const it = itemOf(l.item); if (!inCat(it)) return; const r = m[l.item] || (m[l.item] = {it, t: 0}); const k = keyOf(x.date); r[k] = (r[k] || 0) + l.base; r.t += l.base; }));
    const rows = Object.values(m).sort((a, b) => b.t - a.t);
    const days = Math.max(1, Jalali.toDay(R.to) - Jalali.toDay(R.from) + 1);
    const top = rows.slice(0, 8), mx = Math.max(1, ...top.map(r => r.t));
    out.innerHTML = `<h3>${esc(lbl)}</h3><div class="hbars">${top.map(r => `<div><span>${esc(r.it.name)}</span><i style="width:${Math.round(r.t / mx * 100)}%"></i><b>${fmt(r.t)} ${esc(unitName(r.it.base))}</b></div>`).join('') || '<p class="mut">در این بازه خروجی ثبت نشده.</p>'}</div>`;
    const kl = k => R.per === 'day' ? toFa(k.slice(5)) : R.per === 'week' ? 'هفته ' + toFa(k.slice(5)) : toFa(k);
    UI.table(out, itemCols.concat(keys.map(k => ({t: kl(k), n: 1, v: r => r[k] || 0, sum: 1})), [{t: 'جمع', n: 1, v: 't', sum: 1}, {t: 'میانگین روزانه', n: 1, v: r => r.t / days}, {t: 'میانگین هفتگی', n: 1, v: r => r.t / days * 7}, {t: 'موجودی فعلی', n: 1, v: r => stockOf(r.it.id, R.wh || null)}, {t: 'کفایت (روز)', n: 1, v: r => r.t ? Math.floor(stockOf(r.it.id, R.wh || null) / (r.t / days)) : 0}]), rows, {name: lbl, foot: 1, click: r => Pages._card(r.it.id)});
  }
  if (R.k === 'caps') {
    out.innerHTML = `<div class="row"><h3>سقف مصرف کالاها</h3><span class="sp"></span>${Auth.can('items') ? '<button class="btn pri sm" onclick="Caps.edit()">➕ تعریف سقف مصرف</button>' : ''}</div><p class="small mut">هنگام صدور حواله خروج، اگر مصرف دوره از سقف بیشتر شود هشدار داده می‌شود. وضعیت دوره جاری (نسبت به تاریخ «تا»):</p>`;
    const rows = DB.caps.map(c => { const [a, b] = periodRange(c.period, R.to); const used = consumption(c.item, a, b, c.wh); return {c, it: itemOf(c.item), a, b, used, pct: c.max ? used / c.max * 100 : 0}; }).filter(r => r.it);
    UI.table(out, itemCols.concat([{t: 'انبار', v: r => r.c.wh ? whName(r.c.wh) : 'همه'}, {t: 'دوره', v: r => PERIODS[r.c.period]}, {t: 'بازه جاری', v: r => toFa(r.a) + (r.a !== r.b ? ' تا ' + toFa(r.b) : '')}, {t: 'سقف', n: 1, v: r => r.c.max}, {t: 'مصرف', n: 1, v: 'used'}, {t: 'درصد', n: 1, v: 'pct', h: r => `<div class="pbar ${r.pct > 100 ? 'over' : r.pct > 80 ? 'near' : ''}"><i style="width:${Math.min(100, r.pct)}%"></i><b>${fmt(r.pct, 0)}٪</b></div>`}, {t: 'مانده مجاز', n: 1, v: r => r.c.max - r.used}]), rows, {name: 'سقف مصرف', click: r => Auth.can('items') && Caps.edit(r.c.id), empty: 'سقفی تعریف نشده.'});
  }
  const groupBy = (type, keyFn, title) => {
    const m = {};
    DB.docs.filter(x => x.type === type && fin(x) && x.date >= R.from && x.date <= R.to).forEach(x => x.lines.forEach(l => { const it = itemOf(l.item); if (!inCat(it)) return; const k = keyFn(x) || '(نامشخص)'; const kk = k + '|' + l.item; const r = m[kk] || (m[kk] = {g: k, it, q: 0, n: 0, docs: new Set()}); r.q += l.base; r.docs.add(x.no); }));
    const rows = Object.values(m).map(r => Object.assign(r, {n: r.docs.size})).sort((a, b) => a.g.localeCompare(b.g, 'fa') || b.q - a.q);
    const tot = {}; rows.forEach(r => tot[r.g] = (tot[r.g] || 0) + r.n);
    out.innerHTML = `<h3>${esc(lbl)}</h3><div class="chips">${Object.keys(tot).slice(0, 30).map(g => `<span class="chip">${esc(g)} <small>${toFa(tot[g])} سند</small></span>`).join('')}</div>`;
    UI.table(out, [{t: title, v: 'g'}].concat(itemCols, [{t: 'مقدار', n: 1, v: 'q', sum: 1}, {t: 'تعداد سند', n: 1, v: 'n'}, {t: 'وزن (kg)', n: 1, v: r => r.q * (r.it.kgPer || 0), sum: 1}]), rows, {name: lbl, foot: 1});
  };
  if (R.k === 'byproj') groupBy('OUT', x => projName(x.project), 'پروژه');
  if (R.k === 'byrecv') groupBy('OUT', x => x.receiver, 'تحویل‌گیرنده');
  if (R.k === 'bysup') groupBy('IN', x => partyName(x.party), 'تامین‌کننده');
  if (R.k === 'card') { if (R.item) { out.innerHTML = '<button class="btn pri" id="opencard">نمایش کاردکس «' + esc(itemOf(R.item).name) + '»</button>'; $('opencard').onclick = () => Pages._card(R.item, R.wh || null); setTimeout(() => Pages._card(R.item, R.wh || null), 50); } else out.innerHTML = '<p class="mut">کالا را انتخاب کنید و «نمایش» را بزنید. (در صفحه موجودی هم با کلیک روی هر کالا کاردکس باز می‌شود.)</p>'; }
  if (R.k === 'idle') {
    const last = {}; DB.docs.filter(d => d.status === 'final' && d.type === 'OUT').forEach(d => d.lines.forEach(l => { if (!last[l.item] || d.date > last[l.item]) last[l.item] = d.date; }));
    const rows = DB.items.filter(i => inCat(i) && stockOf(i.id, R.wh || null) > 0 && (!last[i.id] || last[i.id] < R.from)).map(it => ({it, last: last[it.id] || '', q: stockOf(it.id, R.wh || null)}));
    UI.table(out, itemCols.concat([{t: 'موجودی', n: 1, v: 'q'}, {t: 'آخرین خروج', v: r => r.last ? toFa(r.last) : 'هرگز'}, {t: 'وزن (kg)', n: 1, v: r => r.q * (r.it.kgPer || 0), sum: 1}]), rows, {name: 'کالاهای راکد از ' + R.from, foot: 1, click: r => Pages._card(r.it.id)});
  }
  if (R.k === 'reorder') {
    const days = 30, from = Jalali.add(Jalali.today(), -days);
    const rows = DB.items.filter(i => inCat(i) && i.min > 0 && stockOf(i.id) < i.min).map(it => { const c = consumption(it.id, from, Jalali.today()); return {it, q: stockOf(it.id), avg: c / days, need: Math.max(0, (it.max || it.min * 2) - stockOf(it.id))}; });
    UI.table(out, itemCols.concat([{t: 'موجودی', n: 1, v: 'q'}, {t: 'نقطه سفارش', n: 1, v: r => r.it.min}, {t: 'حداکثر', n: 1, v: r => r.it.max || 0}, {t: 'مصرف روزانه (۳۰ روز)', n: 1, v: 'avg'}, {t: 'مقدار پیشنهادی خرید', n: 1, v: 'need', h: r => '<b>' + fmt(r.need) + '</b>'}, {t: 'آخرین تامین‌کننده', v: r => { const d = DB.docs.filter(x => x.type === 'IN' && x.lines.some(l => l.item === r.it.id)).sort((a, b) => b.date.localeCompare(a.date))[0]; return d ? partyName(d.party) : ''; }}]), rows, {name: 'پیشنهاد خرید ' + Jalali.today(), empty: 'همه کالاهای دارای نقطه سفارش، موجودی کافی دارند.'});
  }
  if (R.k === 'qc') {
    const m = {}; DB.docs.filter(d => d.type === 'IN' && d.status !== 'cancelled' && d.date >= R.from && d.date <= R.to).forEach(d => d.lines.forEach(l => { if (!l.qc) return; const k = partyName(d.party) || '(نامشخص)'; const r = m[k] || (m[k] = {g: k, n: 0, ok: 0, cond: 0, rej: 0, pending: 0}); r.n++; r[l.qc]++; }));
    UI.table(out, [{t: 'تامین‌کننده', v: 'g'}, {t: 'تعداد قلم بازرسی', n: 1, v: 'n', sum: 1}, {t: 'تایید', n: 1, v: 'ok', sum: 1}, {t: 'مشروط', n: 1, v: 'cond', sum: 1}, {t: 'رد', n: 1, v: 'rej', sum: 1}, {t: 'در انتظار', n: 1, v: 'pending', sum: 1}, {t: 'درصد رد', n: 1, v: r => r.n - r.pending ? r.rej / (r.n - r.pending) * 100 : 0, h: r => fmt(r.n - r.pending ? r.rej / (r.n - r.pending) * 100 : 0, 1) + '٪'}], Object.values(m), {name: lbl, foot: 1});
  }
  if (R.k === 'whsum') {
    const rows = DB.warehouses.map(w => { const its = DB.items.filter(i => inCat(i) && Math.abs(stockOf(i.id, w.id)) > 1e-9); return {w, n: its.length, kg: its.reduce((a, i) => a + stockOf(i.id, w.id) * (i.kgPer || 0), 0), neg: its.filter(i => stockOf(i.id, w.id) < 0).length, docs: DB.docs.filter(d => d.status === 'final' && (d.wh === w.id || d.toWh === w.id) && d.date >= R.from && d.date <= R.to).length}; });
    UI.table(out, [{t: 'انبار', v: r => r.w.name}, {t: 'تعداد اقلام دارای موجودی', n: 1, v: 'n', sum: 1}, {t: 'وزن تقریبی (kg)', n: 1, v: 'kg', sum: 1}, {t: 'اقلام منفی', n: 1, v: 'neg'}, {t: 'اسناد در بازه', n: 1, v: 'docs', sum: 1}], rows, {name: lbl, foot: 1, click: r => { Pages._stWh = r.w.id; UI.go('stock'); }});
  }
};
const Caps = {
  edit(id) {
    const old = id ? byId('caps', id) : null; const c = old ? Object.assign({}, old) : {period: 'week'};
    UI.modal('سقف مصرف', `<form id="cpf"><div class="form one"><label>کالا<input id="cp_i" list="dl_cp" required value="${esc(c.item ? itemLabel(itemOf(c.item)) : '')}"><datalist id="dl_cp">${DB.items.map(i => `<option value="${esc(itemLabel(i))}">`).join('')}</datalist></label>
      <label>دوره<select id="cp_p">${Object.keys(PERIODS).map(p => `<option value="${p}" ${c.period === p ? 'selected' : ''}>${PERIODS[p]}</option>`).join('')}</select></label>
      <label>انبار<select id="cp_w">${UI.whOpts(c.wh, 'همه انبارها', 1)}</select></label><label>حداکثر مصرف مجاز (واحد پایه)<input id="cp_m" required inputmode="decimal" value="${c.max ? toFa(c.max) : ''}"></label></div></form>`,
      [{t: 'انصراف'}, ...(old ? [{t: 'حذف', c: 'danger', f: () => { removeRec('caps', old.id); UI.refresh(); }}] : []), {t: 'ذخیره', c: 'pri', f: () => { if (!$('cpf').reportValidity()) return false; const k = normKey($('cp_i').value); const it = DB.items.find(i => normKey(itemLabel(i)) === k); if (!it) { UI.toast('کالا پیدا نشد', 'err'); return false; } Object.assign(c, {item: it.id, period: $('cp_p').value, wh: $('cp_w').value, max: num($('cp_m').value)}); upsert('caps', c); UI.refresh(); }}]);
  }
};
