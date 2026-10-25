/* سفارشی‌سازی فرم‌ها، کاربران، گزارش تغییرات/ورود، تنظیمات */
'use strict';
Pages.forms = el => {
  const type = Pages._fType || 'IN';
  UI.head(el, 'سفارشی‌سازی فرم‌ها و چاپ', 'forms');
  const c = UI.card(el, `<div class="chips">${Object.keys(DOC_TYPES).map(t => `<button class="chip ${t === type ? 'on' : ''}" data-t="${t}">${DOC_TYPES[t].icon} ${DOC_TYPES[t].t}</button>`).join('')}</div>`);
  c.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { Pages._fType = b.dataset.t; UI.refresh(); });
  const f = JSON.parse(JSON.stringify(Forms.get(type))); f.custom = f.custom || []; f.labels = f.labels || {}; f.hidden = f.hidden || []; f.req = f.req || [];
  const F = Forms.fields(type), LF = Forms.lineFields(type);
  const box = UI.card(el, `<div class="form"><label class="wide">عنوان چاپی سند<input id="fo_title" value="${esc(f.title || '')}" placeholder="${esc(DOC_TYPES[type].print)}"></label>
    <label class="wide">متن پایین سند چاپی<input id="fo_footer" value="${esc(f.footer || '')}" placeholder="${esc(DB.settings.printFooter)}"></label>
    <label class="wide">جای امضاها (با ویرگول جدا کنید)<input id="fo_signs" value="${esc(Forms.signs(type).join('، '))}"></label></div>
    <h4>فیلدهای پیش‌فرض</h4><table class="mini"><thead><tr><th>فیلد</th><th>برچسب نمایشی</th><th>نمایش</th><th>اجباری</th></tr></thead><tbody>
    ${F.map(x => `<tr><td>${esc((FIELD_DEFS[x.k].lab && FIELD_DEFS[x.k].lab[type]) || FIELD_DEFS[x.k].t)}</td><td><input data-l="${x.k}" value="${esc(f.labels[x.k] || '')}" placeholder="${esc(x.t)}"></td><td><input type="checkbox" data-h="${x.k}" ${!x.hide ? 'checked' : ''} ${x.fixed ? 'disabled' : ''}></td><td><input type="checkbox" data-r="${x.k}" ${x.req ? 'checked' : ''} ${x.fixed || (FIELD_DEFS[x.k].reqT || []).includes(type) ? 'disabled' : ''}></td></tr>`).join('')}
    ${LF.map(x => `<tr><td>ستون ردیف: ${esc(LINE_DEFS[x.k].t)}</td><td><input data-l="l_${x.k}" value="${esc(f.labels['l_' + x.k] || '')}" placeholder="${esc(x.t)}"></td><td><input type="checkbox" data-h="l_${x.k}" ${!x.hide ? 'checked' : ''}></td><td></td></tr>`).join('')}</tbody></table>
    <h4>فیلدهای اضافی (دلخواه)</h4><table class="mini"><thead><tr><th>برچسب</th><th>نوع</th><th>گزینه‌ها (برای فهرست)</th><th>اجباری</th><th>در چاپ</th><th></th></tr></thead><tbody id="fo_c"></tbody></table>
    <div class="row"><button class="btn ghost sm" id="fo_add">➕ افزودن فیلد</button><span class="sp"></span><button class="btn ghost sm" id="fo_reset">بازگشت به پیش‌فرض</button><button class="btn ghost sm" id="fo_prev">👁 پیش‌نمایش فرم</button><button class="btn pri" id="fo_save">💾 ذخیره فرم</button></div>`);
  const KINDS = [['text', 'متن'], ['number', 'عدد'], ['date', 'تاریخ'], ['select', 'فهرست انتخابی'], ['check', 'تیک (بله/خیر)']];
  const draw = () => { $('fo_c').innerHTML = f.custom.map((x, i) => `<tr data-i="${i}"><td><input class="cl" value="${esc(x.label)}" required></td><td><select class="ck">${KINDS.map(k => `<option value="${k[0]}" ${x.kind === k[0] ? 'selected' : ''}>${k[1]}</option>`).join('')}</select></td><td><input class="co" value="${esc(x.options || '')}" placeholder="مثلاً: نقدی، اعتباری"></td><td><input type="checkbox" class="cr" ${x.req ? 'checked' : ''}></td><td><input type="checkbox" class="cp" ${x.print !== false ? 'checked' : ''}></td><td><button class="btn ghost sm cdel">✕</button></td></tr>`).join('') || '<tr><td colspan="6" class="mut">فیلد اضافی ندارد. مثال: «شماره بارنامه»، «نوع بسته‌بندی»، «شماره سفارش کارفرما».</td></tr>'; };
  const read = () => { f.custom = [...$('fo_c').querySelectorAll('tr[data-i]')].map(tr => { const o = f.custom[+tr.dataset.i]; return {key: o.key, label: tr.querySelector('.cl').value.trim(), kind: tr.querySelector('.ck').value, options: tr.querySelector('.co').value, req: tr.querySelector('.cr').checked, print: tr.querySelector('.cp').checked}; }).filter(x => x.label); };
  draw();
  $('fo_add').onclick = () => { read(); f.custom.push({key: 'c' + uid(), label: '', kind: 'text'}); draw(); };
  $('fo_c').onclick = e => { if (e.target.classList.contains('cdel')) { read(); f.custom.splice(+e.target.closest('tr').dataset.i, 1); draw(); } };
  const collect = () => {
    read(); f.type = type; f.title = $('fo_title').value.trim(); f.footer = $('fo_footer').value.trim();
    const sg = $('fo_signs').value.split(/[,،]/).map(s => s.trim()).filter(Boolean); f.signs = sg.length ? sg : null;
    f.labels = {}; box.querySelectorAll('[data-l]').forEach(e => { if (e.value.trim()) f.labels[e.dataset.l] = e.value.trim(); });
    f.hidden = [...box.querySelectorAll('[data-h]')].filter(e => !e.checked && !e.disabled).map(e => e.dataset.h);
    f.req = [...box.querySelectorAll('[data-r]')].filter(e => e.checked && !e.disabled).map(e => e.dataset.r);
  };
  $('fo_save').onclick = () => { collect(); upsert('forms', f, 'تغییر فرم ' + DOC_TYPES[type].t); UI.toast('فرم ذخیره شد و از این پس در ثبت و چاپ استفاده می‌شود', 'ok'); UI.refresh(); };
  $('fo_reset').onclick = () => { const o = DB.forms.find(x => x.type === type); if (o) UI.confirmBox('تنظیمات این فرم پاک و به حالت پیش‌فرض برگردد؟', () => { removeRec('forms', o.id, 'بازگشت فرم ' + DOC_TYPES[type].t + ' به پیش‌فرض'); UI.refresh(); }); };
  $('fo_prev').onclick = () => { collect(); const bak = DB.forms; DB.forms = DB.forms.filter(x => x.type !== type).concat([f]); Docs.edit(null, type); DB.forms = bak; };
};

Pages.log = el => {
  const tab = Pages._logTab || 'audit';
  UI.head(el, 'گزارش تغییرات، اصلاحیه‌ها و ورود کاربران', 'log');
  const c = UI.card(el, `<div class="chips"><button class="chip ${tab === 'audit' ? 'on' : ''}" data-t="audit">🕘 تغییرات و اصلاحیه‌ها</button><button class="chip ${tab === 'logins' ? 'on' : ''}" data-t="logins">🔐 ورود و خروج کاربران</button><button class="chip ${tab === 'edits' ? 'on' : ''}" data-t="edits">✏️ فقط اصلاحیه و ابطال اسناد</button></div>`);
  c.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { Pages._logTab = b.dataset.t; UI.refresh(); });
  if (tab === 'logins') UI.table(c, [{t: 'زمان', v: r => toFa(r.at)}, {t: 'کاربر', v: 'user'}, {t: 'نتیجه', v: r => r.ok ? 'موفق' : 'ناموفق', h: r => r.ok ? '<span class="st final">موفق</span>' : '<span class="st cancelled">ناموفق</span>'}, {t: 'دستگاه', v: 'device'}, {t: 'اینترنت', v: r => r.online ? 'آنلاین' : 'آفلاین'}, {t: 'توضیح', v: 'note'}], DB.logins, {name: 'گزارش ورود کاربران'});
  else {
    const rows = tab === 'edits' ? DB.audit.filter(a => a.coll === 'docs' && a.action !== 'ایجاد') : DB.audit;
    UI.table(c, [{t: 'زمان', v: r => toFa(r.at)}, {t: 'کاربر', v: 'user'}, {t: 'عمل', v: 'action'}, {t: 'بخش', v: r => LABELS[r.coll] || r.coll}, {t: 'مورد', v: 'title'}, {t: 'جزئیات', v: 'detail', h: r => `<small>${esc(r.detail).slice(0, 300)}</small>`}], rows, {name: 'گزارش تغییرات', click: r => r.coll === 'docs' && byId('docs', r.rid) && Docs.view(r.rid)});
  }
};

Pages.users = el => {
  UI.head(el, 'کاربران و دسترسی‌ها', 'users', '<button class="btn pri sm" onclick="Users.edit()">➕ کاربر جدید</button>');
  const c = UI.card(el, '');
  UI.table(c, [{t: 'نام', v: 'name'}, {t: 'نام کاربری', v: 'username'}, {t: 'نقش', v: r => ROLES[r.role].t}, {t: 'انبارهای مجاز', v: r => r.whs && r.whs.length ? r.whs.map(whName).join('، ') : 'همه'}, {t: 'آخرین ورود', v: r => toFa(r.lastLogin || '')}, {t: 'وضعیت', v: r => r.active ? 'فعال' : 'غیرفعال'}], DB.users, {name: 'کاربران', click: r => Users.edit(r.id)});
  UI.card(el, '<h3>نقش‌ها و دسترسی‌های پیش‌فرض</h3><div class="tw"><table class="mini"><thead><tr><th>دسترسی</th>' + Object.values(ROLES).map(r => '<th>' + r.t + '</th>').join('') + '</tr></thead><tbody>' + Object.keys(PERMS).map(p => '<tr><td>' + PERMS[p] + '</td>' + Object.values(ROLES).map(r => '<td>' + (r.p.includes(p) ? '✓' : '') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div><p class="small mut">برای هر کاربر می‌توانید دسترسی‌ها را جداگانه تغییر دهید یا او را به انبارهای خاص محدود کنید.</p>');
};
const Users = {
  edit(id) {
    const old = id ? byId('users', id) : null; const u = old ? JSON.parse(JSON.stringify(old)) : {role: 'keeper', active: true, whs: []};
    const perms = u.perms || ROLES[u.role].p;
    UI.modal(old ? 'ویرایش کاربر' : 'کاربر جدید', `<form id="uf"><div class="form"><label>نام و نام خانوادگی <b class="req">*</b><input id="u_n" required value="${esc(u.name || '')}"></label>
      <label>نام کاربری <b class="req">*</b><input id="u_u" required dir="ltr" value="${esc(u.username || '')}" ${old ? 'disabled' : ''}></label>
      <label>${old ? 'رمز جدید (خالی = بدون تغییر)' : 'رمز عبور <b class="req">*</b>'}<input id="u_p" type="password" dir="ltr" ${old ? '' : 'required'} autocomplete="new-password"></label>
      <label>نقش<select id="u_r">${Object.keys(ROLES).map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${ROLES[r].t}</option>`).join('')}</select></label>
      <label class="chk"><input type="checkbox" id="u_a" ${u.active ? 'checked' : ''}> حساب فعال</label></div>
      <h4>دسترسی‌ها</h4><div class="chks" id="u_perm">${Object.keys(PERMS).map(p => `<label class="chk"><input type="checkbox" value="${p}" ${perms.includes(p) ? 'checked' : ''}> ${PERMS[p]}</label>`).join('')}</div>
      <h4>انبارهای مجاز <small class="mut">(هیچ‌کدام = همه انبارها)</small></h4><div class="chks" id="u_wh">${DB.warehouses.map(w => `<label class="chk"><input type="checkbox" value="${w.id}" ${(u.whs || []).includes(w.id) ? 'checked' : ''}> ${esc(w.name)}</label>`).join('')}</div></form>`,
      [{t: 'انصراف'}, {t: 'ذخیره', c: 'pri', f: () => {
        if (!$('uf').reportValidity()) return false;
        if (!old) { u.username = toEn($('u_u').value).trim(); if (DB.users.some(x => x.username.toLowerCase() === u.username.toLowerCase())) { UI.toast('نام کاربری تکراری است', 'err'); return false; } }
        const p = $('u_p').value; if (p) { if (p.length < 4) { UI.toast('رمز حداقل ۴ کاراکتر', 'err'); return false; } Auth.setPass(u, p); }
        u.name = $('u_n').value.trim(); u.role = $('u_r').value; u.active = $('u_a').checked;
        const ps = [...$('u_perm').querySelectorAll('input:checked')].map(e => e.value); u.perms = JSON.stringify(ps.slice().sort()) === JSON.stringify(ROLES[u.role].p.slice().sort()) ? null : ps;
        u.whs = [...$('u_wh').querySelectorAll('input:checked')].map(e => e.value);
        if (old && old.role === 'admin' && (u.role !== 'admin' || !u.active) && DB.users.filter(x => x.role === 'admin' && x.active).length < 2) { UI.toast('حداقل یک مدیر سیستم فعال لازم است', 'err'); return false; }
        upsert('users', u, (old ? 'ویرایش کاربر' : 'ایجاد کاربر') + ' — نقش: ' + ROLES[u.role].t + (p ? ' (رمز تغییر کرد)' : '')); UI.toast('کاربر ذخیره شد', 'ok'); UI.refresh();
      }}], true);
    $('u_r').onchange = () => { const rp = ROLES[$('u_r').value].p; $('u_perm').querySelectorAll('input').forEach(e => e.checked = rp.includes(e.value)); };
  }
};

Pages.settings = el => {
  const S = DB.settings;
  UI.head(el, 'تنظیمات، پشتیبان‌گیری و همگام‌سازی ابری', 'settings');
  UI.card(el, `<h3>اطلاعات شرکت و قوانین انبار</h3><div class="form">
    <label>نام شرکت (سربرگ چاپ)<input id="s_co" value="${esc(S.company)}"></label><label>واحد / زیرعنوان<input id="s_un" value="${esc(S.unit || '')}"></label>
    <label>پیشوند شماره اسناد<input id="s_pre" dir="ltr" value="${esc(S.prefix || 'ASR')}"></label><label>قفل خودکار پس از بی‌کاری (دقیقه، ۰ = خاموش)<input id="s_ses" inputmode="numeric" value="${toFa(S.sessionMin)}"></label>
    <label class="wide">متن پیش‌فرض پایین اسناد چاپی<input id="s_ft" value="${esc(S.printFooter || '')}"></label>
    <label class="chk"><input type="checkbox" id="s_ap" ${S.requireApproval ? 'checked' : ''}> اسناد خروج، امانی، انتقال و اصلاحیه پیش از قطعی شدن نیاز به «مجوز مدیر» دارند</label>
    <label class="chk"><input type="checkbox" id="s_qc" ${S.qcDefault ? 'checked' : ''}> کالاهای جدید به‌طور پیش‌فرض نیاز به کنترل کیفی دارند</label>
    <label class="chk"><input type="checkbox" id="s_neg" ${S.allowNegative ? 'checked' : ''}> اجازه ثبت خروج بیش از موجودی (موجودی منفی)</label>
    <label class="chk"><input type="checkbox" id="s_pr" ${S.printAfterSave ? 'checked' : ''}> پس از ثبت هر سند، چاپ خودکار</label></div>
    <div class="row"><span class="sp"></span><button class="btn pri" id="s_save">ذخیره تنظیمات</button></div>`);
  $('s_save').onclick = () => { Object.assign(S, {company: $('s_co').value.trim(), unit: $('s_un').value.trim(), prefix: toEn($('s_pre').value).trim().toUpperCase() || 'ASR', sessionMin: num($('s_ses').value), printFooter: $('s_ft').value.trim(), requireApproval: $('s_ap').checked, qcDefault: $('s_qc').checked, allowNegative: $('s_neg').checked, printAfterSave: $('s_pr').checked}); S.u = Date.now(); audit('ویرایش', 'settings', {name: 'تنظیمات'}, 'تنظیمات عمومی'); saveDB(); UI.toast('تنظیمات ذخیره شد', 'ok'); };
  const cl = S.cloud;
  UI.card(el, `<h3>☁️ همگام‌سازی ابری و ارسال گزارش</h3>
    <p class="small">برنامه همیشه <b>روی همین دستگاه</b> (حتی بدون اینترنت) کار می‌کند. با فعال کردن ابر، اطلاعات همه دستگاه‌ها (لپ‌تاپ انبار، گوشی مدیر و…) با هم یکی می‌شود و مدیر از هر جا با اینترنت گزارش‌ها را می‌بیند.</p>
    <div class="form"><label>روش<select id="c_m"><option value="none" ${cl.mode === 'none' ? 'selected' : ''}>غیرفعال (فقط همین دستگاه)</option><option value="gas" ${cl.mode === 'gas' ? 'selected' : ''}>Google Sheets / Drive (رایگان — پیشنهادی)</option><option value="folder" ${cl.mode === 'folder' ? 'selected' : ''}>پوشه همگام (Google Drive / OneDrive روی لپ‌تاپ)</option></select></label>
    <label class="gasf wide">آدرس وب‌اپ (Web App URL)<input id="c_u" dir="ltr" value="${esc(cl.url)}" placeholder="https://script.google.com/macros/s/…/exec"></label>
    <label class="gasf">کلید امنیتی (همان KEY در اسکریپت)<input id="c_k" dir="ltr" value="${esc(cl.key)}"></label>
    <label class="chk"><input type="checkbox" id="c_a" ${cl.auto ? 'checked' : ''}> ارسال خودکار تغییرات هنگام اتصال به اینترنت</label></div>
    <div class="row"><span id="c_st" class="mut small">${esc(Sync.status())}</span><span class="sp"></span><button class="btn ghost sm" onclick="Help.show('cloud')">📘 راهنمای راه‌اندازی ابر</button><button class="btn ghost sm" id="c_folder">📁 انتخاب پوشه</button><button class="btn ghost sm" id="c_save">ذخیره</button><button class="btn pri sm" id="c_now">🔄 همگام‌سازی الان</button></div>`);
  const tog = () => { el.querySelectorAll('.gasf').forEach(e => e.style.display = $('c_m').value === 'gas' ? '' : 'none'); $('c_folder').style.display = $('c_m').value === 'folder' ? '' : 'none'; }; $('c_m').onchange = tog; tog();
  $('c_save').onclick = () => { Object.assign(cl, {mode: $('c_m').value, url: $('c_u').value.trim(), key: $('c_k').value.trim(), auto: $('c_a').checked}); saveDB(); UI.toast('ذخیره شد', 'ok'); };
  $('c_now').onclick = async () => { $('c_save').click(); await Sync.run(true); $('c_st').textContent = Sync.status(); };
  $('c_folder').onclick = () => Sync.pickFolder();
  UI.card(el, `<h3>💾 پشتیبان‌گیری و بازیابی</h3><p class="small">فایل پشتیبان شامل همه کالاها، اسناد، کاربران (با رمز رمزنگاری‌شده)، فرم‌ها و گزارش‌هاست. توصیه: هر هفته یک پشتیبان روی فلش یا Drive.</p>
    <div class="row"><button class="btn pri sm" onclick="Backup.download()">⬇ دانلود پشتیبان کامل</button><button class="btn ghost sm" onclick="Backup.restorePrompt()">⬆ بازیابی از فایل</button><button class="btn ghost sm" onclick="Backup.excel()">📗 خروجی اکسل همه اسناد</button><button class="btn ghost sm" onclick="Importer.open()">📂 ورود اطلاعات از اکسل قدیمی</button><span class="sp"></span><button class="btn danger sm" onclick="Backup.wipe()">پاک کردن همه اطلاعات</button></div>
    <p class="small mut">حجم اطلاعات: ${toFa(Math.round(JSON.stringify(DB).length / 1024))} کیلوبایت — ${toFa(DB.items.length)} کالا، ${toFa(DB.docs.length)} سند.</p>`);
};
