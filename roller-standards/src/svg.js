/* ═══ نقشه‌های شماتیک (SVG) — فقط برای توضیح، بدون مقیاس دقیق ═══ */
const SV = (() => {
  const C = {ink:'#3b1f47', acc:'#e8820c', steel:'#c9c3cc', dark:'#8a8290', rub:'#2d2d2d', bg:'#fcfaf7'};
  const defs = `<defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.ink}"/></marker>
    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eeecef"/><stop offset=".5" stop-color="#a9a3ad"/><stop offset="1" stop-color="#d8d4db"/></linearGradient>
    <style>.dl{font:600 12px Tahoma,Arial,sans-serif;fill:${C.ink}}.sm{font:11px Tahoma,Arial,sans-serif;fill:#5c4a66}</style></defs>`;
  const wrap = (w,h,g) => `<svg class="sv" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" direction="ltr">${defs}<rect width="${w}" height="${h}" fill="${C.bg}"/>${g}</svg>`;
  const hdim = (x1,x2,y,lab) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.ink}" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="${(x1+x2)/2}" y="${y-5}" text-anchor="middle" class="dl">${lab}</text>`;
  const vd = (x,y1,y2,lab,end) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${C.ink}" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="${x+(end?-6:6)}" y="${(y1+y2)/2+4}" text-anchor="${end?'end':'start'}" class="dl">${lab}</text>`;
  const n = v => (v===null||v===undefined||v==='') ? null : +v;

  /* رولیک (نمای جانبی) */
  function roller(r){
    const W=820, ringy=!!r.oe, H=ringy?310:250, cx=W/2, cy=H/2-14;
    const B=n(r.B)||600, A=n(r.A)||B+26, Cc=n(r.C)||B+8, D=n(r.D)||n(r.oe)||89, d=n(r.d)||20, oe=n(r.oe)||0;
    const sx=Math.min(640/A,1.6), hD=Math.max(46,Math.min(90,D*0.9)), hd=Math.max(12,hD*d/D), hR=oe?Math.min(H-120,hD*oe/D):0;
    const X=v=>cx-v*sx/2; let g='';
    g+=`<rect x="${X(A)}" y="${cy-hd/2}" width="${A*sx}" height="${hd}" fill="${C.steel}" stroke="#555"/>`;
    const fl=(A-Cc)/2*sx; g+=`<rect x="${X(A)}" y="${cy-hd/2+3}" width="${fl}" height="${hd-6}" fill="${C.dark}"/><rect x="${X(-A)-fl}" y="${cy-hd/2+3}" width="${fl}" height="${hd-6}" fill="${C.dark}"/>`;
    if (r.cat!=='cage') g+=`<rect x="${X(B)}" y="${cy-hD/2}" width="${B*sx}" height="${hD}" rx="3" fill="url(#tg)" stroke="#444"/>`;
    const ring=(xc,w,flat)=>{const x=xc-w/2; return flat?`<rect x="${x}" y="${cy-hR/2}" width="${w}" height="${hR}" rx="2" fill="${C.rub}"/>`
      :`<polygon points="${x},${cy-hD/2-3} ${xc},${cy-hR/2} ${x+w},${cy-hD/2-3} ${x+w},${cy+hD/2+3} ${xc},${cy+hR/2} ${x},${cy+hD/2+3}" fill="${C.rub}"/>`;};
    if (r.cat==='impact' && oe){ const E=n(r.E)||35, k=Math.min(n(r.total)||Math.floor(B/E),90), w=E*sx, x0=cx-k*w/2; for(let i=0;i<k;i++) g+=ring(x0+w*i+w/2,w-1,true);
      g+=`<text x="${cx}" y="${cy+hR/2+18}" text-anchor="middle" class="dl">ET = ${E} × ${k}</text>`; }
    if ((r.cat==='retring'||r.cat==='retv') && oe){
      const t=n(r.t)||B-40, side=n(r.side)||2, cen=n(r.central)||0, E1=n(r.E1)||n(r.E)||25, E=n(r.E)||25, a=n(r.a)||side*E1, bb=n(r.b)||((t-2*a)/(cen+1));
      const sF=r.sideT==='ET', cF=r.cenT==='ET', L=cx-t*sx/2, R=cx+t*sx/2;
      for(let i=0;i<side;i++){ g+=ring(L+(E1*i+E1/2)*sx,E1*sx-1,sF); if(r.cat!=='retv') g+=ring(R-(E1*i+E1/2)*sx,E1*sx-1,sF); }
      const span=(cen-1)*bb, c0=(r.cat==='retv'?(L+a*sx+bb*sx):cx-span*sx/2); for(let i=0;i<cen;i++) g+=ring(c0+i*bb*sx,E*sx,cF);
      const yT=cy-hR/2-12; g+=hdim(L,R,yT-20,'t = '+t)+hdim(L,L+a*sx,yT,'a = '+a);
      if(cen>1) g+=hdim(c0,c0+bb*sx,cy+hR/2+16,'b = '+Math.round(bb));
      g+=`<text x="${L+E1*sx/2}" y="${cy+hR/2+34}" text-anchor="middle" class="dl">${r.sideT||'ET'}=${E1}</text><text x="${c0}" y="${cy+hR/2+34}" text-anchor="middle" class="dl">${r.cenT||'ER'}=${E}</text>`;
    }
    if (r.cat==='helix' && oe){ const p=38.5*sx, Lh=n(r.L)||B*0.9, x0=cx-Lh*sx/2; for(let x=x0;x<x0+Lh*sx-2;x+=p) g+=`<line x1="${x}" y1="${cy-hR/2}" x2="${x+p*0.8}" y2="${cy+hR/2}" stroke="${C.rub}" stroke-width="${Math.max(3,p*0.35)}" stroke-linecap="round"/>`;
      if(n(r.L)) g+=hdim(x0,x0+Lh*sx,cy-hR/2-10,'L = '+r.L); }
    if (r.cat==='cage' && oe){ for(let x=X(B);x<X(-B);x+=14) g+=`<path d="M${x},${cy-hR/2} Q${x+7},${cy} ${x},${cy+hR/2}" stroke="${C.dark}" stroke-width="3" fill="none"/>`; }
    const yb=H-14; g+=hdim(X(A),X(-A),yb,'A = '+A)+hdim(X(Cc),X(-Cc),yb-24,'C = '+Cc);
    if (!(r.cat==='retring'||r.cat==='retv')) g+=hdim(X(B),X(-B),cy-Math.max(hD,hR)/2-14,'B = '+B); else g+=hdim(X(B),X(-B),yb-48,'B = '+B);
    if (r.cat!=='cage') g+=vd(X(B)-10,cy-hD/2,cy+hD/2,'ØD '+D+(r.s?' × '+r.s:''),true);
    g+=`<text x="${X(A)}" y="${cy-hd/2-6}" class="dl">d ${d}${r.ch?'  ch '+r.ch:''}</text>`;
    if (oe) g+=vd(X(-B)+14,cy-hR/2,cy+hR/2,'øe '+oe);
    if (r.brg) g+=`<text x="${X(-A)}" y="${cy+hd/2+16}" text-anchor="end" class="sm">${r.brg}</text>`;
    return wrap(W,H,g);
  }

  /* مقطع لوله */
  function pipe(D,s,label){
    D=D||89; s=s||3; const W=360,H=260,cx=180,cy=130,R=95,ri=Math.max(30,R*(D-2*s)/D);
    let g=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#tg)" stroke="#444"/><circle cx="${cx}" cy="${cy}" r="${ri}" fill="${C.bg}" stroke="#444"/>`;
    g+=hdim(cx-R,cx+R,cy-R-8,'ØD '+D)+hdim(cx-ri,cx+ri,cy+6,'Ødi '+(+(D-2*s).toFixed(1)));
    g+=`<text x="${cx+R+6}" y="${cy-ri/2}" class="dl">s ${s}</text>`;
    if(label) g+=`<text x="${cx}" y="${H-8}" text-anchor="middle" class="sm">${label}</text>`;
    return wrap(W,H,g);
  }

  /* انواع سر شافت */
  function shaftEnd(k){
    const W=520,H=200,y=100; let g='';
    const body=`<rect x="160" y="${y-22}" width="330" height="44" fill="${C.steel}" stroke="#555"/>`;
    const tube=`<rect x="300" y="${y-55}" width="200" height="110" fill="url(#tg)" stroke="#444" opacity=".55"/>`;
    if(k==='flat'){ g+=tube+body+`<rect x="40" y="${y-22}" width="120" height="44" fill="${C.steel}" stroke="#555"/><rect x="40" y="${y-14}" width="70" height="28" fill="${C.dark}"/>`+vd(30,y-14,y+14,'ch',true)+hdim(40,110,y-30,'g'); }
    if(k==='circlip'){ g+=tube+body+`<rect x="40" y="${y-22}" width="120" height="44" fill="${C.steel}" stroke="#555"/><rect x="96" y="${y-22}" width="6" height="44" fill="${C.ink}"/>`+`<text x="99" y="${y-30}" text-anchor="middle" class="dl">DIN 471</text>`; }
    if(k==='tap'){ g+=tube+body+`<rect x="40" y="${y-22}" width="120" height="44" fill="${C.steel}" stroke="#555"/><rect x="40" y="${y-8}" width="60" height="16" fill="#fff" stroke="${C.ink}" stroke-dasharray="3 2"/>`+`<text x="70" y="${y-30}" text-anchor="middle" class="dl">M · depth ≈ 1.5d</text>`; }
    if(k==='thread'){ g+=tube+body+`<rect x="60" y="${y-16}" width="100" height="32" fill="${C.steel}" stroke="#555"/>`; for(let x=62;x<158;x+=7) g+=`<line x1="${x}" y1="${y-16}" x2="${x+4}" y2="${y+16}" stroke="${C.ink}"/>`; g+=`<text x="110" y="${y-24}" text-anchor="middle" class="dl">M</text>`; }
    if(k==='cross'){ g+=tube+body+`<rect x="40" y="${y-22}" width="120" height="44" fill="${C.steel}" stroke="#555"/><circle cx="85" cy="${y}" r="9" fill="#fff" stroke="${C.ink}"/>`+`<text x="85" y="${y-30}" text-anchor="middle" class="dl">Ø pin</text>`; }
    if(k==='step'){ g+=tube+body+`<rect x="60" y="${y-15}" width="100" height="30" fill="${C.steel}" stroke="#555"/>`+vd(50,y-15,y+15,'d1',true)+vd(175,y-22,y+22,'d'); }
    if(k==='bush'){ g+=tube+body+`<rect x="60" y="${y-28}" width="70" height="56" rx="4" fill="#9fb4c7" stroke="#555"/><rect x="40" y="${y-14}" width="120" height="28" fill="${C.steel}" stroke="#555"/>`+`<text x="95" y="${y-34}" text-anchor="middle" class="dl">B (bush)</text>`; }
    return wrap(W,H,g);
  }

  /* بلبرینگ شیار عمیق — مقطع */
  function bearing(o){
    const W=360,H=260,cx=180,cy=130; let g='';
    g+=`<rect x="${cx-60}" y="${cy-110}" width="120" height="70" fill="${C.steel}" stroke="#444"/><rect x="${cx-60}" y="${cy+40}" width="120" height="70" fill="${C.steel}" stroke="#444"/>`;
    g+=`<circle cx="${cx}" cy="${cy-75}" r="22" fill="${C.dark}" stroke="#333"/><circle cx="${cx}" cy="${cy+75}" r="22" fill="${C.dark}" stroke="#333"/>`;
    g+=`<line x1="${cx-60}" y1="${cy-75}" x2="${cx+60}" y2="${cy-75}" stroke="#444"/><line x1="${cx-60}" y1="${cy+75}" x2="${cx+60}" y2="${cy+75}" stroke="#444"/>`;
    g+=`<line x1="20" y1="${cy}" x2="${W-20}" y2="${cy}" stroke="${C.acc}" stroke-dasharray="8 4"/>`;
    g+=vd(cx+90,cy-110,cy+110,'D '+(o&&o.D||''))+vd(cx-90,cy-40,cy+40,'d '+(o&&o.d||''),true)+hdim(cx-60,cx+60,cy-118,'B '+(o&&o.B||''));
    return wrap(W,H,g);
  }

  /* پروفیل رینگ لاستیکی */
  function ringProf(k){
    const W=420,H=220,cx=210,cy=110; let g=`<rect x="40" y="${cy-30}" width="340" height="60" fill="url(#tg)" stroke="#444"/>`;
    const R=(x,w,flat)=>flat?`<rect x="${x}" y="${cy-70}" width="${w}" height="140" rx="3" fill="${C.rub}"/>`:`<polygon points="${x},${cy-32} ${x+w/2},${cy-70} ${x+w},${cy-32} ${x+w},${cy+32} ${x+w/2},${cy+70} ${x},${cy+32}" fill="${C.rub}"/>`;
    if(k==='NA') for(let x=60;x<360;x+=34) g+=R(x,32,true);
    if(k==='NG') for(let x=70;x<360;x+=60) g+=R(x,24,false);
    if(k==='NL'){ g+=R(50,36,true)+R(88,36,true); for(let x=160;x<270;x+=50) g+=R(x,22,false); g+=R(296,36,true)+R(334,36,true); }
    if(k==='NC'){ g+=R(50,36,true)+R(88,36,true); for(let x=170;x<360;x+=60) g+=R(x,22,false); }
    if(k==='NM') for(let x=50;x<370;x+=26) g+=`<line x1="${x}" y1="${cy-68}" x2="${x+20}" y2="${cy+68}" stroke="${C.rub}" stroke-width="10" stroke-linecap="round"/>`;
    if(k==='disc') for(let x=60;x<360;x+=50) g+=`<rect x="${x}" y="${cy-75}" width="10" height="150" rx="3" fill="${C.rub}"/>`;
    if(k==='lag') g+=`<rect x="40" y="${cy-42}" width="340" height="84" rx="6" fill="${C.rub}" opacity=".85"/>`;
    if(k==='pu') for(let x=60;x<360;x+=34) g+=`<rect x="${x}" y="${cy-62}" width="32" height="124" rx="3" fill="#c9a227"/>`;
    return wrap(W,H,g);
  }

  /* پایه‌ها — نمای روبه‌رو */
  function frame(k, ang){
    const W=520,H=260,base=200; let g=`<rect x="40" y="${base}" width="440" height="12" fill="${C.dark}"/>`;
    const lam=(ang||0)*Math.PI/180;
    const roll=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#777" stroke-width="22" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#bbb" stroke-width="14" stroke-linecap="round"/>`;
    const belt=pts=>`<polyline points="${pts}" fill="none" stroke="${C.ink}" stroke-width="5" opacity=".8"/>`;
    if(k==='t3'||k==='t3o'||k==='imp'||k==='sa'||k==='tr'){
      const l=120, y=150, x1=200, x2=320, dx=l*Math.cos(lam), dy=l*Math.sin(lam);
      g+=roll(x1,y,x2,y)+roll(x1-dx-6,y-dy,x1-6,y)+roll(x2+6,y,x2+dx+6,y-dy);
      g+=belt(`${x1-dx-10},${y-dy-14} ${x1},${y-12} ${x2},${y-12} ${x2+dx+10},${y-dy-14}`);
      g+=`<line x1="${x1-dx-6}" y1="${y}" x2="${x1-dx-6}" y2="${base}" stroke="${C.dark}" stroke-width="6"/><line x1="${x2+dx+6}" y1="${y}" x2="${x2+dx+6}" y2="${base}" stroke="${C.dark}" stroke-width="6"/>`;
      g+=`<text x="${x2+30}" y="${y-8}" class="dl">λ = ${ang}°</text>`;
      if(k==='sa') g+=`<circle cx="260" cy="${base-10}" r="9" fill="${C.acc}"/><text x="260" y="${base+30}" text-anchor="middle" class="sm">pivot</text>`;
      if(k==='imp') g+=`<text x="260" y="40" text-anchor="middle" class="dl">⬇ impact</text>`;
    } else if(k==='v2'||k==='vret'){
      const l=170, y=k==='vret'?120:160, dx=l*Math.cos(lam), dy=l*Math.sin(lam);
      g+=roll(260-dx,y-dy,258,y)+roll(262,y,260+dx,y-dy)+belt(`${260-dx},${y-dy-14} 260,${y-12} ${260+dx},${y-dy-14}`)+`<text x="${260+dx/2}" y="${y-dy-24}" class="dl">${ang}°</text>`;
    } else if(k==='flat'||k==='ret'){
      const y=k==='ret'?120:160; g+=roll(110,y,410,y)+belt(`90,${y-14} 430,${y-14}`);
      if(k==='ret') g+=`<line x1="100" y1="${y}" x2="100" y2="${base}" stroke="${C.dark}" stroke-width="6"/><line x1="420" y1="${y}" x2="420" y2="${base}" stroke="${C.dark}" stroke-width="6"/>`;
    } else if(k==='gar'){
      g+=`<path d="M70,60 Q260,${60+180*Math.sin(lam||0.6)} 450,60" fill="none" stroke="#bbb" stroke-width="16"/><path d="M70,48 Q260,${48+180*Math.sin(lam||0.6)} 450,48" fill="none" stroke="${C.ink}" stroke-width="5"/>`;
      g+=`<circle cx="70" cy="60" r="8" fill="${C.acc}"/><circle cx="450" cy="60" r="8" fill="${C.acc}"/>`;
    } else if(k==='gd'){
      g+=roll(250,40,250,180)+`<rect x="280" y="80" width="200" height="16" fill="${C.ink}"/><text x="380" y="72" text-anchor="middle" class="sm">belt edge</text>`;
    }
    return wrap(W,H,g);
  }
  return {roller, pipe, shaftEnd, bearing, ringProf, frame};
})();
