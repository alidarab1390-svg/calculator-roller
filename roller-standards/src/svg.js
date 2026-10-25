/* ═══ تصاویر فنی (SVG سه‌بعدی‌نما) — با سایه و نور؛ ابعاد از ردیف انتخابی ═══
   Pseudo-3D technical illustrations; dimensions follow the selected row. */
const SV = (() => {
  const C = {ink:'#3b1f47', acc:'#e8820c', bg:'#fbfaf8'};
  let UID = 0;
  const defsBase = `<marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.ink}"/></marker>
    <style>.dl{font:600 12px Tahoma,Arial,sans-serif;fill:${C.ink}}.sm{font:11px Tahoma,Arial,sans-serif;fill:#5c4a66}</style>`;
  /* هر تصویر گرادیان‌های خودش را دارد تا شناسه‌ها تداخل نکنند */
  function Pal(){
    const u = 'u' + (++UID), D = [];
    const lin = (id, stops, vert=true) => { D.push(`<linearGradient id="${u+id}" x1="0" y1="0" x2="${vert?0:1}" y2="${vert?1:0}">${stops.map(([o,c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`); return `url(#${u+id})`; };
    const rad = (id, stops) => { D.push(`<radialGradient id="${u+id}" cx=".38" cy=".35" r=".75">${stops.map(([o,c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`); return `url(#${u+id})`; };
    const P = {
      steel: lin('st', [[0,'#6f6a75'],[.12,'#bdb8c2'],[.3,'#f7f6f8'],[.46,'#d5d1d9'],[.72,'#8c8692'],[1,'#5b5660']]),
      paint: lin('pt', [[0,'#56305f'],[.25,'#8a5a95'],[.42,'#b58bbf'],[.7,'#5d3567'],[1,'#3a1f42']]),
      shaft: lin('sh', [[0,'#7d7883'],[.3,'#ffffff'],[.55,'#c7c3cc'],[1,'#66616c']]),
      rub:   lin('rb', [[0,'#0d0d0d'],[.28,'#3d3d3d'],[.4,'#575757'],[.6,'#262626'],[1,'#080808']]),
      pu:    lin('pu', [[0,'#7a5a05'],[.3,'#e8be3c'],[.45,'#f7dc7b'],[.7,'#b88c12'],[1,'#6b4d03']]),
      poly:  lin('po', [[0,'#3b5d7a'],[.3,'#8fb4d1'],[.45,'#c4dbee'],[.75,'#55799a'],[1,'#2f4a62']]),
      chan:  lin('ch', [[0,'#3b3740'],[.4,'#6c6772'],[1,'#2a272e']]),
      flange:lin('fl', [[0,'#a59fab'],[1,'#77717d']]),
      face:  rad('fc', [[0,'#ffffff'],[.6,'#cfcbd4'],[1,'#8e8894']]),
      rface: rad('rf', [[0,'#5a5a5a'],[1,'#151515']]),
      hole:  rad('ho', [[0,'#111'],[1,'#3a3a3a']]),
      belt:  lin('bt', [[0,'#3a3a3a'],[.5,'#1c1c1c'],[1,'#0a0a0a']]),
      shadow:rad('sd', [[0,'rgba(0,0,0,.28)'],[1,'rgba(0,0,0,0)']])
    };
    P.defs = () => D.join('');
    return P;
  }
  const wrap = (w, h, P, g) => `<svg class="sv" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" direction="ltr"><defs>${defsBase}${P.defs()}</defs><rect width="${w}" height="${h}" fill="${C.bg}"/>${g}</svg>`;
  const hdim = (x1,x2,y,lab) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.ink}" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="${(x1+x2)/2}" y="${y-5}" text-anchor="middle" class="dl">${lab}</text>`;
  const vd = (x,y1,y2,lab,end) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${C.ink}" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="${x+(end?-6:6)}" y="${(y1+y2)/2+4}" text-anchor="${end?'end':'start'}" class="dl">${lab}</text>`;
  const n = v => (v===null||v===undefined||v==='') ? null : +v;
  const f1 = v => Math.round(v*10)/10;

  /* استوانه افقی با پیشانی بیضوی (side: سمت دیده‌شده) */
  function cyl(P, x1, x2, cy, R, fill, face, side='right'){
    const rx = Math.max(2, R*0.3);
    if (x2 - x1 < 0.5) return '';
    const body = side === 'right'
      ? `M${f1(x1)},${f1(cy-R)} L${f1(x2)},${f1(cy-R)} L${f1(x2)},${f1(cy+R)} L${f1(x1)},${f1(cy+R)} A${f1(rx)},${f1(R)} 0 0 1 ${f1(x1)},${f1(cy-R)} Z`
      : `M${f1(x2)},${f1(cy-R)} L${f1(x1)},${f1(cy-R)} L${f1(x1)},${f1(cy+R)} L${f1(x2)},${f1(cy+R)} A${f1(rx)},${f1(R)} 0 0 0 ${f1(x2)},${f1(cy-R)} Z`;
    const fx = side === 'right' ? x2 : x1;
    return `<path d="${body}" fill="${fill}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>` +
      (face ? `<ellipse cx="${f1(fx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(R)}" fill="${face}" stroke="rgba(0,0,0,.4)" stroke-width=".8"/>` : '');
  }
  /* پیشانی رولیک: لوله، درپوش، آب‌بند، شافت */
  function endCap(P, x, cy, R, rs){
    const rx = R*0.3, e = (k, fill, sw) => `<ellipse cx="${f1(x)}" cy="${f1(cy)}" rx="${f1(rx*k)}" ry="${f1(R*k)}" fill="${fill}" stroke="rgba(0,0,0,.45)" stroke-width="${sw||.7}"/>`;
    return e(1, P.face) + e(.86, '#a29ca8') + e(.7, P.face) + e(.5, '#26303d') + e(.38, '#3c4a5c') + e(Math.max(rs/R, .12), P.shaft, .8);
  }
  /* رینگ لاستیکی: تخت (استوانه) یا نوک‌تیز/خم */
  function ringArt(P, xc, w, cy, Rr, Rt, flat, fill){
    if (flat) return cyl(P, xc - w/2, xc + w/2, cy, Rr, fill || P.rub, P.rface);
    const x = xc - w/2, rx = Rr*0.3;
    return `<path d="M${f1(x)},${f1(cy-Rt)} Q${f1(xc)},${f1(cy-Rr-4)} ${f1(x+w)},${f1(cy-Rt)} L${f1(x+w)},${f1(cy+Rt)} Q${f1(xc)},${f1(cy+Rr+4)} ${f1(x)},${f1(cy+Rt)} Z" fill="${fill || P.rub}" stroke="rgba(0,0,0,.5)" stroke-width=".7"/>` +
      `<ellipse cx="${f1(xc)}" cy="${f1(cy)}" rx="${f1(Math.min(rx, w/2))}" ry="${f1(Rr)}" fill="none" stroke="rgba(255,255,255,.18)"/>`;
  }

  /* ─── رولیک کامل ─── */
  function rollerArt(P, r, o){
    const {cx, cy, sx, hD} = o;
    const B=n(r.B)||600, A=n(r.A)||B+26, Cc=n(r.C)||B+8, D=n(r.D)||n(r.oe)||89, d=n(r.d)||20, oe=n(r.oe)||0;
    const R = hD/2, rs = Math.max(6, R*d/D*1.1), Rr = oe ? Math.min(o.maxR||200, R*oe/D) : 0;
    const X = v => cx - v*sx/2, x1 = X(B), x2 = X(-B);
    let g = '';
    g += `<ellipse cx="${cx}" cy="${cy+Math.max(R,Rr)+14}" rx="${f1(A*sx/2+20)}" ry="10" fill="${P.shadow}"/>`;
    /* شافت پشت (چپ) */
    const flL = (A-Cc)/2*sx;
    g += cyl(P, X(A), x1+4, cy, rs, P.shaft, null);
    g += `<rect x="${f1(X(A))}" y="${f1(cy-rs*0.55)}" width="${f1(flL+2)}" height="${f1(rs*1.1)}" fill="rgba(255,255,255,.45)" stroke="rgba(0,0,0,.25)"/>`;
    const tubeFill = r.mat === 'pvc' ? P.poly : P.steel;
    if (r.cat === 'cage'){
      for (let x = x1; x < x2; x += 12) g += `<path d="M${f1(x)},${f1(cy-Rr)} C${f1(x+10)},${f1(cy-Rr*0.3)} ${f1(x+10)},${f1(cy+Rr*0.3)} ${f1(x)},${f1(cy+Rr)}" stroke="#4d4852" stroke-width="3.2" fill="none"/>`;
      g += cyl(P, x1, x1+10, cy, Rr*0.55, P.steel, P.face, 'left') + cyl(P, x2-10, x2, cy, Rr*0.55, P.steel, P.face);
    } else g += cyl(P, x1, x2, cy, R, tubeFill, null);
    /* رینگ‌ها */
    if (r.cat === 'impact' && oe){
      const E = n(r.E)||35, k = Math.min(n(r.total)||Math.floor(B/E), 90), w = E*sx, x0 = cx - k*w/2;
      for (let i = 0; i < k; i++) g += ringArt(P, x0+w*i+w/2, w-0.6, cy, Rr, R, true);
    }
    if ((r.cat === 'retring' || r.cat === 'retv') && oe){
      const t=n(r.t)||B-40, side=n(r.side)||2, cen=n(r.central)||0, E1=n(r.E1)||n(r.E)||25, E=n(r.E)||25, a=n(r.a)||side*E1, bb=n(r.b)||((t-2*a)/(cen+1));
      const sF = r.sideT === 'ET', cF = r.cenT === 'ET', L = cx - t*sx/2, Rx = cx + t*sx/2;
      const items = [];
      for (let i = 0; i < side; i++){ items.push([L+(E1*i+E1/2)*sx, E1*sx-0.6, sF]); if (r.cat !== 'retv') items.push([Rx-(E1*i+E1/2)*sx, E1*sx-0.6, sF]); }
      const span = (cen-1)*bb, c0 = r.cat === 'retv' ? (L+a*sx+bb*sx) : cx-span*sx/2;
      for (let i = 0; i < cen; i++) items.push([c0+i*bb*sx, E*sx, cF]);
      items.sort((p,q) => p[0]-q[0]).forEach(([xc,w,fl]) => g += ringArt(P, xc, w, cy, Rr, R+1, fl));
      if (o.dims){ const yT = cy-Rr-12; g += hdim(L,Rx,yT-20,'t = '+t) + hdim(L,L+a*sx,yT,'a = '+a);
        if (cen > 1) g += hdim(c0,c0+bb*sx,cy+Rr+18,'b = '+Math.round(bb));
        g += `<text x="${f1(L+E1*sx/2)}" y="${f1(cy+Rr+36)}" text-anchor="middle" class="dl">${r.sideT||'ET'}=${E1}</text><text x="${f1(c0)}" y="${f1(cy+Rr+36)}" text-anchor="middle" class="dl">${r.cenT||'ER'}=${E}</text>`; }
    }
    if (r.cat === 'helix' && oe){
      const p = 38.5*sx, Lh = n(r.L)||B*0.9, x0 = cx - Lh*sx/2;
      for (let x = x0; x < x0+Lh*sx-2; x += p) g += `<path d="M${f1(x)},${f1(cy-Rr)} C${f1(x+p*0.55)},${f1(cy-Rr*0.4)} ${f1(x+p*0.25)},${f1(cy+Rr*0.4)} ${f1(x+p*0.8)},${f1(cy+Rr)}" stroke="#141414" stroke-width="${f1(Math.max(4,p*0.42))}" stroke-linecap="round" fill="none"/>` +
        `<path d="M${f1(x)},${f1(cy-Rr)} C${f1(x+p*0.55)},${f1(cy-Rr*0.4)} ${f1(x+p*0.25)},${f1(cy+Rr*0.4)} ${f1(x+p*0.8)},${f1(cy+Rr)}" stroke="rgba(255,255,255,.18)" stroke-width="1.4" fill="none" transform="translate(-1,-2)"/>`;
      if (o.dims && n(r.L)) g += hdim(x0, x0+Lh*sx, cy+Rr+20, 'L = '+r.L);
    }
    if (r.cat === 'lag') g += cyl(P, x1+4, x2-4, cy, R*1.18, P.rub, null);
    /* پیشانی راست + شافت جلو */
    if (r.cat !== 'cage') g += endCap(P, x2, cy, R, rs);
    g += cyl(P, x2, X(-A), cy, rs, P.shaft, P.face);
    g += `<rect x="${f1(X(-A)-flL-2)}" y="${f1(cy-rs*0.55)}" width="${f1(flL+2)}" height="${f1(rs*1.1)}" fill="rgba(255,255,255,.5)" stroke="rgba(0,0,0,.25)"/>`;
    return {g, x1, x2, X, R, Rr, rs, A, B, Cc, D, d, oe};
  }
  function roller(r){
    const P = Pal(), W = 840, ringy = !!r.oe, H = ringy ? 330 : 260, cx = W/2 - 10, cy = H/2 - 26;
    const B=n(r.B)||600, A=n(r.A)||B+26, D=n(r.D)||n(r.oe)||89;
    const sx = Math.min(640/A, 1.6), hD = Math.max(50, Math.min(96, D*0.95));
    const a = rollerArt(P, r, {cx, cy, sx, hD, dims:true, maxR:(H-150)/2});
    let g = a.g;
    const yb = H - 14;
    g += hdim(a.X(A), a.X(-A), yb, 'A = '+A) + hdim(a.X(a.Cc), a.X(-a.Cc), yb-24, 'C = '+a.Cc);
    if (!(r.cat === 'retring' || r.cat === 'retv')) g += hdim(a.x1, a.x2, cy-Math.max(a.R,a.Rr)-16, 'B = '+B); else g += hdim(a.x1, a.x2, yb-48, 'B = '+B);
    if (r.cat !== 'cage') g += vd(a.X(A)-14, cy-a.R, cy+a.R, 'ØD '+a.D+(r.s?' × '+r.s:''), true);
    g += `<text x="${f1(a.X(A))}" y="${f1(cy+Math.max(a.R,a.Rr)+(r.cat==='helix'?40:18))}" class="dl">d ${a.d}${r.ch?'  ch '+r.ch:''}</text>`;
    if (a.oe) g += vd(a.x2+a.R*0.3+18, cy-a.Rr, cy+a.Rr, 'øe '+a.oe);
    if (r.brg) g += `<text x="${f1(a.X(-A))}" y="${f1(cy+Math.max(a.R,a.Rr)+(r.cat==='helix'?40:18))}" text-anchor="end" class="sm">${r.brg}</text>`;
    return wrap(W, H, P, g);
  }

  /* ─── لوله ─── */
  function pipe(D, s, label){
    D = D||89; s = s||3; const P = Pal(), W = 420, H = 270, cy = 120, R = 78, ri = Math.max(18, R*(D-2*s)/D), rx = R*0.32;
    const fill = /PVC|PE|PA|UHMW|HDPE/i.test(label||'') ? P.poly : P.steel;
    let g = `<ellipse cx="230" cy="${cy+R+16}" rx="160" ry="10" fill="${P.shadow}"/>`;
    g += cyl(P, 100, 300, cy, R, fill, null);
    g += `<ellipse cx="300" cy="${cy}" rx="${f1(rx)}" ry="${R}" fill="${P.face}" stroke="rgba(0,0,0,.45)"/>`;
    g += `<ellipse cx="300" cy="${cy}" rx="${f1(rx*ri/R)}" ry="${f1(ri)}" fill="${P.hole}" stroke="rgba(0,0,0,.6)"/>`;
    g += vd(80, cy-R, cy+R, 'ØD '+D, true);
    g += `<text x="${f1(300+rx+10)}" y="${cy-R+18}" class="dl">s ${s}</text><text x="${f1(300+rx+10)}" y="${cy+6}" class="dl">Ødi ${+(D-2*s).toFixed(1)}</text>`;
    if (label) g += `<text x="210" y="${H-12}" text-anchor="middle" class="sm">${label}</text>`;
    return wrap(W, H, P, g);
  }

  /* ─── انواع سر شافت ─── */
  function shaftEnd(k){
    const P = Pal(), W = 560, H = 230, cy = 110, R = 26;
    let g = `<ellipse cx="300" cy="${cy+86}" rx="230" ry="9" fill="${P.shadow}"/>`;
    /* لوله رولیک در پس‌زمینه */
    g += cyl(P, 330, 540, cy, 72, P.steel, null, 'left');
    g += `<ellipse cx="330" cy="${cy}" rx="${72*0.3}" ry="72" fill="${P.face}" stroke="rgba(0,0,0,.45)"/><ellipse cx="330" cy="${cy}" rx="${72*0.3*0.6}" ry="${72*0.6}" fill="#26303d"/>`;
    const sh = (x1, x2, r2, fill) => cyl(P, x1, x2, cy, r2, fill || P.shaft, P.face, 'left');
    if (k === 'flat'){
      g += sh(70, 336, R);
      g += `<path d="M70,${cy-R*0.62} L170,${cy-R*0.62} L170,${cy-R} L78,${cy-R} Z" fill="rgba(255,255,255,.75)" stroke="rgba(0,0,0,.3)"/><path d="M70,${cy+R*0.62} L170,${cy+R*0.62} L170,${cy+R} L78,${cy+R} Z" fill="rgba(0,0,0,.25)"/>`;
      g += vd(52, cy-R*0.62, cy+R*0.62, 'ch', true) + hdim(70, 170, cy-R-12, 'g');
    }
    if (k === 'circlip'){
      g += sh(70, 336, R) + `<rect x="118" y="${cy-R}" width="8" height="${2*R}" fill="#333"/>`;
      g += `<path d="M122,${cy-R-6} A9,${R+6} 0 1 0 122,${cy+R+6}" fill="none" stroke="#1d1d1d" stroke-width="6"/><circle cx="118" cy="${cy-R-6}" r="4" fill="#1d1d1d"/><circle cx="118" cy="${cy+R+6}" r="4" fill="#1d1d1d"/>`;
      g += `<text x="122" y="${cy-R-18}" text-anchor="middle" class="dl">DIN 471</text>`;
    }
    if (k === 'tap'){
      g += sh(70, 336, R) + `<ellipse cx="70" cy="${cy}" rx="${R*0.3*0.45}" ry="${R*0.45}" fill="${P.hole}"/>`;
      for (let i = 0; i < 4; i++) g += `<line x1="${72+i*12}" y1="${cy-R*0.42}" x2="${76+i*12}" y2="${cy+R*0.42}" stroke="rgba(0,0,0,.25)" stroke-dasharray="3 2"/>`;
      g += `<text x="90" y="${cy-R-12}" text-anchor="middle" class="dl">M · depth ≈ 1.5d</text>`;
    }
    if (k === 'thread'){
      g += sh(150, 336, R) + sh(60, 152, R*0.72);
      for (let x = 64; x < 148; x += 7) g += `<path d="M${x},${cy-R*0.72} Q${x+5},${cy} ${x+2},${cy+R*0.72}" stroke="rgba(0,0,0,.45)" fill="none"/>`;
      g += `<text x="105" y="${cy-R-10}" text-anchor="middle" class="dl">M</text>`;
    }
    if (k === 'cross'){
      g += sh(70, 336, R) + `<ellipse cx="110" cy="${cy}" rx="7" ry="9" fill="${P.hole}"/>`;
      g += `<rect x="106" y="${cy-R-30}" width="8" height="${2*R+60}" rx="3" fill="${P.shaft}" stroke="#555"/>`;
      g += `<text x="110" y="${cy-R-36}" text-anchor="middle" class="dl">Ø pin</text>`;
    }
    if (k === 'step'){
      g += sh(160, 336, R) + sh(70, 162, R*0.68);
      g += vd(52, cy-R*0.68, cy+R*0.68, 'd1', true) + vd(190, cy-R, cy+R, 'd');
    }
    if (k === 'bush'){
      g += sh(70, 336, R*0.8) + cyl(P, 95, 175, cy, R*1.35, P.poly, P.face, 'left');
      g += `<ellipse cx="95" cy="${cy}" rx="${R*0.8*0.3}" ry="${R*0.8}" fill="${P.shaft}"/><text x="135" y="${cy-R*1.35-10}" text-anchor="middle" class="dl">B (bush)</text>`;
    }
    return wrap(W, H, P, g);
  }

  /* ─── بلبرینگ (برش نیمه) ─── */
  function bearing(o){
    const P = Pal(), W = 420, H = 300, cx = 200, cy = 150, R = 120, rx = 64;
    const e = (k, fill, extra) => `<ellipse cx="${cx}" cy="${cy}" rx="${f1(rx*k)}" ry="${f1(R*k)}" fill="${fill}" stroke="rgba(0,0,0,.45)" ${extra||''}/>`;
    let g = `<ellipse cx="${cx+20}" cy="${cy+R+12}" rx="140" ry="10" fill="${P.shadow}"/>`;
    g += `<path d="M${cx-60},${cy-R} L${cx},${cy-R} L${cx},${cy+R} L${cx-60},${cy+R} A${rx},${R} 0 0 1 ${cx-60},${cy-R} Z" fill="${P.steel}" stroke="rgba(0,0,0,.35)"/>`;
    g += e(1, P.face) + e(.84, '#9d97a3') + e(.8, '#2b3442');
    /* ساچمه‌ها در نیمه پایین (برش) */
    const rb = .64;
    for (let i = 0; i < 7; i++){ const t = Math.PI*(0.12 + i*0.76/6); const bx = cx + rx*rb*Math.cos(t), by = cy + R*rb*Math.sin(t);
      g += `<circle cx="${f1(bx)}" cy="${f1(by)}" r="${f1(9 + 4*Math.sin(t))}" fill="${P.face}" stroke="#555"/>`; }
    g += `<path d="M${cx-rx*.8},${cy} A${rx*.8},${R*.8} 0 0 1 ${cx+rx*.8},${cy} L${cx+rx*.48},${cy} A${rx*.48},${R*.48} 0 0 0 ${cx-rx*.48},${cy} Z" fill="#1f2733" opacity=".95"/>`;
    g += e(.48, P.face) + e(.33, P.hole);
    g += vd(cx+rx+40, cy-R, cy+R, 'D '+(o&&o.D||'')) + vd(cx-80, cy-R*0.33, cy+R*0.33, 'd '+(o&&o.d||''), true) + hdim(cx-60, cx, cy-R-12, 'B '+(o&&o.B||''));
    g += `<text x="${cx+rx+50}" y="${cy-R+20}" class="sm">2RS / 2Z · C3</text>`;
    return wrap(W, H, P, g);
  }

  /* ─── نمونه رولیک با رینگ برای کارت‌های لاستیک ─── */
  function ringProf(k){
    const base = {D:89, d:25, B:600, C:608, A:632, oe:133, ri:89, ch:18, brg:'6205'};
    const map = {
      NA: {cat:'impact', E:35, total:17, B:600},
      NG: {cat:'retring', E:30, side:2, central:3, t:560, a:30, b:120, sideT:'ER', cenT:'ER'},
      NL: {cat:'retring', E:30, E1:35, side:3, central:3, t:560, a:105, b:85, sideT:'ET', cenT:'ER'},
      NC: {cat:'retv', E:30, E1:35, side:3, central:2, t:420, a:105, b:90, sideT:'ET', cenT:'ER', B:450, C:458, A:482},
      NM: {cat:'helix', L:540, oe:133},
      lag:{cat:'lag', oe:0}, disc:{cat:'retring', E:12, side:0, central:6, t:560, b:80, cenT:'ET'},
      pu: {cat:'impact', E:35, total:17}
    };
    const r = Object.assign({}, base, map[k] || map.NA), P = Pal(), W = 700, H = 260;
    const a = rollerArt(P, r, {cx:W/2, cy:H/2-10, sx:0.95, hD:70, dims:false, maxR:105});
    let g = a.g;
    if (k === 'pu') g = g.replace(new RegExp(P.rub.replace(/[()]/g,'\\$&'),'g'), P.pu);
    return wrap(W, H, P, g);
  }

  /* ─── پایه‌ها (نمای روبه‌رو با عمق) ─── */
  function frame(k, ang){
    const P = Pal(), W = 620, H = 330, base = 262, lam = (ang||0)*Math.PI/180, dep = 22;
    let g = `<ellipse cx="${W/2}" cy="${base+40}" rx="270" ry="14" fill="${P.shadow}"/>`;
    /* تیر ناودانی پایه + صفحه پایه */
    const channel = (x1, x2, y, h) => `<path d="M${x1},${y} L${x1+dep},${y-dep*0.55} L${x2+dep},${y-dep*0.55} L${x2},${y} Z" fill="${P.flange}" stroke="rgba(0,0,0,.4)"/>` +
      `<rect x="${x1}" y="${y}" width="${x2-x1}" height="${h}" fill="${P.paint}" stroke="rgba(0,0,0,.45)"/><rect x="${x1}" y="${y+h-4}" width="${x2-x1}" height="4" fill="rgba(0,0,0,.35)"/>`;
    const foot = x => `<path d="M${x-22},${base+22} L${x-22+dep},${base+22-dep*0.55} L${x+22+dep},${base+22-dep*0.55} L${x+22},${base+22} Z" fill="${P.flange}" stroke="#444"/><rect x="${x-22}" y="${base+22}" width="44" height="7" fill="${P.paint}" stroke="#333"/><rect x="${x-12}" y="${base+12}" width="24" height="7" rx="3.5" fill="#222" transform="translate(${dep*0.5},-1)"/>`;
    const plate = (x, yTop, yBot) => `<path d="M${x-7},${yBot} L${x-7},${yTop+6} Q${x},${yTop-6} ${x+7},${yTop+6} L${x+7},${yBot} Z" fill="${P.paint}" stroke="rgba(0,0,0,.5)"/><rect x="${x-3}" y="${yTop}" width="6" height="12" fill="#1a1a1a"/>`;
    /* رولیک با چرخش (طول L، شعاع r) — شروع از نقطه (x,y) */
    const rollerAt = (x, y, L, r, deg, flip, rings) => {
      let s = cyl(P, 0, L, 0, r, P.steel, P.face, flip ? 'left' : 'right');
      if (rings) for (let t = 6; t < L-6; t += 16) s += cyl(P, t, t+13, 0, r*1.45, P.rub, P.rface, flip ? 'left' : 'right');
      return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(deg)})">${flip ? `<g transform="translate(${-L},0)">${s}</g>` : s}</g>`;
    };
    const belt = pts => `<polyline points="${pts}" fill="none" stroke="#0d0d0d" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${pts}" fill="none" stroke="#474747" stroke-width="3" stroke-linejoin="round" transform="translate(0,-3)"/>`;
    const rr = 15;
    if (['t3','t3o','imp','sa','tr'].includes(k)){
      const Lc = 150, Lw = 150, yC = 168, xa = W/2 - Lc/2, xb = W/2 + Lc/2;
      const dx = Lw*Math.cos(lam), dy = Lw*Math.sin(lam);
      g += channel(60, 560, base, 22) + foot(80) + foot(540);
      g += plate(xa - 10, yC - 10, base) + plate(xb + 10, yC - 10, base);
      g += plate(xa - 14 - dx, yC - dy - 10, base) + plate(xb + 14 + dx, yC - dy - 10, base);
      g += `<path d="M${xa-14},${yC+6} L${xa-14-dx},${yC-dy+6}" stroke="${P.paint}" stroke-width="8" opacity=".9"/><path d="M${xb+14},${yC+6} L${xb+14+dx},${yC-dy+6}" stroke="${P.paint}" stroke-width="8" opacity=".9"/>`;
      const imp = k === 'imp';
      g += rollerAt(xa - 14, yC, Lw, rr, ang, true, imp) + rollerAt(xb + 14, yC, Lw, rr, -ang, false, imp);
      g += rollerAt(xa, yC + (k === 't3o' ? 8 : 0), Lc, rr, 0, false, imp);
      const rb = imp ? rr*1.45 : rr, off = rb + 8;
      g += belt(`${f1(xa-14-dx-8)},${f1(yC-dy-off/Math.cos(lam||0.0001)*0.9)} ${xa-6},${yC-off} ${xb+6},${yC-off} ${f1(xb+14+dx+8)},${f1(yC-dy-off/Math.cos(lam||0.0001)*0.9)}`);
      g += `<text x="${f1(xb+14+dx/2+18)}" y="${f1(yC-dy/2+30)}" class="dl">λ = ${ang}°</text>`;
      if (k === 'sa'){ g += `<ellipse cx="${W/2}" cy="${base-4}" rx="34" ry="9" fill="${P.flange}" stroke="#333"/><circle cx="${W/2}" cy="${base-4}" r="6" fill="${C.acc}"/>`;
        g += rollerAt(xa - 34 - dx, yC - dy - 70, 60, 9, 90, false, false) + rollerAt(xb + 34 + dx, yC - dy - 70, 60, 9, 90, false, false);
        g += `<text x="${W/2}" y="${base+52}" text-anchor="middle" class="sm">pivot</text>`; }
      if (k === 't3o') g += `<text x="${W/2}" y="${yC+36}" text-anchor="middle" class="sm">offset</text>`;
      if (imp) g += `<path d="M${W/2},22 l0,46" stroke="${C.acc}" stroke-width="5" marker-end="url(#ar)"/><text x="${W/2+12}" y="40" class="dl">impact</text>`;
    } else if (k === 'v2' || k === 'vret'){
      const ret = k === 'vret', L = 200, xm = W/2, y = ret ? 150 : 190, dx = L*Math.cos(lam), dy = L*Math.sin(lam);
      if (ret){ g += channel(50, 570, 52, 20); g += plate(xm-dx-14, 70, y-dy+12).replace(/Q/,'Q') + plate(xm+dx+14, 70, y-dy+12) + plate(xm, 70, y+12); }
      else { g += channel(60, 560, base, 22) + foot(80) + foot(540) + plate(xm-dx-14, y-dy-10, base) + plate(xm+dx+14, y-dy-10, base) + plate(xm, y-10, base); }
      g += rollerAt(xm-4, y, L, rr, ang, true, false) + rollerAt(xm+4, y, L, rr, -ang, false, false);
      g += belt(`${f1(xm-dx-6)},${f1(y-dy-rr-9)} ${xm},${y-rr-9} ${f1(xm+dx+6)},${f1(y-dy-rr-9)}`);
      g += `<text x="${f1(xm+dx/2)}" y="${f1(y-dy/2+34)}" class="dl">${ang}°</text>`;
    } else if (k === 'flat' || k === 'ret'){
      const ret = k === 'ret', y = ret ? 150 : 200, x1 = 130, L = 360;
      if (ret){ g += channel(50, 570, 52, 20) + plate(x1-10, 70, y+12) + plate(x1+L+10, 70, y+12); }
      else { g += channel(60, 560, base, 22) + foot(80) + foot(540) + plate(x1-10, y-10, base) + plate(x1+L+10, y-10, base); }
      g += rollerAt(x1, y, L, rr+2, 0, false, false) + belt(`${x1-30},${y-rr-11} ${x1+L+30},${y-rr-11}`);
    } else if (k === 'gar'){
      const n5 = (ang||30) >= 45 ? 5 : 3, pts = [];
      for (let i = 0; i <= n5; i++){ const t = i/n5; pts.push([90 + t*(W-180), 70 + Math.sin(Math.PI*t)*(120 + (ang||30))]); }
      g += `<rect x="40" y="40" width="40" height="14" fill="${P.paint}"/><rect x="${W-80}" y="40" width="40" height="14" fill="${P.paint}"/>`;
      for (let i = 0; i < n5; i++){ const [ax,ay] = pts[i], [bx,by] = pts[i+1], L = Math.hypot(bx-ax, by-ay) - 18, deg = Math.atan2(by-ay, bx-ax)*180/Math.PI;
        g += rollerAt(ax + 9*Math.cos(deg*Math.PI/180), ay + 9*Math.sin(deg*Math.PI/180), L, rr, deg, false, false); }
      pts.forEach(([x,y]) => g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="#2a2a2a" stroke="#888" stroke-width="2"/>`);
      g += belt(pts.map(([x,y],i) => `${f1(x)},${f1(y-rr-12)}`).join(' '));
    } else if (k === 'gd'){
      g += channel(60, 560, base, 22) + `<rect x="210" y="110" width="16" height="${base-110}" fill="${P.paint}" stroke="#333"/>`;
      g += rollerAt(250, 40, 170, 18, 90, false, false);
      g += `<rect x="270" y="120" width="300" height="14" fill="#151515"/><text x="420" y="110" text-anchor="middle" class="sm">belt edge</text>`;
    }
    return wrap(W, H, P, g);
  }
  return {roller, pipe, shaftEnd, bearing, ringProf, frame};
})();
