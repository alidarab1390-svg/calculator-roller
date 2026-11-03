/* ═══════════════════════════════════════════════════════════════
   موتور طراحی کامل نوار نقاله — آسارول (ASA)
   روش اصلی: DIN 22101 / ISO 5048 ؛ کنترل دوم: CEMA
   خروجی: مشخصات کامل همه اجزا + لیست قطعات و شکست وزن (قابل ویرایش)
   هشدار: نتیجه «طراحی مقدماتی» است و باید توسط مهندس تأیید شود.
═══════════════════════════════════════════════════════════════ */
const CV = (() => {
  const r2 = (v, d=2) => Math.round(v * 10**d) / 10**d;
  const ceilTo = (v, list) => list.find(x => x >= v - 1e-9) ?? list[list.length-1];
  const interp = (tbl, x) => { if (x <= tbl[0][0]) return tbl[0][1]; for (let i = 1; i < tbl.length; i++) if (x <= tbl[i][0]) { const [x0,y0] = tbl[i-1], [x1,y1] = tbl[i]; return y0 + (y1-y0)*(x-x0)/(x1-x0); } return tbl[tbl.length-1][1]; };
  const cyl = (D, t, L) => Math.PI * ((D/2)**2 - (D/2 - t)**2) * L * STEEL_RHO;      /* لوله: mm → kg */
  const bar = (d, L) => Math.PI * (d/2)**2 * L * STEEL_RHO;
  const plate = (a, c, t) => a * c * t * STEEL_RHO;

  /* ظرفیت حجمی DIN برای یک عرض */
  function capFor(bw, arr, lam, beta, v, rho, delta){ return capDIN(bw, arr, lam, beta, v, rho, delta); }

  /* ظرفیت بار رولیک از جدول کاتالوگ در سرعت v (daN) — درون‌یابی؛ null یعنی خارج از محدوده سرعت */
  function rollCap(T, row, v){
    const sp = T.sp, ld = row[7] || [];
    if (v > sp[sp.length-1] + 1e-9) return null;
    if (v <= sp[0]) return ld[0];
    for (let i = 1; i < sp.length; i++) if (v <= sp[i] && ld[i] != null && ld[i-1] != null) return ld[i-1] + (ld[i]-ld[i-1])*(v-sp[i-1])/(sp[i]-sp[i-1]);
    return null;
  }
  /* نامزدهای رولیک: همه جداول با طول مناسب این عرض/چیدمان */
  function rollerCandidates(bw, arr, v, load, opt){
    const out = [], idx = arr === 'flat' ? 2 : arr === 'v2' ? 3 : 4;
    CATALOG_N.forEach(T => {
      if (opt.noPoly && /^PL/.test(T.ser)) return;
      if (opt.noLight && ['M1','RTL1','MPR15','MPS1'].includes(T.ser)) return;
      const row = T.rows.find(rw => rw[idx] === bw); if (!row) return;
      const cap = rollCap(T, row, v); if (cap == null) return;
      const rpm = v * 60000 / (Math.PI * T.D);
      out.push({T, row, cap, ok: cap >= load, rpm, lv:(SER[T.ser]||{}).lv||0, wt:row[6], wr:row[5], key:T.ser+'|'+T.D});
    });
    return out.sort((a,c) => (c.ok - a.ok) || a.wt - c.wt || a.lv - c.lv);
  }
  /* مشخصات کامل یک رولیک */
  function rollerSpec(T, row, extra){
    const S = SER[T.ser] || {}, [B, A] = row, C = B + 8;
    const o = Object.assign({ser:T.ser, asa:asaSer(T.ser), duty:S.duty, des:T.des, D:T.D, s:T.s, B, C, A:A || B + (S.addA||26),
      d:T.d, d1:T.d1 || T.d, ch:T.ch, e:T.e, g:T.g, brg:T.brg, wr:row[5], wt:row[6], mat:S.mat,
      shaftMat: b('C45 (CK45) کشیده سرد h9','C45 (CK45) cold drawn h9'),
      tubeMat: S.mat === 'pvc' ? b('PVC-U سخت','Rigid PVC-U') : b('S235JR (ST37) — EN 10219','S235JR (ST37) — EN 10219'),
      housing: S.mat === 'pvc' || S.mat === 'plf' ? b('هوزینگ پلی‌آمید تزریقی','Injection-moulded polyamide housing') : b('هوزینگ فولادی کشش عمیق، پرس و جوش به لوله','Deep-drawn steel housing, pressed & welded'),
      seal: b('لابیرنت پلیمری چندمرحله‌ای + گریس لیتیمی NLGI 2/3','Multi-stage polymer labyrinth + lithium grease NLGI 2/3'),
      brgFull: T.brg && /^6/.test(T.brg) ? T.brg + ' 2RS C3' : T.brg,
      code: `${asaSer(T.ser)}·${T.d}${S.fl||'F'}·${T.D}${asaDes(T.des)}·${C}`, eq:`${T.ser},${T.d}${S.fl||'F'},${T.D}${T.des},${C}`}, extra||{});
    return o;
  }

  /* ─── انتخاب تسمه ─── */
  function beltOptions(type, bw){
    /* نام‌گذاری تجاری: EP (استحکام کل)/(تعداد لایه) — مثل Dunlop Superfort EP 400/3 */
    const out = [], minPly = bw <= 650 ? 2 : bw <= 1200 ? 3 : 4, maxPly = bw <= 650 ? 4 : bw <= 1000 ? 5 : 6;
    const tpOf = ps => { const ks = Object.keys(EP_PLY).map(Number); let lo = ks[0], hi = ks[ks.length-1];
      for (const k of ks){ if (k <= ps) lo = k; if (k >= ps){ hi = k; break; } } return lo === hi ? EP_PLY[lo] : EP_PLY[lo] + (EP_PLY[hi]-EP_PLY[lo])*(ps-lo)/(hi-lo); };
    if (type !== 'st') EP_NOMINAL.forEach(k => { for (let n = minPly; n <= maxPly; n++){ const ps = k/n; if (ps < 80 || ps > 630) continue;
      out.push({type:'EP', k, plies:n, ply:Math.round(ps), carcass:r2(tpOf(ps)*n,1), name:`EP ${k}/${n}`}); } });
    if (type !== 'ep') ST_GRADES.forEach(([k, dc]) => out.push({type:'ST', k, plies:1, cord:dc, carcass:r2(dc + 2.5,1), name:`ST ${k}`}));
    return out.sort((a,c) => a.k - c.k || a.plies - c.plies);
  }
  function covers(mat, inp){
    const abr = mat ? mat.abr : 'B';
    let top = abr === 'C' ? 6 : abr === 'B' ? 5 : 4, bot = abr === 'C' ? 2 : 2;
    if (inp.lump >= 3) top += 2; else if (inp.lump >= 2) top += 1;
    if (inp.drop > 2) top += 1;
    const grade = inp.fire ? {din:'K (DIN 22103) / EN 14973', iso:'S / K', dl:'FRAS / BV-FR'}
      : inp.temp > 60 ? {din:'T (heat)', iso:'—', dl: inp.temp > 150 ? 'Deltahete' : 'Betahete'}
      : inp.oil ? {din:'G (oil)', iso:'—', dl:'BV / ROM'}
      : abr === 'C' || inp.lump >= 3 ? {din:'X', iso:'H', dl:'RS'} : abr === 'B' ? {din:'W', iso:'D', dl:'RS / RA'} : {din:'Y', iso:'L', dl:'RA'};
    return {top, bot, grade};
  }
  function beltMass(bt, bw, cv){ const carc = bt.type === 'ST' ? 1.15*bt.carcass + 0.75*bt.cord : 1.2*bt.carcass; return r2(bw/1000 * (carc + 1.15*(cv.top + cv.bot)), 2); }

  /* ─── طراحی ─── */
  function design(inp, ovr){
    ovr = ovr || {};
    const W = [], steps = [], mat = findRow('materials', inp.mat) || null;
    const step = (sec, name, formula, val, unit) => steps.push({sec, name, formula, val, unit});
    const warn = (fa, en) => W.push(b(fa, en));
    const rho = +inp.rho || (mat ? mat.rho : 1.6), beta = +inp.beta || (mat ? mat.sur : 20);
    const Lc = +inp.L, H = +inp.H || 0, delta = Math.asin(Math.max(-0.99, Math.min(0.99, H / Lc))) / DEG;
    const lam = +inp.lam || 35, arr = inp.arr || 't3';
    const Q = +inp.Q;
    step('geo', b('زاویه شیب','Inclination'), 'δ = asin(H / Lc)', r2(delta,2), '°');
    if (mat && delta > mat.inc) warn(`شیب ${r2(delta,1)}° از بیشینه مجاز این ماده (${mat.inc}°) بیشتر است.`, `Inclination ${r2(delta,1)}° exceeds the material maximum (${mat.inc}°).`);

    /* ۱) سرعت و عرض نوار */
    let v = +ovr.v || +inp.v || (mat ? ({A:3.0, B:2.5, C:2.0})[mat.abr] || 2.5 : 2.5);
    let bw = +ovr.bw || +inp.bw || 0;
    if (!bw){ bw = DIN_BW.find(w => capFor(w, arr, lam, beta, v, rho, delta).Qm >= 1.1*Q) || DIN_BW[DIN_BW.length-1]; }
    const cap = capFor(bw, arr, lam, beta, v, rho, delta);
    const fill = Q / cap.Qm;
    step('cap', b('عرض نوار','Belt width'), 'min BW: Qm,max ≥ 1.1·Q', bw, 'mm');
    step('cap', b('سرعت نوار','Belt speed'), inp.v ? 'input' : b('بر اساس سایندگی ماده','by material abrasiveness'), v, 'm/s');
    step('cap', b('سطح مقطع بار','Load cross-section'), 'A = A1 + A2 (ISO 5048)', r2(cap.A,4), 'm²');
    step('cap', b('ضریب شیب','Inclination factor'), 'k (ISO 5048)', r2(cap.k,3), '—');
    step('cap', b('ظرفیت بیشینه','Maximum capacity'), 'Qm = 3600·v·A·k·ρ', r2(cap.Qm,0), 't/h');
    step('cap', b('درصد پرشدگی','Fill ratio'), 'Q / Qm,max', r2(fill*100,1), '%');
    if (fill > 1) warn('ظرفیت خواسته‌شده از ظرفیت نوار بیشتر است؛ عرض یا سرعت را افزایش دهید.', 'Required capacity exceeds belt capacity; increase width or speed.');
    const qG = Q / (3.6 * v);
    step('load', b('جرم مواد در متر','Material mass per metre'), 'qG = Q / (3.6·v)', r2(qG,2), 'kg/m');

    /* ۲) فاصله و تعداد پایه‌ها */
    const sp = bw <= 650 ? DIN_SPACING[0] : bw <= 1000 ? DIN_SPACING[1] : DIN_SPACING[2];
    const a0 = +ovr.a0 || (rho < 1.2 ? sp[1][0] : rho <= 2 ? sp[1][1] : sp[1][2]), au = +ovr.au || sp[2];
    const Ls = +ovr.Ls || Math.max(1.5, r2(1.0 + 0.6*v, 1)), aImp = 0.35;
    const nImp = Math.ceil(Ls / aImp) + 1;
    const Lt = r2((TRANS_K[lam] || 1.6) * bw/1000 * (inp.beltType === 'st' ? 1.8 : 1), 2), nTrEnd = lam >= 30 ? 2 : 1;
    const nTrainC = Lc > 30 ? Math.floor(Lc / 25) : 0, nTrainR = Lc > 30 ? Math.floor(Lc / 30) : 0;
    const nCarryTot = Math.max(2, Math.ceil((Lc - Ls) / a0));
    const nCarry = Math.max(0, nCarryTot - 2*nTrEnd - nTrainC), nTr = 2*nTrEnd;
    const rarr = inp.rarr === 'v2' || (inp.rarr === 'auto' && bw >= 1200) ? 'v2' : 'flat';
    const nRetTot = Math.max(1, Math.ceil(Lc / au)), nRet = Math.max(0, nRetTot - nTrainR);
    step('idl', b('فاصله پایه رفت','Carrying pitch'), 'DIN / ASA', a0, 'm');
    step('idl', b('فاصله پایه برگشت','Return pitch'), 'DIN / ASA', au, 'm');
    step('idl', b('طول ناحیه بارگیری','Loading zone length'), 'Ls = max(1.5, 1 + 0.6·v)', Ls, 'm');
    step('idl', b('فاصله انتقالی','Transition distance'), 'Lt = k(λ)·BW', Lt, 'm');

    /* ضرایب بار */
    const fpC = arr === 'flat' ? FP.flat : arr === 'v2' ? FP.v2 : (FP['t'+lam] || 0.67), fpR = rarr === 'v2' ? FP.v2 : 1;
    const si = FD_SPEEDS.findIndex(s => s >= v), fd = FD[inp.lump||0][1][si < 0 ? FD_SPEEDS.length-1 : si];
    const Fs = FS[inp.fs ?? 2][1], Fm = FM[inp.fm ?? 1][1];

    /* تکرار برای جرم تسمه */
    let qB = BELT_WT[bw] || 13, res = null;
    for (let it = 0; it < 4; it++){
      const Ca = a0*(qB + qG)*G/10, ca = Ca*fd*Fs*Fm*fpC;
      const Cr = au*qB*G/10, cr = Cr*Fs*Fm*fpR;
      const candC = rollerCandidates(bw, arr, v, ca, {noPoly: inp.poly !== 'yes', noLight: inp.heavy !== 'no'});
      const pickC = (ovr.carry && candC.find(c => c.key === ovr.carry)) || candC.find(c => c.ok) || candC[0];
      const candR = rollerCandidates(bw, rarr, v, cr, {noPoly: inp.poly !== 'yes', noLight: inp.heavy !== 'no'});
      const pickR = (ovr.ret && candR.find(c => c.key === ovr.ret)) || candR.find(c => c.ok && (!pickC || c.T.ser === pickC.T.ser)) || candR.find(c => c.ok) || candR[0];
      if (!pickC || !pickR){ warn('برای این عرض و سرعت رولیک مناسب در جدول یافت نشد.', 'No suitable roller found in the table for this width and speed.'); return {err:true, W, steps}; }
      const nRollC = arr === 't3' ? 3 : arr === 'v2' ? 2 : 1, nRollR = rarr === 'v2' ? 2 : 1;
      const qRO = nRollC * pickC.wr / a0, qRU = nRollR * pickR.wr / au;
      /* مقاومت‌ها (DIN 22101) */
      const f = +inp.f || 0.020, Ccoef = interp(C_TABLE, Lc), cosd = Math.cos(delta*DEG);
      const FH = f * Lc * G * (qRO + qRU + (2*qB + qG) * cosd);
      const FN = (Ccoef - 1) * FH;
      const FSt = qG * H * G;
      const nPrim = 1, nSec = inp.sticky || v > 2.5 || (mat && mat.abr === 'C') ? 1 : 0, nPlough = 1 + (inp.takeup === 'gravity' || (inp.takeup === 'auto' && Lc > 60) ? 1 : 0);
      const pClean = 6e4, muC = 0.6, Fcl = (nPrim + nSec) * (bw/1000 * 0.01) * pClean * muC + nPlough * (bw/1000*1.4*0.008) * 3e4 * muC;
      const Iv = Q / (3.6 * rho * 1000), b1 = 0.6 * bw/1000;
      const Fsk = 0.6 * Iv*Iv * rho*1000 * G * Ls / (v*v * b1*b1) + 2 * Ls * 150;
      const FS = Fcl + Fsk;
      const FU = FH + FN + FSt + FS;
      /* توان */
      const eta = +inp.eta || 0.92, PA = FU * v / 1000, PMreq = PA / eta;
      /* کشش‌ها */
      const lag = LAGGING[inp.lag || 'rubber'], mu = lag.mu[inp.wet ? 1 : 0], th = (+inp.wrap || 180) * DEG, eu = Math.exp(mu*th);
      const kA = START[inp.start || 'soft'].k, FUmax = FU * kA;
      const T2e = FUmax / (eu - 1);
      const Tcs = a0 * (qB + qG) * G / (8 * 0.01), Trs = au * qB * G / (8 * 0.02);
      const Fret = f * Lc * G * (qRU + qB * cosd) - qB * H * G;
      const T2 = Math.max(T2e, Trs, Tcs - Fret);
      const T1 = T2 + FU, T1s = T2 + FUmax, Ttail = T2 + Fret;
      /* تسمه */
      const cv = covers(mat, inp), SF = inp.beltType === 'st' ? 6.7 : 10;
      const kReq = T1s * SF / bw;
      const opts = beltOptions(inp.beltType || 'ep', bw);
      const bt = (ovr.belt && opts.find(o => o.name === ovr.belt)) || opts.find(o => o.k >= kReq) || opts[opts.length-1];
      const qBnew = beltMass(bt, bw, cv);
      res = {Ca, ca, Cr, cr, candC, candR, pickC, pickR, nRollC, nRollR, qRO, qRU, f, Ccoef, FH, FN, FSt, Fcl, Fsk, FS, FU, eta, PA, PMreq, lag, mu, eu, kA, FUmax, T2e, Tcs, Trs, Fret, T2, T1, T1s, Ttail, cv, SF, kReq, opts, bt, nPrim, nSec, nPlough};
      if (Math.abs(qBnew - qB) < 0.05) { qB = qBnew; break; }
      qB = qBnew;
    }
    const R = res;
    step('load', b('بار پایه رفت (استاتیک)','Carrying set load (static)'), 'Ca = a0·(qB+qG)·g', r2(R.Ca,1), 'daN');
    step('load', b('بار رولیک رفت (طراحی)','Carrying roll load (design)'), 'ca = Ca·Fd·Fs·Fm·Fp', r2(R.ca,1), 'daN');
    step('load', b('بار رولیک برگشت','Return roll load'), 'cr = au·qB·g·Fs·Fm·Fp', r2(R.cr,1), 'daN');
    step('res', b('جرم دوار رولیک‌های رفت در متر','Carry rotating mass per metre'), 'qRO = n·m_rot / a0', r2(R.qRO,2), 'kg/m');
    step('res', b('جرم دوار رولیک‌های برگشت در متر','Return rotating mass per metre'), 'qRU = n·m_rot / au', r2(R.qRU,2), 'kg/m');
    step('res', b('جرم تسمه در متر','Belt mass per metre'), 'qB', r2(qB,2), 'kg/m');
    step('res', b('ضریب اصطکاک فرضی','Artificial friction factor'), 'f', R.f, '—');
    step('res', b('ضریب مقاومت‌های فرعی','Secondary resistance coefficient'), 'C (ISO 5048)', r2(R.Ccoef,2), '—');
    step('res', b('مقاومت اصلی','Main resistance'), 'FH = f·Lc·g·[qRO+qRU+(2qB+qG)·cosδ]', r2(R.FH,0), 'N');
    step('res', b('مقاومت‌های فرعی','Secondary resistances'), 'FN = (C−1)·FH', r2(R.FN,0), 'N');
    step('res', b('مقاومت شیب','Slope resistance'), 'FSt = qG·H·g', r2(R.FSt,0), 'N');
    step('res', b('مقاومت بلت کلینرها','Belt cleaner resistance'), 'Σ A·p·μ', r2(R.Fcl,0), 'N');
    step('res', b('مقاومت دیواره ناحیه بارگیری','Skirtboard resistance'), 'μ2·Iv²·ρ·g·l / (v²·b1²)', r2(R.Fsk,0), 'N');
    step('res', b('نیروی محیطی درام محرک','Drive pulley peripheral force'), 'FU = FH + FN + FSt + FS', r2(R.FU,0), 'N');
    step('pow', b('توان روی درام','Power at drive pulley'), 'PA = FU·v', r2(R.PA,2), 'kW');
    step('pow', b('توان لازم موتور','Required motor power'), 'PM = PA / η', r2(R.PMreq,2), 'kW');
    step('ten', b('ضریب اویلر','Euler factor'), 'e^(μ·θ)', r2(R.eu,3), '—');
    step('ten', b('نیروی محیطی راه‌اندازی','Start-up peripheral force'), 'FU,max = FU·kA', r2(R.FUmax,0), 'N');
    step('ten', b('کشش لازم برای انتقال (اویلر)','Min slack tension (Euler)'), 'T2 ≥ FU,max / (e^μθ − 1)', r2(R.T2e,0), 'N');
    step('ten', b('کشش لازم برای شکم‌دادگی رفت (1%)','Min tension for carry sag (1%)'), 'a0·(qB+qG)·g / (8·0.01)', r2(R.Tcs,0), 'N');
    step('ten', b('کشش لازم برای شکم‌دادگی برگشت (2%)','Min tension for return sag (2%)'), 'au·qB·g / (8·0.02)', r2(R.Trs,0), 'N');
    step('ten', b('کشش سمت شل','Slack side tension'), 'T2', r2(R.T2,0), 'N');
    step('ten', b('کشش سمت سفت (کار)','Tight side tension (running)'), 'T1 = T2 + FU', r2(R.T1,0), 'N');
    step('ten', b('کشش سمت سفت (راه‌اندازی)','Tight side tension (start)'), 'T1,max = T2 + FU,max', r2(R.T1s,0), 'N');
    step('ten', b('کشش درام انتهایی','Tail pulley tension'), 'T3 = T2 + F_return', r2(R.Ttail,0), 'N');
    step('belt', b('استحکام لازم تسمه','Required belt strength'), `k = T1,max·S / BW   (S = ${R.SF})`, r2(R.kReq,0), 'N/mm');

    /* ۳) تسمه — مشخصات کامل */
    const bt = R.bt, cv = R.cv, tTot = r2(bt.carcass + cv.top + cv.bot, 1);
    const Dmin = {A: (bt.type === 'ST' ? 145 : 108) * bt.carcass}; Dmin.B = 0.8*Dmin.A; Dmin.C = 0.63*Dmin.A;
    const DA = +ovr.Dhead || ceilTo(Math.max(Dmin.A, 250), PULLEY_STD), DB = ceilTo(Math.max(Dmin.B, 200), PULLEY_STD), DC = ceilTo(Math.max(Dmin.C, 200), PULLEY_STD);
    const takeup = inp.takeup === 'auto' ? (Lc <= 60 ? 'screw' : 'gravity') : inp.takeup;
    const tuTravel = takeup === 'screw' ? Math.max(300, Math.round(Lc*1000*0.01/50)*50) : Math.round(Lc*1000*(bt.type === 'ST' ? 0.005 : 0.015)/50)*50 + 500;
    const step0 = bt.type === 'ST' ? 0 : (bt.ply >= 250 ? 300 : 200), splice = bt.type === 'ST' ? Math.round(600 + bt.k*0.6) : Math.round((bt.plies-1)*step0 + 0.3*bw);
    const beltLen = Math.ceil((2*Lc*1000 + Math.PI*(DA + DB)/2 + (takeup === 'gravity' ? 2*tuTravel : tuTravel) + splice) / 1000);
    const belt = {name:bt.name, type:bt.type, k:bt.k, plies:bt.plies, ply:bt.ply, cord:bt.cord, carcass:bt.carcass, top:cv.top, bot:cv.bot, tTot, grade:cv.grade, qB, len:beltLen, splice, SF:R.SF,
      util: r2(R.kReq/bt.k*100, 0), Dmin, opts:R.opts};

    /* ۴) درام‌ها */
    const face = bw + (bw <= 650 ? 100 : bw <= 1400 ? 150 : 200);
    const wrap = +inp.wrap || 180, phi = (180 - wrap) * DEG;
    const pulleys = [];
    const mkPulley = (key, name, D, Rres, torque, lagging) => {
      const a = 150 + 50*bw/1000, Lb = face + 2*a, M = Rres/2 * a/1000, Tq = torque;
      const dCalc = Math.cbrt(16/(Math.PI*40e6) * Math.sqrt((1.5*M)**2 + (1.0*Tq)**2)) * 1000;
      const brg = PULLEY_BRG.find(x => x[0] >= dCalc) || PULLEY_BRG[PULLEY_BRG.length-1], d = brg[0], dHub = Math.round((d + 15)/5)*5;
      const t = Math.min(25, Math.max(6, Math.ceil(D/50))), td = t + (D >= 630 ? 8 : 6);
      const Lsh = Lb + 2*80 + (torque ? 2*d : 0);
      const mShell = cyl(D, t, face), mDisc = 2 * Math.PI/4 * D*D * td * STEEL_RHO * 0.85, mHub = 2 * (Math.PI/4*((2.2*dHub)**2 - dHub**2) * 0.8*dHub * STEEL_RHO);
      const mShaft = bar(dHub, face) + bar(d, Lsh - face), mLag = lagging ? Math.PI*D*face*lagging.th*1.15e-6 : 0, mBrg = 2 * 0.003 * d*d;
      pulleys.push({key, name, D, face, t, td, d, dHub, dCalc:r2(dCalc,1), Lb:Math.round(Lb), Lsh:Math.round(Lsh), R:Rres, M, Tq, brg:brg[1], sleeve:brg[2], housing:brg[3],
        lag:lagging, mShell, mDisc, mHub, mShaft, mLag, mBrg, mass:mShell+mDisc+mHub+mShaft+mLag+mBrg, drive:!!torque,
        lock: b(`رینگ قفلی (Locking assembly) برای Ø${dHub}`,`Locking assembly for Ø${dHub}`), key6885: torque ? `DIN 6885 — ${d<=50?'14×9':d<=65?'18×11':d<=85?'22×14':d<=110?'28×16':'32×18'}` : '—'});
    };
    const Rdrive = Math.sqrt(R.T1s**2 + R.T2**2 + 2*R.T1s*R.T2*Math.cos(phi));
    mkPulley('drive', b('درام محرک (سر)','Drive (head) pulley'), DA, Rdrive, R.FUmax*DA/2000, R.lag.th ? R.lag : LAGGING.rubber);
    mkPulley('tail', b('درام انتهایی (دم)','Tail pulley'), DB, 2*R.Ttail, 0, inp.lagAll ? {th:10} : null);
    if (wrap > 180) mkPulley('snub', b('درام برگردان (اسناب)','Snub pulley'), DC, 2*R.T2*Math.sin((wrap-180)/2*DEG), 0, inp.lagAll ? {th:10} : null);
    if (takeup === 'gravity'){
      mkPulley('tu', b('درام کشش (وزنه‌ای)','Take-up pulley (gravity)'), DB, 2*R.T2, 0, null);
      mkPulley('bend1', b('درام خم ۱ (کشش)','Bend pulley 1 (take-up)'), DC, 2*R.T2*Math.sin(45*DEG), 0, null);
      mkPulley('bend2', b('درام خم ۲ (کشش)','Bend pulley 2 (take-up)'), DC, 2*R.T2*Math.sin(45*DEG), 0, null);
    }
    const tuForce = takeup === 'gravity' ? 2*R.T2 : 2*R.Ttail;
    if (DA < Dmin.A) warn('قطر درام محرک از کمینه توصیه‌شده تسمه کمتر است.', 'Drive pulley diameter is below the belt minimum.');

    /* ۵) محرک: موتور و گیربکس */
    const Pm = +ovr.motor || (MOTORS.find(m => m[0] >= R.PMreq * 1.1) || MOTORS[MOTORS.length-1])[0];
    const mot = MOTORS.find(m => m[0] === Pm) || MOTORS[MOTORS.length-1];
    const n2 = v * 60000 / (Math.PI * DA), iReq = mot[2] / n2, iSel = +ovr.ratio || GEAR_RATIOS.reduce((p,c) => Math.abs(c-iReq) < Math.abs(p-iReq) ? c : p);
    const vAct = Math.PI * DA * mot[2] / iSel / 60000, T2g = 9550 * Pm / (mot[2]/iSel);
    const sfG = (inp.fs ?? 2) >= 2 ? 1.5 : 1.25, gbRating = T2g * sfG * (inp.lump >= 3 ? 1.15 : 1);
    const backstop = R.FSt > 0.5 * (R.FH + R.FN), bsTorque = backstop ? (R.FSt - 0.5*(R.FH+R.FN)) * DA/2000 * 1.5 : 0;
    const brake = H < 0 && Math.abs(R.FSt) > (R.FH + R.FN);
    const mGB = 20 + 0.025 * Math.pow(gbRating, 0.9);
    const drive = {Pm, frame:mot[1], rpm:mot[2], mMotor:mot[3], n2, iReq, iSel, vAct, T2g, sfG, gbRating, backstop, bsTorque, brake, mGB,
      start: START[inp.start || 'soft'].t, coupling: Pm >= 30 && inp.start !== 'vfd' ? b('کوپلینگ هیدرولیک (Fluid coupling)','Fluid coupling') : b('کوپلینگ انعطاف‌پذیر (Flexible)','Flexible coupling'),
      motorType: b(`موتور القایی سه‌فاز IE3، ۴ قطب، IP55، کلاس عایق F، بدنه ${mot[1]}`,`3-phase induction motor IE3, 4-pole, IP55, insulation class F, frame ${mot[1]}`),
      gbType: b('گیربکس هلیکال-بول (Helical-bevel) شفت‌توخالی یا پایه‌دار','Helical-bevel gearbox, hollow-shaft or foot-mounted')};
    step('drv', b('دور درام محرک','Drive pulley speed'), 'n2 = v·60000 / (π·D)', r2(n2,1), 'rpm');
    step('drv', b('نسبت دنده لازم','Required gear ratio'), 'i = n1 / n2', r2(iReq,2), '—');
    step('drv', b('گشتاور خروجی گیربکس','Gearbox output torque'), 'T2 = 9550·P / n2', r2(T2g,0), 'N·m');
    if (R.PMreq*1.1 > MOTORS[MOTORS.length-1][0]) warn('توان لازم از بزرگ‌ترین موتور فهرست بیشتر است؛ محرک چندگانه (دو یا چند موتور) لازم است.', 'Required power exceeds the largest listed motor; a multiple-drive arrangement is needed.');
    if (R.kReq > R.bt.k) warn('هیچ تسمه‌ای در فهرست استحکام کافی ندارد؛ تسمه سیم‌فولادی (ST) یا محرک چندگانه را بررسی کنید.', 'No listed belt is strong enough; consider steel cord (ST) or multiple drives.');
    if (Math.abs(vAct - v)/v > 0.05) warn('سرعت واقعی با نسبت استاندارد بیش از ۵٪ با سرعت طراحی فرق دارد.', 'Actual speed with the standard ratio differs by more than 5%.');

    /* ۶) بلت کلینرها — محصولات آسارول */
    const bladeSec = inp.secBlade || (v > 3.5 || (mat && mat.abr === 'C') ? 'tc' : v > 2.5 ? 'cer' : 'pu');
    const cleaners = [{key:'prim', name:b('بلت کلینر اولیه ASA-PC','Primary belt cleaner ASA-PC'), qty:R.nPrim,
        spec:b(`تیغه یکپارچه پلی‌یورتان (85–90 Shore A)، طول تیغه ${bw-100} mm، نصب روی درام سر، کشش فنری/پیچشی`,`Single polyurethane blade (85–90 Shore A), blade length ${bw-100} mm, on head pulley, spring/torsion tensioner`), mass: 15 + 20*bw/1000}];
    if (R.nSec) cleaners.push({key:'sec', name:b('بلت کلینر ثانویه ASA-SC','Secondary belt cleaner ASA-SC'), qty:R.nSec,
        spec:b(`تیغه‌های چندقطعه‌ای ${bladeSec==='tc'?'کاربید تنگستن':bladeSec==='cer'?'سرامیکی':'پلی‌یورتان'} روی بستر الاستیک، ${Math.ceil((bw-100)/150)} قطعه، بلافاصله پس از درام سر`,`Segmented ${bladeSec==='tc'?'tungsten-carbide':bladeSec==='cer'?'ceramic':'polyurethane'} blades on elastic mounts, ${Math.ceil((bw-100)/150)} segments, just after head pulley`), mass: 20 + 25*bw/1000});
    cleaners.push({key:'plough', name:b('تمیزکننده V (پلاو) ASA-VP','V-plough cleaner ASA-VP'), qty:R.nPlough,
        spec:b('تیغه لاستیکی/پلی‌یورتان 20 mm در قاب V؛ جلوی درام دم' + (R.nPlough > 1 ? ' و جلوی درام کشش' : ''),'Rubber/PU 20 mm blade in a V frame; ahead of tail pulley' + (R.nPlough > 1 ? ' and take-up pulley' : '')), mass: 8 + 15*bw/1000});

    /* ۷) رولیک‌ها و پایه‌ها — مشخصات کامل */
    const thick = d => d >= 40 ? 10 : d >= 30 ? 8 : 6;
    const unpCross = bw <= 800 ? 80 : bw <= 1400 ? 100 : 120;
    const sC = rollerSpec(R.pickC.T, R.pickC.row, {cap:r2(R.pickC.cap,0), load:r2(R.ca,0), rpm:r2(R.pickC.rpm,0)});
    const sR = rollerSpec(R.pickR.T, R.pickR.row, {cap:r2(R.pickR.cap,0), load:r2(R.cr,0), rpm:r2(R.pickR.rpm,0)});
    /* رولیک برگشت لاستیکی در صورت چسبندگی */
    let ringRet = null;
    if (inp.sticky){
      const lst = (rarr === 'v2' ? NC : NL).filter(g => g.b.some(x => x[0] === sR.ser || x[1] === sR.D));
      const g = lst.find(gg => gg.b.some(x => x[1] === sR.D)) || lst[0];
      const row = g && g.r.find(rw => rw[0] === bw);
      if (row){ const isNC = rarr === 'v2'; const [, C2, a, bb, ...rest] = row; const side = isNC ? rest[2] : rest[1], central = isNC ? rest[3] : rest[2];
        ringRet = {des: isNC ? 'NC' : 'NL', oe:g.oe, ri:sR.D, E:g.E, E1:g.E1, side, central, a, b:bb, t: isNC ? rest[1] : rest[0], radial: r2((g.oe - sR.D)/2,1), C:C2,
          total: isNC ? side + central : 2*side + central, comp: b('NR 60 ± 5 Shore A','NR 60 ± 5 Shore A'),
          massRing: Math.PI/4*(g.oe**2 - sR.D**2) * 1.15e-6 * ((isNC ? side : 2*side)*(g.E1||g.E) + central*g.E) / (isNC ? side + central : 2*side + central)}; }
    }
    /* ضربه‌گیر */
    let imp = null;
    { const T = CATALOG_NA.find(t => t.oe >= sC.D + 40 && t.base.some(x => x[0] === sC.ser)) || CATALOG_NA.find(t => t.oe >= sC.D + 40) || CATALOG_NA[CATALOG_NA.length-1];
      const bi = Math.max(0, T.base.findIndex(x => x[0] === sC.ser)), [ser, D, s] = T.base[bi], idx = arr === 'flat' ? 1 : arr === 'v2' ? 2 : 3;
      const row = T.rows.find(rw => rw[idx] === bw);
      if (row){ const Bi = row[0], S = SER[ser] || {}; imp = {ser, asa:asaSer(ser), D, s, oe:T.oe, E:T.E, B:Bi, C:Bi+8, A:Bi+(S.addA||26), d:S.d, ch:S.ch, brg:S.brg, wt: row[4+bi] || null,
        rings: Math.floor(Bi/T.E), radial: r2((T.oe - D)/2,1), comp: b('NR 60 ± 5 Shore A، رینگ تخت ET','NR 60 ± 5 Shore A, flat rings ET'),
        code:`${asaSer(ser)}·${S.d}${S.fl||'F'}·${T.oe}${asaDes('NA')}·${Bi+8}`, eq:`${ser},${S.d}${S.fl||'F'},${T.oe}NA,${Bi+8}`}; } }
    const hOuter = Math.round(0.45 * sC.B * Math.sin(lam*DEG) + 120), hInner = 120;
    const frameT3 = () => { const t = thick(sC.d), parts = [
        [b('تیر عرضی','Cross member'), `UNP ${unpCross} × ${bw+350}`, UNP[unpCross]*(bw+350)/1000],
        [b('براکت بیرونی ×2','Outer brackets ×2'), `PL ${t}×70×${hOuter}`, 2*plate(70, hOuter, t)],
        [b('براکت داخلی ×2','Inner brackets ×2'), `PL ${t}×70×${hInner}`, 2*plate(70, hInner, t)],
        [b('پشت‌بند بال (نبشی) ×2','Wing supports (angle) ×2'), `L50×5 × ${Math.round(sC.B*0.9)}`, 2*ANGLE['L50x5']*sC.B*0.9/1000],
        [b('صفحه پایه ×2','Foot plates ×2'), 'PL 8×100×150', 2*plate(100,150,8)]];
      return {parts, mass: parts.reduce((s,p) => s+p[2], 0)}; };
    const frameRet = () => { const parts = rarr === 'v2' ? [
        [b('نبشی عرضی','Cross angle'), `L60×6 × ${bw+300}`, ANGLE['L60x6']*(bw+300)/1000], [b('آویز ×3','Hangers ×3'), 'PL 8×70×250', 3*plate(70,250,8)]]
        : [[b('براکت آویز ×2','Drop brackets ×2'), 'L60×6 × 250', 2*ANGLE['L60x6']*0.25], [b('پیچ و مهره','Bolts & nuts'), 'M12 ×4', 0.3]];
      return {parts, mass: parts.reduce((s,p) => s+p[2], 0)}; };
    const fT3 = frameT3(), fR = frameRet();
    const idlers = [
      {key:'carry', name:b('پایه رفت','Carrying idler set'), arr, lam, qty:nCarry, rolls:R.nRollC, roller:sC, frame:fT3, frameMass:fT3.mass},
      {key:'trans', name:b('پایه انتقالی (زاویه قابل تنظیم)','Transition idler set (adjustable)'), arr, lam, qty:nTr, rolls:R.nRollC, roller:sC, frame:fT3, frameMass:fT3.mass*1.1},
      {key:'impact', name:b('پایه ضربه‌گیر','Impact idler set'), arr, lam, qty:nImp, rolls:R.nRollC, roller:imp, frame:fT3, frameMass:fT3.mass*1.5, impact:true},
      {key:'trainC', name:b('پایه خودتنظیم رفت','Carrying training idler'), arr, lam, qty:nTrainC, rolls:R.nRollC, roller:sC, frame:fT3, frameMass:fT3.mass*1.6 + 8 + 10*bw/1000, train:true},
      {key:'ret', name:b('پایه برگشت','Return idler set'), arr:rarr, qty:nRet, rolls:R.nRollR, roller:sR, frame:fR, frameMass:fR.mass, ring:ringRet},
      {key:'trainR', name:b('پایه خودتنظیم برگشت','Return training idler'), arr:rarr, qty:nTrainR, rolls:R.nRollR, roller:sR, frame:fR, frameMass:fR.mass*2 + 8, train:true}
    ].filter(x => x.qty > 0);

    /* ۸) سازه و متعلقات */
    const unpS = bw <= 650 ? 100 : bw <= 800 ? 120 : bw <= 1200 ? 140 : bw <= 1600 ? 160 : 200;
    const hLeg = +inp.hLeg || 1.0, nSup = Math.ceil(Lc / 3) + 1;
    const head = pulleys.find(p => p.key === 'drive'), tail = pulleys.find(p => p.key === 'tail');
    const struct = [
      [b('شاسی طولی (استرینگر) ×2','Stringers ×2'), `UNP ${unpS} × ${Lc} m ×2`, 2*Lc*UNP[unpS]],
      [b('بادبند عرضی هر ۳ متر','Cross braces every 3 m'), `L50×5 × ${bw+400} × ${nSup}`, nSup*ANGLE['L50x5']*(bw+400)/1000],
      [b('پایه‌های نگهدارنده هر ۳ متر','Support legs every 3 m'), `UNP 100 × ${hLeg} m ×2 + L50×5 × ${nSup}`, nSup*(2*hLeg*UNP[100] + ANGLE['L50x5']*((bw+400)/1000 + 1.4*hLeg))],
      [b('شاسی سر (درام محرک)','Head frame'), b('ورق و ناودانی','Plates & channels'), 120 + 0.35*head.mass + 0.02*R.T1s/G],
      [b('شاسی دم','Tail frame'), b('ورق و ناودانی','Plates & channels'), 80 + 0.3*tail.mass],
      [b('شاسی محرک (پایه موتور و گیربکس)','Drive base frame'), b('ورق و ناودانی','Plates & channels'), 40 + 0.4*mGB],
      [b('دیواره ناحیه بارگیری ×2','Skirtboards ×2'), `PL 6×350 + rubber 10×150 × ${Ls} m`, 2*Ls*(16.5 + 1.7)*1.2],
      [b('شوت بارگیری','Loading chute'), 'PL 8', 120*bw/1000]];
    if (+inp.walk > 0) struct.push([b('راهرو سرویس (گریتینگ + نرده)','Service walkway (grating + handrail)'), `${inp.walk} × ${Lc} m`, +inp.walk * Lc * (0.8*30 + 12)]);
    if (+inp.cover > 0) struct.push([b('پوشش (کاور) نوار','Belt covers'), `0.7 mm × ${inp.cover}%`, Math.PI*(bw+300)/2000 * Lc * inp.cover/100 * 0.7*7.85]);
    const structMass = struct.reduce((s,p) => s+p[2], 0);
    struct.push([b('پیچ، مهره و متفرقه (۳٪)','Bolts, nuts & misc. (3%)'), '3%', 0.03*structMass]);
    const takeupObj = {type:takeup, travel:tuTravel, force:tuForce, cw: takeup === 'gravity' ? tuForce/G : 0,
      mass: takeup === 'screw' ? 20 + 30*bw/1000 : 300 + 400*bw/1000,
      name: takeup === 'screw' ? b('کشش‌دهنده پیچی در دم','Screw take-up at tail') : b('کشش‌دهنده وزنه‌ای عمودی نزدیک سر','Vertical gravity take-up near head')};

    /* ۹) لیست قطعات و شکست وزن */
    const bom = [], add = (id, cat, item, spec, qty, unit) => bom.push({id, cat, item, spec, qty, unit, total: qty*unit});
    idlers.forEach(I => { const rr = I.roller; if (!rr) return;
      const rMass = I.impact ? (rr.wt || 0) : (I.ring ? (rr.wt + I.ring.total*I.ring.massRing) : rr.wt);
      add('r_'+I.key, 'idl', b(`رولیک — ${I.name.fa}`,`Rollers — ${I.name.en}`), `${rr.code} (${rr.eq})`, I.qty*I.rolls, rMass);
      add('f_'+I.key, 'frm', b(`قاب — ${I.name.fa}`,`Frame — ${I.name.en}`), {fa:ARR[I.arr].fa+(I.lam&&I.arr!=='flat'?` ${I.lam}°`:''), en:ARR[I.arr].en+(I.lam&&I.arr!=='flat'?` ${I.lam}°`:'')}, I.qty, I.frameMass); });
    pulleys.forEach(p => add('p_'+p.key, 'pul', p.name, {fa:`Ø${p.D} × ${p.face} · شافت Ø${p.d}/${p.dHub}`, en:`Ø${p.D} × ${p.face} · shaft Ø${p.d}/${p.dHub}`}, 1, p.mass));
    add('belt', 'blt', b('تسمه نقاله','Conveyor belt'), `${belt.name} ${cv.top}+${cv.bot} · ${bw} mm`, belt.len, qB);
    cleaners.forEach(c => add('c_'+c.key, 'cln', c.name, '', c.qty, c.mass));
    add('tu', 'tku', takeupObj.name, {fa:`کورس ${tuTravel} mm`, en:`travel ${tuTravel} mm`}, 1, takeupObj.mass);
    if (takeupObj.cw) add('cw', 'tku', b('وزنه تعادل (بتن/فولاد)','Counterweight (concrete/steel)'), `${r2(takeupObj.cw,0)} kg`, 1, takeupObj.cw);
    add('gb', 'drv', b('گیربکس','Gearbox'), `i = ${iSel} · ${r2(gbRating/1000,1)} kN·m`, 1, mGB);
    add('cpl', 'drv', drive.coupling, '', 1, 0.04*mGB + 10);
    if (backstop) add('bs', 'drv', b('ضد برگشت (Backstop)','Backstop'), `${r2(bsTorque/1000,1)} kN·m`, 1, 15 + 0.02*bsTorque);
    struct.forEach((p,i) => add('s_'+i, 'str', p[0], p[1], 1, p[2]));
    const CAT = {idl:b('رولیک‌ها','Rollers'), frm:b('قاب پایه‌ها','Idler frames'), pul:b('درام‌ها','Pulleys'), blt:b('تسمه','Belt'), cln:b('بلت کلینرها','Belt cleaners'), tku:b('کشش‌دهنده','Take-up'), drv:b('محرک مکانیکی','Mechanical drive'), str:b('سازه و متعلقات','Structure & accessories')};
    return {inp, ovr, mat, rho, beta, L:Lc, H, delta, lam, arr, rarr, Q, v, bw, cap, fill, qG, qB, a0, au, Ls, Lt, nImp, nTr, nCarry, nRet, nTrainC, nTrainR,
      fd, Fs, Fm, fpC, fpR, R, belt, pulleys, face, drive, cleaners, idlers, sC, sR, imp, ringRet, struct, takeup:takeupObj, bom, CAT, steps, W, hOuter, unpS};
  }
  return {design, rollerCandidates, beltOptions, r2};
})();
