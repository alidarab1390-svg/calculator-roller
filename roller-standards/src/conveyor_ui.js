/* ═══ رابط کاربری «طراحی کامل نوار نقاله» + گزارش ═══ */
(() => {
  const r2 = CV.r2, f0 = v => fx(v, 0), f1 = v => fx(v, 1), f2 = v => fx(v, 2);
  const DEF = {mat:'mt|coal', Q:800, rho:'', beta:'', L:150, H:12, v:'', bw:'', arr:'t3', lam:35, rarr:'auto', lump:1, drop:1.5, sticky:false, wet:false, oil:false, fire:false, temp:20,
    fs:2, fm:1, f:0.020, start:'soft', eta:0.92, beltType:'ep', wrap:210, lag:'rubber', lagAll:false, takeup:'auto', hLeg:1.0, walk:1, cover:0, poly:'no', heavy:'yes', secBlade:''};
  const W = () => CS.wiz || (CS.wiz = {inp:Object.assign({}, DEF), ovr:{}, bomEd:{}, tab:'sum', name:''});
  let RES = null;
  const T = (fa, en) => L(b(fa, en));
  const val = (v, u) => `${esc(v)}${u ? ' <small>' + esc(u) + '</small>' : ''}`;
  const spec = rows => `<table class="mini wide spec2">${rows.filter(Boolean).map(([k, v, u]) => `<tr><td>${esc(L(k))}</td><td>${typeof v === 'object' && v && 'fa' in v ? esc(L(v)) : val(v, u)}</td></tr>`).join('')}</table>`;
  const eqs2 = (main, eq) => `<span dir="ltr">${esc(main)}${eq ? ` <small class="eq">(${esc(eq)})</small>` : ''}</span>`;

  /* ── فرم ورودی ── */
  const I = (k, lab, type, opts, unit, hint) => {
    const v = W().inp[k];
    let h;
    if (type === 'sel') h = `<select id="w_${k}" onchange="wizIn('${k}',this.value)">${opts.map(([o, t]) => `<option value="${esc(o)}" ${String(o) === String(v) ? 'selected' : ''}>${esc(L(t))}</option>`).join('')}</select>`;
    else if (type === 'chk') h = `<input type="checkbox" id="w_${k}" ${v ? 'checked' : ''} onchange="wizIn('${k}',this.checked)" style="width:auto;align-self:flex-start">`;
    else h = `<input id="w_${k}" type="number" step="any" value="${esc(v)}" placeholder="${esc(hint ? L(hint) : '')}" onchange="wizIn('${k}',this.value)">`;
    return `<label>${esc(L(lab))}${unit ? ` <small>(${unit})</small>` : ''}${h}</label>`;
  };
  const auto = b('خودکار', 'auto');
  function form(){
    const mats = rowsOf('materials').map(m => [m.id, m.name]);
    return `<details open class="fs"><summary>⛰ ${T('ماده و ظرفیت','Material & capacity')}</summary><div class="form">
      ${I('mat', b('ماده','Material'), 'sel', mats)}${I('Q', b('ظرفیت','Capacity'), 'n', null, 't/h')}
      ${I('rho', b('چگالی (خالی = از ماده)','Density (blank = material)'), 'n', null, 't/m³', auto)}${I('beta', b('زاویه سرریز β','Surcharge β'), 'n', null, '°', auto)}
      ${I('lump', b('اندازه کلوخه','Lump size'), 'sel', FD.map((x, i) => [i, x[0]]))}${I('drop', b('ارتفاع سقوط در بارگیری','Drop height at loading'), 'n', null, 'm')}
      ${I('temp', b('دمای ماده','Material temperature'), 'n', null, '°C')}${I('sticky', b('ماده چسبنده','Sticky material'), 'chk')}
      ${I('wet', b('محیط مرطوب','Wet conditions'), 'chk')}${I('oil', b('ماده روغنی','Oily material'), 'chk')}${I('fire', b('نیاز به ضد آتش','Fire resistant required'), 'chk')}
    </div></details>
    <details open class="fs"><summary>📏 ${T('هندسه نوار','Conveyor geometry')}</summary><div class="form">
      ${I('L', b('طول نوار (مرکز تا مرکز درام‌ها)','Length (pulley centres)'), 'n', null, 'm')}${I('H', b('اختلاف ارتفاع (بالارو +)','Lift (up +)'), 'n', null, 'm')}
      ${I('v', b('سرعت (خالی = خودکار)','Speed (blank = auto)'), 'n', null, 'm/s', auto)}${I('bw', b('عرض نوار','Belt width'), 'sel', [['', auto]].concat(DIN_BW.map(x => [x, x + ' mm'])))}
      ${I('arr', b('چیدمان رفت','Carrying arrangement'), 'sel', [['t3', ARR.t3], ['v2', ARR.v2], ['flat', ARR.flat]])}${I('lam', b('زاویه ناودانی λ','Troughing angle λ'), 'sel', [20,25,30,35,40,45].map(x => [x, x + '°']))}
      ${I('rarr', b('چیدمان برگشت','Return arrangement'), 'sel', [['auto', auto], ['flat', ARR.flat], ['v2', ARR.v2]])}${I('hLeg', b('ارتفاع متوسط پایه‌های سازه','Average support height'), 'n', null, 'm')}
      ${I('walk', b('راهرو سرویس','Service walkway'), 'sel', [[0, b('ندارد','none')], [1, b('یک طرف','one side')], [2, b('دو طرف','both sides')]])}
      ${I('cover', b('پوشش (کاور) نوار','Belt covers'), 'sel', [[0, b('ندارد','none')], [50, '50%'], [100, '100%']])}
    </div></details>
    <details class="fs"><summary>⚙️ ${T('شرایط کار، تسمه و محرک','Operation, belt & drive')}</summary><div class="form">
      ${I('fs', b('ساعت کار','Operating hours'), 'sel', FS.map((x, i) => [i, x[0]]))}${I('fm', b('محیط','Environment'), 'sel', FM.map((x, i) => [i, x[0]]))}
      ${I('f', b('ضریب اصطکاک f','Friction factor f'), 'sel', F_OPTS.map(([x, t]) => [x, {fa:x + ' — ' + t.fa, en:x + ' — ' + t.en}]))}
      ${I('beltType', b('نوع تسمه','Belt type'), 'sel', [['ep', b('EP پارچه‌ای (Dunlop Superfort)','EP fabric (Dunlop Superfort)')], ['st', b('ST سیم‌فولادی (Dunlop Ferroflex)','ST steel cord (Dunlop Ferroflex)')]])}
      ${I('wrap', b('زاویه پیچش درام محرک','Drive wrap angle'), 'sel', [[180, '180°'], [210, '210° (snub)'], [240, '240° (snub)']])}
      ${I('lag', b('روکش درام محرک','Drive lagging'), 'sel', Object.entries(LAGGING).map(([k, x]) => [k, x.t]))}${I('lagAll', b('روکش لاستیکی درام‌های دیگر','Rubber lagging on other pulleys'), 'chk')}
      ${I('start', b('روش راه‌اندازی','Starting method'), 'sel', Object.entries(START).map(([k, x]) => [k, x.t]))}${I('eta', b('راندمان محرک η','Drive efficiency η'), 'n')}
      ${I('takeup', b('کشش‌دهنده','Take-up'), 'sel', [['auto', auto], ['screw', b('پیچی','screw')], ['gravity', b('وزنه‌ای','gravity')]])}
      ${I('secBlade', b('تیغه بلت کلینر ثانویه','Secondary cleaner blade'), 'sel', [['', auto], ['pu', b('پلی‌یورتان','polyurethane')], ['cer', b('سرامیک','ceramic')], ['tc', b('کاربید تنگستن','tungsten carbide')]])}
      ${I('heavy', b('حذف سری‌های سبک (M/RTL/MPS)','Exclude light series'), 'sel', [['yes', b('بله','yes')], ['no', b('خیر','no')]])}
      ${I('poly', b('اجازه رولیک پلیمری','Allow polymer rollers'), 'sel', [['no', b('خیر','no')], ['yes', b('بله','yes')]])}
    </div></details>`;
  }
  window.wizIn = (k, v) => { const w = W(); w.inp[k] = typeof v === 'boolean' ? v : (v === '' ? '' : (isNaN(+v) ? v : +v)); if (['bw', 'arr', 'lam', 'v', 'beltType', 'Q', 'L'].includes(k)) w.ovr = {}; saveCS(); run(); };
  window.wizOvr = (k, v) => { const w = W(); if (v === '' || v == null) delete w.ovr[k]; else w.ovr[k] = v; saveCS(); run(); };
  window.wizTab = k => { W().tab = k; saveCS(); out(); };

  /* ── اجرا ── */
  function run(){ const w = W(); RES = CV.design(w.inp, w.ovr); out(); }
  const TABS2 = [['sum', b('خلاصه','Summary')], ['calc', b('محاسبات','Calculations')], ['idl', b('رولیک‌ها و پایه‌ها','Idlers')], ['belt', b('تسمه','Belt')],
    ['pul', b('درام‌ها','Pulleys')], ['drv', b('موتور و گیربکس','Motor & gearbox')], ['cln', b('بلت کلینر و کشش‌دهنده','Cleaners & take-up')], ['wt', b('وزن و لیست قطعات','Weights & BOM')]];
  function bomRows(){ const ed = W().bomEd; return RES.bom.map(x => { const e = ed[x.id] || {}; const qty = e.qty ?? x.qty, unit = e.unit ?? x.unit; return Object.assign({}, x, {qty, unit, total:qty*unit, edited:!!ed[x.id]}); }); }
  function out(){
    const el = $('wiz_out'); if (!el) return;
    if (!RES || RES.err){ el.innerHTML = `<p class="warn">⚠️ ${esc((RES && RES.W || []).map(L).join(' · ') || T('ورودی‌ها را کامل کنید','Complete the inputs'))}</p>`; return; }
    const k = W().tab || 'sum';
    el.innerHTML = `<div class="seg sm">${TABS2.map(([t, l]) => `<button class="${t === k ? 'on' : ''}" onclick="wizTab('${t}')">${esc(L(l))}</button>`).join('')}</div>` +
      (RES.W.length ? RES.W.map(w => `<p class="warn">⚠️ ${esc(L(w))}</p>`).join('') : '') + `<div class="wz">${PANES[k]()}</div>`;
  }
  const kpi = items => `<div class="kpi k4">${items.map(([l, v, u]) => `<div><small>${esc(L(l))}</small><b>${esc(v)}</b><i>${esc(u || '')}</i></div>`).join('')}</div>`;
  const totalMass = () => bomRows().reduce((s, x) => s + x.total, 0);

  /* ── بخش‌های خروجی ── */
  const rollerRows = (rr, I) => [
    [b('کد ASA (کد معادل)','ASA code (equivalent)'), rr.code + (rr.eq ? '  (' + rr.eq + ')' : '')],
    [b('سری / کلاس کاری','Series / duty'), `${rr.asa} (${rr.ser}) — ${L(DUTY[rr.duty]) || ''}`],
    [b('لوله: قطر × ضخامت','Tube: D × s'), `Ø${rr.D} × ${rr.s}`, 'mm'], [b('جنس لوله','Tube material'), rr.tubeMat || b('S235JR','S235JR')],
    [b('طول لوله B','Tube length B'), rr.B, 'mm'], [b('طول نصب C (بین تخت‌ها)','Installed length C'), rr.C, 'mm'], [b('طول کل شافت A','Spindle length A'), rr.A, 'mm'],
    [b('قطر شافت d / در هوزینگ d1','Spindle d / at housing d1'), `${rr.d} / ${rr.d1 || rr.d}`, 'mm'], [b('جنس شافت','Spindle material'), rr.shaftMat || b('C45 h9','C45 h9')],
    [b('آچارخور شافت (تخت) ch × g','Spindle flats ch × g'), `${rr.ch} × ${rr.g || 9}  (e = ${rr.e || 4})`, 'mm'], [b('نوع سر شافت','Spindle end'), b('دو تخت موازی (F)','Two parallel flats (F)')],
    [b('بلبرینگ','Bearing'), rr.brgFull || rr.brg], [b('هوزینگ','Housing'), rr.housing || b('فولادی کشش عمیق','Deep-drawn steel')], [b('آب‌بندی','Sealing'), rr.seal || b('لابیرنت','Labyrinth')],
    rr.cap != null ? [b('ظرفیت بار در این سرعت / بار طراحی','Load capacity at speed / design load'), `${rr.cap} / ${rr.load}`, 'daN'] : null,
    rr.rpm != null ? [b('دور رولیک','Roller speed'), rr.rpm, 'rpm'] : null,
    [b('وزن کل / قطعات دوار','Total / rotating weight'), `${rr.wt ?? '—'} / ${rr.wr ?? '—'}`, 'kg']];
  const PANES = {
    sum: () => { const R = RES, d = RES.drive;
      const cemaLoad = R.R.Ca*R.fd*R.Fs*R.Fm*10/4.448, cm = rowsOf('cema').find(c => c.trough >= cemaLoad);
      return kpi([[b('عرض نوار','Belt width'), RES.bw, 'mm'], [b('سرعت','Speed'), RES.v, 'm/s'], [b('پرشدگی','Fill'), f0(RES.fill*100), '%'], [b('توان موتور','Motor'), d.Pm, 'kW'],
        [b('تسمه','Belt'), RES.belt.name, `${RES.belt.top}+${RES.belt.bot}`], [b('درام محرک','Drive pulley'), 'Ø' + RES.pulleys[0].D, 'mm'], [b('نسبت گیربکس','Gear ratio'), d.iSel, ''], [b('وزن کل مکانیکی','Total mechanical mass'), f0(totalMass()), 'kg']]) +
      spec([[b('ماده','Material'), RES.mat ? RES.mat.name : '—'], [b('ظرفیت طراحی / بیشینه','Design / max capacity'), `${RES.Q} / ${f0(RES.cap.Qm)}`, 't/h'], [b('ظرفیت حجمی','Volumetric'), f0(RES.Q/RES.rho), 'm³/h'],
        [b('طول / ارتفاع / شیب','Length / lift / slope'), `${RES.L} / ${RES.H} / ${f1(RES.delta)}°`], [b('چیدمان','Arrangement'), `${L(ARR[RES.arr])} ${RES.lam}° · ${T('برگشت','return')}: ${L(ARR[RES.rarr])}`],
        [b('رولیک رفت','Carrying roller'), RES.sC.code + ' (' + RES.sC.eq + ')'], [b('رولیک برگشت','Return roller'), RES.sR.code + ' (' + RES.sR.eq + ')' + (RES.ringRet ? ' + ' + T('رینگ لاستیکی','rubber rings') + ' ' + asaDes(RES.ringRet.des) : '')],
        [b('رولیک ضربه‌گیر','Impact roller'), RES.imp ? RES.imp.code + ' (' + RES.imp.eq + ')' : '—'],
        [b('تعداد پایه‌ها (رفت/انتقالی/ضربه/خودتنظیم/برگشت)','Sets (carry/transition/impact/training/return)'), `${RES.nCarry} / ${RES.nTr} / ${RES.nImp} / ${RES.nTrainC}+${RES.nTrainR} / ${RES.nRet}`],
        [b('نیروی محیطی / توان درام','Peripheral force / pulley power'), `${f0(RES.R.FU)} N / ${f1(RES.R.PA)} kW`], [b('کشش T1 / T2','Tension T1 / T2'), `${f0(RES.R.T1)} / ${f0(RES.R.T2)}`, 'N'],
        [b('کشش‌دهنده','Take-up'), `${L(RES.takeup.name)} — ${f0(RES.takeup.force)} N`], [b('موتور','Motor'), `${d.Pm} kW · ${d.frame} · ${d.rpm} rpm`],
        [b('کنترل CEMA (بار هر پایه رفت)','CEMA check (carrying set load)'), `${f0(cemaLoad)} lbf → ${cm ? 'CEMA ' + cm.cls : T('بیش از F','above F')}`]]); },
    calc: () => { const SEC = {geo:b('هندسه','Geometry'), cap:b('ظرفیت','Capacity'), load:b('بار','Loads'), idl:b('پایه‌ها','Idlers'), res:b('مقاومت‌ها (DIN 22101)','Resistances (DIN 22101)'), pow:b('توان','Power'), ten:b('کشش‌ها','Tensions'), belt:b('تسمه','Belt'), drv:b('محرک','Drive')};
      let last = '', h = '<table class="mini wide"><tr><th>' + T('پارامتر','Parameter') + '</th><th>' + T('رابطه','Formula') + '</th><th>' + T('مقدار','Value') + '</th><th>' + T('واحد','Unit') + '</th></tr>';
      RES.steps.forEach(s => { if (s.sec !== last){ last = s.sec; h += `<tr><th colspan="4" class="sub">${esc(L(SEC[s.sec]))}</th></tr>`; }
        h += `<tr><td style="text-align:start">${esc(L(s.name))}</td><td dir="ltr">${esc(L(s.formula))}</td><td><b>${esc(typeof s.val === 'number' ? fx(s.val, 3) : s.val)}</b></td><td>${esc(s.unit)}</td></tr>`; });
      return h + '</table>'; },
    idl: () => { const cand = (list, key, cur) => `<select onchange="wizOvr('${key}',this.value)"><option value="">${T('انتخاب خودکار','automatic')}</option>${list.slice(0, 40).map(c => `<option value="${c.key}" ${c.key === cur ? 'selected' : ''}>${c.ok ? '✅' : '✗'} ${asaSer(c.T.ser)} (${c.T.ser}) Ø${c.T.D} — ${f0(c.cap)} daN · ${c.wt} kg</option>`).join('')}</select>`;
      let h = `<div class="form"><label>${T('رولیک رفت','Carrying roller')}${cand(RES.R.candC, 'carry', W().ovr.carry)}</label><label>${T('رولیک برگشت','Return roller')}${cand(RES.R.candR, 'ret', W().ovr.ret)}</label>
        <label>${T('فاصله پایه رفت a0','Carry pitch a0')} <small>(m)</small><input type="number" step="0.05" value="${RES.a0}" onchange="wizOvr('a0',this.value)"></label><label>${T('فاصله پایه برگشت au','Return pitch au')} <small>(m)</small><input type="number" step="0.1" value="${RES.au}" onchange="wizOvr('au',this.value)"></label></div>`;
      RES.idlers.forEach(I => { const rr = I.roller; if (!rr) return;
        h += `<h4>${esc(L(I.name))} — ${I.qty} ${T('عدد','sets')} × ${I.rolls} ${T('رولیک','rollers')}</h4>`;
        if (I.impact) h += spec([[b('کد ASA (معادل)','ASA code (equivalent)'), rr.code + ' (' + rr.eq + ')'], [b('لوله پایه','Base tube'), `Ø${rr.D} × ${rr.s} — ${rr.asa} (${rr.ser})`, ''],
          [b('B / C / A','B / C / A'), `${rr.B} / ${rr.C} / ${rr.A}`, 'mm'], [b('شافت / تخت / بلبرینگ','Spindle / flats / bearing'), `Ø${rr.d} · ch ${rr.ch} · ${rr.brg} 2RS C3`],
          [b('رینگ ضربه‌گیر: قطر خارجی / داخلی','Impact ring OD / bore'), `${rr.oe} / ${rr.D}`, 'mm'], [b('ضخامت شعاعی لاستیک','Radial rubber thickness'), rr.radial, 'mm'],
          [b('عرض رینگ (ET) × تعداد','Ring width (ET) × count'), `${rr.E} × ${rr.rings}`], [b('آمیزه','Compound'), rr.comp], [b('وزن رولیک','Roller weight'), rr.wt ?? '—', 'kg']]);
        else h += spec(rollerRows(rr, I));
        if (I.ring){ const g = I.ring; h += `<h4>⭕ ${T('رینگ‌های لاستیکی برگشت','Return rubber rings')} ${asaDes(g.des)} (${g.des})</h4>` + spec([[b('قطر خارجی / داخلی رینگ','Ring OD / bore'), `${g.oe} / ${g.ri}`, 'mm'], [b('ضخامت شعاعی','Radial thickness'), g.radial, 'mm'],
          [b('رینگ تخت کناری ET (عرض × تعداد)','Side flat rings ET (width × count)'), `${g.E1} × ${g.des === 'NC' ? g.side : g.side + ' × 2'}`], [b('رینگ خم میانی ER (عرض × تعداد)','Central curved rings ER (width × count)'), `${g.E} × ${g.central}`],
          [b('a / b / t','a / b / t'), `${g.a} / ${g.b} / ${g.t}`, 'mm'], [b('کل رینگ‌ها','Total rings'), g.total], [b('آمیزه','Compound'), g.comp]]); }
        h += `<p class="note">${T('قاب','Frame')}: ${I.frame.parts.map(p => `${L(p[0])} ${p[1]} (${f1(p[2])} kg)`).join(' · ')} — ${T('وزن قاب','frame mass')} ≈ <b>${f1(I.frameMass)} kg</b></p>`; });
      return h; },
    belt: () => { const t = RES.belt, opt = `<select onchange="wizOvr('belt',this.value)"><option value="">${T('انتخاب خودکار','automatic')}</option>${t.opts.map(o => `<option ${o.name === W().ovr.belt ? 'selected' : ''}>${o.name}</option>`).join('')}</select>`;
      const fam = t.type === 'ST' ? 'Dunlop Ferroflex (steel cord)' : (RES.inp.lump >= 3 ? 'Dunlop Ultra X (impact / rip resistant)' : 'Dunlop Superfort (EP multi-ply)');
      return `<div class="form one"><label>${T('تسمه','Belt')}${opt}</label></div>` + spec([
        [b('مشخصه','Designation'), `${t.name}  ${t.top}+${t.bot}  ${t.grade.din}`], [b('خانواده پیشنهادی (دانلوپ)','Suggested family (Dunlop)'), fam],
        [b('عرض','Width'), RES.bw, 'mm'], [b('نوع منجید (لاشه)','Carcass'), t.type === 'ST' ? T(`سیم‌فولادی، قطر سیم ${t.cord} mm`,`Steel cord, cord Ø${t.cord} mm`) : T(`پلی‌استر/نایلون EP، ${t.plies} لایه × ${t.ply} N/mm`,`Polyester/nylon EP, ${t.plies} plies × ${t.ply} N/mm`)],
        [b('استحکام اسمی / لازم','Nominal / required strength'), `${t.k} / ${f0(RES.R.kReq)}`, 'N/mm'], [b('بهره‌برداری استحکام','Strength utilisation'), t.util, '%'], [b('ضریب اطمینان','Safety factor'), t.SF],
        [b('روکش بالا + پایین','Top + bottom cover'), `${t.top} + ${t.bot}`, 'mm'], [b('گرید روکش (DIN 22102 / ISO 14890)','Cover grade (DIN 22102 / ISO 14890)'), `${t.grade.din} / ${t.grade.iso}`],
        [b('گرید معادل دانلوپ (بررسی شود)','Dunlop equivalent grade (verify)'), t.grade.dl], [b('ضخامت منجید / کل','Carcass / total thickness'), `${t.carcass} / ${t.tTot}`, 'mm'],
        [b('وزن تسمه','Belt mass'), `${t.qB} kg/m  (${f2(t.qB/(RES.bw/1000))} kg/m²)`], [b('طول کل تسمه (با اتصال و کورس)','Total belt length (incl. splice & travel)'), t.len, 'm'],
        [b('اتصال (Splice)','Splice'), t.type === 'ST' ? T(`پرس گرم (وولکانیزه)، طول ≈ ${t.splice} mm`,`Hot vulcanised, length ≈ ${t.splice} mm`) : T(`پرس گرم پله‌ای، ${t.plies - 1} پله، طول ≈ ${t.splice} mm`,`Hot vulcanised step splice, ${t.plies - 1} steps, ≈ ${t.splice} mm`)],
        [b('کمینه قطر درام A / B / C (DIN 22101)','Min. pulley Ø A / B / C (DIN 22101)'), `${f0(t.Dmin.A)} / ${f0(t.Dmin.B)} / ${f0(t.Dmin.C)}`, 'mm'], [b('وزن کل تسمه','Total belt mass'), f0(t.len*t.qB), 'kg']]) +
        `<p class="note">${T('نام خانواده و گرید دانلوپ بر اساس نام‌گذاری عمومی دانلوپ است؛ برای سفارش با کاتالوگ دانلوپ تطبیق دهید.','Dunlop family and grade names follow Dunlop\'s general naming; confirm against the Dunlop catalogue before ordering.')}</p>`; },
    pul: () => { const dsel = `<select onchange="wizOvr('Dhead',this.value)"><option value="">${T('خودکار','automatic')}</option>${PULLEY_STD.map(x => `<option ${+W().ovr.Dhead === x ? 'selected' : ''}>${x}</option>`).join('')}</select>`;
      return `<div class="form one"><label>${T('قطر درام محرک','Drive pulley diameter')} (mm)${dsel}</label></div>` + RES.pulleys.map(p => `<h4>🛢 ${esc(L(p.name))}</h4>` + spec([
        [b('قطر درام × عرض پوسته','Diameter × face width'), `Ø${p.D} × ${p.face}`, 'mm'], [b('ضخامت پوسته / دیسک','Shell / disc thickness'), `${p.t} / ${p.td}`, 'mm'],
        [b('جنس پوسته و دیسک','Shell & disc material'), b('S355JR (ST52)','S355JR (ST52)')], [b('شافت: Ø در بلبرینگ / در توپی','Shaft Ø at bearing / at hub'), `${p.d} / ${p.dHub}`, 'mm'],
        [b('جنس شافت','Shaft material'), p.d > 100 ? b('42CrMo4 (MO40) بهسازی‌شده','42CrMo4 (MO40) QT') : b('C45 (CK45)','C45 (CK45)')], [b('طول شافت / فاصله یاتاقان‌ها','Shaft length / bearing centres'), `${p.Lsh} / ${p.Lb}`, 'mm'],
        [b('اتصال توپی','Hub connection'), p.lock], [b('خار انتهای شافت','Shaft-end key'), p.key6885],
        [b('بلبرینگ / بوش / یاتاقان','Bearing / sleeve / housing'), `${p.brg} + ${p.sleeve} · ${p.housing}`], [b('روکش','Lagging'), p.lag ? (p.lag.t ? p.lag.t : T(`لاستیکی ${p.lag.th} mm`,`Rubber ${p.lag.th} mm`)) : T('ندارد','none')],
        [b('نیروی برآیند / گشتاور خمشی / پیچشی','Resultant / bending moment / torque'), `${f0(p.R)} N / ${f0(p.M)} N·m / ${f0(p.Tq)} N·m`],
        [b('وزن: پوسته / دیسک‌ها / توپی‌ها / شافت / روکش / یاتاقان‌ها','Mass: shell / discs / hubs / shaft / lagging / bearings'), `${f1(p.mShell)} / ${f1(p.mDisc)} / ${f1(p.mHub)} / ${f1(p.mShaft)} / ${f1(p.mLag)} / ${f1(p.mBrg)}`, 'kg'],
        [b('وزن کل درام','Total pulley mass'), f0(p.mass), 'kg']])).join(''); },
    drv: () => { const d = RES.drive, ms = `<select onchange="wizOvr('motor',this.value)"><option value="">${T('خودکار','automatic')}</option>${MOTORS.map(m => `<option value="${m[0]}" ${+W().ovr.motor === m[0] ? 'selected' : ''}>${m[0]} kW — ${m[1]}</option>`).join('')}</select>`,
        rs = `<select onchange="wizOvr('ratio',this.value)"><option value="">${T('خودکار','automatic')}</option>${GEAR_RATIOS.map(g => `<option ${+W().ovr.ratio === g ? 'selected' : ''}>${g}</option>`).join('')}</select>`;
      return `<div class="form"><label>${T('موتور','Motor')}${ms}</label><label>${T('نسبت گیربکس','Gear ratio')}${rs}</label></div>` + spec([
        [b('توان لازم / انتخابی','Required / selected power'), `${f1(RES.R.PMreq)} / ${d.Pm}`, 'kW'], [b('نوع موتور','Motor type'), d.motorType], [b('دور موتور','Motor speed'), d.rpm, 'rpm'],
        [b('روش راه‌اندازی','Starting'), d.start], [b('نوع گیربکس','Gearbox type'), d.gbType], [b('نسبت لازم / انتخابی','Required / selected ratio'), `${f2(d.iReq)} / ${d.iSel}`],
        [b('دور درام / سرعت واقعی نوار','Pulley speed / actual belt speed'), `${f1(d.n2)} rpm / ${f2(d.vAct)} m/s`], [b('گشتاور خروجی گیربکس','Gearbox output torque'), f0(d.T2g), 'N·m'],
        [b('ضریب سرویس / گشتاور نامی لازم','Service factor / required rating'), `${d.sfG} / ${f0(d.gbRating)} N·m`], [b('کوپلینگ','Coupling'), d.coupling],
        [b('ضد برگشت (Backstop)','Backstop'), d.backstop ? T(`لازم — گشتاور ≥ ${f0(d.bsTorque)} N·m`,`required — torque ≥ ${f0(d.bsTorque)} N·m`) : T('لازم نیست','not required')],
        [b('ترمز','Brake'), d.brake ? T('لازم (نوار سرازیر)','required (decline)') : T('اختیاری','optional')],
        [b('وزن تقریبی گیربکس / موتور (برقی)','Approx. gearbox / motor (electrical) mass'), `${f0(d.mGB)} / ${d.mMotor}`, 'kg']]); },
    cln: () => RES.cleaners.map(c => `<h4>🧹 ${esc(L(c.name))} × ${c.qty}</h4>` + spec([[b('مشخصات','Specification'), c.spec], [b('وزن هر عدد','Unit mass'), f1(c.mass), 'kg']])).join('') +
      `<h4>⚖️ ${esc(L(RES.takeup.name))}</h4>` + spec([[b('نیروی کشش','Take-up force'), f0(RES.takeup.force), 'N'], [b('کورس','Travel'), RES.takeup.travel, 'mm'],
        RES.takeup.cw ? [b('وزنه تعادل','Counterweight'), f0(RES.takeup.cw), 'kg'] : null, [b('وزن سازه کشش‌دهنده','Take-up structure mass'), f0(RES.takeup.mass), 'kg']]) +
      `<h4>🦺 ${T('ایمنی و جانبی (برقی — فقط فهرست)','Safety & accessories (electrical — list only)')}</h4>` + spec([[b('کلید طنابی اضطراری','Pull-cord switches'), Math.max(2, Math.ceil(RES.L/30)*(+RES.inp.walk === 2 ? 2 : 1))],
        [b('کلید انحراف نوار','Belt misalignment switches'), Math.max(2, 2*Math.ceil(RES.L/100))], [b('سنسور سرعت (درام دم)','Speed sensor (tail pulley)'), 1], RES.inp.sticky || RES.L > 100 ? [b('سنسور پارگی/گرفتگی شوت','Chute blockage sensor'), 1] : null]),
    wt: () => { const rows = bomRows(), cats = {}; rows.forEach(x => cats[x.cat] = (cats[x.cat] || 0) + x.total); const tot = rows.reduce((s, x) => s + x.total, 0);
      const mx = Math.max(...Object.values(cats));
      return `<div class="bars">${Object.entries(cats).map(([c, v]) => `<div><span>${esc(L(RES.CAT[c]))}</span><i style="width:${(v/mx*100).toFixed(1)}%"></i><b>${f0(v)} kg · ${f1(v/tot*100)}%</b></div>`).join('')}</div>
        <p class="res">⚖️ ${T('وزن کل قطعات مکانیکی (بدون موتور و تجهیزات برقی)','Total mechanical mass (excluding motor & electrical)')}: <b>${f0(tot)} kg</b> ≈ ${f1(tot/1000)} t · ${f0(tot/RES.L)} kg/m</p>
        <p class="note">${T('تعداد و وزن واحد هر ردیف قابل ویرایش است؛ مقادیر ویرایش‌شده با رنگ نارنجی مشخص می‌شوند.','Quantity and unit mass are editable; edited values are highlighted.')} <button class="btn sm" onclick="wizBomReset()">↺ ${T('بازگردانی','reset')}</button></p>
        <div class="tw"><table class="mini wide bom"><tr><th>#</th><th>${T('گروه','Group')}</th><th>${T('قطعه','Item')}</th><th>${T('مشخصه','Spec')}</th><th>${T('تعداد','Qty')}</th><th>${T('وزن واحد','Unit mass')} kg</th><th>${T('وزن کل','Total')} kg</th></tr>
        ${rows.map((x, i) => `<tr class="${x.edited ? 'ed' : ''}"><td>${i+1}</td><td>${esc(L(RES.CAT[x.cat]))}</td><td style="text-align:start">${esc(L(x.item))}</td><td dir="ltr" style="font-size:.72rem">${esc(L(x.spec))}</td>
          <td><input type="number" step="any" value="${r2(x.qty,2)}" onchange="wizBom('${x.id}','qty',this.value)"></td><td><input type="number" step="any" value="${r2(x.unit,2)}" onchange="wizBom('${x.id}','unit',this.value)"></td><td><b>${f1(x.total)}</b></td></tr>`).join('')}
        <tr><th colspan="6">${T('جمع کل','Grand total')}</th><th>${f0(tot)}</th></tr></table></div>`; }
  };
  window.wizBom = (id, k, v) => { const ed = W().bomEd; ed[id] = Object.assign(ed[id] || {}, {[k]: +v}); saveCS(); out(); };
  window.wizBomReset = () => { W().bomEd = {}; saveCS(); out(); };

  /* ── پروژه‌ها ── */
  const PJ = () => LS.get('rs_conv_proj', {});
  window.wizSave = () => { const w = W(), n = (prompt(T('نام پروژه:','Project name:'), w.name || '') || '').trim(); if (!n) return; const p = PJ(); p[n] = {inp:w.inp, ovr:w.ovr, bomEd:w.bomEd, date:new Date().toISOString()}; LS.set('rs_conv_proj', p); w.name = n; saveCS(); renderTab(); toast('✅ ' + L(I18N.saved)); };
  window.wizLoad = n => { const p = PJ()[n]; if (!p) return; Object.assign(W(), {inp:Object.assign({}, DEF, p.inp), ovr:p.ovr || {}, bomEd:p.bomEd || {}, name:n}); saveCS(); renderTab(); };
  window.wizDel = () => { const w = W(), p = PJ(); if (!w.name || !p[w.name] || !confirm(L(I18N.confirm_del))) return; delete p[w.name]; LS.set('rs_conv_proj', p); w.name = ''; saveCS(); renderTab(); };
  window.wizNew = () => { CS.wiz = null; saveCS(); renderTab(); };
  window.wizExportJson = () => { const w = W(), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({app:'asaroll-conveyor', v:1, name:w.name, inp:w.inp, ovr:w.ovr, bomEd:w.bomEd}, null, 1)], {type:'application/json'}));
    a.download = `Asaroll_Conveyor_${(w.name || 'project').replace(/\s+/g,'_')}.json`; a.click(); };
  window.wizImportJson = ev => { const f = ev.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const p = JSON.parse(rd.result); if (p.app !== 'asaroll-conveyor') throw 0;
    Object.assign(W(), {inp:Object.assign({}, DEF, p.inp), ovr:p.ovr || {}, bomEd:p.bomEd || {}, name:p.name || ''}); saveCS(); renderTab(); } catch(e){ toast('⛔ ' + T('فایل نامعتبر است','Invalid file')); } }; rd.readAsText(f); };

  /* ── گزارش کامل ── */
  function reportHtml(){
    const w = W(), keep = w.tab, parts = [];
    TABS2.forEach(([k, l]) => { parts.push(`<h2 class="rp">${esc(L(l))}</h2>` + PANES[k]().replace(/<select[\s\S]*?<\/select>/g, '').replace(/<input([^>]*?)value="([^"]*)"[^>]*>/g, '$2').replace(/<button[\s\S]*?<\/button>/g, '')); });
    const head = spec([[b('پروژه','Project'), w.name || '—'], [b('تاریخ','Date'), new Date().toLocaleDateString(APP.lang === 'fa' ? 'fa-IR' : 'en-GB')], [b('روش','Method'), 'DIN 22101 / ISO 5048 (+ CEMA check)']]);
    return head + (RES.W.length ? RES.W.map(x => `<p class="warn">⚠️ ${esc(L(x))}</p>`).join('') : '') + parts.join('') +
      `<p class="note">${T('این گزارش «طراحی مقدماتی» است. مقادیر مرجع عمومی و وزن‌ها تقریبی‌اند و پیش از ساخت باید توسط مهندس مسئول بررسی و تأیید شوند.','This report is a preliminary design. Reference values and masses are approximate and must be reviewed and approved by the responsible engineer before manufacture.')}</p>`;
  }
  window.wizPdf = () => { if (!RES || RES.err) return; printHtml(T('گزارش طراحی نوار نقاله','Belt conveyor design report') + (W().name ? ' — ' + W().name : ''),
    `<style>.rp{color:#fff;background:#3b1f47;padding:4px 10px;border-radius:5px;font-size:13px;margin:12px 0 6px;page-break-after:avoid}.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.kpi div{border:1px solid #ddd0e2;padding:6px;text-align:center}.kpi b{display:block;font-size:14px}.kpi small,.kpi i{font-style:normal;color:#5c4a66}
     .spec2 td:first-child{text-align:start;width:46%;background:#faf7fb}.bars div{display:grid;grid-template-columns:150px 1fr 160px;gap:6px;align-items:center;margin:2px 0}.bars i{display:block;height:9px;background:#e8820c;border-radius:3px}.warn{color:#b45309}h4{color:#3b1f47;margin:8px 0 3px}.mini th.sub{background:#532a63}.seg,.form{display:none}</style>` + reportHtml()); };
  window.wizXlsx = () => { if (!RES || RES.err || typeof XLSX === 'undefined') return;
    const wb = XLSX.utils.book_new(); wb.Workbook = {Views:[{RTL: APP.lang === 'fa'}]};
    const sheetFromHtml = (name, html) => { const div = document.createElement('div'); div.innerHTML = html; const aoa = [];
      div.querySelectorAll('h4, tr, p.res').forEach(el => { if (el.tagName === 'TR') aoa.push([...el.children].map(c => { const t = c.querySelector('input') ? c.querySelector('input').value : c.textContent.trim(); return t !== '' && !isNaN(+t.replace(/,/g,'')) && !/[×/]/.test(t) ? +t.replace(/,/g,'') : t; }));
        else aoa.push([el.textContent.trim()]); });
      aoa.push([], [creditText()]); const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [{wch:48},{wch:40},{wch:16},{wch:14},{wch:12},{wch:14},{wch:14}]; XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); };
    TABS2.forEach(([k, l]) => sheetFromHtml(L(l).replace(/[\\\/\?\*\[\]:]/g, ' '), PANES[k]()));
    XLSX.writeFile(wb, `Asaroll_Conveyor_${(W().name || 'design').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`); };

  /* ── رندر بخش ── */
  CALC.wiz = el => {
    const w = W(), pj = Object.keys(PJ());
    el.innerHTML = `<div class="card"><div class="ch"><span>🏭 ${T('طراحی کامل نوار نقاله (۰ تا ۱۰۰)','Complete belt conveyor design (0 to 100)')}</span><small>DIN 22101 · ISO 5048 · CEMA</small></div>
      <div class="bar"><select onchange="wizLoad(this.value)"><option value="">📂 ${T('پروژه‌های ذخیره‌شده','Saved projects')} (${pj.length})</option>${pj.map(n => `<option ${n === w.name ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        <span class="cnt" style="margin:0">${esc(w.name || '')}</span>
        <button class="btn" onclick="wizSave()">💾 ${T('ذخیره پروژه','Save project')}</button><button class="btn" onclick="wizNew()">🆕 ${T('جدید','New')}</button><button class="btn" onclick="wizDel()">🗑</button>
        <button class="btn" onclick="wizExportJson()">⬇ JSON</button><label class="btn">⬆ JSON<input type="file" accept=".json" hidden onchange="wizImportJson(event)"></label>
        <button class="btn pri" onclick="wizPdf()">📄 ${T('گزارش کامل PDF','Full report PDF')}</button><button class="btn pri" onclick="wizXlsx()">📊 ${T('گزارش اکسل','Excel report')}</button></div>
      <div class="pad">${form()}<div id="wiz_out" class="out"></div>
      <p class="note">${T('نتیجه «طراحی مقدماتی» است و باید پیش از ساخت توسط مهندس مسئول تأیید شود. هر انتخاب خودکار (رولیک، تسمه، درام، موتور، گیربکس، فاصله پایه‌ها) و هر وزن در لیست قطعات قابل تغییر است.','Results are a preliminary design and must be approved by the responsible engineer before manufacture. Every automatic choice (rollers, belt, pulleys, motor, gearbox, pitches) and every mass in the BOM can be changed.')}</p></div></div>`;
    run();
  };
})();
