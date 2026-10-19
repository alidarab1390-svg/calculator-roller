/* ═══════════════════════════════════════════════════════════════
   رولیک و استانداردها — آسارول  |  Rollers & Standards — Asaroul
   نرم‌افزار مستقل مرجع مهندسی (بدون قیمت‌گذاری) — کاملاً آفلاین
═══════════════════════════════════════════════════════════════ */
'use strict';
const LS = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ toast(L(b('ذخیره در حافظه مرورگر ممکن نشد','Could not save to browser storage'))); return false; } }
};
const APP = { lang: LS.get('rs_lang','fa'), unlocked: false, tab: LS.get('rs_tab','rollers'), sec: LS.get('rs_sec',{}) };
try { APP.unlocked = sessionStorage.getItem('rs_unlock') === '1'; } catch(e){}
const L = v => v == null ? '' : (typeof v === 'object' && !Array.isArray(v) && 'fa' in v) ? v[APP.lang] : v;
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const has = v => v !== '' && v != null && !(typeof v === 'number' && isNaN(v));
const $ = id => document.getElementById(id);
const fx = (v, d) => (v == null || isNaN(v)) ? '—' : (+v).toLocaleString('en-US', {maximumFractionDigits: d == null ? 2 : d});
const DEG = Math.PI / 180;

/* ─────────────── تعریف جدول‌ها (Datasets) ─────────────── */
const lvBar = lv => `<span class="lv" title="${lv}/7">${'▮'.repeat(lv||0)}<i>${'▮'.repeat(7-(lv||0))}</i></span>`;
const serBadge = r => `<span class="badge">${esc(r.ser||'')}</span>`;
const srcLab = r => L(SRC[r.src]) || '';
const rt = (r, k) => k === 'E1' ? (r.sideT || (has(r.E1) ? 'ET' : '')) : (r.cenT || r.rt || '');

const DS = {
  rollers: {
    icon:'📚', title:b('رولیک‌های استاندارد','Standard rollers'), src:'rm', rows: buildRollers,
    chips:{k:'cat', map:ROLLER_CATS},
    cols:[
      {k:'cat', l:b('نوع رولیک','Roller type'), hide:true, fmt:r => L((ROLLER_CATS[r.cat]||{}).t), opts:() => Object.keys(ROLLER_CATS).map(k => [k, L(ROLLER_CATS[k].t)])},
      {k:'ser', ab:'Series', l:b('سری','Series'), f:1, html:serBadge},
      {k:'duty', l:b('کلاس کاری','Duty class'), f:1, fmt:r => L(DUTY[r.duty]) || L(r.duty), opts:() => Object.keys(DUTY).map(k => [k, L(DUTY[k])])},
      {k:'design', ab:'Design', l:b('طرح','Design'), f:1},
      {k:'bw', ab:'BW', l:b('عرض نوار','Belt width'), u:'mm', n:1, f:1},
      {k:'arr', l:b('چیدمان','Arrangement'), f:1, fmt:r => L(ARR[r.arr]) || L(r.arr), opts:() => Object.keys(ARR).map(k => [k, L(ARR[k])])},
      {k:'D', ab:'D', l:b('قطر لوله','Tube dia.'), u:'mm', n:1, f:1},
      {k:'s', ab:'s', l:b('ضخامت لوله','Wall'), u:'mm', n:1},
      {k:'B', ab:'B', l:b('طول لوله','Tube length'), u:'mm', n:1},
      {k:'C', ab:'C', l:b('طول نصب','Installed length'), u:'mm', n:1},
      {k:'A', ab:'A', l:b('طول شافت','Spindle length'), u:'mm', n:1},
      {k:'d', ab:'d', l:b('قطر شافت','Spindle dia.'), u:'mm', n:1, f:1},
      {k:'ch', ab:'ch', l:b('تخت شافت','Flats'), u:'mm', n:1},
      {k:'brg', ab:'Brg', l:b('بلبرینگ','Bearing'), f:1},
      {k:'oe', ab:'øe', l:b('قطر لاستیک','Ring OD'), u:'mm', n:1, f:1},
      {k:'ri', ab:'øi', l:b('قطر داخلی لاستیک','Ring bore'), u:'mm', n:1},
      {k:'E1', ab:'ET/ER', l:b('عرض لاستیک کناری','Side ring width'), u:'mm', n:1, fmt:r => has(r.E1) ? rt(r,'E1')+' '+r.E1 : ''},
      {k:'E', ab:'ET/ER', l:b('عرض لاستیک میانی / ضربه‌گیر','Central / impact ring width'), u:'mm', n:1, fmt:r => has(r.E) ? (rt(r,'E') ? rt(r,'E')+' ' : '')+r.E : ''},
      {k:'sideT', l:b('نوع لاستیک کناری','Side ring type'), hide:true, opts:() => [['ET','ET'],['ER','ER']]},
      {k:'cenT', l:b('نوع لاستیک میانی','Central ring type'), hide:true, opts:() => [['ER','ER'],['ET','ET']]},
      {k:'side', ab:'side', l:b('تعداد کناری (هر طرف)','Side count (each)'), n:1},
      {k:'central', ab:'central', l:b('تعداد میانی','Central count'), n:1},
      {k:'total', ab:'n', l:b('کل رینگ‌ها','Total rings'), n:1},
      {k:'a', ab:'a', l:b('طول دسته کناری','Side set length'), u:'mm', n:1},
      {k:'b', ab:'b', l:b('گام رینگ میانی','Central pitch'), u:'mm', n:1},
      {k:'c', ab:'c', l:b('فاصله‌انداز','Spacer'), u:'mm', n:1},
      {k:'t', ab:'t', l:b('فاصله دسته‌ها','Set distance'), u:'mm', n:1},
      {k:'L', ab:'L', l:b('طول مارپیچ','Helix length'), u:'mm', n:1},
      {k:'M', ab:'M', l:b('رزوه','Thread')},
      {k:'f', ab:'f', l:b('f','f'), u:'mm', n:1}, {k:'m', ab:'m', l:b('m','m'), u:'mm', n:1},
      {k:'e', ab:'e', l:b('فاصله تخت تا لوله','Flat to tube'), u:'mm', n:1, hide:true},
      {k:'g', ab:'g', l:b('طول تخت','Flat length'), u:'mm', n:1, hide:true},
      {k:'wt', ab:'kg', l:b('وزن','Weight'), u:'kg', n:1},
      {k:'mat', l:b('جنس','Material'), hide:true, fmt:r => L(MAT[r.mat]) || L(r.mat)},
      {k:'code', ab:'Code', l:b('کد سفارش (Rulmeca)','Order code (Rulmeca)')},
      {k:'note', l:b('توضیحات','Notes'), hide:true}
    ],
    rowTitle: r => `${(ROLLER_CATS[r.cat]||{}).icon||''} ${L((ROLLER_CATS[r.cat]||{}).t)} — ${r.ser} Ø${r.oe||r.D||''}${r.B?' × '+r.B:''}`,
    detail: r => SV.roller(r) +
      `<p class="note">${L(b('C = B + 8 و A = B + ΔA سری (طبق جداول رولمکا). کد سفارش به سبک رولمکا: سری، d + نوع سر شافت، قطر + طرح، C.','C = B + 8 and A = B + series ΔA (Rulmeca tables). Rulmeca-style order code: series, d + spindle end, diameter + design, C.'))}</p>`
  },
  series: {
    icon:'🏷', title:b('سری‌ها و کلاس کاری (Rulmeca / DIN)','Series & duty class (Rulmeca / DIN)'), src:'rm', rows: buildSeries,
    cols:[
      {k:'ser', ab:'Series', l:b('سری','Series'), html:serBadge},
      {k:'duty', l:b('کلاس کاری','Duty class'), f:1, fmt:r => L(DUTY[r.duty]) || L(r.duty), opts:() => Object.keys(DUTY).map(k => [k, L(DUTY[k])])},
      {k:'lv', l:b('سطح (۱ تا ۷)','Level (1–7)'), n:1, html:r => lvBar(r.lv)},
      {k:'d', ab:'d', l:b('قطر شافت','Spindle dia.'), u:'mm', n:1, f:1},
      {k:'ch', ab:'ch', l:b('تخت شافت','Flats'), u:'mm', n:1},
      {k:'brg', ab:'Brg', l:b('بلبرینگ','Bearing'), f:1},
      {k:'e', ab:'e', l:b('e','e'), u:'mm', n:1}, {k:'g', ab:'g', l:b('g','g'), u:'mm', n:1},
      {k:'addA', ab:'ΔA', l:b('A − B','A − B'), u:'mm', n:1},
      {k:'fl', ab:'F/B', l:b('سر شافت','Spindle end')},
      {k:'mat', l:b('جنس لوله','Tube material'), fmt:r => L(MAT[r.mat]) || L(r.mat)},
      {k:'Ds', ab:'D', l:b('قطرهای موجود','Available diameters'), u:'mm'}
    ],
    rowTitle: r => `${r.ser} — ${L(DUTY[r.duty])}`,
    detail: r => `<p class="note">${L(b('سطح کاری از ۱ (خیلی سبک) تا ۷ (فوق سنگین معدنی) است. برای انتخاب سری بر اساس بار و عمر بلبرینگ از تب «🧮 طراحی و محاسبات» استفاده کنید.','Duty level ranges from 1 (very light) to 7 (extra heavy mining). Use the "🧮 Design & calculations" tab to select a series by load and bearing life.'))}</p>`
  },
  cema: {
    icon:'🇺🇸', title:b('کلاس‌های رولیک CEMA','CEMA idler classes'), src:'cema', rows:() => CEMA_CLASSES,
    cols:[
      {k:'cls', ab:'Class', l:b('کلاس','Class')}, {k:'duty', l:b('کلاس کاری','Duty'), fmt:r => L(r.duty)},
      {k:'dia', ab:'Ø', l:b('قطر رولیک','Roll dia.'), u:'in'}, {k:'bw', ab:'BW', l:b('عرض نوار','Belt width'), u:'in'},
      {k:'trough', l:b('ظرفیت بار ناودانی','Troughed load rating'), u:'lbf', n:1}, {k:'troughN', l:b('ظرفیت بار ناودانی','Troughed load rating'), u:'N', n:1},
      {k:'ret', l:b('ظرفیت بار برگشت','Return load rating'), u:'lbf', n:1}, {k:'retN', l:b('ظرفیت بار برگشت','Return load rating'), u:'N', n:1}
    ],
    rowTitle: r => `CEMA ${r.cls} — ${L(r.duty)}`,
    detail: () => `<p class="note">${L(b('ظرفیت بار CEMA بر پایه عمر L10 برابر ۳۰٬۰۰۰ ساعت در ۵۰۰ دور در دقیقه تعریف می‌شود (CEMA 502). مقادیر را با آخرین ویرایش استاندارد و کاتالوگ سازنده تطبیق دهید.','CEMA load ratings are based on L10 life of 30,000 h at 500 rpm (CEMA 502). Verify against the latest edition and the manufacturer catalogue.'))}</p>`
  },
  rollLen: {
    icon:'📏', title:b('طول رولیک بر حسب عرض نوار (ISO 1537 / DIN 15207)','Roll length vs belt width (ISO 1537 / DIN 15207)'), src:'iso',
    rows:() => Object.keys(ROLL_LEN.flat).map(bw => ({id:'rl|'+bw, bw:+bw, t3:ROLL_LEN.t3[bw]||'', v2:ROLL_LEN.v2[bw]||'', flat:ROLL_LEN.flat[bw]||'', src:'iso'})),
    cols:[
      {k:'bw', ab:'BW', l:b('عرض نوار','Belt width'), u:'mm', n:1},
      {k:'t3', ab:'B', l:b('ناودانی ۳ رولیکی','3-roll troughed'), u:'mm', n:1},
      {k:'v2', ab:'B', l:b('V دو رولیکی','2-roll V'), u:'mm', n:1},
      {k:'flat', ab:'B', l:b('تخت','Flat'), u:'mm', n:1}
    ],
    rowTitle: r => `BW ${r.bw}`
  },
  steelTubes: {
    icon:'🔩', title:b('لوله‌های فولادی','Steel tubes'), src:'ref', rows:() => STEEL_TUBES,
    cols:[
      {k:'D', ab:'D', l:b('قطر خارجی','OD'), u:'mm', n:1, f:1}, {k:'s', ab:'s', l:b('ضخامت','Wall'), u:'mm', n:1, f:1},
      {k:'Di', ab:'di', l:b('قطر داخلی','ID'), u:'mm', n:1}, {k:'kgm', ab:'kg/m', l:b('وزن هر متر','Mass per metre'), u:'kg/m', n:1},
      {k:'inch', l:b('معادل اینچی / CEMA','Inch / CEMA equiv.')}, {k:'roll', l:b('قطر رولیک','Roller dia.'), f:1},
      {k:'std', l:b('استاندارد','Standard')}, {k:'src', l:b('منبع','Source'), fmt:srcLab, hide:true}
    ],
    rowTitle: r => `Ø${r.D} × ${r.s}`, detail: r => SV.pipe(r.D, r.s, 'EN 10219 / EN 10217-1')
  },
  polyTubes: {
    icon:'🧪', title:b('لوله‌های پلیمری','Polymer tubes'), src:'ref', rows:() => POLY_TUBES,
    cols:[
      {k:'mat', l:b('جنس','Material'), f:1}, {k:'D', ab:'D', l:b('قطر خارجی','OD'), u:'mm', n:1, f:1}, {k:'s', ab:'s', l:b('ضخامت','Wall'), u:'mm', n:1},
      {k:'Di', ab:'di', l:b('قطر داخلی','ID'), u:'mm', n:1}, {k:'rho', ab:'ρ', l:b('چگالی','Density'), u:'g/cm³', n:1},
      {k:'kgm', ab:'kg/m', l:b('وزن هر متر','Mass per metre'), u:'kg/m', n:1}, {k:'temp', l:b('دمای کار','Service temp.'), u:'°C'},
      {k:'note', l:b('ویژگی','Properties'), fmt:r => L(r.note)}
    ],
    rowTitle: r => `${r.mat} Ø${r.D} × ${r.s}`, detail: r => SV.pipe(r.D, r.s, r.mat)
  },
  shaftMat: {
    icon:'⚙️', title:b('جنس شافت','Shaft materials'), src:'ref', rows:() => SHAFT_MAT,
    cols:[
      {k:'mat', l:b('جنس (EN / DIN)','Material (EN / DIN)')}, {k:'wn', l:b('شماره مواد','Material No.')}, {k:'aisi', l:b('معادل AISI / ASTM','AISI / ASTM equiv.')},
      {k:'Re', ab:'Re', l:b('تنش تسلیم','Yield strength'), u:'MPa', n:1}, {k:'Rm', ab:'Rm', l:b('استحکام کششی','Tensile strength'), u:'MPa'},
      {k:'HB', ab:'HB', l:b('سختی','Hardness'), u:'HB'}, {k:'use', l:b('کاربرد','Application'), fmt:r => L(r.use)}
    ],
    rowTitle: r => r.mat
  },
  circlip: {
    icon:'⭕', title:b('شیار خار شافت (DIN 471)','Shaft circlip groove (DIN 471)'), src:'din', rows:() => CIRCLIP,
    cols:[{k:'d', ab:'d', l:b('قطر شافت','Shaft dia.'), u:'mm', n:1}, {k:'d2', ab:'d2', l:b('قطر کف شیار','Groove dia.'), u:'mm', n:1},
      {k:'m', ab:'m', l:b('عرض شیار','Groove width'), u:'mm', n:1}, {k:'s', ab:'s', l:b('ضخامت خار','Ring thickness'), u:'mm', n:1}, {k:'std', l:b('استاندارد','Standard')}],
    rowTitle: r => `DIN 471 — d ${r.d}`, detail: () => SV.shaftEnd('circlip')
  },
  threads: {
    icon:'🔧', title:b('رزوه و سوراخکاری سر شافت (ISO متریک)','End threads & tapping (ISO metric)'), src:'din', rows:() => THREADS,
    cols:[{k:'M', ab:'M', l:b('رزوه','Thread')}, {k:'p', ab:'P', l:b('گام','Pitch'), u:'mm', n:1}, {k:'drill', ab:'Ø drill', l:b('مته قلاویز','Tap drill'), u:'mm', n:1},
      {k:'depth', l:b('عمق رزوه پیشنهادی (≈1.5d)','Suggested thread depth (≈1.5d)'), u:'mm', n:1}, {k:'std', l:b('استاندارد','Standard')}],
    rowTitle: r => r.M, detail: () => SV.shaftEnd('tap')
  },
  bearings: {
    icon:'🔘', title:b('بلبرینگ‌های شیار عمیق','Deep groove ball bearings'), src:'ref', rows:() => BEARINGS,
    cols:[{k:'brg', ab:'Brg', l:b('شماره','Designation')}, {k:'d', ab:'d', l:b('قطر داخلی','Bore'), u:'mm', n:1, f:1}, {k:'D', ab:'D', l:b('قطر خارجی','OD'), u:'mm', n:1},
      {k:'B', ab:'B', l:b('پهنا','Width'), u:'mm', n:1}, {k:'C', ab:'C', l:b('بار دینامیکی','Dynamic rating'), u:'kN', n:1}, {k:'C0', ab:'C0', l:b('بار استاتیکی','Static rating'), u:'kN', n:1},
      {k:'ser', l:b('سری‌های رولیک','Roller series')}],
    rowTitle: r => r.brg, detail: r => SV.bearing(r) + `<p class="note">${L(b('برای رولیک نوار نقاله لقی داخلی C3 و آب‌بندی 2RS/2Z با گریس لیتیمی پیشنهاد می‌شود. C و C0 مقادیر مرجع SKF هستند؛ برای سازنده دیگر از کاتالوگ همان سازنده استفاده کنید.','For conveyor rollers C3 internal clearance and 2RS/2Z sealing with lithium grease are recommended. C and C0 are SKF reference values; use the actual maker\'s catalogue.'))}</p>`
  },
  rings: {
    icon:'⭕', title:b('رینگ‌های لاستیکی استاندارد','Standard rubber rings'), src:'rm', rows:() => RINGS,
    cols:[{k:'type', ab:'Type', l:b('طرح','Design'), f:1}, {k:'prof', l:b('پروفیل','Profile'), fmt:r => L(r.prof)}, {k:'rt', ab:'ET/ER', l:b('نوع','Type'), f:1},
      {k:'oe', ab:'øe', l:b('قطر خارجی','OD'), u:'mm', n:1, f:1}, {k:'ri', ab:'øi', l:b('قطر داخلی (= D لوله)','Bore (= tube D)'), u:'mm', n:1, f:1},
      {k:'w', ab:'W', l:b('عرض','Width'), u:'mm', n:1}],
    rowTitle: r => `${r.type} øe${r.oe} / øi${r.ri} × ${r.w}`, detail: r => SV.ringProf(r.type)
  },
  rubberComp: {
    icon:'🧪', title:b('آمیزه‌های لاستیک','Rubber compounds'), src:'ref', rows:() => RUBBER_COMP,
    cols:[{k:'comp', l:b('آمیزه','Compound')}, {k:'shore', l:b('سختی','Hardness'), u:'Shore A'}, {k:'temp', l:b('دمای کار','Service temp.'), u:'°C'},
      {k:'abr', l:b('مقاومت سایشی','Abrasion resistance')}, {k:'oil', l:b('مقاوم به روغن','Oil resistant')}, {k:'use', l:b('کاربرد','Application'), fmt:r => L(r.use)}],
    rowTitle: r => r.comp
  },
  cemaSpacing: {
    icon:'📐', title:b('فاصله پایه‌ها — CEMA (فوت)','Idler spacing — CEMA (ft)'), src:'cema',
    rows:() => CEMA_SPACING.map(([bw,v,ret]) => Object.assign({id:'cs|'+bw, bw, ret, src:'cema'}, ...CEMA_DENS.map((dn,i) => ({['d'+dn]:v[i]})))),
    cols:[{k:'bw', ab:'BW', l:b('عرض نوار','Belt width'), u:'in'}].concat(CEMA_DENS.map(dn => ({k:'d'+dn, ab:dn+' lb/ft³', l:b('رفت','Troughed'), u:'ft', n:1})), [{k:'ret', l:b('برگشت','Return'), u:'ft', n:1}]),
    rowTitle: r => `CEMA BW ${r.bw}"`
  },
  dinSpacing: {
    icon:'📐', title:b('فاصله پایه‌ها — Rulmeca / DIN (متر)','Idler pitch — Rulmeca / DIN (m)'), src:'rm',
    rows:() => DIN_SPACING.map(([bw,v,ret]) => ({id:'ds|'+bw, bw, r1:v[0], r2:v[1], r3:v[2], ret, src:'rm'})),
    cols:[{k:'bw', ab:'BW', l:b('عرض نوار','Belt width'), u:'mm'}, {k:'r1', ab:'ρ < 1.2', l:b('رفت a0','Carrying a0'), u:'m', n:1},
      {k:'r2', ab:'ρ 1.2–2.0', l:b('رفت a0','Carrying a0'), u:'m', n:1}, {k:'r3', ab:'ρ > 2.0', l:b('رفت a0','Carrying a0'), u:'m', n:1}, {k:'ret', ab:'au', l:b('برگشت','Return'), u:'m', n:1}],
    rowTitle: r => `BW ${r.bw}`
  },
  materials: {
    icon:'⛰', title:b('مواد فله (برای محاسبات)','Bulk materials (for calculations)'), src:'ref', rows:() => MATERIALS,
    cols:[{k:'name', l:b('ماده','Material'), fmt:r => L(r.name)}, {k:'rmin', ab:'ρ min', l:b('چگالی کمینه','Density min'), u:'t/m³', n:1},
      {k:'rmax', ab:'ρ max', l:b('چگالی بیشینه','Density max'), u:'t/m³', n:1}, {k:'rho', ab:'ρ', l:b('چگالی محاسبه','Design density'), u:'t/m³', n:1},
      {k:'rep', ab:'∠ repose', l:b('زاویه ریزش','Angle of repose'), u:'°', n:1}, {k:'sur', ab:'β', l:b('زاویه سرریز','Surcharge angle'), u:'°', n:1},
      {k:'inc', ab:'δ max', l:b('بیشینه شیب نوار','Max. inclination'), u:'°', n:1}, {k:'abr', l:b('سایندگی (A کم … C زیاد)','Abrasiveness (A low … C high)')}],
    rowTitle: r => L(r.name),
    actions: r => `<button class="btn pri" onclick="useMaterial('${esc(r.id)}')">🧮 ${L(b('استفاده در محاسبه ظرفیت','Use in capacity calculation'))}</button>`,
    detail: () => `<p class="note">${L(b('مقادیر نمونه از جداول CEMA 550 و کاتالوگ‌ها هستند؛ برای طراحی نهایی چگالی و زاویه‌ها را با آزمایش ماده واقعی تعیین کنید.','Typical values from CEMA 550 and catalogues; for final design determine density and angles by testing the actual material.'))}</p>`
  },
  speeds: {
    icon:'⏩', title:b('سرعت پیشنهادی نوار','Recommended belt speed'), src:'ref', rows:() => SPEEDS,
    cols:[{k:'mat', l:b('نوع ماده / کاربرد','Material / duty'), fmt:r => L(r.mat)}, {k:'v', ab:'v', l:b('سرعت','Speed'), u:'m/s'}, {k:'fpm', ab:'v', l:b('سرعت','Speed'), u:'ft/min'}],
    rowTitle: r => L(r.mat)
  },
  tests: {
    icon:'🧪', title:b('آزمایش‌ها و تست‌های رولیک','Roller tests'), src:'ref', rows:() => TESTS,
    cols:[{k:'code', l:b('کد','Code')}, {k:'name', l:b('آزمایش','Test'), fmt:r => L(r.name)}, {k:'ref', l:b('استاندارد مرجع','Reference standard')},
      {k:'acc', l:b('معیار پذیرش','Acceptance criterion'), fmt:r => L(r.acc)}, {k:'freq', l:b('دفعات','Frequency'), fmt:r => L(r.freq)},
      {k:'eq', l:b('تجهیزات','Equipment'), fmt:r => L(r.eq), hide:true}],
    rowTitle: r => `${r.code} — ${L(r.name)}`,
    detail: r => { const st = L(r.steps); return `<h4>${L(b('روش انجام','Method'))}</h4><ol class="steps">${(Array.isArray(st)?st:[st]).map(s => `<li>${esc(s)}</li>`).join('')}</ol>`; },
    actions: r => `<button class="btn pri" onclick="printTestForm('${esc(r.id)}')">🖨 ${L(b('چاپ فرم ثبت نتایج','Print test record form'))}</button>`
  },
  glossary: {
    icon:'🔤', title:b('راهنمای علائم و اصطلاحات','Symbols & terms'), src:'rm', rows:() => GLOSSARY,
    cols:[{k:'ab', l:b('علامت','Symbol')}, {k:'desc', l:b('شرح','Description'), fmt:r => L(r.desc)}],
    rowTitle: r => r.ab
  }
};

/* ─────────────── ذخیره تغییرات کاربر ─────────────── */
const store = k => LS.get('rs_ds_'+k, {added:[], edits:{}, deleted:[]});
const DEFROWS = {}, ROWS = {};
function rowsOf(k){
  if (ROWS[k]) return ROWS[k];
  if (!DEFROWS[k]) DEFROWS[k] = DS[k].rows();
  const st = store(k), del = new Set(st.deleted||[]), ed = st.edits||{};
  ROWS[k] = DEFROWS[k].filter(r => !del.has(r.id)).map(r => ed[r.id] ? Object.assign({}, r, ed[r.id], {_ed:1}) : r)
    .concat((st.added||[]).map(r => Object.assign({}, r, {_add:1})));
  return ROWS[k];
}
const findRow = (k, id) => rowsOf(k).find(r => r.id === id);

/* ─────────────── رابط کاربری — تب‌ها ─────────────── */
const VIEW = {};
const vs = k => VIEW[k] || (VIEW[k] = {q:'', f:{}, chip:'all', limit:200});
const TABS = [
  {k:'rollers', icon:'📚', t:b('رولیک‌ها','Rollers'), secs:[
    {k:'std', t:b('رولیک‌های استاندارد','Standard rollers'), ds:'rollers'},
    {k:'series', t:b('سری و کلاس کاری','Series & duty'), ds:'series'},
    {k:'cema', t:b('کلاس‌های CEMA','CEMA classes'), ds:'cema'},
    {k:'len', t:b('طول رولیک ISO/DIN','Roll lengths ISO/DIN'), ds:'rollLen'}]},
  {k:'pipes', icon:'🔩', t:b('لوله‌ها','Tubes'), secs:[
    {k:'types', t:b('انواع لوله','Tube types'), cards:'pipes'},
    {k:'steel', t:b('لوله فولادی','Steel tubes'), ds:'steelTubes'},
    {k:'poly', t:b('لوله پلیمری','Polymer tubes'), ds:'polyTubes'}]},
  {k:'shafts', icon:'⚙️', t:b('شافت‌ها','Shafts'), secs:[
    {k:'ends', t:b('انواع سر شافت و ماشینکاری','End types & machining'), cards:'shafts'},
    {k:'mat', t:b('جنس شافت','Materials'), ds:'shaftMat'},
    {k:'circ', t:b('شیار خار DIN 471','Circlip grooves'), ds:'circlip'},
    {k:'thr', t:b('رزوه و قلاویز','Threads & tapping'), ds:'threads'}]},
  {k:'bearings', icon:'🔘', t:b('بلبرینگ و آب‌بند','Bearings & seals'), secs:[
    {k:'info', t:b('هوزینگ، آب‌بند و روانکاری','Housings, seals, lubrication'), cards:'bearings'},
    {k:'tbl', t:b('جدول بلبرینگ‌ها','Bearing table'), ds:'bearings'}]},
  {k:'rubber', icon:'⭕', t:b('لاستیک‌ها','Rubber'), secs:[
    {k:'types', t:b('انواع رینگ و پوشش','Ring & lagging types'), cards:'rubber'},
    {k:'rings', t:b('رینگ‌های استاندارد','Standard rings'), ds:'rings'},
    {k:'comp', t:b('آمیزه‌ها','Compounds'), ds:'rubberComp'}]},
  {k:'frames', icon:'🏗', t:b('پایه‌ها','Idler frames'), secs:[
    {k:'types', t:b('انواع پایه','Frame types'), cards:'frames'},
    {k:'din', t:b('فاصله پایه‌ها DIN','Pitch DIN'), ds:'dinSpacing'},
    {k:'cema', t:b('فاصله پایه‌ها CEMA','Spacing CEMA'), ds:'cemaSpacing'}]},
  {k:'design', icon:'🧮', t:b('طراحی و محاسبات','Design & calculations'), secs:[
    {k:'cap', t:b('ظرفیت و عرض نوار','Capacity & belt width'), calc:'cap'},
    {k:'load', t:b('بار رولیک و انتخاب سری','Idler load & series selection'), calc:'load'},
    {k:'mat', t:b('مواد فله','Bulk materials'), ds:'materials'},
    {k:'spd', t:b('سرعت پیشنهادی','Belt speed'), ds:'speeds'},
    {k:'fac', t:b('ضرایب محاسبه','Design factors'), calc:'factors'}]},
  {k:'tests', icon:'🧪', t:b('آزمایش‌ها','Tests'), secs:[{k:'all', t:b('آزمایش‌ها و تست‌ها','Tests & inspections'), ds:'tests'}]},
  {k:'gloss', icon:'🔤', t:b('علائم','Symbols'), secs:[{k:'all', t:b('راهنمای علائم','Symbols'), ds:'glossary'}]}
];

function renderAll(){
  document.documentElement.lang = APP.lang; document.documentElement.dir = APP.lang === 'fa' ? 'rtl' : 'ltr';
  document.body.classList.toggle('unlocked', APP.unlocked);
  document.querySelectorAll('[data-i]').forEach(el => { el.textContent = L(I18N[el.dataset.i]); });
  document.querySelectorAll('[data-ph]').forEach(el => { el.placeholder = L(I18N[el.dataset.ph]); });
  $('lang_btn').textContent = APP.lang === 'fa' ? 'EN' : 'فا';
  $('lock_btn').innerHTML = APP.unlocked ? '🔓 ' + L(I18N.locked_off) : '🔒 ' + L(I18N.locked_on);
  document.title = L(I18N.app);
  $('tabs').innerHTML = TABS.map(T => `<button class="tab ${APP.tab===T.k?'on':''}" onclick="go('${T.k}')">${T.icon} ${esc(L(T.t))}</button>`).join('');
  renderTab(); placeCredit();
}
function renderTab(){
  const T = TABS.find(x => x.k === APP.tab) || TABS[0];
  const sk = APP.sec[T.k] && T.secs.find(s => s.k === APP.sec[T.k]) ? APP.sec[T.k] : T.secs[0].k;
  const S = T.secs.find(s => s.k === sk);
  $('main').innerHTML = (T.secs.length > 1 ? `<div class="seg">${T.secs.map(s => `<button class="${s.k===sk?'on':''}" onclick="goSec('${s.k}')">${esc(L(s.t))}</button>`).join('')}</div>` : '') + `<div id="sec"></div>`;
  const el = $('sec');
  if (S.ds) renderDS(S.ds, el);
  else if (S.cards) renderCards(S.cards, el);
  else if (S.calc) CALC[S.calc](el);
}
window.go = k => { APP.tab = k; LS.set('rs_tab', k); renderAll(); window.scrollTo(0,0); };
window.goSec = k => { APP.sec[APP.tab] = k; LS.set('rs_sec', APP.sec); renderTab(); };

/* ─────────────── موتور جدول ─────────────── */
function cellText(c, r){ return c.fmt ? c.fmt(r) : L(r[c.k]); }
function cellHtml(c, r){ return c.html ? c.html(r) : esc(cellText(c, r)); }
function dsFiltered(k, ignore){
  const D = DS[k], V = vs(k), words = V.q.toLowerCase().split(/\s+/).filter(Boolean);
  return rowsOf(k).filter(r => {
    if (D.chips && V.chip !== 'all' && r[D.chips.k] !== V.chip && ignore !== 'chip') return false;
    for (const c of D.cols) if (c.f && c.k !== ignore && has(V.f[c.k]) && String(r[c.k] ?? '') !== V.f[c.k]) return false;
    if (words.length){ const hay = rowSearch(k, r); if (!words.every(w => hay.includes(w))) return false; }
    return true;
  });
}
function rowSearch(k, r){
  if (!r._s || r._sl !== APP.lang){
    r._s = DS[k].cols.map(c => cellText(c, r)).concat([r.ser, r.code, L(r.note), r.D && r.s ? r.D+'x'+r.s : '', r.D && r.B ? r.D+'*'+r.B : '']).filter(has).join(' ').toLowerCase()
      + ' ' + (r.D&&r.s ? r.D+'*'+r.s : '');
    r._sl = APP.lang;
  }
  return r._s;
}
function renderDS(k, el){
  const D = DS[k], V = vs(k);
  el.innerHTML = `<div class="card"><div class="ch"><span>${D.icon} ${esc(L(D.title))}</span><small>${esc(L(SRC[D.src])||'')}</small></div>
    <div class="bar"><input type="search" class="q" id="q_${k}" value="${esc(V.q)}" placeholder="${esc(L(I18N.search_ph))}" oninput="dsQ('${k}',this.value)">
    <button class="btn" onclick="dsXlsx('${k}')">📊 Excel</button><button class="btn" onclick="dsPdf('${k}')">📄 PDF</button>
    <button class="btn lk" onclick="dsEdit('${k}',null)">➕ ${esc(L(I18N.add))}</button>
    <button class="btn lk" onclick="dsReset('${k}')">↺ ${esc(L(I18N.reset))}</button><span class="cnt" id="cnt_${k}"></span></div>
    <div class="chips" id="chips_${k}"></div><div class="filters" id="flt_${k}"></div>
    <div class="tw"><table class="tb" id="tb_${k}"></table></div><div class="more" id="more_${k}"></div></div>`;
  dsBody(k);
}
function dsBody(k){
  const D = DS[k], V = vs(k);
  if (D.chips){
    const pool = dsFiltered(k, 'chip'), cnt = {};
    pool.forEach(r => cnt[r[D.chips.k]] = (cnt[r[D.chips.k]]||0) + 1);
    $('chips_'+k).innerHTML = `<button class="chip ${V.chip==='all'?'on':''}" onclick="dsChip('${k}','all')">${esc(L(I18N.all))}<b>${pool.length}</b></button>` +
      Object.entries(D.chips.map).map(([ck,c]) => `<button class="chip ${V.chip===ck?'on':''}" onclick="dsChip('${k}','${ck}')">${c.icon||''} ${esc(L(c.t))}<b>${cnt[ck]||0}</b></button>`).join('');
  }
  $('flt_'+k).innerHTML = D.cols.filter(c => c.f).map(c => {
    const pool = dsFiltered(k, c.k), seen = new Map();
    pool.forEach(r => { const v = r[c.k]; if (has(v) && !seen.has(String(v))) seen.set(String(v), cellText(c, r)); });
    if (!seen.size && !has(V.f[c.k])) return '';
    const vals = [...seen.entries()].sort((a,b2) => (parseFloat(a[0])-parseFloat(b2[0])) || a[1].localeCompare(b2[1]));
    return `<label>${esc(c.ab || L(c.l))}<select onchange="dsF('${k}','${c.k}',this.value)"><option value="">${esc(L(I18N.all))}</option>${vals.map(([v,t2]) => `<option value="${esc(v)}" ${V.f[c.k]===v?'selected':''}>${esc(t2)}</option>`).join('')}</select></label>`;
  }).join('') + (Object.values(V.f).some(has) || V.q ? `<button class="btn sm" onclick="dsClear('${k}')">✕ ${esc(L(I18N.clear))}</button>` : '');
  const list = dsFiltered(k), shown = list.slice(0, V.limit);
  const cols = D.cols.filter(c => !c.hide && shown.some(r => has(c.html ? r[c.k] : cellText(c, r))));
  $('tb_'+k).innerHTML = `<thead><tr><th>#</th>${cols.map(c => `<th title="${esc(L(c.l))}">${c.ab?`<b>${esc(c.ab)}</b>`:''}<span>${esc(L(c.l))}</span>${c.u?`<small>${esc(c.u)}</small>`:''}</th>`).join('')}</tr></thead><tbody>` +
    (shown.length ? shown.map((r,i) => `<tr onclick="dsShow('${k}','${esc(r.id)}')"><td>${i+1}${r._add?' <i class="mk" title="+">●</i>':''}${r._ed?' <i class="mk">✎</i>':''}</td>${cols.map(c => `<td class="${c.n?'num':''}">${cellHtml(c, r)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${cols.length+1}" class="empty">${esc(L(I18N.none))}</td></tr>`) + '</tbody>';
  $('cnt_'+k).textContent = `${fx(list.length,0)} ${L(I18N.rows)}`;
  $('more_'+k).innerHTML = list.length > shown.length ? `<button class="btn" onclick="dsMore('${k}')">${esc(L(I18N.more))} (${fx(list.length-shown.length,0)})</button>` : '';
}
let qT = null;
window.dsQ = (k, v) => { vs(k).q = v; vs(k).limit = 200; clearTimeout(qT); qT = setTimeout(() => dsBody(k), 120); };
window.dsF = (k, c, v) => { vs(k).f[c] = v; vs(k).limit = 200; dsBody(k); };
window.dsChip = (k, c) => { const V = vs(k); V.chip = c; V.f = {}; V.limit = 200; dsBody(k); };
window.dsClear = k => { const V = vs(k); V.f = {}; V.q = ''; const q = $('q_'+k); if (q) q.value = ''; dsBody(k); };
window.dsMore = k => { vs(k).limit += 400; dsBody(k); };

/* جزئیات */
window.dsShow = (k, id) => {
  const D = DS[k], r = findRow(k, id); if (!r) return;
  const spec = D.cols.filter(c => has(c.html && c.k!=='lv' ? r[c.k] : cellText(c, r))).map(c =>
    `<div><span>${c.ab?`<b>${esc(c.ab)}</b> `:''}${esc(L(c.l))}${c.u?` <small>(${esc(c.u)})</small>`:''}</span><em>${c.k==='lv'?lvBar(r.lv):esc(cellText(c, r))}</em></div>`).join('');
  const note = has(L(r.note)) && D.cols.every(c => c.k !== 'note' || c.hide) ? `<p class="note">ℹ️ ${esc(L(r.note))}</p>` : '';
  openModal(D.rowTitle(r), (D.detail ? D.detail(r) : '') + `<div class="spec">${spec}</div>` + note +
    (r.src || D.src ? `<p class="src">${esc(L(I18N.source))}: ${esc(L(SRC[r.src||D.src]))}</p>` : ''),
    (D.actions ? D.actions(r) : '') + `<button class="btn" onclick="printItem('${k}','${esc(id)}')">🖨 ${esc(L(I18N.print))}</button>` +
    `<button class="btn lk" onclick="dsEdit('${k}','${esc(id)}')">✏️ ${esc(L(I18N.edit))}</button><button class="btn lk" onclick="dsEdit('${k}','${esc(id)}',true)">⧉ ${esc(L(I18N.copy))}</button>` +
    `<button class="btn lk danger" onclick="dsDel('${k}','${esc(id)}')">🗑 ${esc(L(I18N.del))}</button>`);
};
/* ویرایش (فقط در حالت باز) */
const need = () => { if (APP.unlocked) return true; toast('🔒 ' + L(I18N.need_unlock)); return false; };
window.dsEdit = (k, id, copy) => {
  if (!need()) return;
  const D = DS[k], r = id ? Object.assign({}, findRow(k, id)) : {};
  if (!id && D.chips && vs(k).chip !== 'all') r[D.chips.k] = vs(k).chip;
  const inp = c => {
    const v = r[c.k];
    if (c.opts) return `<label>${esc((c.ab?c.ab+' — ':'')+L(c.l))}<select id="e_${c.k}"><option value=""></option>${c.opts().map(([o,t2]) => `<option value="${esc(o)}" ${String(v)===String(o)?'selected':''}>${esc(t2)}</option>`).join('')}</select></label>`;
    const val = v && typeof v === 'object' && 'fa' in v ? (Array.isArray(v.fa) ? v[APP.lang].join(' | ') : v[APP.lang]) : (v ?? '');
    return `<label>${esc((c.ab?c.ab+' — ':'')+L(c.l))}${c.u?` (${esc(c.u)})`:''}<input id="e_${c.k}" type="${c.n?'number':'text'}" step="any" value="${esc(val)}"></label>`;
  };
  const extra = k === 'tests' ? [{k:'steps', l:b('مراحل (با | جدا شوند)','Steps (separate with |)')}] : [];
  openModal((id && !copy ? '✏️ ' : '➕ ') + L(D.title), `<div class="form">${D.cols.concat(extra).filter(c => !c.html || c.k==='ser').map(inp).join('')}</div>`,
    `<button class="btn pri" onclick="dsSave('${k}','${id && !copy ? esc(id) : ''}')">💾 ${esc(L(I18N.save))}</button><button class="btn" onclick="closeModal()">${esc(L(I18N.cancel))}</button>`);
  dsEdit._base = r;
};
window.dsSave = (k, id) => {
  if (!need()) return;
  const D = DS[k], base = dsEdit._base || {}, o = Object.assign({}, base); delete o._add; delete o._ed; delete o._s; delete o._sl;
  const cols = D.cols.concat(k === 'tests' ? [{k:'steps'}] : []);
  cols.forEach(c => { const el = $('e_'+c.k); if (!el) return; let v = el.value.trim();
    const old = base[c.k];
    if (c.k === 'steps'){ const arr = v.split('|').map(s => s.trim()).filter(Boolean); o.steps = Object.assign({}, old && typeof old==='object' ? old : {fa:arr,en:arr}, {[APP.lang]:arr}); return; }
    if (old && typeof old === 'object' && 'fa' in old){ o[c.k] = Object.assign({}, old, {[APP.lang]:v}); return; }
    o[c.k] = v === '' ? '' : (c.n ? +v : v); });
  const st = store(k);
  if (id){ if ((st.added||[]).some(r => r.id === id)) st.added = st.added.map(r => r.id === id ? Object.assign(o,{id}) : r); else { st.edits = st.edits||{}; st.edits[id] = Object.assign(o,{id}); } }
  else { o.id = 'u|' + Date.now().toString(36); st.added = (st.added||[]).concat([o]); }
  LS.set('rs_ds_'+k, st); delete ROWS[k]; closeModal(); renderTab(); toast('✅ ' + L(I18N.saved));
};
window.dsDel = (k, id) => {
  if (!need() || !confirm(L(I18N.confirm_del))) return;
  const st = store(k);
  if ((st.added||[]).some(r => r.id === id)) st.added = st.added.filter(r => r.id !== id);
  else { st.deleted = (st.deleted||[]).concat([id]); if (st.edits) delete st.edits[id]; }
  LS.set('rs_ds_'+k, st); delete ROWS[k]; closeModal(); renderTab();
};
window.dsReset = k => {
  if (!need() || !confirm(L(I18N.confirm_reset))) return;
  localStorage.removeItem('rs_ds_'+k); delete ROWS[k]; renderTab();
};

/* ─────────────── کارت‌های دانش ─────────────── */
const SHAFT_ENDS = [
  ['flat', b('سر تخت‌دار (آچارخور ch)','Flats (ch)'), b('دو سطح موازی با عرض ch در دو سر شافت فرز می‌شود تا شافت در شیار پایه بنشیند و نچرخد. عرض ch و طول g در جدول سری‌ها آمده است (مثلاً d20 → ch14 ، d25 → ch18 ، d30 → ch22 ، d40 → ch32).','Two parallel flats (width ch) are milled at both spindle ends so the spindle sits in the frame slot and cannot rotate. ch and g per series table (e.g. d20 → ch14, d25 → ch18, d30 → ch22, d40 → ch32).')],
  ['circlip', b('سر گرد با شیار خار','Round end with circlip groove'), b('برای نگهداری محوری بلبرینگ/هوزینگ یا اتصال به پایه‌های خاص؛ ابعاد شیار طبق DIN 471 (جدول جداگانه).','Axially retains bearing/housing or fits special brackets; groove dimensions per DIN 471 (separate table).')],
  ['tap', b('سوراخکاری و قلاویز سر شافت','Drilled & tapped end'), b('سوراخ رزوه‌دار در انتهای شافت برای پیچ‌شدن به پایه (پایه‌های راهنما، رولیک‌های آویز، نصب عمودی). M12 تا M24؛ عمق رزوه ≈ 1.5d.','Threaded hole in the spindle end for bolting to the bracket (guide rollers, suspended rollers, vertical mounting). M12–M24; thread depth ≈ 1.5d.')],
  ['thread', b('رزوه سر شافت (پیچ)','Threaded spindle end'), b('سر شافت تراش و رزوه می‌شود و با مهره به پایه بسته می‌شود؛ رولیک‌های راهنما (M14 تا M24 / S18).','Spindle end turned and threaded, fixed with nut; guide rollers (M14–M24 / S18).')],
  ['cross', b('سوراخ عرضی (پین/اشپیل)','Cross-hole (pin)'), b('سوراخ عرضی برای پین یا اشپیل جهت قفل کردن شافت در پایه یا اتصال زنجیر گارلند.','Cross hole for pin/cotter to lock the spindle or connect garland links.')],
  ['step', b('شافت پله‌دار (d / d1)','Stepped spindle (d / d1)'), b('قطر شافت در محل بلبرینگ (d1) با قطر بدنه (d) فرق دارد؛ برای بلبرینگ کوچک‌تر روی شافت قوی‌تر یا برعکس.','Diameter at bearing (d1) differs from body (d); smaller bearing on stronger spindle or vice versa.')],
  ['bush', b('سر بوش‌دار (سری سبک، نوع B)','Bush end (light series, type B)'), b('در سری‌های سبک (RTL، M، MPS) شافت با بوش پلیمری/فلزی در پایه می‌نشیند (حرف B در کد سفارش).','In light series (RTL, M, MPS) the spindle seats via a polymer/steel bush (letter B in the order code).')]
];
const CARDS = {
  pipes: [
    {icon:'🔩', t:b('لوله فولادی درزدار (ERW)','Welded steel tube (ERW)'), s:b('رایج‌ترین پوسته رولیک','Most common roller shell'),
     body:b('لوله جوش مقاومتی طولی طبق EN 10217-1 / EN 10219 (DIN 2458)، جنس S235 (ST37) یا S355 (ST52). برای رولیک، لوله با دوپهنی و لنگی کم انتخاب و دو سر آن تراش داده می‌شود تا هوزینگ با هم‌محوری درست جا بخورد. جوش داخلی باید در محل نشیمن هوزینگ تراشیده شود.','Longitudinal ERW tube per EN 10217-1 / EN 10219 (DIN 2458), S235 (ST37) or S355 (ST52). Choose low-ovality, low run-out tube; machine both ends for concentric housing fit. Inner weld bead must be removed at the housing seat.'), svg:() => SV.pipe(89,3,'ERW')},
    {icon:'⭕', t:b('لوله بی‌درز','Seamless tube'), s:b('بار بسیار سنگین / ضخامت زیاد','Very heavy duty / thick wall'),
     body:b('طبق EN 10210 / EN 10297؛ برای رولیک‌های سنگین معدنی و ضخامت‌های بالا. گران‌تر؛ معمولاً تنها وقتی ضخامت درزدار در دسترس نیست.','Per EN 10210 / EN 10297; heavy mining rollers and thick walls. More expensive; used when welded tube is unavailable.'), svg:() => SV.pipe(159,8,'Seamless')},
    {icon:'🎯', t:b('لوله دقیق (کالیبره سرد)','Precision tube (cold sized)'), s:b('دقت بالا، لنگی کم','High accuracy, low run-out'),
     body:b('لوله جوشی کالیبره سرد طبق EN 10305-3 با تلرانس قطر دقیق؛ برای رولیک‌های پرسرعت و کم‌صدا و رولیک‌های توزین.','Cold-sized welded tube per EN 10305-3 with tight OD tolerance; for high-speed, low-noise and weighing rollers.'), svg:() => SV.pipe(108,3.5,'EN 10305-3')},
    {icon:'🧪', t:b('لوله PVC سخت','Rigid PVC tube'), s:b('ضدخوردگی، سبک','Corrosion-proof, light'),
     body:b('سری PL رولمکا: لوله PVC (RAL 7030) با هوزینگ پلیمری؛ برای محیط‌های نمکی، شیمیایی و مرطوب. محدودیت دما و ضربه دارد.','Rulmeca PL series: PVC tube (RAL 7030) with polymer housings; salty, chemical and wet environments. Temperature and impact limited.'), svg:() => SV.pipe(110,5.3,'PVC-U')},
    {icon:'🧴', t:b('HDPE / UHMW-PE / نایلون','HDPE / UHMW-PE / Nylon'), s:b('سایش کم، صدای کم','Low wear, low noise'),
     body:b('HDPE (PE100) با کلاس SDR؛ UHMW-PE بیشترین مقاومت سایش و ضدچسبندگی؛ PA6 استحکام بیشتر ولی جذب رطوبت. وزن رولیک تا حدود ۵۰٪ کمتر از فولادی.','HDPE (PE100) by SDR class; UHMW-PE best abrasion and anti-stick; PA6 stronger but absorbs moisture. Roller weight up to ~50% lower than steel.'), svg:() => SV.pipe(125,11.4,'HDPE SDR11')},
    {icon:'📏', t:b('تلرانس‌ها: DIN/ISO و CEMA','Tolerances: DIN/ISO and CEMA'), s:b('قطر، ضخامت، لنگی','OD, wall, run-out'),
     body:b('مرجع عمومی (بررسی شود): EN 10219 — قطر ±1٪ (حداقل ±0.5 mm)، ضخامت ±10٪؛ EN 10305-3 دقیق‌تر. ISO 1537 و DIN 15207 تلرانس قطر و لنگی رولیک تمام‌شده را تعیین می‌کنند؛ CEMA 502 لنگی (TIR) را بر حسب کلاس رولیک می‌دهد. معیارهای پذیرش داخلی را در تب «🧪 آزمایش‌ها» تنظیم کنید.','General reference (verify): EN 10219 — OD ±1% (min ±0.5 mm), wall ±10%; EN 10305-3 tighter. ISO 1537 and DIN 15207 set finished-roller diameter and run-out tolerances; CEMA 502 gives TIR by idler class. Set in-house acceptance criteria in the "🧪 Tests" tab.')}
  ],
  shafts: SHAFT_ENDS.map(([k,t,body]) => ({icon:'⚙️', t, s:b('برای جزئیات کلیک کنید','Click for details'), body, svg:() => SV.shaftEnd(k)})).concat([
    {icon:'📏', t:b('تلرانس شافت','Shaft tolerances'), s:b('h9 بدنه ، k6/j6 محل بلبرینگ','h9 body, k6/j6 bearing seat'),
     body:b('مرجع عمومی: شافت کشیده سرد C45 با تلرانس h9؛ در محل بلبرینگ برای انطباق جذبی سبک k6 یا j6 (یا h7 با چسب نگهدارنده). صافی سطح نشیمن Ra ≤ 1.6 µm. تلرانس تخت‌ها: ch در h11 یا d11. با نقشه و توصیه سازنده بلبرینگ تطبیق دهید.','General reference: cold-drawn C45 to h9; at bearing seat k6 or j6 for light interference (or h7 with retaining compound). Seat finish Ra ≤ 1.6 µm. Flats ch to h11/d11. Match with drawing and bearing maker.')}
  ]),
  bearings: [
    {icon:'🔘', t:b('بلبرینگ شیار عمیق C3','Deep groove ball bearing C3'), s:b('استاندارد رولیک نوار','Standard conveyor roller bearing'),
     body:b('سری 62xx برای بار معمولی و 63xx برای بار سنگین. لقی C3 برای جبران انحراف شافت و انبساط حرارتی. آب‌بندی 2RS (لاستیکی) یا 2Z (فلزی) و گریس لیتیمی NLGI 2/3.','62xx for normal loads, 63xx for heavy. C3 clearance compensates spindle deflection and thermal expansion. 2RS (rubber) or 2Z (metal) seals, lithium grease NLGI 2/3.'), svg:() => SV.bearing({d:20,D:47,B:14})},
    {icon:'🏠', t:b('هوزینگ پرسی فولادی','Deep-drawn steel housing'), s:b('رایج‌ترین؛ جوش به لوله','Most common; welded to tube'),
     body:b('ورق فولادی کشش عمیق با دقت بالا؛ با پرس در لوله و جوش محیطی. سبک و اقتصادی؛ هم‌محوری با تراش دو سر لوله تضمین می‌شود.','Precision deep-drawn sheet steel; pressed into the tube and circumferentially welded. Light and economical; concentricity ensured by machining tube ends.')},
    {icon:'🏭', t:b('هوزینگ چدنی / تراشکاری','Cast / machined housing'), s:b('رولیک‌های فوق سنگین','Extra heavy rollers'),
     body:b('برای قطرهای بزرگ (≥ 159) و بلبرینگ‌های 63xx در کاربردهای معدنی؛ صلبیت بیشتر و امکان آب‌بندی لابیرنت چندمرحله‌ای.','Large diameters (≥ 159) and 63xx bearings in mining; higher rigidity and room for multi-stage labyrinths.')},
    {icon:'🧴', t:b('هوزینگ پلیمری','Polymer housing'), s:b('سری‌های سبک و ضدخوردگی','Light and anti-corrosion series'),
     body:b('پلی‌آمید/پلی‌پروپیلن تزریقی؛ ضد زنگ و سبک، برای سری‌های RTL، PL و PLF.','Injection-moulded polyamide/polypropylene; rust-free and light, for RTL, PL, PLF series.')},
    {icon:'🛡', t:b('آب‌بند لابیرنت','Labyrinth seal'), s:b('بدون اصطکاک، ضد گردوغبار','Frictionless, dust-proof'),
     body:b('چند حلقه پلیمری درهم‌رفته با گریس پرشده؛ مقاومت چرخشی کم و عمر طولانی. اغلب با یک لبه تماسی بیرونی ترکیب می‌شود.','Interlocking polymer rings filled with grease; low rotating resistance and long life. Often combined with an outer contact lip.')},
    {icon:'💧', t:b('آب‌بند لبه‌دار تماسی','Contact lip seal'), s:b('محیط مرطوب و شستشو','Wet and wash-down'),
     body:b('لبه NBR روی شافت؛ آب‌بندی بهتر در برابر آب ولی مقاومت چرخشی بیشتر. برای محیط‌های بسیار گل‌آلود معمولاً لابیرنت + لبه.','NBR lip on the spindle; better against water but higher resistance. For very muddy sites usually labyrinth + lip.')},
    {icon:'🛢', t:b('روانکاری','Lubrication'), s:b('روانکاری مادام‌العمر','Lubricated for life'),
     body:b('گریس لیتیمی یا لیتیم‌کمپلکس NLGI 2–3، پرشدگی ۳۰ تا ۵۰٪ فضای آزاد بلبرینگ؛ دمای کار ‎-20 تا +100 °C. برای دمای پایین/بالا گریس ویژه.','Lithium or lithium-complex NLGI 2–3, 30–50% of free space; −20…+100 °C. Special grease for low/high temperature.')},
    {icon:'⏱', t:b('محاسبه عمر بلبرینگ','Bearing life calculation'), s:b('L10h = 10⁶/(60n) · (C/P)³','L10h = 10⁶/(60n) · (C/P)³'),
     body:b('n = دور رولیک = v·60000/(π·D) ؛ P = بار هر بلبرینگ (نصف بار رولیک). عمر پیشنهادی رولیک ۳۰٬۰۰۰ تا ۵۰٬۰۰۰ ساعت. محاسبه خودکار در تب «🧮 طراحی».','n = roller rpm = v·60000/(π·D); P = load per bearing (half the roller load). Recommended life 30,000–50,000 h. Calculated automatically in "🧮 Design".')}
  ],
  rubber: [
    ['NA', b('رینگ ضربه‌گیر (NA)','Impact rings (NA)'), b('رینگ‌های تخت (ET) پشت‌سرهم روی لوله در محل بارگیری؛ جذب انرژی ضربه و حفاظت نوار. سختی معمول NR 60 ± 5 Shore A.','Flat rings (ET) side by side under the loading point; absorb impact and protect the belt. Typically NR 60 ± 5 Shore A.')],
    ['NG', b('برگشت با رینگ نوک‌تیز (NG)','Return, pointed rings (NG)'), b('رینگ‌های خم/نوک‌تیز (ER) با فاصله؛ تماس کم با سطح کثیف نوار و جلوگیری از چسبیدن مواد.','Curved/pointed rings (ER) spaced apart; small contact with dirty belt side, prevents build-up.')],
    ['NL', b('برگشت NL (تخت کناری + خم میانی)','Return NL (flat sides + curved centre)'), b('دسته رینگ تخت (ET) در دو لبه نوار برای تکیه‌گاه و هدایت، رینگ‌های خم (ER) در وسط. چینش: side | central | side.','Flat ring sets (ET) at belt edges for support/tracking, curved rings (ER) in the centre. Layout: side | central | side.')],
    ['NC', b('برگشت V با رینگ (NC)','V-return with rings (NC)'), b('برای پایه‌های برگشت V؛ دسته تخت در سمت بیرونی و رینگ‌های خم میانی.','For V-return sets; flat set on the outer side, curved rings inward.')],
    ['NM', b('مارپیچ لاستیکی خودتمیزکن (NM)','Self-cleaning rubber helix (NM)'), b('نوار لاستیکی مارپیچ روی لوله؛ مواد چسبنده را از سطح برگشت نوار جدا و به کناره هدایت می‌کند.','Helical rubber strip on the tube; sheds sticky material from the return belt to the sides.')],
    ['disc', b('دیسک لاستیکی','Rubber discs'), b('دیسک‌های باریک با فاصله زیاد؛ اقتصادی برای برگشت با مواد کم‌چسبنده.','Narrow discs widely spaced; economical return rollers for low-adhesion materials.')],
    ['lag', b('روکش لاستیکی (Lagging)','Rubber lagging'), b('پوشش یکپارچه لاستیک روی لوله (وولکانیزه/چسبی)؛ کاهش صدا و سایش، رولیک‌های توزین و ویژه.','Continuous vulcanised/bonded rubber cover; reduces noise and wear; weighing and special rollers.')],
    ['pu', b('رینگ پلی‌اورتان','Polyurethane rings'), b('سختی 80 تا 95 Shore A؛ بیشترین مقاومت سایش و برش برای مواد تیز؛ حساس به رطوبت گرم (هیدرولیز).','80–95 Shore A; best abrasion and cut resistance for sharp materials; sensitive to hot moisture (hydrolysis).')]
  ].map(([k,t,body]) => ({icon:'⭕', t, s:b('برای جزئیات و تصویر کلیک کنید','Click for details & drawing'), body, svg:() => SV.ringProf(k)})),
  frames: FRAMES.map(f => ({icon:'🏗', t:f.name, s:{fa:'زاویه‌ها: '+f.ang.join('°، ')+'°', en:'Angles: '+f.ang.join('°, ')+'°'}, body:f.desc, frame:f}))
};
function renderCards(k, el){
  const list = CARDS[k];
  el.innerHTML = `<div class="cards">${list.map((c,i) => `<button class="kc" onclick="showCard('${k}',${i})"><span class="ki">${c.icon}</span><b>${esc(L(c.t))}</b><small>${esc(L(c.s))}</small></button>`).join('')}</div>`;
}
window.showCard = (k, i, ang) => {
  const c = CARDS[k][i];
  let svg = c.svg ? c.svg() : '', extra = '';
  if (c.frame){ const a = ang != null ? ang : c.frame.ang[Math.min(1, c.frame.ang.length-1)];
    svg = SV.frame(c.frame.k, a);
    extra = c.frame.ang.length > 1 ? `<div class="seg sm">${c.frame.ang.map(x => `<button class="${x===a?'on':''}" onclick="showCard('${k}',${i},${x})">λ ${x}°</button>`).join('')}</div>` : ''; }
  openModal(c.icon + ' ' + L(c.t), extra + svg + `<p class="body">${esc(L(c.body))}</p>`,
    `<button class="btn" onclick="printHtml(document.querySelector('#modal_t').textContent, document.querySelector('#modal_b').innerHTML)">🖨 ${esc(L(I18N.print))}</button>`);
};

/* ─────────────── محاسبات ─────────────── */
const num = id => { const el = $(id); return el ? parseFloat(el.value) : NaN; };
const CALC = {};
const DIN_BW = [400,500,650,800,1000,1200,1400,1600,1800,2000,2200,2400];
const CEMA_BW = [18,24,30,36,42,48,54,60,72,84,96];

function trough(bUse, l3, lamDeg, betaDeg, deltaDeg){
  const lam = lamDeg*DEG, beta = betaDeg*DEG, l = Math.min(l3, bUse), w = (bUse - l);
  const A1 = Math.pow(l + w*Math.cos(lam), 2) * Math.tan(beta) / 6;
  const A2 = (l + w/2*Math.cos(lam)) * (w/2*Math.sin(lam));
  const A = A1 + A2, dl = (deltaDeg||0)*DEG;
  let k = 1;
  if (deltaDeg > 0){ const c2d = Math.cos(dl)**2, c2b = Math.cos(beta)**2; const k1 = c2d > c2b ? Math.sqrt((c2d - c2b)/(1 - c2b)) : 0; k = 1 - (A1/A)*(1 - k1); }
  return {A1, A2, A, k};
}
function capDIN(bw, arr, lam, beta, v, rho, delta){
  const bU = (bw <= 2000 ? 0.9*bw - 50 : bw - 250)/1000;
  const l3 = arr === 't3' ? (ROLL_LEN.t3[bw]||bw/3)/1000 : arr === 'v2' ? 0 : bU;
  const T = trough(bU, l3, arr === 'flat' ? 0 : lam, beta, delta);
  const Qv = 3600*v*T.A*T.k;
  return Object.assign(T, {bU, l3, Qv, Qm:Qv*rho});
}
function capCEMA(bw, arr, lam, beta, vfpm, dens, delta){
  const c = 0.055*bw + 0.9, bU = bw - 2*c;
  const l = arr === 't3' ? 0.371*bw + 0.25 : arr === 'v2' ? 0 : bU;
  const T = trough(bU, l, arr === 'flat' ? 0 : lam, beta, delta);
  const Aft = T.A/144, Qft = Aft*vfpm*60*T.k, tph = Qft*dens/2000;
  return Object.assign(T, {bU, l, Aft, Qft, tph, tphM:tph*0.90718});
}
const sel = (id, opts, v) => `<select id="${id}" oninput="calcRun()">${opts.map(o => { const [val,lab] = Array.isArray(o) ? o : [o,o]; return `<option value="${val}" ${String(val)===String(v)?'selected':''}>${esc(lab)}</option>`; }).join('')}</select>`;
const fld = (lab, html, u) => `<label>${lab}${u?` <small>(${u})</small>`:''}${html}</label>`;
const ninp = (id, v, step) => `<input id="${id}" type="number" step="${step||'any'}" value="${v}" oninput="calcRun()">`;
let calcRun = () => {};
window.calcRun = () => calcRun();
const CS = LS.get('rs_calc', {capMode:'din'});
const saveCS = () => LS.set('rs_calc', CS);
const matOpts = () => [['', '— ' + L(b('انتخاب ماده','pick material')) + ' —']].concat(rowsOf('materials').map(m => [m.id, L(m.name)]));

CALC.cap = el => {
  const din = CS.capMode !== 'cema';
  const V = CS.cap || (CS.cap = {bw:1000, arr:'t3', lam:35, beta:20, v:2.5, rho:1.6, delta:0, Q:0, bwi:36, lamc:35, vf:500, dens:100, mat:''});
  el.innerHTML = `<div class="card"><div class="ch"><span>🧮 ${esc(L(b('ظرفیت نوار و عرض لازم','Belt capacity & required width')))}</span>
    <div class="seg sm inl"><button class="${din?'on':''}" onclick="CS.capMode='din';saveCS();renderTab()">DIN 22101 / ISO 5048</button><button class="${!din?'on':''}" onclick="CS.capMode='cema';saveCS();renderTab()">CEMA</button></div></div>
    <div class="calc"><div class="form">
    ${fld(L(b('ماده','Material')), sel('c_mat', matOpts(), V.mat))}
    ${din ? fld(L(b('عرض نوار BW','Belt width BW')), sel('c_bw', DIN_BW, V.bw), 'mm') : fld(L(b('عرض نوار BW','Belt width BW')), sel('c_bwi', CEMA_BW, V.bwi), 'in')}
    ${fld(L(b('چیدمان','Arrangement')), sel('c_arr', [['t3',L(ARR.t3)],['v2',L(ARR.v2)],['flat',L(ARR.flat)]], V.arr))}
    ${fld(L(b('زاویه ناودانی λ','Troughing angle λ')), sel('c_lam', din ? [20,25,30,35,40,45] : [20,35,45], din ? V.lam : V.lamc), '°')}
    ${fld(L(b('زاویه سرریز دینامیکی β','Dynamic surcharge β')), ninp('c_beta', V.beta), '°')}
    ${din ? fld(L(b('سرعت نوار v','Belt speed v')), ninp('c_v', V.v), 'm/s') : fld(L(b('سرعت نوار v','Belt speed v')), ninp('c_vf', V.vf), 'ft/min')}
    ${din ? fld(L(b('چگالی ρ','Density ρ')), ninp('c_rho', V.rho), 't/m³') : fld(L(b('چگالی','Density')), ninp('c_dens', V.dens), 'lb/ft³')}
    ${fld(L(b('شیب نوار δ','Inclination δ')), ninp('c_delta', V.delta), '°')}
    ${fld(L(b('ظرفیت لازم (اختیاری)','Required capacity (optional)')), ninp('c_Q', V.Q), din ? 't/h' : 'stph')}
    </div><div id="c_out" class="out"></div></div>
    <p class="note">${esc(L(b('روش DIN/ISO: عرض مفید b = 0.9·BW − 0.05 m ؛ سطح مقطع A = A1 (سرریز) + A2 (ذوزنقه) ؛ ضریب شیب k طبق ISO 5048. روش CEMA: فاصله لبه c = 0.055·b + 0.9 in و طول رولیک وسط l = 0.371·b + 0.25 in (سه رولیک مساوی).','DIN/ISO: usable width b = 0.9·BW − 0.05 m; area A = A1 (surcharge) + A2 (trapezoid); slope factor k per ISO 5048. CEMA: edge distance c = 0.055·b + 0.9 in and centre roll l = 0.371·b + 0.25 in (three equal rolls).')))}</p></div>`;
  calcRun = () => {
    const mid = $('c_mat').value;
    if (mid !== V.mat){ V.mat = mid; const m = findRow('materials', mid);
      if (m){ $('c_beta').value = m.sur; if (din) $('c_rho').value = m.rho; else $('c_dens').value = Math.round(m.rho*62.43); } }
    const m = findRow('materials', V.mat);
    V.arr = $('c_arr').value; V.beta = num('c_beta'); V.delta = num('c_delta') || 0; V.Q = num('c_Q') || 0;
    let h = '', warn = [];
    if (m && V.delta > m.inc) warn.push(L(b(`شیب ${V.delta}° از بیشینه شیب مجاز این ماده (${m.inc}°) بیشتر است — خطر برگشت مواد.`, `Inclination ${V.delta}° exceeds the material's max. (${m.inc}°) — risk of roll-back.`)));
    if (din){
      V.bw = +$('c_bw').value; V.lam = +$('c_lam').value; V.v = num('c_v'); V.rho = num('c_rho');
      const r = capDIN(V.bw, V.arr, V.lam, V.beta, V.v, V.rho, V.delta);
      h += `<div class="kpi"><div><small>Qm</small><b>${fx(r.Qm,0)}</b><i>t/h</i></div><div><small>Qv</small><b>${fx(r.Qv,0)}</b><i>m³/h</i></div><div><small>A</small><b>${fx(r.A,4)}</b><i>m²</i></div></div>
        <table class="mini"><tr><td>b</td><td>${fx(r.bU,3)} m</td></tr><tr><td>l3</td><td>${fx(r.l3,3)} m</td></tr><tr><td>A1 / A2</td><td>${fx(r.A1,4)} / ${fx(r.A2,4)} m²</td></tr><tr><td>k</td><td>${fx(r.k,3)}</td></tr></table>`;
      h += `<h4>${esc(L(b('ظرفیت همه عرض‌ها با همین شرایط','Capacity of all widths, same conditions')))}</h4><table class="mini"><tr><th>BW</th><th>t/h</th><th>m³/h</th></tr>` +
        DIN_BW.map(w => { const q = capDIN(w, V.arr, V.lam, V.beta, V.v, V.rho, V.delta); const ok = V.Q > 0 && q.Qm >= V.Q; return `<tr class="${ok?'ok':''}${w===V.bw?' cur':''}"><td>${w}</td><td>${fx(q.Qm,0)}</td><td>${fx(q.Qv,0)}</td></tr>`; }).join('') + '</table>';
      if (V.Q > 0){ const w = DIN_BW.find(x => capDIN(x, V.arr, V.lam, V.beta, V.v, V.rho, V.delta).Qm >= V.Q);
        h += `<p class="res">${w ? '✅ '+L(b('کمترین عرض نوار لازم: ','Minimum belt width: '))+'<b>'+w+' mm</b>' : '⚠️ '+L(b('هیچ عرضی کافی نیست؛ سرعت یا زاویه را افزایش دهید.','No width is sufficient; increase speed or angle.'))}</p>`; }
      const sp = rowsOf('speeds'); if (V.v > 5) warn.push(L(b('سرعت بیش از ۵ m/s — بررسی ویژه لازم است.','Speed above 5 m/s — special review needed.')));
    } else {
      V.bwi = +$('c_bwi').value; V.lamc = +$('c_lam').value; V.vf = num('c_vf'); V.dens = num('c_dens');
      const r = capCEMA(V.bwi, V.arr, V.lamc, V.beta, V.vf, V.dens, V.delta);
      h += `<div class="kpi"><div><small>${esc(L(b('ظرفیت','Capacity')))}</small><b>${fx(r.tph,0)}</b><i>stph</i></div><div><small>≈</small><b>${fx(r.tphM,0)}</b><i>t/h</i></div><div><small>A</small><b>${fx(r.Aft,3)}</b><i>ft²</i></div></div>
        <table class="mini"><tr><td>c (edge)</td><td>${fx(0.055*V.bwi+0.9,2)} in</td></tr><tr><td>b′ = b − 2c</td><td>${fx(r.bU,2)} in</td></tr><tr><td>l</td><td>${fx(r.l,2)} in</td></tr><tr><td>ft³/h</td><td>${fx(r.Qft,0)}</td></tr><tr><td>k</td><td>${fx(r.k,3)}</td></tr></table>`;
      h += `<h4>${esc(L(b('ظرفیت همه عرض‌ها','Capacity of all widths')))}</h4><table class="mini"><tr><th>BW (in)</th><th>stph</th><th>t/h</th></tr>` +
        CEMA_BW.map(w => { const q = capCEMA(w, V.arr, V.lamc, V.beta, V.vf, V.dens, V.delta); const ok = V.Q > 0 && q.tph >= V.Q; return `<tr class="${ok?'ok':''}${w===V.bwi?' cur':''}"><td>${w}</td><td>${fx(q.tph,0)}</td><td>${fx(q.tphM,0)}</td></tr>`; }).join('') + '</table>';
      if (V.Q > 0){ const w = CEMA_BW.find(x => capCEMA(x, V.arr, V.lamc, V.beta, V.vf, V.dens, V.delta).tph >= V.Q);
        h += `<p class="res">${w ? '✅ '+L(b('کمترین عرض نوار لازم: ','Minimum belt width: '))+'<b>'+w+' in</b>' : '⚠️ '+L(b('هیچ عرضی کافی نیست.','No width is sufficient.'))}</p>`; }
    }
    if (warn.length) h = warn.map(w => `<p class="warn">⚠️ ${esc(w)}</p>`).join('') + h;
    $('c_out').innerHTML = h; saveCS();
  };
  calcRun();
};
window.useMaterial = id => {
  const m = findRow('materials', id); if (!m) return;
  const V = CS.cap || (CS.cap = {bw:1000, arr:'t3', lam:35, beta:20, v:2.5, rho:1.6, delta:0, Q:0, bwi:36, lamc:35, vf:500, dens:100});
  V.mat = id; V.beta = m.sur; V.rho = m.rho; V.dens = Math.round(m.rho*62.43); saveCS(); closeModal();
  APP.tab = 'design'; APP.sec.design = 'cap'; LS.set('rs_tab','design'); LS.set('rs_sec', APP.sec); renderAll();
};

CALC.load = el => {
  const V = CS.load || (CS.load = {Q:800, v:2.5, bw:1000, arr:'t3', lam:35, a0:1.2, au:3, qb:13, D:133, lump:1, fs:2, fm:1, life:30000, rarr:'flat'});
  el.innerHTML = `<div class="card"><div class="ch"><span>⚖️ ${esc(L(b('بار روی رولیک، عمر بلبرینگ و انتخاب سری','Idler load, bearing life & series selection')))}</span><small>Rulmeca · DIN 22101 · CEMA 502</small></div>
    <div class="calc"><div class="form">
    ${fld(L(b('ظرفیت Qm','Capacity Qm')), ninp('l_Q', V.Q), 't/h')}
    ${fld(L(b('سرعت v','Speed v')), ninp('l_v', V.v), 'm/s')}
    ${fld(L(b('عرض نوار','Belt width')), sel('l_bw', DIN_BW, V.bw), 'mm')}
    ${fld(L(b('چیدمان رفت','Carrying arrangement')), sel('l_arr', [['t3',L(ARR.t3)],['v2',L(ARR.v2)],['flat',L(ARR.flat)]], V.arr))}
    ${fld(L(b('زاویه λ','Angle λ')), sel('l_lam', [20,25,30,35,40,45], V.lam), '°')}
    ${fld(L(b('چیدمان برگشت','Return arrangement')), sel('l_rarr', [['flat',L(ARR.flat)],['v2',L(ARR.v2)]], V.rarr))}
    ${fld(L(b('فاصله پایه رفت a0','Carrying pitch a0')), ninp('l_a0', V.a0) + `<button class="btn sm" type="button" onclick="suggestPitch()">${esc(L(b('پیشنهاد DIN','DIN suggestion')))}</button>`, 'm')}
    ${fld(L(b('فاصله پایه برگشت au','Return pitch au')), ninp('l_au', V.au), 'm')}
    ${fld(L(b('وزن نوار qb','Belt mass qb')), ninp('l_qb', V.qb) + `<button class="btn sm" type="button" onclick="$('l_qb').value=BELT_WT[$('l_bw').value]||'';calcRun()">${esc(L(b('تخمین','Estimate')))}</button>`, 'kg/m')}
    ${fld(L(b('قطر رولیک D','Roller dia. D')), sel('l_D', [63,76,89,102,108,133,159,194], V.D), 'mm')}
    ${fld(L(b('اندازه کلوخه (Fd)','Lump size (Fd)')), sel('l_lump', FD.map((x,i) => [i, L(x[0])]), V.lump))}
    ${fld(L(b('ساعت کار (Fs)','Operating hours (Fs)')), sel('l_fs', FS.map((x,i) => [i, L(x[0])+' — '+x[1]]), V.fs))}
    ${fld(L(b('محیط (Fm)','Environment (Fm)')), sel('l_fm', FM.map((x,i) => [i, L(x[0])+' — '+x[1]]), V.fm))}
    ${fld(L(b('عمر لازم بلبرینگ','Required bearing life')), ninp('l_life', V.life), 'h')}
    </div><div id="l_out" class="out"></div></div>
    <p class="note">${esc(L(b('Ca = a0·(qb + Qm/(3.6·v))·0.981 [daN] ؛ ca = Ca·Fd·Fs·Fm·Fp ؛ Cr = au·qb·0.981 ؛ cr = Cr·Fs·Fm·Fp. عمر L10h با بار هر بلبرینگ = نصف بار رولیک. شیب شافت در محل بلبرینگ θ = P·a·(C−2a)/(2·E·I) با حد 0.0025 rad. ضرایب را با کاتالوگ تطبیق دهید.','Ca = a0·(qb + Qm/(3.6·v))·0.981 [daN]; ca = Ca·Fd·Fs·Fm·Fp; Cr = au·qb·0.981; cr = Cr·Fs·Fm·Fp. L10h with load per bearing = half the roller load. Spindle slope at bearing θ = P·a·(C−2a)/(2·E·I), limit 0.0025 rad. Verify factors against the catalogue.')))}</p></div>`;
  calcRun = () => {
    Object.assign(V, {Q:num('l_Q'), v:num('l_v'), bw:+$('l_bw').value, arr:$('l_arr').value, lam:+$('l_lam').value, rarr:$('l_rarr').value, a0:num('l_a0'), au:num('l_au'),
      qb:num('l_qb'), D:+$('l_D').value, lump:+$('l_lump').value, fs:+$('l_fs').value, fm:+$('l_fm').value, life:num('l_life')});
    const fpC = V.arr === 'flat' ? FP.flat : V.arr === 'v2' ? FP.v2 : (FP['t'+V.lam] || 0.67), fpR = V.rarr === 'v2' ? FP.v2 : 1;
    const si = FD_SPEEDS.findIndex(s => s >= V.v), fd = FD[V.lump][1][si < 0 ? FD_SPEEDS.length-1 : si];
    const Fs = FS[V.fs][1], Fm = FM[V.fm][1];
    const Ca = V.a0*(V.qb + V.Q/(3.6*V.v))*0.981, Ca1 = Ca*fd*Fs*Fm, ca = Ca1*fpC;
    const Cr = V.au*V.qb*0.981, cr = Cr*Fs*Fm*fpR;
    const n = V.v*60000/(Math.PI*V.D);
    const Bc = V.arr === 't3' ? ROLL_LEN.t3[V.bw] : V.arr === 'v2' ? ROLL_LEN.v2[V.bw] : ROLL_LEN.flat[V.bw];
    const Br = V.rarr === 'v2' ? ROLL_LEN.v2[V.bw] : ROLL_LEN.flat[V.bw];
    const life = (C, PdaN) => { const P = PdaN*10/2/1000; return P > 0 ? 1e6/(60*n)*Math.pow(C/P, 3) : Infinity; };
    const slope = (S, PdaN, B) => { const brg = BEARINGS.find(x => x.brg === S.brg); const a = 4 + (S.e||4) + (brg ? brg.B/2 : 7);
      const L0 = B + 8, P = PdaN*10/2, I = Math.PI*Math.pow(S.d,4)/64; return P*a*(L0-2*a)/(2*210000*I); };
    let h = `<div class="kpi"><div><small>ca ${esc(L(b('(رولیک رفت)','(carry roll)')))}</small><b>${fx(ca,1)}</b><i>daN</i></div><div><small>cr ${esc(L(b('(برگشت)','(return)')))}</small><b>${fx(cr,1)}</b><i>daN</i></div><div><small>n</small><b>${fx(n,0)}</b><i>rpm</i></div></div>
      <table class="mini"><tr><td>Ca</td><td>${fx(Ca,1)} daN</td></tr><tr><td>Fd · Fs · Fm · Fp</td><td>${fd} · ${Fs} · ${Fm} · ${fpC}</td></tr><tr><td>Ca1 ${esc(L(b('(دینامیکی)','(dynamic)')))}</td><td>${fx(Ca1,1)} daN ≈ ${fx(Ca1*10/4.448,0)} lbf</td></tr>
      <tr><td>Cr</td><td>${fx(Cr,1)} daN</td></tr><tr><td>B ${esc(L(b('رفت / برگشت','carry / return')))}</td><td>${Bc||'—'} / ${Br||'—'} mm</td></tr></table>`;
    if (V.v > 4) h = `<p class="warn">⚠️ ${esc(L(b('ضریب Fd برای سرعت بیش از 4 m/s از ستون 4 m/s برداشته شد.','Fd for speeds above 4 m/s taken from the 4 m/s column.')))}</p>` + h;
    if (n > 650) h = `<p class="warn">⚠️ ${esc(L(b('دور رولیک بالاست؛ قطر بزرگ‌تر یا بلبرینگ مناسب پرسرعت بررسی شود.','High roller speed; consider a larger diameter or suitable bearings.')))}</p>` + h;
    const rows = Object.entries(SER).filter(([k,S]) => BEARINGS.some(x => x.brg === S.brg) && DIAS[k] && DIAS[k][V.D] && S.mat !== 'spring').map(([k,S]) => {
      const C = BEARINGS.find(x => x.brg === S.brg).C, Lc = life(C, ca), Lr = life(C, cr), th = Bc ? slope(S, ca, Bc) : NaN;
      const ok = Lc >= V.life && Lr >= V.life && !(th > 0.0025);
      return {k, S, C, Lc, Lr, th, ok};
    });
    h += `<h4>${esc(L(b('بررسی سری‌ها برای D = ','Series check for D = ')))}${V.D} mm</h4>` + (rows.length ? `<table class="mini"><tr><th>${esc(L(b('سری','Series')))}</th><th>d</th><th>Brg</th><th>C kN</th><th>L10h ${esc(L(b('رفت','carry')))}</th><th>L10h ${esc(L(b('برگشت','return')))}</th><th>θ rad</th><th></th></tr>` +
      rows.map(x => `<tr class="${x.ok?'ok':'bad'}"><td>${x.k}</td><td>${x.S.d}</td><td>${x.S.brg}</td><td>${x.C}</td><td>${x.Lc>1e7?'>10⁷':fx(x.Lc,0)}</td><td>${x.Lr>1e7?'>10⁷':fx(x.Lr,0)}</td><td>${isNaN(x.th)?'—':x.th.toFixed(4)}</td><td>${x.ok?'✅':'✗'}</td></tr>`).join('') + '</table>'
      : `<p class="warn">${esc(L(b('هیچ سری فولادی با این قطر در جدول نیست.','No steel series with this diameter in the table.')))}</p>`);
    const best = rows.find(x => x.ok);
    h += `<p class="res">${best ? '✅ '+esc(L(b('سبک‌ترین سری مناسب: ','Lightest suitable series: ')))+`<b>${best.k}</b> (${esc(L(DUTY[best.S.duty]))})` : '⚠️ '+esc(L(b('هیچ سری با این قطر کافی نیست؛ قطر یا فاصله پایه را تغییر دهید.','No series is sufficient at this diameter; change diameter or pitch.')))}</p>`;
    const lbfC = Ca1*10/4.448, lbfR = Cr*Fs*Fm*10/4.448;
    const cm = rowsOf('cema').find(c => c.trough >= lbfC && c.ret >= lbfR);
    h += `<p class="res">🇺🇸 CEMA: ${esc(L(b('بار هر پایه رفت','carrying set load')))} ${fx(lbfC,0)} lbf ، ${esc(L(b('برگشت','return')))} ${fx(lbfR,0)} lbf → ${cm ? `<b>CEMA ${cm.cls}</b>` : esc(L(b('بیش از کلاس F','above class F')))}</p>`;
    $('l_out').innerHTML = h; saveCS();
  };
  calcRun();
};
window.suggestPitch = () => {
  const bw = +$('l_bw').value, Q = CS.cap && CS.cap.rho || 1.6;
  const row = bw <= 650 ? DIN_SPACING[0] : bw <= 1000 ? DIN_SPACING[1] : DIN_SPACING[2];
  const rho = parseFloat(prompt(L(b('چگالی مواد (t/m³):','Material density (t/m³):')), Q)) || Q;
  $('l_a0').value = rho < 1.2 ? row[1][0] : rho <= 2 ? row[1][1] : row[1][2]; $('l_au').value = row[2]; calcRun();
};

CALC.factors = el => {
  const t2 = (head, rows) => `<table class="mini wide"><tr>${head.map(x => `<th>${esc(x)}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table>`;
  el.innerHTML = `<div class="card"><div class="ch"><span>📋 ${esc(L(b('ضرایب محاسبه بار رولیک (Rulmeca)','Idler load factors (Rulmeca)')))}</span><small>${esc(L(SRC.ref))}</small></div><div class="pad">
    <h4>Fp — ${esc(L(b('ضریب مشارکت','Participation factor')))}</h4>${t2([L(b('چیدمان','Arrangement')),'Fp'], [[L(ARR.flat),'1.00'],[L(ARR.v2),'0.50']].concat([20,25,30,35,40,45].map(a => [L(ARR.t3)+' '+a+'°', FP['t'+a]])))}
    <h4>Fd — ${esc(L(b('ضریب ضربه','Impact factor')))}</h4>${t2([L(b('اندازه کلوخه','Lump size'))].concat(FD_SPEEDS.map(s => s+' m/s')), FD.map(([n2,v]) => [L(n2)].concat(v)))}
    <h4>Fs — ${esc(L(b('ضریب سرویس','Service factor')))}</h4>${t2([L(b('ساعت کار','Operating hours')),'Fs'], FS.map(([n2,v]) => [L(n2), v]))}
    <h4>Fm — ${esc(L(b('ضریب محیط','Environment factor')))}</h4>${t2([L(b('شرایط','Conditions')),'Fm'], FM.map(([n2,v]) => [L(n2), v]))}
    <h4>qb — ${esc(L(b('وزن تقریبی نوار EP','Approx. EP belt mass')))}</h4>${t2(['BW (mm)','kg/m'], Object.entries(BELT_WT))}
  </div></div>`;
};

/* ─────────────── چاپ / PDF / اکسل ─────────────── */
function printHtml(title, body){
  const w = window.open('', '_blank'); if (!w){ toast(L(I18N.popup)); return; }
  w.document.write(`<!DOCTYPE html><html lang="${APP.lang}" dir="${APP.lang==='fa'?'rtl':'ltr'}"><head><meta charset="UTF-8"><title>${esc(title)}</title><style>${FONT_CSS}
  @page{size:A4 landscape;margin:10mm}body{font-family:Vazirmatn,Tahoma,sans-serif;font-size:10.5px;color:#241729}
  .hd{display:flex;align-items:center;gap:10px;border-bottom:2px solid #3b1f47;padding-bottom:6px;margin-bottom:8px}.hd img{width:42px;height:42px;border-radius:50%}
  h2{color:#3b1f47;margin:0}table{width:100%;border-collapse:collapse;margin:6px 0}th{background:#3b1f47;color:#fff;padding:4px;font-size:9.5px}
  td{border:1px solid #ddd0e2;padding:3px 5px;text-align:center}tr:nth-child(even) td{background:#faf7fb}svg{width:100%;max-height:300px}
  .spec{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}.spec div{border:1px solid #ddd0e2;padding:3px 8px;display:flex;justify-content:space-between;gap:8px}
  .spec em{font-style:normal;font-weight:700;direction:ltr}.note,.body{line-height:1.9}.lk,.btn{display:none}.f td{height:22px}</style></head><body>
  <div class="hd"><img src="${LOGO}"><div><h2>${esc(title)}</h2><div>${esc(L(I18N.app))} — ${new Date().toLocaleDateString(APP.lang==='fa'?'fa-IR':'en-GB')}</div></div></div>${body}
  <p style="margin-top:14px;border-top:1px solid #ddd0e2;padding-top:6px;font-weight:700">${esc(creditText())}</p>
  <script>setTimeout(function(){window.print()},400)<\/script></body></html>`);
  w.document.close();
}
window.printHtml = printHtml;
window.printItem = (k, id) => { const r = findRow(k, id); printHtml(DS[k].rowTitle(r), $('modal_b').innerHTML); };
window.dsPdf = k => {
  const D = DS[k], list = dsFiltered(k); if (!list.length) return toast(L(I18N.none));
  if (list.length > 1500 && !confirm(L(b(`${list.length} ردیف؛ ادامه؟ (بهتر است فیلتر کنید)`, `${list.length} rows; continue? (filtering is better)`)))) return;
  const cols = D.cols.filter(c => !c.hide && list.some(r => has(cellText(c, r))));
  printHtml(L(D.title), `<table><thead><tr><th>#</th>${cols.map(c => `<th>${esc(c.ab ? c.ab+' ' : '')}${esc(L(c.l))}${c.u?' ('+esc(c.u)+')':''}</th>`).join('')}</tr></thead><tbody>${
    list.map((r,i) => `<tr><td>${i+1}</td>${cols.map(c => `<td>${esc(cellText(c, r))}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
};
window.dsXlsx = k => {
  const D = DS[k], list = dsFiltered(k); if (!list.length) return toast(L(I18N.none));
  if (typeof XLSX === 'undefined') return toast('Excel library missing');
  const cols = D.cols.filter(c => list.some(r => has(cellText(c, r))));
  const aoa = [cols.map(c => (c.ab ? c.ab+' — ' : '') + L(c.l) + (c.u ? ' ('+c.u+')' : ''))].concat(list.map(r => cols.map(c => { const v = cellText(c, r); return c.n && has(r[c.k]) && !isNaN(+r[c.k]) ? +r[c.k] : v; })));
  aoa.push([], [creditText()]);
  const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = cols.map(c => ({wch: c.n ? 10 : 24}));
  const wb = XLSX.utils.book_new(); wb.Workbook = {Views:[{RTL: APP.lang === 'fa'}]};
  XLSX.utils.book_append_sheet(wb, ws, (L(D.title).replace(/[\\\/\?\*\[\]:]/g,' ')).slice(0,31));
  XLSX.writeFile(wb, `Asaroul_${k}_${new Date().toISOString().slice(0,10)}.xlsx`);
};
window.printTestForm = id => {
  const r = findRow('tests', id); if (!r) return;
  const st = L(r.steps), lab = x => esc(L(x));
  const f = (a, bb) => `<tr><td style="width:30%;text-align:start"><b>${a}</b></td><td style="text-align:start">${bb||''}</td></tr>`;
  printHtml(`${r.code} — ${L(r.name)}`, `<table>${f(lab(b('استاندارد مرجع','Reference')), esc(r.ref))}${f(lab(b('تجهیزات','Equipment')), esc(L(r.eq)))}${f(lab(b('معیار پذیرش','Acceptance')), esc(L(r.acc)))}
    ${f(lab(b('تاریخ / شماره سفارش','Date / order No.')))}${f(lab(b('سری / D × B / شماره نقشه','Series / D × B / drawing No.')))}${f(lab(b('تعداد نمونه','Sample size')))}</table>
    <ol>${(Array.isArray(st)?st:[st]).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <table class="f"><tr><th>#</th><th>${lab(b('شناسه نمونه','Sample ID'))}</th><th>${lab(b('مقدار ۱','Value 1'))}</th><th>${lab(b('مقدار ۲','Value 2'))}</th><th>${lab(b('مقدار ۳','Value 3'))}</th><th>${lab(b('نتیجه','Result'))}</th><th>${lab(b('قبول / رد','Pass / fail'))}</th></tr>
    ${Array.from({length:10}, (_,i) => `<tr><td>${i+1}</td><td></td><td></td><td></td><td></td><td></td><td>☐ ☐</td></tr>`).join('')}</table>
    <table>${f(lab(b('نتیجه کلی','Overall result')), '☐ ' + lab(b('قبول','Pass')) + ' &nbsp; ☐ ' + lab(b('رد','Fail')))}${f(lab(b('بازرس — نام و امضا','Inspector — name & signature')))}${f(lab(b('تأیید کنترل کیفیت','QC approval')))}</table>`);
};

/* ─────────────── جستجوی کلی ─────────────── */
window.gSearch = q => {
  const out = $('gres'); q = q.trim().toLowerCase();
  if (q.length < 2){ out.classList.add('hidden'); return; }
  const words = q.split(/\s+/), res = [];
  Object.keys(DS).forEach(k => { for (const r of rowsOf(k)){ if (res.length > 60) break; if (words.every(w => rowSearch(k, r).includes(w))) res.push([k, r]); } });
  Object.entries(CARDS).forEach(([k, list]) => list.forEach((c,i) => { const h = (L(c.t)+' '+L(c.body)).toLowerCase(); if (words.every(w => h.includes(w))) res.unshift(['card:'+k, i, c]); }));
  out.innerHTML = res.length ? res.slice(0,60).map(x => x[0].startsWith('card:') ? `<button onclick="gOpenCard('${x[0].slice(5)}',${x[1]})">${x[2].icon} ${esc(L(x[2].t))}</button>`
    : `<button onclick="gOpen('${x[0]}','${esc(x[1].id)}')">${DS[x[0]].icon} <small>${esc(L(DS[x[0]].title))}</small> ${esc(DS[x[0]].rowTitle(x[1]))}</button>`).join('') : `<div class="empty">${esc(L(I18N.none))}</div>`;
  out.classList.remove('hidden');
};
const tabOfDS = k => { for (const T of TABS) for (const S of T.secs) if (S.ds === k || S.cards === k) return [T.k, S.k]; return [null, null]; };
window.gOpen = (k, id) => { const [t2, s] = tabOfDS(k); $('gres').classList.add('hidden'); if (t2){ APP.tab = t2; APP.sec[t2] = s; renderAll(); } dsShow(k, id); };
window.gOpenCard = (k, i) => { const [t2, s] = tabOfDS(k); $('gres').classList.add('hidden'); if (t2){ APP.tab = t2; APP.sec[t2] = s; renderAll(); } showCard(k, i); };
document.addEventListener('click', e => { if (!e.target.closest('.gs')) $('gres').classList.add('hidden'); });

/* ─────────────── قفل و تنظیمات ─────────────── */
const DEFAULT_PW_HASH = '%%PW_HASH%%';
const pwHash = () => LS.get('rs_pw', DEFAULT_PW_HASH);
window.lockClick = () => {
  if (APP.unlocked) return openSettings();
  openModal('🔒 ' + L(I18N.unlock_t), `<p class="note">${esc(L(I18N.unlock_d))}</p><div class="form one"><label>${esc(L(I18N.password))}<input type="password" id="pw" onkeydown="if(event.key==='Enter')doUnlock()"></label></div>`,
    `<button class="btn pri" onclick="doUnlock()">🔓 ${esc(L(I18N.unlock))}</button><button class="btn" onclick="closeModal()">${esc(L(I18N.cancel))}</button>`);
  setTimeout(() => $('pw') && $('pw').focus(), 50);
};
window.doUnlock = () => {
  if (sha256($('pw').value) !== pwHash()){ toast('⛔ ' + L(I18N.wrong_pw)); return; }
  APP.unlocked = true; try { sessionStorage.setItem('rs_unlock','1'); } catch(e){}
  closeModal(); renderAll(); toast('🔓 ' + L(I18N.unlocked_msg));
};
window.doLock = () => { APP.unlocked = false; try { sessionStorage.removeItem('rs_unlock'); } catch(e){} closeModal(); renderAll(); };
function openSettings(){
  openModal('⚙️ ' + L(I18N.settings), `<div class="form one">
    <label>${esc(L(I18N.new_pw))}<input type="password" id="npw"></label><label>${esc(L(I18N.new_pw2))}<input type="password" id="npw2"></label>
    <button class="btn" onclick="changePw()">🔑 ${esc(L(I18N.change_pw))}</button></div><hr>
    <p class="note">${esc(L(I18N.pkg_d))}</p>
    <div class="row"><button class="btn" onclick="exportPkg()">⬇ ${esc(L(I18N.export_pkg))}</button>
    <label class="btn">⬆ ${esc(L(I18N.import_pkg))}<input type="file" accept=".json" hidden onchange="importPkg(event)"></label>
    <button class="btn danger" onclick="resetAll()">↺ ${esc(L(I18N.reset_all))}</button></div>`,
    `<button class="btn pri" onclick="doLock()">🔒 ${esc(L(I18N.lock_now))}</button><button class="btn" onclick="closeModal()">${esc(L(I18N.close))}</button>`);
}
window.changePw = () => {
  const a = $('npw').value, c = $('npw2').value;
  if (a.length < 4) return toast(L(b('رمز حداقل ۴ کاراکتر باشد','Password must be at least 4 characters')));
  if (a !== c) return toast(L(b('تکرار رمز یکسان نیست','Passwords do not match')));
  LS.set('rs_pw', sha256(a)); toast('✅ ' + L(I18N.saved));
};
window.exportPkg = () => {
  const pkg = {app:'asaroul-roller-standards', v:1, date:new Date().toISOString(), data:{}};
  Object.keys(DS).forEach(k => { const s = LS.get('rs_ds_'+k, null); if (s) pkg.data[k] = s; });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(pkg, null, 1)], {type:'application/json'}));
  a.download = `Asaroul_Roller_Standards_changes_${new Date().toISOString().slice(0,10)}.json`; a.click();
};
window.importPkg = ev => {
  const f = ev.target.files[0]; if (!f || !need()) return;
  const rd = new FileReader(); rd.onload = () => { try { const p = JSON.parse(rd.result); if (p.app !== 'asaroul-roller-standards') throw new Error('format');
    Object.entries(p.data||{}).forEach(([k,v]) => { if (DS[k]) { LS.set('rs_ds_'+k, v); delete ROWS[k]; } }); closeModal(); renderAll(); toast('✅ ' + L(I18N.saved)); }
    catch(e){ toast('⛔ ' + L(b('فایل نامعتبر است','Invalid file'))); } }; rd.readAsText(f);
};
window.resetAll = () => { if (!need() || !confirm(L(I18N.confirm_reset_all))) return; Object.keys(DS).forEach(k => { localStorage.removeItem('rs_ds_'+k); delete ROWS[k]; }); closeModal(); renderAll(); };


/* ─────────────── اطلاعات سازنده (غیرقابل تغییر از داخل نرم‌افزار) ─────────────── */
const CREDIT = Object.freeze(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('eyJmYSI6ICLYt9ix2KfYrduMINmIINiz2KfYrtiqOiDYudmE24zYsdi22Kcg2K/Yp9ix2KfYqCDigJQg2KrZhNmB2YY6IDA5MTI2MDMzNTMwIiwgImVuIjogIkRlc2lnbmVkICYgZGV2ZWxvcGVkIGJ5IEFsaXJlemEgRGFyYWIg4oCUIFRlbDogKzk4IDkxMiA2MDMgMzUzMCJ9'), c => c.charCodeAt(0)))));
const creditText = () => CREDIT[APP.lang] || CREDIT.fa;
const CREDIT_STYLE = 'display:block!important;visibility:visible!important;opacity:1!important;position:static!important;font-weight:700!important;color:#3b1f47!important;font-size:.85rem!important;margin-top:6px!important';
function placeCredit(){
  let el = document.getElementById('rs_credit');
  const ft = document.querySelector('footer') || document.body;
  if (!el || !document.body.contains(el)){ el = document.createElement('div'); el.id = 'rs_credit'; ft.appendChild(el); }
  if (el.textContent !== creditText()) el.textContent = creditText();
  if (el.getAttribute('style') !== CREDIT_STYLE) el.setAttribute('style', CREDIT_STYLE);
  if (ft.style && ft !== document.body){ ft.style.removeProperty('display'); ft.style.removeProperty('visibility'); }
}
new MutationObserver(() => placeCredit()).observe(document.documentElement, {childList:true, subtree:true, attributes:true, characterData:true});

/* ─────────────── مودال، پیام، زبان ─────────────── */
function openModal(title, body, foot){ $('modal_t').textContent = title; $('modal_b').innerHTML = body; $('modal_f').innerHTML = foot || ''; $('modal').classList.remove('hidden'); $('modal_b').scrollTop = 0; }
function closeModal(){ $('modal').classList.add('hidden'); }
window.closeModal = closeModal;
let tT = null;
function toast(m){ const el = $('toast'); el.textContent = m; el.classList.remove('hidden'); clearTimeout(tT); tT = setTimeout(() => el.classList.add('hidden'), 2800); }
window.toggleLang = () => { APP.lang = APP.lang === 'fa' ? 'en' : 'fa'; LS.set('rs_lang', APP.lang); renderAll(); const q = $('gq'); if (q.value) gSearch(q.value); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('DOMContentLoaded', () => { $('logo').src = LOGO; renderAll(); });
