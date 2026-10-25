/* اسناد انبار: فرم ثبت/ویرایش (قابل سفارشی‌سازی)، فهرست، چاپ، مجوز، کنترل کیفی */
'use strict';
/* فیلدهای پیش‌فرض سربرگ هر نوع سند — برچسب، نمایش و اجباری بودن در «سفارشی‌سازی فرم‌ها» قابل تغییر است */
const FIELD_DEFS = {
  date: {t: 'تاریخ', all: 1, req: 1},
  wh: {t: 'انبار', all: 1, req: 1, lab: {IN: 'انبار مقصد', RET_IN: 'انبار مقصد', OUT: 'انبار مبدأ', TRANSFER: 'از انبار', LOAN_OUT: 'انبار ارسال‌کننده', LOAN_RET: 'انبار دریافت‌کننده', ADJ: 'انبار', OPEN: 'انبار'}},
  toWh: {t: 'به انبار', types: ['TRANSFER', 'LOAN_OUT', 'LOAN_RET'], lab: {TRANSFER: 'به انبار', LOAN_OUT: 'انبار امانت‌گیرنده (اگر داخلی است)', LOAN_RET: 'از انبار امانت‌گیرنده (اگر داخلی است)'}, reqT: ['TRANSFER']},
  party: {t: 'طرف حساب', types: ['IN', 'RET_IN', 'OUT', 'LOAN_OUT', 'LOAN_RET'], lab: {IN: 'فروشنده / تامین‌کننده / پیمانکار', RET_IN: 'برگشت‌دهنده', OUT: 'کارفرما / مشتری', LOAN_OUT: 'امانت‌گیرنده (شخص/شرکت)', LOAN_RET: 'برگشت‌دهنده امانت'}},
  project: {t: 'شماره پروژه', types: ['OUT', 'RET_IN', 'LOAN_OUT', 'IN']},
  receiver: {t: 'تحویل‌گیرنده', types: ['OUT', 'LOAN_OUT', 'TRANSFER'], reqT: ['OUT']},
  deliverer: {t: 'تحویل‌دهنده', types: ['IN', 'RET_IN', 'LOAN_RET']},
  ref: {t: 'شماره مرجع', types: ['IN', 'OUT', 'RET_IN', 'TRANSFER', 'LOAN_OUT'], lab: {IN: 'شماره درخواست خرید / فاکتور', OUT: 'شماره درخواست خروج کالا', RET_IN: 'شماره حواله مرجع'}},
  carrier: {t: 'خودرو / راننده (برای مجوز خروج)', types: ['OUT', 'LOAN_OUT', 'IN']},
  due: {t: 'تاریخ سررسید برگشت', types: ['LOAN_OUT'], reqT: ['LOAN_OUT']},
  note: {t: 'توضیحات', all: 1}
};
const LINE_DEFS = {empCode: {t: 'کد کالا کارفرما', types: ['OUT']}, note: {t: 'توضیح ردیف', all: 1}};
const Forms = {
  get(type) { return DB.forms.find(f => f.type === type) || {type, hidden: [], labels: {}, req: [], custom: [], signs: null, footer: '', title: ''}; },
  fields(type) {
    const f = this.get(type);
    return Object.keys(FIELD_DEFS).filter(k => FIELD_DEFS[k].all || FIELD_DEFS[k].types.includes(type)).map(k => {
      const d = FIELD_DEFS[k];
      return {k, t: f.labels[k] || (d.lab && d.lab[type]) || d.t, req: !!(d.req || (d.reqT && d.reqT.includes(type)) || f.req.includes(k)), hide: !d.req && f.hidden.includes(k), fixed: !!d.req};
    });
  },
  lineFields(type) { const f = this.get(type); return Object.keys(LINE_DEFS).filter(k => LINE_DEFS[k].all || LINE_DEFS[k].types.includes(type)).map(k => ({k, t: f.labels['l_' + k] || LINE_DEFS[k].t, hide: f.hidden.includes('l_' + k)})); },
  signs(type) { const f = this.get(type); return f.signs || ({IN: ['تحویل‌دهنده', 'انباردار', 'کنترل کیفی'], OUT: ['انباردار', 'تحویل‌گیرنده', 'مدیر انبار'], LOAN_OUT: ['انباردار', 'امانت‌گیرنده', 'مدیر انبار']}[type] || ['انباردار', 'مدیر انبار']); },
  title(type) { return this.get(type).title || DOC_TYPES[type].print; }
};

const Docs = {
  canCreate(t) { return Auth.can({IN: 'in', RET_IN: 'in', OPEN: 'items', OUT: 'out', TRANSFER: 'transfer', LOAN_OUT: 'loan', LOAN_RET: 'loan', ADJ: 'count'}[t]); },
  needsApproval(t) { return DB.settings.requireApproval && (DB.settings.approvalTypes || ['OUT', 'LOAN_OUT', 'TRANSFER', 'ADJ']).includes(t); },
  /* فرم ثبت یا ویرایش سند */
  edit(id, type, preset) {
    const old = id ? byId('docs', id) : null;
    if (old && !Auth.can('edit') && !(old.createdBy === Auth.name() && old.status === 'pending')) { UI.toast('اجازه ویرایش سند ثبت‌شده را ندارید', 'err'); return; }
    const d = old ? JSON.parse(JSON.stringify(old)) : Object.assign({type, date: Jalali.today(), wh: (DB.warehouses.find(w => w.type === 'stock' && Auth.whAllowed(w.id)) || {}).id, lines: [], custom: {}}, preset || {});
    type = d.type; const T = DOC_TYPES[type];
    if (!d.lines.length) d.lines.push({});
    const F = Forms.fields(type).filter(f => !f.hide), LF = Forms.lineFields(type).filter(f => !f.hide), custom = Forms.get(type).custom || [];
    const parties = DB.parties.filter(p => p.active !== false);
    const fieldHTML = f => {
      const v = d[f.k] || '', rq = f.req ? ' required' : '', star = f.req ? ' <b class="req">*</b>' : '';
      switch (f.k) {
        case 'date': return `<label>${f.t}${star}<input id="f_date" value="${toFa(v)}" placeholder="۱۴۰۵/۰۱/۱۵"${rq}></label>`;
        case 'wh': return `<label>${f.t}${star}<select id="f_wh"${rq}>${UI.whOpts(v, '— انتخاب —')}</select></label>`;
        case 'toWh': return `<label>${f.t}${star}<select id="f_toWh">${UI.opts(DB.warehouses.filter(w => w.active !== false), v, '—')}</select></label>`;
        case 'party': return `<label>${f.t}${star}<input id="f_party" list="dl_party" value="${esc(partyName(v))}"${rq}></label>`;
        case 'project': return `<label>${f.t}${star}<input id="f_project" list="dl_proj" value="${esc(projName(v))}"${rq}></label>`;
        case 'due': return `<label>${f.t}${star}<input id="f_due" value="${toFa(v)}" placeholder="${toFa(Jalali.add(Jalali.today(), 30))}"${rq}></label>`;
        case 'note': return `<label class="wide">${f.t}${star}<textarea id="f_note" rows="2"${rq}>${esc(v)}</textarea></label>`;
        case 'receiver': case 'deliverer': return `<label>${f.t}${star}<input id="f_${f.k}" list="dl_person" value="${esc(v)}"${rq}></label>`;
        default: return `<label>${f.t}${star}<input id="f_${f.k}" value="${esc(v)}"${rq}></label>`;
      }
    };
    const customHTML = c => {
      const v = (d.custom || {})[c.key] || '', rq = c.req ? ' required' : '', star = c.req ? ' <b class="req">*</b>' : '';
      if (c.kind === 'select') return `<label>${esc(c.label)}${star}<select data-c="${c.key}"${rq}><option value=""></option>${(c.options || '').split(/[,،]/).map(o => o.trim()).filter(Boolean).map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
      if (c.kind === 'check') return `<label class="chk"><input type="checkbox" data-c="${c.key}" ${v ? 'checked' : ''}> ${esc(c.label)}</label>`;
      return `<label>${esc(c.label)}${star}<input data-c="${c.key}" value="${esc(v)}" ${c.kind === 'number' ? 'inputmode="decimal"' : ''}${rq}></label>`;
    };
    const loans = type === 'LOAN_RET' ? loanBalances().filter(l => l.open > 1e-9 || (old && old.lines.some(x => x.loanRef === l.ref))) : [];
    const body = `<form id="docf" class="docf">
      <div class="dtype">${T.icon} ${esc(Forms.title(type))} ${old ? '<b>' + esc(old.no) + '</b> <span class="st ' + old.status + '">' + STATUS[old.status] + '</span>' : '<span class="mut">شماره پس از ثبت داده می‌شود</span>'}</div>
      <div class="form">${F.map(fieldHTML).join('')}${custom.map(customHTML).join('')}</div>
      <h4>اقلام سند ${type === 'ADJ' ? '<small class="mut">(مقدار مثبت = افزایش، منفی = کاهش موجودی)</small>' : ''}</h4>
      <div class="lines"><table><thead><tr><th>#</th><th>کالا</th><th>مقدار</th><th>واحد</th><th>معادل واحد پایه / موجودی</th>${type === 'LOAN_RET' ? '<th>بابت امانی</th>' : ''}${type === 'IN' ? '<th>نیاز به QC</th>' : ''}${LF.map(f => '<th>' + esc(f.t) + '</th>').join('')}<th></th></tr></thead><tbody id="lines"></tbody></table></div>
      <div class="row"><button type="button" class="btn ghost sm" id="addl">➕ افزودن ردیف</button><button type="button" class="btn ghost sm" id="newit">🆕 تعریف کالای جدید</button><span class="sp"></span><span class="mut small">برای جستجو بخشی از نام یا کد کالا را بنویسید.</span></div>
      <div id="dwarn"></div></form>
      <datalist id="dl_items">${DB.items.filter(i => i.active !== false).map(i => `<option value="${esc(itemLabel(i))}">`).join('')}</datalist>
      <datalist id="dl_party">${parties.map(p => `<option value="${esc(p.name)}">`).join('')}</datalist>
      <datalist id="dl_proj">${DB.projects.map(p => `<option value="${esc(projName(p.id))}">`).join('')}</datalist>
      <datalist id="dl_person">${[...new Set(DB.docs.map(x => x.receiver).concat(DB.docs.map(x => x.deliverer)).concat(DB.parties.filter(p => p.kind === 'person').map(p => p.name)).filter(Boolean))].slice(0, 400).map(n => `<option value="${esc(n)}">`).join('')}</datalist>`;
    UI.modal((old ? 'ویرایش ' : 'ثبت ') + T.t, body, [
      {t: 'انصراف'},
      ...(old ? [] : [{t: 'ثبت و سند جدید', c: 'ghost', f: () => save(true)}]),
      {t: old ? 'ذخیره تغییرات' : 'ثبت سند', c: 'pri', f: () => save(false)}
    ], true);
    const findItem = s => { const k = normKey(s); if (!k) return null; return DB.items.find(i => normKey(itemLabel(i)) === k) || DB.items.find(i => normKey(i.code) === k) || DB.items.find(i => normKey(i.name) === k); };
    function lineRow(l, i) {
      const it = itemOf(l.item);
      const us = it ? itemUnits(it) : [];
      const stockWh = d.wh; const st = it ? stockOf(it.id, stockWh) : 0;
      const eq = it ? (l.qty ? (toBase(it, l.qty, l.unit || it.base) == null ? '<span class="err">واحد نامعتبر</span>' : '= ' + fmt(toBase(it, l.qty, l.unit || it.base)) + ' ' + esc(unitName(it.base))) : '') + `<br><small class="mut">موجودی ${esc(whName(stockWh))}: ${fmt(st)}</small>` : '';
      return `<tr data-i="${i}"><td>${toFa(i + 1)}</td>
        <td><input class="li" list="dl_items" value="${esc(it ? itemLabel(it) : l._txt || '')}" placeholder="کد یا نام کالا"></td>
        <td><input class="lq" inputmode="decimal" value="${l.qty != null ? toFa(l.qty) : ''}" style="width:90px"></td>
        <td><select class="lu">${us.map(u => `<option value="${u.id}" ${u.id === (l.unit || (it && it.base)) ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></td>
        <td class="eq">${eq}</td>
        ${type === 'LOAN_RET' ? `<td><select class="lr"><option value="">—</option>${loans.filter(x => !l.item || x.line.item === l.item).map(x => `<option value="${x.ref}" ${x.ref === l.loanRef ? 'selected' : ''}>${esc(x.doc.no)} · ${esc(partyName(x.doc.party) || whName(x.doc.toWh))} · مانده ${fmt(x.open)}</option>`).join('')}</select></td>` : ''}
        ${type === 'IN' ? `<td><input type="checkbox" class="lqc" ${l.qc ? 'checked' : ''} ${l.qc && l.qc !== 'pending' ? 'disabled title="نتیجه QC ثبت شده: ' + QC[l.qc] + '"' : ''}></td>` : ''}
        ${LF.map(f => `<td><input class="lf" data-k="${f.k}" value="${esc(l[f.k] || '')}"></td>`).join('')}
        <td><button type="button" class="btn ghost sm ldel" title="حذف ردیف">✕</button></td></tr>`;
    }
    const drawLines = () => { $('lines').innerHTML = d.lines.map(lineRow).join(''); };
    drawLines();
    const lines = $('lines');
    lines.addEventListener('change', e => {
      const tr = e.target.closest('tr'); if (!tr || !tr.isConnected) return; const l = d.lines[+tr.dataset.i];
      if (e.target.classList.contains('li')) {
        const it = findItem(e.target.value); l._txt = e.target.value;
        if (it) { l.item = it.id; l.unit = it.base; if (type === 'IN' && l.qc == null && (it.qc != null ? it.qc : DB.settings.qcDefault)) l.qc = 'pending'; }
        else l.item = null;
        try { tr.outerHTML = lineRow(l, +tr.dataset.i); } catch (err) { return; } /* ردیف در رویداد blur قبلاً بازسازی شده */
        const ntr = lines.querySelector(`tr[data-i="${tr.dataset.i}"]`); if (ntr) (it ? ntr.querySelector('.lq') : ntr.querySelector('.li')).focus();
        if (!it && e.target.value.trim()) UI.toast('کالا پیدا نشد؛ از فهرست انتخاب کنید یا «تعریف کالای جدید» را بزنید', 'err');
        return;
      }
      if (e.target.classList.contains('lq')) l.qty = e.target.value.trim() === '' ? null : num(e.target.value);
      if (e.target.classList.contains('lu')) l.unit = e.target.value;
      if (e.target.classList.contains('lr')) l.loanRef = e.target.value;
      if (e.target.classList.contains('lqc')) l.qc = e.target.checked ? 'pending' : null;
      if (e.target.classList.contains('lf')) l[e.target.dataset.k] = e.target.value;
      const it = itemOf(l.item); if (it && (e.target.classList.contains('lq') || e.target.classList.contains('lu'))) { const b = toBase(it, l.qty || 0, l.unit || it.base); tr.querySelector('.eq').innerHTML = (b == null ? '<span class="err">واحد نامعتبر</span>' : '= ' + fmt(b) + ' ' + esc(unitName(it.base))) + `<br><small class="mut">موجودی ${esc(whName(d.wh))}: ${fmt(stockOf(it.id, d.wh))}</small>`; }
    });
    lines.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('lq')) { e.preventDefault(); e.target.dispatchEvent(new Event('change', {bubbles: true})); d.lines.push({}); drawLines(); lines.querySelector('tr:last-child .li').focus(); } });
    lines.addEventListener('click', e => { if (e.target.classList.contains('ldel')) { d.lines.splice(+e.target.closest('tr').dataset.i, 1); if (!d.lines.length) d.lines.push({}); drawLines(); } });
    $('addl').onclick = () => { d.lines.push({}); drawLines(); lines.querySelector('tr:last-child .li').focus(); };
    $('newit').onclick = () => Items.quick(it => { $('dl_items').insertAdjacentHTML('beforeend', `<option value="${esc(itemLabel(it))}">`); const l = d.lines.find(x => !x.item) || (d.lines.push({}), d.lines[d.lines.length - 1]); l.item = it.id; l.unit = it.base; if (type === 'IN' && (it.qc != null ? it.qc : DB.settings.qcDefault)) l.qc = 'pending'; drawLines(); });
    const whSel = $('f_wh'); if (whSel) whSel.onchange = () => { d.wh = whSel.value; drawLines(); };
    async function save(again) {
      const g = k => { const e = $('f_' + k); return e ? e.value.trim() : d[k]; };
      const form = $('docf'); if (!form.reportValidity()) return false;
      const date = Jalali.parse(g('date') || ''); if (!date) { UI.toast('تاریخ نامعتبر است (مثال: ۱۴۰۵/۰۱/۱۵)', 'err'); return false; }
      d.date = date; d.wh = g('wh'); if ($('f_toWh')) d.toWh = g('toWh');
      ['ref', 'receiver', 'deliverer', 'carrier', 'note'].forEach(k => { if ($('f_' + k)) d[k] = g(k); });
      if ($('f_due')) d.due = Jalali.parse(g('due')) || '';
      if ($('f_party')) d.party = Base.resolveParty(g('party'), type === 'IN' ? 'supplier' : 'customer');
      if ($('f_project')) d.project = Base.resolveProject(g('project'));
      d.custom = d.custom || {}; $('docf').querySelectorAll('[data-c]').forEach(e => d.custom[e.dataset.c] = e.type === 'checkbox' ? (e.checked ? '✓' : '') : e.value.trim());
      if (type === 'TRANSFER' && d.toWh === d.wh) { UI.toast('انبار مبدأ و مقصد یکسان است', 'err'); return false; }
      if (type === 'LOAN_OUT' && !d.party && !d.toWh) { UI.toast('امانت‌گیرنده (شخص/شرکت یا انبار) را مشخص کنید', 'err'); return false; }
      const bad = d.lines.find(l => !l.item && (l._txt || l.qty)); if (bad) { UI.toast('ردیف ' + toFa(d.lines.indexOf(bad) + 1) + ': کالا شناخته نشد', 'err'); return false; }
      d.lines = d.lines.filter(l => l.item);
      for (const l of d.lines) {
        const it = itemOf(l.item); l.unit = l.unit || it.base;
        if (!l.qty || (type !== 'ADJ' && l.qty < 0)) { UI.toast('مقدار «' + it.name + '» نامعتبر است', 'err'); if (!d.lines.length) d.lines.push({}); drawLines(); return false; }
        l.base = toBase(it, l.qty, l.unit); if (l.base == null) { UI.toast('واحد «' + unitName(l.unit) + '» برای «' + it.name + '» تعریف نشده', 'err'); return false; }
        delete l._txt;
      }
      if (!d.lines.length) { d.lines.push({}); drawLines(); UI.toast('حداقل یک قلم کالا وارد کنید', 'err'); return false; }
      if (type === 'LOAN_RET') {
        for (const l of d.lines) { const lb = l.loanRef && loanBalances().find(x => x.ref === l.loanRef); if (lb) { const prev = old ? (old.lines.find(x => x.loanRef === l.loanRef) || {}).base || 0 : 0; if (l.base > lb.open + prev + 1e-9) { UI.toast('برگشت «' + itemOf(l.item).name + '» بیشتر از مانده امانی است', 'err'); return false; } if (!d.party && lb.doc.party) d.party = lb.doc.party; if (!d.toWh && lb.doc.toWh) d.toWh = lb.doc.toWh; } }
      }
      if (!old) d.status = Docs.needsApproval(type) ? 'pending' : 'final';
      const neg = negativeWarnings(d), caps = capWarnings(d);
      const go = async () => {
        if (!old) d.no = nextDocNo(type, d.date);
        const note = old ? (prompt('علت اصلاح سند (در گزارش تغییرات ثبت می‌شود):', '') || '') : '';
        if (old) d.rev = (old.rev || 0) + 1;
        upsert('docs', d, old ? 'اصلاحیه سند' + (note ? ' — علت: ' + note : '') + ' | ' + diffText(old, d) : 'ثبت ' + T.t + ' با ' + toFa(d.lines.length) + ' قلم' + (d.status === 'pending' ? ' (در انتظار مجوز)' : ''));
        UI.toast((old ? 'سند اصلاح شد: ' : 'سند ثبت شد: ') + d.no + (d.status === 'pending' ? ' — در انتظار مجوز' : ''), 'ok');
        UI.closeModal(); UI.refresh();
        if (again) setTimeout(() => Docs.edit(null, type, {wh: d.wh}), 150);
        else if (!old && DB.settings.printAfterSave) Docs.print(d.id);
      };
      if (neg.length && !DB.settings.allowNegative && d.status === 'final') { $('dwarn').innerHTML = '<div class="warn"><b>موجودی کافی نیست:</b><br>' + neg.map(esc).join('<br>') + '<br><small>برای ثبت، مقدار را اصلاح کنید یا در تنظیمات «اجازه موجودی منفی» را فعال کنید.</small></div>'; return false; }
      if (caps.length || neg.length) { if (!confirm('هشدار:\n' + caps.concat(neg).join('\n') + '\n\nآیا ثبت انجام شود؟')) return false; }
      await go(); return false;
    }
  },
  view(id) {
    const d = byId('docs', id); if (!d) return; const T = DOC_TYPES[d.type];
    const F = Forms.fields(d.type).filter(f => f.k !== 'note' && d[f.k]);
    const val = (k, v) => k === 'wh' || k === 'toWh' ? whName(v) : k === 'party' ? partyName(v) : k === 'project' ? projName(v) : toFa(v);
    const custom = (Forms.get(d.type).custom || []).filter(c => (d.custom || {})[c.key]);
    const hist = DB.audit.filter(a => a.rid === d.id).slice(0, 20);
    const body = `<div class="dtype">${T.icon} ${esc(Forms.title(d.type))} <b>${esc(d.no)}</b> <span class="st ${d.status}">${STATUS[d.status]}</span>${d.rev ? ' <span class="st rev">اصلاحیه ' + toFa(d.rev) + '</span>' : ''}</div>
      <div class="kv">${F.map(f => `<div><small>${esc(f.t)}</small><b>${esc(val(f.k, d[f.k]))}</b></div>`).join('')}${custom.map(c => `<div><small>${esc(c.label)}</small><b>${esc(d.custom[c.key])}</b></div>`).join('')}
      <div><small>ثبت‌کننده</small><b>${esc(d.createdBy || '')} ${toFa(d.createdAt || '')}</b></div>${d.updatedBy ? `<div><small>آخرین اصلاح</small><b>${esc(d.updatedBy)} ${toFa(d.updatedAt)}</b></div>` : ''}
      ${(d.approvals || []).map(a => `<div><small>${a.ok ? 'مجوز صادر شد' : 'رد مجوز'}</small><b>${esc(a.by)} ${toFa(a.at)} ${esc(a.note || '')}</b></div>`).join('')}</div>
      ${d.note ? '<p class="note">' + esc(d.note) + '</p>' : ''}
      <table class="pt"><thead><tr><th>#</th><th>کالا</th><th>مقدار</th><th>معادل پایه</th>${d.type === 'IN' ? '<th>QC</th>' : ''}<th>توضیح</th></tr></thead><tbody>${d.lines.map((l, i) => { const it = itemOf(l.item); return `<tr><td>${toFa(i + 1)}</td><td>${esc(itemLabel(it))}</td><td>${fmt(l.qty)} ${esc(unitName(l.unit))}</td><td>${fmt(l.base)} ${esc(it ? unitName(it.base) : '')}</td>${d.type === 'IN' ? `<td>${l.qc ? '<span class="st q' + l.qc + '">' + QC[l.qc] + '</span>' + (l.qcBy ? '<br><small>' + esc(l.qcBy) + '</small>' : '') : '—'}</td>` : ''}<td>${esc([l.empCode, l.note, l.qcNote].filter(Boolean).join(' · '))}</td></tr>`; }).join('')}</tbody></table>
      <details><summary>تاریخچه تغییرات این سند (${toFa(hist.length)})</summary><ul class="feed">${hist.map(a => `<li><b>${esc(a.user)}</b> ${esc(a.action)} <small>${toFa(a.at)}</small><br><small class="mut">${esc(a.detail)}</small></li>`).join('')}</ul></details>`;
    const btns = [{t: 'بستن'}, {t: '🖨 چاپ سند', c: 'ghost', f: () => { Docs.print(d.id); return false; }}];
    if (['OUT', 'LOAN_OUT', 'TRANSFER'].includes(d.type) && d.status === 'final') btns.push({t: '🚪 مجوز خروج', c: 'ghost', f: () => { Docs.print(d.id, 'gate'); return false; }});
    if (d.status !== 'cancelled' && (Auth.can('edit') || (d.status === 'pending' && d.createdBy === Auth.name()))) btns.push({t: '✏️ اصلاح', c: 'ghost', f: () => setTimeout(() => Docs.edit(d.id), 50)});
    if (d.status !== 'cancelled' && Auth.can('del')) btns.push({t: 'ابطال', c: 'danger', f: () => { setTimeout(() => Docs.cancel(d.id), 50); }});
    if (d.status === 'pending' && Auth.can('approve')) btns.push({t: '✅ صدور مجوز', c: 'pri', f: () => { Docs.approve(d.id, true); }});
    UI.modal('مشاهده سند', body, btns, true);
  },
  cancel(id) {
    const d = byId('docs', id); const why = prompt('علت ابطال سند ' + d.no + ' (اجباری):'); if (!why) return;
    const c = JSON.parse(JSON.stringify(d)); c.status = 'cancelled'; c.cancelNote = why;
    const neg = docMoves(d).filter(x => x.q > 0 && stockOf(x.item, x.wh) - x.q < -1e-9).map(x => itemLabel(itemOf(x.item)) + ' در ' + whName(x.wh));
    if (neg.length && !confirm('با ابطال این سند موجودی این اقلام منفی می‌شود:\n' + neg.join('\n') + '\nادامه می‌دهید؟')) return;
    upsert('docs', c, 'ابطال سند — علت: ' + why); UI.toast('سند ابطال شد و از موجودی کسر/اضافه آن برگشت خورد', 'ok'); UI.refresh();
  },
  approve(id, ok) {
    const d = JSON.parse(JSON.stringify(byId('docs', id))); const note = ok ? (prompt('توضیح مجوز (اختیاری):', '') || '') : prompt('علت رد مجوز:');
    if (!ok && !note) return;
    if (ok) { const neg = negativeWarnings(Object.assign({}, d, {status: 'final'})); if (neg.length && !DB.settings.allowNegative) { alert('موجودی کافی نیست:\n' + neg.join('\n')); return; } }
    d.approvals = (d.approvals || []).concat([{by: Auth.name(), at: nowStamp(), ok, note}]);
    d.status = ok ? 'final' : 'cancelled'; if (!ok) d.cancelNote = 'رد مجوز: ' + note;
    upsert('docs', d, (ok ? 'صدور مجوز' : 'رد مجوز') + (note ? ' — ' + note : '')); UI.toast(ok ? 'مجوز صادر شد و موجودی به‌روز شد' : 'درخواست رد شد', 'ok'); UI.refresh();
  },
  print(id, mode) {
    const d = byId('docs', id); const T = DOC_TYPES[d.type]; const gate = mode === 'gate';
    const F = Forms.fields(d.type).filter(f => !f.hide && f.k !== 'note' && f.k !== 'date' && d[f.k]);
    const val = (k, v) => k === 'wh' || k === 'toWh' ? whName(v) : k === 'party' ? partyName(v) : k === 'project' ? projName(v) : toFa(v);
    const custom = (Forms.get(d.type).custom || []).filter(c => c.print !== false && (d.custom || {})[c.key]);
    const LF = Forms.lineFields(d.type).filter(f => !f.hide);
    const signs = gate ? ['انباردار', 'مدیر انبار / صادرکننده مجوز', 'نگهبانی (هنگام خروج)'] : Forms.signs(d.type);
    const title = gate ? 'مجوز خروج کالا از کارخانه' : Forms.title(d.type);
    UI.printHTML(`<div class="pdoc">${UI.printHead(title)}
      <div class="pinfo"><div>شماره سند: <b>${esc(d.no)}</b></div><div>تاریخ: <b>${toFa(d.date)}</b></div><div>وضعیت: <b>${STATUS[d.status]}${d.rev ? ' — اصلاحیه ' + toFa(d.rev) : ''}</b></div>
      ${F.map(f => `<div>${esc(f.t)}: <b>${esc(val(f.k, d[f.k]))}</b></div>`).join('')}${custom.map(c => `<div>${esc(c.label)}: <b>${esc(d.custom[c.key])}</b></div>`).join('')}</div>
      <table class="pt"><thead><tr><th>ردیف</th><th>کد کالا</th><th>شرح کالا</th><th>مقدار</th><th>واحد</th><th>معادل (واحد پایه)</th>${!gate && d.type === 'IN' ? '<th>کنترل کیفی</th>' : ''}${gate ? '' : LF.map(f => '<th>' + esc(f.t) + '</th>').join('')}</tr></thead>
      <tbody>${d.lines.map((l, i) => { const it = itemOf(l.item) || {}; return `<tr><td>${toFa(i + 1)}</td><td>${esc(it.code || '')}</td><td>${esc(it.name || '')}</td><td>${fmt(l.qty)}</td><td>${esc(unitName(l.unit))}</td><td>${fmt(l.base)} ${esc(unitName(it.base))}</td>${!gate && d.type === 'IN' ? '<td>' + (l.qc ? QC[l.qc] : '—') + '</td>' : ''}${gate ? '' : LF.map(f => '<td>' + esc(l[f.k] || '') + '</td>').join('')}</tr>`; }).join('')}</tbody></table>
      ${d.note ? '<p>توضیحات: ' + esc(d.note) + '</p>' : ''}
      ${(d.approvals || []).filter(a => a.ok).map(a => `<p class="small">مجوز توسط ${esc(a.by)} در ${toFa(a.at)} صادر شد.</p>`).join('')}
      <div class="signs">${signs.map(s => `<div><small>${esc(s)}</small><span>نام و امضا</span></div>`).join('')}</div>
      <p class="pfoot">${esc(Forms.get(d.type).footer || DB.settings.printFooter || '')} — ثبت: ${esc(d.createdBy || '')} ${toFa(d.createdAt || '')}</p></div>`);
  }
};

/* ---------- صفحه فهرست اسناد ---------- */
Pages.docs = el => {
  const st = Pages._docFilter || (Pages._docFilter = {type: '', wh: '', from: '', to: '', status: ''});
  UI.head(el, 'اسناد ورود و خروج', 'docs', Object.keys(DOC_TYPES).filter(t => Docs.canCreate(t)).map(t => `<button class="btn ${t === 'IN' || t === 'OUT' ? 'pri' : 'ghost'} sm" onclick="Docs.edit(null,'${t}')">${DOC_TYPES[t].icon} ${DOC_TYPES[t].t.split(' (')[0]}</button>`).join(''));
  const f = UI.card(el, `<div class="filters"><select id="df_t"><option value="">همه انواع سند</option>${Object.keys(DOC_TYPES).map(t => `<option value="${t}" ${st.type === t ? 'selected' : ''}>${DOC_TYPES[t].t}</option>`).join('')}</select>
    <select id="df_w">${UI.whOpts(st.wh, 'همه انبارها', 1)}</select><select id="df_s"><option value="">همه وضعیت‌ها</option>${Object.keys(STATUS).map(s => `<option value="${s}" ${st.status === s ? 'selected' : ''}>${STATUS[s]}</option>`).join('')}</select>
    <input id="df_f" placeholder="از تاریخ" value="${toFa(st.from)}"><input id="df_to" placeholder="تا تاریخ" value="${toFa(st.to)}"><button class="btn ghost sm" id="df_go">اعمال</button></div>`);
  $('df_go').onclick = () => { Object.assign(st, {type: $('df_t').value, wh: $('df_w').value, status: $('df_s').value, from: Jalali.parse($('df_f').value) || '', to: Jalali.parse($('df_to').value) || ''}); UI.refresh(); };
  ['df_t', 'df_w', 'df_s'].forEach(i => $(i).onchange = () => $('df_go').click());
  const rows = DB.docs.filter(d => (!st.type || d.type === st.type) && (!st.wh || d.wh === st.wh || d.toWh === st.wh) && (!st.status || d.status === st.status) && (!st.from || d.date >= st.from) && (!st.to || d.date <= st.to) && (Auth.whAllowed(d.wh) || Auth.whAllowed(d.toWh)))
    .sort((a, b) => (b.date + b.no).localeCompare(a.date + a.no));
  UI.table(f, [
    {t: 'شماره', v: 'no'}, {t: 'تاریخ', v: 'date', h: r => toFa(r.date)}, {t: 'نوع', v: r => DOC_TYPES[r.type].t, h: r => DOC_TYPES[r.type].icon + ' ' + esc(DOC_TYPES[r.type].t.split(' (')[0])},
    {t: 'انبار', v: r => whName(r.wh) + (r.toWh ? ' ← ' + whName(r.toWh) : '')}, {t: 'طرف حساب / تحویل‌گیرنده', v: r => [partyName(r.party), r.receiver].filter(Boolean).join(' / ')},
    {t: 'پروژه', v: r => projName(r.project)}, {t: 'اقلام', n: 1, v: r => r.lines.length},
    {t: 'شرح اقلام', v: r => r.lines.slice(0, 3).map(l => (itemOf(l.item) || {}).name).join('، ') + (r.lines.length > 3 ? '…' : '')},
    {t: 'وضعیت', v: r => STATUS[r.status], h: r => `<span class="st ${r.status}">${STATUS[r.status]}</span>${r.rev ? ' <span class="st rev">اصلاحیه</span>' : ''}`},
    {t: 'ثبت‌کننده', v: 'createdBy'}, {t: '', noX: 1, h: r => `<button class="btn ghost sm" onclick="Docs.print('${r.id}')">🖨</button>`}
  ], rows, {name: 'اسناد انبار', click: r => Docs.view(r.id), empty: 'سندی ثبت نشده. از دکمه‌های بالا سند جدید ثبت کنید.'});
};

/* ---------- مجوزها ---------- */
Pages.approve = el => {
  UI.head(el, 'مجوزهای ورود و خروج', 'approve');
  if (!DB.settings.requireApproval) UI.card(el, 'صدور مجوز پیش از قطعی شدن اسناد <b>غیرفعال</b> است؛ اسناد بلافاصله پس از ثبت قطعی می‌شوند. برای فعال‌سازی: تنظیمات ← «نیاز به مجوز مدیر».' + (Auth.can('settings') ? ' <a href="#settings">رفتن به تنظیمات</a>' : ''), 'note');
  const pend = DB.docs.filter(d => d.status === 'pending');
  const c = UI.card(el, '<h3>در انتظار مجوز</h3>');
  UI.table(c, [{t: 'شماره', v: 'no'}, {t: 'تاریخ', v: r => toFa(r.date)}, {t: 'نوع', v: r => DOC_TYPES[r.type].t}, {t: 'انبار', v: r => whName(r.wh)}, {t: 'درخواست‌کننده', v: 'createdBy'}, {t: 'اقلام', v: r => r.lines.map(l => (itemOf(l.item) || {}).name + ' ' + fmt(l.qty) + ' ' + unitName(l.unit)).join('، ')},
    {t: '', noX: 1, h: r => Auth.can('approve') ? `<button class="btn pri sm" onclick="Docs.approve('${r.id}',true)">✅ صدور مجوز</button> <button class="btn danger sm" onclick="Docs.approve('${r.id}',false)">رد</button>` : '<span class="mut">نیاز به دسترسی مجوز</span>'}], pend, {name: 'در انتظار مجوز', click: r => Docs.view(r.id), empty: 'درخواستی در انتظار مجوز نیست.'});
  const done = DB.docs.filter(d => (d.approvals || []).length).sort((a, b) => b.u - a.u);
  const c2 = UI.card(el, '<h3>مجوزهای صادرشده / ردشده</h3>');
  UI.table(c2, [{t: 'شماره', v: 'no'}, {t: 'نوع', v: r => DOC_TYPES[r.type].t}, {t: 'نتیجه', v: r => r.approvals.slice(-1)[0].ok ? 'صادر شد' : 'رد شد'}, {t: 'توسط', v: r => r.approvals.slice(-1)[0].by}, {t: 'زمان', v: r => toFa(r.approvals.slice(-1)[0].at)}, {t: 'توضیح', v: r => r.approvals.slice(-1)[0].note},
    {t: '', noX: 1, h: r => r.status === 'final' && ['OUT', 'LOAN_OUT', 'TRANSFER'].includes(r.type) ? `<button class="btn ghost sm" onclick="Docs.print('${r.id}','gate')">🚪 چاپ مجوز خروج</button>` : ''}], done, {name: 'سوابق مجوز', click: r => Docs.view(r.id), limit: 50});
};

/* ---------- کنترل کیفی ---------- */
const QCPage = {
  set(docId, i, res) {
    const d = JSON.parse(JSON.stringify(byId('docs', docId))); const l = d.lines[i]; const it = itemOf(l.item);
    UI.modal('نتیجه کنترل کیفی — ' + it.name, `<div class="form one"><p>سند ${esc(d.no)} · مقدار ${fmt(l.qty)} ${esc(unitName(l.unit))} · تامین‌کننده: ${esc(partyName(d.party) || '—')}</p>
      <label>نتیجه<select id="qc_r">${Object.keys(QC).filter(k => k !== 'pending').map(k => `<option value="${k}" ${k === res ? 'selected' : ''}>${QC[k]}</option>`).join('')}</select></label>
      <label>شماره گزارش / گواهی QC<input id="qc_no" value="${esc(l.qcNo || '')}"></label><label>توضیح بازرس (ابعاد، ظاهر، نمونه‌برداری…)<textarea id="qc_n" rows="3">${esc(l.qcNote || '')}</textarea></label>
      <p class="small mut">فقط مقادیر «تایید» یا «قبول مشروط» به موجودی انبار اضافه می‌شوند. اقلام ردشده در گزارش QC باقی می‌مانند تا به تامین‌کننده برگشت داده شوند.</p></div>`,
      [{t: 'انصراف'}, {t: 'ثبت نتیجه', c: 'pri', f: () => { l.qc = $('qc_r').value; l.qcNote = $('qc_n').value; l.qcNo = $('qc_no').value; l.qcBy = Auth.name(); l.qcAt = nowStamp(); upsert('docs', d, 'کنترل کیفی ' + it.name + ': ' + QC[l.qc] + (l.qcNote ? ' — ' + l.qcNote : '')); UI.toast('نتیجه QC ثبت شد', 'ok'); UI.refresh(); }}]);
  }
};
Pages.qc = el => {
  UI.head(el, 'تاییدیه‌های کنترل کیفی', 'qc');
  const rows = []; DB.docs.forEach(d => d.type === 'IN' && d.status !== 'cancelled' && d.lines.forEach((l, i) => l.qc && rows.push({d, l, i})));
  const pend = rows.filter(r => r.l.qc === 'pending'), done = rows.filter(r => r.l.qc !== 'pending').sort((a, b) => String(b.l.qcAt).localeCompare(String(a.l.qcAt)));
  const cols = [{t: 'سند رسید', v: r => r.d.no}, {t: 'تاریخ ورود', v: r => toFa(r.d.date)}, {t: 'کالا', v: r => itemLabel(itemOf(r.l.item))}, {t: 'مقدار', v: r => fmt(r.l.qty) + ' ' + unitName(r.l.unit)}, {t: 'تامین‌کننده', v: r => partyName(r.d.party)}, {t: 'انبار مقصد', v: r => whName(r.d.wh)}];
  const c = UI.card(el, '<h3>🔬 در انتظار بازرسی <small class="mut">(تا تایید نشود به موجودی اضافه نمی‌شود)</small></h3>');
  UI.table(c, cols.concat([{t: '', noX: 1, h: r => Auth.can('qc') ? `<button class="btn pri sm" onclick="QCPage.set('${r.d.id}',${r.i},'ok')">تایید</button> <button class="btn ghost sm" onclick="QCPage.set('${r.d.id}',${r.i},'cond')">مشروط</button> <button class="btn danger sm" onclick="QCPage.set('${r.d.id}',${r.i},'rej')">رد</button>` : '<span class="mut">فقط کاربر QC</span>'}]), pend, {name: 'در انتظار QC', empty: 'قلمی در انتظار کنترل کیفی نیست.'});
  const c2 = UI.card(el, '<h3>سوابق کنترل کیفی</h3>');
  UI.table(c2, cols.concat([{t: 'نتیجه', v: r => QC[r.l.qc], h: r => `<span class="st q${r.l.qc}">${QC[r.l.qc]}</span>`}, {t: 'شماره گواهی', v: r => r.l.qcNo || ''}, {t: 'بازرس', v: r => r.l.qcBy || ''}, {t: 'زمان', v: r => toFa(r.l.qcAt || '')}, {t: 'توضیح', v: r => r.l.qcNote || ''},
    {t: '', noX: 1, h: r => Auth.can('qc') ? `<button class="btn ghost sm" onclick="QCPage.set('${r.d.id}',${r.i},'${r.l.qc}')">ویرایش</button>` : ''}]), done, {name: 'سوابق کنترل کیفی', limit: 100});
};
