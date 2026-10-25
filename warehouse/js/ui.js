/* پوسته رابط کاربری: منو، پنجره‌ها، جدول‌ها، چاپ، خروجی اکسل */
'use strict';
const PAGES = [
  {k: 'dash', t: 'داشبورد', i: '🏠', p: 'view'},
  {k: 'stock', t: 'موجودی انبارها', i: '📦', p: 'view'},
  {k: 'docs', t: 'اسناد ورود و خروج', i: '🧾', p: 'view'},
  {k: 'approve', t: 'مجوزها و تاییدها', i: '✅', p: 'view'},
  {k: 'qc', t: 'کنترل کیفی', i: '🔬', p: 'view'},
  {k: 'loans', t: 'امانی‌ها', i: '🤝', p: 'view'},
  {k: 'count', t: 'انبارگردانی', i: '📋', p: 'view'},
  {k: 'items', t: 'کالاها و واحدها', i: '🏷️', p: 'view'},
  {k: 'base', t: 'انبارها و طرف‌حساب‌ها', i: '🏭', p: 'view'},
  {k: 'reports', t: 'گزارش‌ها', i: '📊', p: 'reports'},
  {k: 'forms', t: 'سفارشی‌سازی فرم‌ها', i: '🛠️', p: 'forms'},
  {k: 'log', t: 'گزارش تغییرات و ورودها', i: '🕘', p: 'reports'},
  {k: 'users', t: 'کاربران', i: '👥', p: 'users'},
  {k: 'settings', t: 'تنظیمات، پشتیبان و ابر', i: '⚙️', p: 'settings'},
  {k: 'help', t: 'آموزش و راهنما', i: '🎓', p: null}
];
const Pages = {};
const UI = (() => {
  let curPage = 'dash';
  function toast(msg, kind) { const t = $('toast'); t.textContent = msg; t.className = 'show ' + (kind || ''); clearTimeout(t._h); t._h = setTimeout(() => t.className = '', 3500); }
  function modal(title, body, buttons, wide) {
    $('m_t').textContent = title; $('m_b').innerHTML = body; $('modal').firstElementChild.className = 'mbox' + (wide ? ' wide' : '');
    const f = $('m_f'); f.innerHTML = '';
    (buttons || [{t: 'بستن'}]).forEach(b => { const e = document.createElement('button'); e.className = 'btn ' + (b.c || 'ghost'); e.textContent = b.t; e.onclick = async () => { if (b.f) { const r = await b.f(); if (r === false) return; } closeModal(); }; f.appendChild(e); });
    $('modal').classList.remove('hidden'); const first = $('m_b').querySelector('input,select,textarea'); if (first) setTimeout(() => first.focus(), 50);
  }
  function closeModal() { $('modal').classList.add('hidden'); }
  const confirmBox = (msg, f, okText) => modal('تایید', '<p>' + msg + '</p>', [{t: 'انصراف'}, {t: okText || 'بله، انجام شود', c: 'danger', f}]);
  function nav() {
    const u = Auth.user();
    $('nav').innerHTML = PAGES.filter(p => !p.p || Auth.can(p.p)).map(p => `<a href="#${p.k}" class="${p.k === curPage ? 'on' : ''}" data-k="${p.k}"><span>${p.i}</span>${p.t}${p.k === 'approve' ? badge(pendingCount()) : p.k === 'qc' ? badge(qcCount()) : ''}</a>`).join('');
    $('who').innerHTML = `<b>${esc(u.name)}</b><small>${esc(ROLES[u.role].t)}</small>`;
  }
  const badge = n => n ? ` <i class="bdg">${toFa(n)}</i>` : '';
  const pendingCount = () => DB.docs.filter(d => d.status === 'pending').length;
  const qcCount = () => DB.docs.reduce((a, d) => a + (d.status !== 'cancelled' ? d.lines.filter(l => l.qc === 'pending').length : 0), 0);
  function go(k) {
    const p = PAGES.find(x => x.k === k) || PAGES[0];
    if (p.p && !Auth.can(p.p)) { toast('به این بخش دسترسی ندارید', 'err'); k = 'dash'; }
    curPage = k; if (location.hash !== '#' + k) history.replaceState(null, '', '#' + k);
    nav(); $('ptitle').textContent = (PAGES.find(x => x.k === k) || {}).t || '';
    document.body.classList.remove('menu');
    const main = $('main'); main.innerHTML = '';
    try { (Pages[k] || Pages.dash)(main); } catch (e) { console.error(e); main.innerHTML = '<div class="card err">خطا در نمایش صفحه: ' + esc(e.message) + '</div>'; }
    main.scrollTop = 0; scrollTo(0, 0);
  }
  const refresh = () => go(curPage);
  function showLogin(msg) {
    document.body.classList.add('locked'); $('app').classList.add('hidden'); const L = $('login'); L.classList.remove('hidden');
    const setup = Auth.needsSetup();
    L.innerHTML = `<div class="lbox"><img src="icon-192.png" alt=""><h1>سامانه انبار آسارول</h1><p class="mut">${setup ? 'اولین اجرا: حساب «مدیر سیستم» را بسازید. این حساب همه دسترسی‌ها را دارد و بعداً کاربران دیگر را تعریف می‌کند.' : 'برای ورود، نام کاربری و رمز خود را وارد کنید.'}</p>
      ${msg ? '<p class="warn">' + esc(msg) + '</p>' : ''}
      <form id="lf">${setup ? '<label>نام و نام خانوادگی<input id="l_n" required></label>' : ''}
      <label>نام کاربری<input id="l_u" autocomplete="username" required dir="ltr"></label>
      <label>رمز عبور<input id="l_p" type="password" autocomplete="${setup ? 'new-password' : 'current-password'}" required dir="ltr"></label>
      ${setup ? '<label>تکرار رمز<input id="l_p2" type="password" required dir="ltr"></label>' : ''}
      <button class="btn pri big">${setup ? 'ساخت حساب و ورود' : 'ورود'}</button><p id="l_e" class="err"></p></form>
      <p class="mut small">هر ورود و خروج با نام کاربر، زمان و دستگاه در «گزارش ورودها» ثبت می‌شود.</p>
      ${setup ? '<p class="small"><a href="#" id="l_restore">بازیابی از فایل پشتیبان یا ابر</a></p>' : ''}</div>`;
    $('lf').onsubmit = async e => {
      e.preventDefault();
      if (setup) {
        if ($('l_p').value.length < 4) { $('l_e').textContent = 'رمز حداقل ۴ کاراکتر باشد.'; return; }
        if ($('l_p').value !== $('l_p2').value) { $('l_e').textContent = 'تکرار رمز یکسان نیست.'; return; }
        await Auth.setup($('l_n').value.trim(), toEn($('l_u').value), toEn($('l_p').value));
      } else { const err = Auth.login($('l_u').value, $('l_p').value); if (err) { $('l_e').textContent = err; return; } }
      enter();
    };
    const r = $('l_restore'); if (r) r.onclick = e => { e.preventDefault(); Backup.restorePrompt(true); };
  }
  function enter() {
    document.body.classList.remove('locked'); $('login').classList.add('hidden'); $('app').classList.remove('hidden');
    go((location.hash || '#dash').slice(1));
    if (!DB.items.length && Auth.can('items')) setTimeout(() => Help.welcome(), 400);
  }
  /* جدول با جستجو، مرتب‌سازی و خروجی اکسل */
  function table(el, cols, rows, opt) {
    opt = opt || {};
    let q = '', sortI = opt.sort == null ? -1 : opt.sort, dir = opt.dir || 1, limit = opt.limit || 300;
    const box = document.createElement('div'); box.className = 'tbl';
    box.innerHTML = `<div class="tbar">${opt.noSearch ? '' : '<input type="search" placeholder="🔍 جستجو در جدول…">'}<span class="cnt mut"></span>
      <span class="sp"></span>${opt.tools || ''}<button class="btn ghost sm xl">⬇ اکسل</button><button class="btn ghost sm pr">🖨 چاپ</button></div><div class="tw"><table><thead></thead><tbody></tbody><tfoot></tfoot></table></div><div class="more"></div>`;
    el.appendChild(box);
    const val = (c, r) => typeof c.v === 'function' ? c.v(r) : r[c.v];
    function draw() {
      let data = rows;
      if (q) { const qq = normKey(q); data = data.filter(r => cols.some(c => normKey(c.s ? c.s(r) : val(c, r)).includes(qq))); }
      if (sortI >= 0) { const c = cols[sortI]; data = data.slice().sort((a, b) => { const x = val(c, a), y = val(c, b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fa')) * dir; }); }
      box.querySelector('thead').innerHTML = '<tr>' + cols.map((c, i) => `<th data-i="${i}" class="${c.n ? 'n' : ''}">${c.t}${i === sortI ? (dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr>';
      box.querySelector('tbody').innerHTML = data.slice(0, limit).map((r, ri) => `<tr data-r="${rows.indexOf(r)}" class="${opt.rowClass ? opt.rowClass(r) : ''}">` + cols.map(c => `<td class="${c.n ? 'n' : ''}">${c.h ? c.h(r) : typeof val(c, r) === 'number' ? fmt(val(c, r)) : esc(val(c, r))}</td>`).join('') + '</tr>').join('') || `<tr><td colspan="${cols.length}" class="empty">${opt.empty || 'موردی یافت نشد.'}</td></tr>`;
      box.querySelector('tfoot').innerHTML = opt.foot ? '<tr>' + cols.map(c => `<td class="${c.n ? 'n' : ''}">${c.sum ? fmt(data.reduce((a, r) => a + (+val(c, r) || 0), 0)) : ''}</td>`).join('') + '</tr>' : '';
      box.querySelector('.cnt').textContent = toFa(data.length) + ' ردیف';
      box.querySelector('.more').innerHTML = data.length > limit ? `<button class="btn ghost sm">نمایش ${toFa(Math.min(300, data.length - limit))} ردیف بیشتر</button>` : '';
      box._data = data;
    }
    box.addEventListener('click', e => {
      const th = e.target.closest('th'); if (th) { const i = +th.dataset.i; if (sortI === i) dir = -dir; else { sortI = i; dir = 1; } draw(); return; }
      if (e.target.closest('.more button')) { limit += 300; draw(); return; }
      if (e.target.closest('.xl')) { exportXlsx(opt.name || 'گزارش', cols, box._data); return; }
      if (e.target.closest('.pr')) { printTable(opt.name || 'گزارش', cols, box._data); return; }
      const tr = e.target.closest('tbody tr'); if (tr && opt.click && tr.dataset.r != null && !e.target.closest('button,a,input,select')) opt.click(rows[+tr.dataset.r]);
    });
    const s = box.querySelector('input[type=search]'); if (s) s.oninput = () => { q = s.value; limit = opt.limit || 300; draw(); };
    draw(); return box;
  }
  function exportXlsx(name, cols, data) {
    if (typeof XLSX === 'undefined') { toast('کتابخانه اکسل بارگذاری نشده (یک‌بار با اینترنت باز کنید)', 'err'); return; }
    const plain = (c, r) => { const v = c.x ? c.x(r) : typeof c.v === 'function' ? c.v(r) : r[c.v]; return typeof v === 'number' ? v : String(v == null ? '' : v).replace(/<[^>]+>/g, ''); };
    const aoa = [cols.filter(c => !c.noX).map(c => c.t)].concat(data.map(r => cols.filter(c => !c.noX).map(c => plain(c, r))));
    const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = aoa[0].map(() => ({wch: 18})); const wb = XLSX.utils.book_new(); wb.Workbook = {Views: [{RTL: true}]};
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1'); XLSX.writeFile(wb, name.replace(/[\\/:*?"<>|]/g, '-') + ' ' + Jalali.today().replace(/\//g, '-') + '.xlsx');
  }
  function printHTML(html) {
    const p = $('print'); p.innerHTML = html; document.body.classList.add('printing');
    setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing'), 300); }, 60);
  }
  const printHead = title => `<div class="ph"><img src="icon-192.png"><div><b>${esc(DB.settings.company)}</b><small>${esc(DB.settings.unit || '')}</small></div><h2>${esc(title)}</h2><div class="pm">تاریخ چاپ: ${toFa(nowStamp())}<br>چاپ توسط: ${esc(Auth.name())}</div></div>`;
  function printTable(name, cols, data) {
    const cs = cols.filter(c => !c.noX);
    printHTML(printHead(name) + '<table class="pt"><thead><tr><th>#</th>' + cs.map(c => '<th>' + c.t + '</th>').join('') + '</tr></thead><tbody>' +
      data.map((r, i) => '<tr><td>' + toFa(i + 1) + '</td>' + cs.map(c => '<td>' + (c.h ? c.h(r) : esc(typeof c.v === 'function' ? c.v(r) : r[c.v])) + '</td>').join('') + '</tr>').join('') + '</tbody></table>');
  }
  /* سازنده گزینه‌های فهرست */
  const opts = (list, sel, empty, lab) => (empty != null ? `<option value="">${empty}</option>` : '') + list.map(x => `<option value="${esc(x.id)}" ${x.id === sel ? 'selected' : ''}>${esc(lab ? lab(x) : x.name)}</option>`).join('');
  const whOpts = (sel, empty, all) => opts(DB.warehouses.filter(w => (all || w.active !== false) && Auth.whAllowed(w.id)), sel, empty, w => w.name);
  const helpBtn = topic => `<button class="btn ghost sm hlp" onclick="Help.show('${topic}')" title="آموزش این بخش">❓ آموزش این بخش</button>`;
  const head = (el, title, topic, tools) => { const h = document.createElement('div'); h.className = 'phead'; h.innerHTML = `<h2>${title}</h2><span class="sp"></span>${tools || ''}${topic ? helpBtn(topic) : ''}`; el.appendChild(h); return h; };
  const card = (el, html, cls) => { const c = document.createElement('div'); c.className = 'card ' + (cls || ''); c.innerHTML = html; el.appendChild(c); return c; };
  return {toast, modal, closeModal, confirmBox, nav, go, refresh, showLogin, enter, table, exportXlsx, printHTML, printHead, opts, whOpts, head, card, cur: () => curPage};
})();
function closeModal() { UI.closeModal(); }
addEventListener('hashchange', () => { if (Auth.user()) { const k = location.hash.slice(1); if (k && k !== UI.cur()) UI.go(k); } });
addEventListener('keydown', e => { if (e.key === 'Escape') UI.closeModal(); });

/* ---------- داشبورد ---------- */
Pages.dash = el => {
  const today = Jalali.today(), wk = Jalali.weekStart(today);
  const docsToday = DB.docs.filter(d => d.date === today && d.status !== 'cancelled');
  const low = DB.items.filter(i => i.active !== false && i.min > 0 && stockOf(i.id) < i.min);
  const loans = loanBalances().filter(l => l.open > 1e-9), late = loans.filter(l => l.due && l.due < today);
  const pend = DB.docs.filter(d => d.status === 'pending');
  const qcN = DB.docs.reduce((a, d) => a + (d.status !== 'cancelled' ? d.lines.filter(l => l.qc === 'pending').length : 0), 0);
  UI.head(el, 'سلام ' + esc(Auth.name()) + ' 👋 <small class="mut">' + Jalali.weekday(today) + ' ' + toFa(today) + '</small>', 'dash');
  const k = UI.card(el, '', 'kpis');
  k.innerHTML = [
    ['📥', 'رسیدهای امروز', docsToday.filter(d => ['IN', 'RET_IN', 'LOAN_RET'].includes(d.type)).length, 'docs'],
    ['📤', 'حواله‌های خروج امروز', docsToday.filter(d => d.type === 'OUT').length, 'docs'],
    ['⏳', 'در انتظار مجوز', pend.length, 'approve'], ['🔬', 'در انتظار QC', qcN, 'qc'],
    ['⚠️', 'زیر نقطه سفارش', low.length, 'stock'], ['🤝', 'امانی باز' + (late.length ? ' (' + toFa(late.length) + ' معوق)' : ''), loans.length, 'loans'],
    ['🏷️', 'کالای تعریف‌شده', DB.items.length, 'items'], ['🏭', 'انبار فعال', DB.warehouses.filter(w => w.active !== false).length, 'base']
  ].map(x => `<a class="kpi" href="#${x[3]}"><span>${x[0]}</span><b>${toFa(x[2])}</b><small>${x[1]}</small></a>`).join('');
  const q = UI.card(el, '<h3>ثبت سریع</h3><div class="quick"></div>');
  q.querySelector('.quick').innerHTML = Object.keys(DOC_TYPES).filter(t => Docs.canCreate(t)).map(t => `<button class="btn qb" onclick="Docs.edit(null,'${t}')"><span>${DOC_TYPES[t].icon}</span>${DOC_TYPES[t].t}</button>`).join('') +
    (Auth.can('count') ? `<button class="btn qb" onclick="UI.go('count')"><span>📋</span>انبارگردانی</button>` : '');
  const grid = document.createElement('div'); grid.className = 'grid2'; el.appendChild(grid);
  /* نمودار مصرف ۷ روز اخیر */
  const days = []; for (let i = 6; i >= 0; i--) days.push(Jalali.add(today, -i));
  const vals = days.map(d => DB.docs.filter(x => x.type === 'OUT' && x.status === 'final' && x.date === d).reduce((a, x) => a + x.lines.length, 0));
  const mx = Math.max(1, ...vals);
  UI.card(grid, '<h3>خروج کالا — ۷ روز اخیر <small class="mut">(تعداد اقلام حواله‌شده)</small></h3><div class="bars">' + days.map((d, i) => `<div><i style="height:${Math.round(vals[i] / mx * 100)}%"></i><b>${toFa(vals[i])}</b><small>${Jalali.weekday(d).slice(0, 3)}<br>${toFa(d.slice(5))}</small></div>`).join('') + '</div>');
  const act = UI.card(grid, '<h3>آخرین فعالیت‌ها</h3>');
  act.innerHTML += '<ul class="feed">' + (DB.audit.slice(0, 9).map(a => `<li><b>${esc(a.user)}</b> ${esc(a.action)} ${esc(LABELS[a.coll] || a.coll)} <i>${esc(a.title)}</i><small>${toFa(a.at)}</small></li>`).join('') || '<li class="mut">هنوز فعالیتی ثبت نشده است.</li>') + '</ul><a href="#log" class="small">همه تغییرات ←</a>';
  if (low.length) { const c = UI.card(el, '<h3>⚠️ کالاهای زیر نقطه سفارش</h3>'); UI.table(c, [{t: 'کالا', v: r => itemLabel(r)}, {t: 'موجودی', n: 1, v: r => stockOf(r.id), h: r => qtyText(r, stockOf(r.id))}, {t: 'حداقل', n: 1, v: 'min'}, {t: 'کسری تا حداکثر', n: 1, v: r => Math.max(0, (r.max || r.min) - stockOf(r.id))}], low, {name: 'کالاهای زیر نقطه سفارش', limit: 10}); }
  if (late.length) { const c = UI.card(el, '<h3>⏰ امانی‌های معوق</h3>'); UI.table(c, Pages._loanCols(), late, {name: 'امانی معوق', limit: 10}); }
  const sinceSync = DB.settings.cloud.mode !== 'none' ? (DB.settings.cloud.last ? 'آخرین همگام‌سازی با ابر: ' + new Date(DB.settings.cloud.last).toLocaleString('fa-IR') : 'هنوز با ابر همگام نشده') : 'همگام‌سازی ابری غیرفعال است (تنظیمات ← ابر)';
  UI.card(el, `<div class="row"><span>💾 اطلاعات روی همین دستگاه ذخیره می‌شود. ${esc(sinceSync)}</span><span class="sp"></span>${Auth.can('settings') ? '<button class="btn ghost sm" onclick="Backup.download()">دانلود پشتیبان</button>' : ''}</div>`, 'note');
};
