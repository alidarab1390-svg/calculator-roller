/* ═══════════════════════════════════════════════════════════════
   داده‌های مرجع: لوله، شافت، بلبرینگ، لاستیک، مواد، CEMA، تست‌ها، پایه‌ها
   مقادیر «مرجع/عمومی» قابل ویرایش هستند و باید با کاتالوگ و استاندارد مربوط تطبیق داده شوند.
═══════════════════════════════════════════════════════════════ */
const SRC = {
  rm:   b('کاتالوگ Rulmeca', 'Rulmeca catalogue'),
  iso:  b('ISO 1537 / DIN 15207', 'ISO 1537 / DIN 15207'),
  cema: b('CEMA 502 / 550', 'CEMA 502 / 550'),
  din:  b('DIN / EN', 'DIN / EN'),
  ref:  b('مقدار مرجع عمومی — بررسی شود', 'General reference value — verify')
};

/* ── لوله فولادی ── */
const STEEL_TUBES = (() => {
  const T = {50:[2,3],60:[2,3,3.5],63.5:[3],76.1:[3,3.5,4],88.9:[3,3.5,4,4.5,5],101.6:[3,3.5,4],108:[3.5,4,4.5,5],
    114.3:[3.5,4,4.5,5,6],127:[4,4.5,5,6],133:[4,4.5,5,6],139.7:[4,4.5,5,6],152.4:[4.5,5,6],159:[4.5,5,6,7,8],168.3:[4.5,5,6],193.7:[5,6,6.3,8],219.1:[6,6.3,8]};
  const inch = {60:'2"',88.9:'3"',101.6:'3½" / CEMA 4"',114.3:'4"',127:'CEMA 5"',152.4:'CEMA 6"',168.3:'6"',219.1:'8"'};
  const roll = {60:'60/63',63.5:'63',76.1:'76',88.9:'89',101.6:'102',108:'108',127:'127',133:'133',152.4:'152',159:'159',193.7:'194'};
  const out = [];
  Object.entries(T).forEach(([D,ss]) => ss.forEach(s => {
    D = +D; const Di = +(D-2*s).toFixed(1);
    out.push({id:`st|${D}|${s}`, D, s, Di, kgm:+(Math.PI*(D*D-Di*Di)/4*7.85e-3).toFixed(2), inch:inch[D]||'', roll:roll[D]||'',
      std:'EN 10219 / EN 10217-1 (ERW) · DIN 2458', src:'ref'});
  }));
  return out;
})();

/* ── لوله پلیمری ── */
const POLY_NOTES = {
  pvc: b('سبک، ضدخوردگی؛ مناسب محیط‌های شیمیایی و نمکی؛ ضربه‌پذیری محدود در سرما','Light, corrosion-proof; chemical/salty environments; limited impact strength in cold'),
  hdpe:b('مقاوم به سایش و خوردگی، صدای کم، ضربه‌پذیری خوب','Abrasion and corrosion resistant, low noise, good impact strength'),
  uhmw:b('بالاترین مقاومت سایشی، ضریب اصطکاک کم، ضد چسبندگی مواد','Highest abrasion resistance, low friction, anti-adhesion'),
  pa:  b('استحکام و سختی بالا، جذب رطوبت؛ برای بارهای سبک تا متوسط','High strength and stiffness, absorbs moisture; light-medium loads')
};
const POLY_TUBES = [
  ['PVC-U',90,4.3,1.40,'-10 … +60','pvc'],['PVC-U',110,5.3,1.40,'-10 … +60','pvc'],['PVC-U',140,8.5,1.40,'-10 … +60','pvc'],
  ['HDPE PE100 SDR11',90,8.2,0.955,'-30 … +60','hdpe'],['HDPE PE100 SDR11',110,10,0.955,'-30 … +60','hdpe'],['HDPE PE100 SDR11',125,11.4,0.955,'-30 … +60','hdpe'],
  ['HDPE PE100 SDR11',140,12.7,0.955,'-30 … +60','hdpe'],['HDPE PE100 SDR11',160,14.6,0.955,'-30 … +60','hdpe'],
  ['HDPE PE100 SDR17',110,6.6,0.955,'-30 … +60','hdpe'],['HDPE PE100 SDR17',125,7.4,0.955,'-30 … +60','hdpe'],['HDPE PE100 SDR17',160,9.5,0.955,'-30 … +60','hdpe'],
  ['UHMW-PE',114,12,0.93,'-100 … +80','uhmw'],['UHMW-PE',133,14,0.93,'-100 … +80','uhmw'],['UHMW-PE',159,15,0.93,'-100 … +80','uhmw'],
  ['PA6 (Nylon)',108,10,1.15,'-40 … +100','pa'],['PA6 (Nylon)',133,12,1.15,'-40 … +100','pa']
].map(([mat,D,s,rho,temp,k]) => {
  const Di = +(D-2*s).toFixed(1);
  return {id:`pt|${mat}|${D}|${s}`, mat, D, s, Di, rho, kgm:+(Math.PI*(D*D-Di*Di)/4*rho*1e-3).toFixed(2), temp, note:POLY_NOTES[k], src:'ref'};
});


/* ── جنس شافت ── */
const SHAFT_MAT = [
  ['S235JR (ST37)','1.0038','A36 / 1018',235,'360–510','~120','کاربرد عمومی، رولیک‌های سبک','General use, light rollers'],
  ['S355J2 (ST52)','1.0577','A572 Gr.50',355,'470–630','~150','رولیک‌های متوسط و سنگین','Medium and heavy rollers'],
  ['C45 / CK45','1.0503','AISI 1045',340,'600–750','170–210','رایج‌ترین جنس شافت رولیک (کشیده سرد h9)','Most common roller shaft (cold drawn h9)'],
  ['42CrMo4 (MO40)','1.7225','AISI 4140',650,'900–1100','270–320','شافت‌های بار بسیار سنگین و ضربه‌ای','Very heavy and impact-loaded shafts'],
  ['X5CrNi18-10 (304)','1.4301','AISI 304',210,'520–720','~180','محیط خورنده و صنایع غذایی','Corrosive environment and food industry'],
  ['X5CrNiMo17-12-2 (316)','1.4401','AISI 316',220,'520–670','~180','محیط بسیار خورنده (دریایی، شیمیایی)','Highly corrosive (marine, chemical)']
].map(([mat,wn,aisi,Re,Rm,HB,fa,en]) => ({id:'sm|'+mat, mat, wn, aisi, Re, Rm, HB, use:b(fa,en), src:'ref'}));

/* ── شیار خار DIN 471 ── */
const CIRCLIP = [[15,14.3,1.1,1.0],[17,16.2,1.1,1.0],[20,19.0,1.3,1.2],[25,23.9,1.3,1.2],[30,28.6,1.6,1.5],[35,33.0,1.6,1.5],[40,37.5,1.85,1.75],[45,42.5,1.85,1.75],[50,47.0,2.15,2.0]]
  .map(([d,d2,m,s]) => ({id:'cc|'+d, d, d2, m, s, std:'DIN 471', src:'din'}));

/* ── رزوه متریک ISO (برای سوراخکاری و قلاویز سر شافت) ── */
const THREADS = [['M10',1.5,8.5],['M12',1.75,10.2],['M14',2.0,12.0],['M16',2.0,14.0],['M20',2.5,17.5],['M24',3.0,21.0],['M30',3.5,26.5]]
  .map(([M,p,drill]) => ({id:'th|'+M, M, p, drill, depth:+(parseFloat(M.slice(1))*1.5).toFixed(0), std:'ISO 261 / ISO 724', src:'din'}));

/* ── بلبرینگ‌ها (ابعاد ISO 15 ؛ C و C0 مقادیر مرجع SKF) ── */
const BEARINGS = [
  ['6202',15,35,11,8.06,3.75],['6203',17,40,12,9.95,4.75],['6204',20,47,14,13.5,6.55],['6205',25,52,15,14.8,7.8],['6206',30,62,16,20.3,11.2],
  ['6207',35,72,17,27.0,15.3],['6208',40,80,18,32.5,19.0],['6305',25,62,17,23.4,11.6],['6306',30,72,19,29.6,16.0],['6307',35,80,21,35.1,19.0],
  ['6308',40,90,23,42.3,24.0],['6310',50,110,27,65.0,38.0]
].map(([brg,d,D,B,C,C0]) => ({id:'br|'+brg, brg, d, D, B, C, C0,
  ser:Object.keys(SER).filter(k => SER[k].brg===brg).join(', '), src:'ref'}));

/* ── آمیزه‌های لاستیک ── */
const RUBBER_COMP = [
  ['NR','60 ± 5','-30 … +70','★★★★','✗','لاستیک طبیعی؛ بهترین الاستیسیته و ضربه‌پذیری — رینگ ضربه‌گیر و برگشت','Natural rubber; best resilience and impact — impact and return rings'],
  ['SBR','60–70','-30 … +70','★★★','✗','اقتصادی، سایش خوب — رینگ‌های برگشت عمومی','Economical, good abrasion — general return rings'],
  ['NBR','60–70','-20 … +100','★★★','✓','مقاوم به روغن و گریس — مواد روغنی، صنایع غذایی','Oil and grease resistant — oily materials, food'],
  ['EPDM','60–70','-40 … +120','★★','✗','مقاوم به حرارت، اوزون و هوازدگی','Heat, ozone and weather resistant'],
  ['CR (Neoprene)','60–70','-25 … +90','★★★','≈','مقاومت نسبی به روغن، ضد شعله','Moderate oil resistance, flame retardant'],
  ['PU (Polyurethane)','80–95','-20 … +80','★★★★★','≈','بیشترین مقاومت سایش و برش؛ حساس به رطوبت گرم','Highest abrasion/cut resistance; sensitive to hot moisture']
].map(([k,sh,temp,abr,oil,fa,en]) => ({id:'rc|'+k, comp:k, shore:sh, temp, abr, oil, use:b(fa,en), src:'ref'}));

/* ── رینگ‌های استاندارد (از جداول رولیک) ── */
const RINGS = (() => {
  const out = [], seen = new Set();
  const add = (o) => { const id = 'rg|'+[o.type,o.oe,o.ri,o.w,o.rt].join('|'); if (seen.has(id)) return; seen.add(id); o.id = id; o.src='rm'; out.push(o); };
  NA.forEach(g => g.b.forEach(x => add({type:'NA', oe:g.oe, ri:x[1], w:g.E, rt:'ET', prof:b('ضربه‌گیر تخت','Impact (flat)')})));
  NG.forEach(g => g.b.forEach(x => add({type:'NG', oe:g.oe, ri:x[1], w:g.E, rt:'ER', prof:b('نوک‌تیز / خم','Pointed / curved')})));
  [...NL, ...NC].forEach(g => g.b.forEach(x => { const t = NL.includes(g)?'NL':'NC';
    add({type:t, oe:g.oe, ri:x[1], w:g.E1, rt:'ET', prof:b('تخت کناری','Flat (side sets)')});
    add({type:t, oe:g.oe, ri:x[1], w:g.E, rt:'ER', prof:b('نوک‌تیز / خم میانی','Pointed / curved (central)')}); }));
  NM.forEach(g => g.b.forEach(x => add({type:'NM', oe:g.oe, ri:x[1], w:38.5, rt:'—', prof:b('مارپیچ','Helix')})));
  return out.sort((a,c) => a.type.localeCompare(c.type) || a.oe-c.oe || a.ri-c.ri);
})();

/* ── مواد فله (برای محاسبات) ── */
const MATERIALS = [
  ['coal',b('زغال‌سنگ (بیتومینه)','Coal, bituminous'),0.72,0.88,38,20,18,'B'],
  ['anth',b('زغال‌سنگ آنتراسیت دانه‌بندی','Coal, anthracite sized'),0.88,1.04,27,15,16,'B'],
  ['coke',b('کک','Coke'),0.37,0.51,40,20,18,'C'],
  ['fe',b('سنگ آهن','Iron ore'),1.6,3.2,35,20,18,'C'],
  ['pel',b('گندله آهن','Iron ore pellets'),1.86,2.08,30,10,13,'C'],
  ['cu',b('سنگ مس','Copper ore'),1.92,2.4,35,20,20,'C'],
  ['lime',b('سنگ آهک خردشده','Limestone, crushed'),1.36,1.44,38,20,18,'B'],
  ['grav',b('شن خشک','Gravel, dry'),1.44,1.6,30,15,15,'C'],
  ['sand',b('ماسه خشک','Sand, dry'),1.44,1.76,35,15,16,'C'],
  ['sandw',b('ماسه مرطوب','Sand, damp'),1.76,2.08,45,25,20,'C'],
  ['cem',b('سیمان پرتلند','Cement, portland'),1.2,1.5,39,20,20,'B'],
  ['clk',b('کلینکر','Clinker'),1.2,1.5,35,25,18,'C'],
  ['gyp',b('گچ خردشده','Gypsum, crushed'),1.44,1.6,35,25,21,'B'],
  ['salt',b('نمک درشت خشک','Salt, dry coarse'),0.72,0.88,25,15,18,'B'],
  ['wheat',b('گندم / غلات','Wheat / grain'),0.72,0.77,28,10,12,'A'],
  ['baux',b('بوکسیت خردشده','Bauxite, crushed'),1.2,1.36,35,20,20,'C'],
  ['chips',b('خرده چوب','Wood chips'),0.16,0.48,40,25,27,'A']
].map(([k,name,rmin,rmax,rep,sur,inc,abr]) => ({id:'mt|'+k, name, rmin, rmax, rho:+((rmin+rmax)/2).toFixed(2), rep, sur, inc, abr, src:'ref'}));

/* ── کلاس‌های CEMA ── */
const CEMA_CLASSES = [
  ['B','4, 5','18 – 48',410,220,b('سبک','Light')],
  ['C','4, 5, 6','18 – 60',900,475,b('متوسط','Medium')],
  ['D','5, 6','24 – 72',1200,650,b('متوسط / سنگین','Medium / heavy')],
  ['E','6, 7','36 – 96',1800,1000,b('سنگین','Heavy')],
  ['F','6, 7','60 – 96',3000,1500,b('خیلی سنگین','Very heavy')]
].map(([cls,dia,bw,trough,ret,duty]) => ({id:'cm|'+cls, cls, dia, bw, trough, troughN:Math.round(trough*4.448), ret, retN:Math.round(ret*4.448), duty, src:'cema'}));

/* فاصله رولیک‌ها — CEMA (ft) : [عرض اینچ] → چگالی 35،50،75،100،150،200 lb/ft³ ، برگشت */
const CEMA_SPACING = [
  ['18–24',[5.5,5.0,5.0,5.0,4.5,4.5],10],['30',[5.0,5.0,4.5,4.5,4.5,4.0],10],['36',[5.0,5.0,4.5,4.5,4.0,4.0],10],
  ['42',[5.0,4.5,4.5,4.0,4.0,3.5],10],['48',[5.0,4.5,4.5,4.0,3.5,3.5],10],['54',[4.5,4.5,4.0,4.0,3.5,3.5],10],
  ['60',[4.5,4.5,4.0,3.5,3.5,3.5],10],['72',[4.5,4.0,4.0,3.5,3.5,3.0],8],['84',[4.0,4.0,3.5,3.5,3.0,3.0],8],['96',[4.0,4.0,3.5,3.5,3.0,3.0],8]
];
const CEMA_DENS = [35,50,75,100,150,200];
/* فاصله رولیک‌ها — Rulmeca / DIN (m): عرض نوار → چگالی <1.2، 1.2–2.0، >2.0 */
const DIN_SPACING = [['300 – 650',[1.65,1.50,1.40],3.0],['800 – 1000',[1.50,1.35,1.25],3.0],['1200 – 2200',[1.40,1.25,1.20],3.0]];

/* ضرایب محاسبه بار رولیک (Rulmeca) */
const FP = {flat:1.00, v2:0.50, t20:0.60, t25:0.625, t30:0.65, t35:0.67, t40:0.70, t45:0.72};
const FD_SPEEDS = [2,2.5,3,3.5,4];
const FD = [
  [b('0 – 100 mm','0 – 100 mm'),[1.00,1.00,1.00,1.00,1.00]],
  [b('100 – 150 mm','100 – 150 mm'),[1.02,1.03,1.05,1.07,1.09]],
  [b('150 – 300 mm (همراه ریزدانه)','150 – 300 mm (with fines)'),[1.04,1.06,1.08,1.10,1.13]],
  [b('150 – 300 mm (بدون ریزدانه)','150 – 300 mm (no fines)'),[1.06,1.09,1.12,1.16,1.24]],
  [b('300 – 450 mm','300 – 450 mm'),[1.20,1.32,1.50,1.70,1.90]]
];
const FS = [[b('کمتر از ۶ ساعت در روز','< 6 h/day'),0.8],[b('۶ تا ۹ ساعت در روز','6 – 9 h/day'),1.0],[b('۱۰ تا ۱۶ ساعت در روز','10 – 16 h/day'),1.1],[b('بیش از ۱۶ ساعت در روز','> 16 h/day'),1.2]];
const FM = [[b('تمیز، نگهداری منظم','Clean, regular maintenance'),0.9],[b('سایشی یا خورنده','Abrasive or corrosive'),1.0],[b('خیلی سایشی یا خورنده','Very abrasive or corrosive'),1.1]];
/* وزن تقریبی نوار (kg/m) — نوار منسوج EP متوسط */
const BELT_WT = {300:3.5,400:4.5,500:6,650:8,800:10,1000:13,1200:16,1400:19,1600:23,1800:27,2000:31,2200:35};

/* سرعت پیشنهادی نوار */
const SPEEDS = [
  [b('دانه‌ای روان و غیرسایشی (غلات، ماسه ریز)','Free-flowing, non-abrasive (grain, fine sand)'),'2.5 – 5.0','500 – 1000'],
  [b('زغال، خاک، سنگ‌دانه ریز','Coal, earth, small crushed stone'),'2.0 – 4.5','400 – 900'],
  [b('سنگ معدن سخت، کلوخه درشت، سایشی','Hard ore, large lumps, abrasive'),'1.5 – 3.0','300 – 600'],
  [b('مواد شکننده (کک، ...)','Fragile materials (coke, ...)'),'1.0 – 2.0','200 – 400'],
  [b('مواد پودری و گردوغبارزا (سیمان، خاکستر)','Dusty / powdery (cement, fly ash)'),'1.0 – 1.5','200 – 300'],
  [b('تخلیه با تریپر یا گاوآهن','Tripper / plough discharge'),'≤ 2.0','≤ 400']
].map(([m,v,fpm],i) => ({id:'sp|'+i, mat:m, v, fpm, src:'ref'}));

/* ── تست‌ها و آزمایش‌ها ── */
const TESTS = [
  {code:'T01', name:b('بازرسی چشمی و ابعادی','Visual & dimensional inspection'), ref:'ISO 1537 · DIN 15207 · CEMA 502',
   eq:b('کولیس، متر، گیج تخت (ch)، شابلون','Caliper, tape, flat gauge (ch), templates'),
   acc:b('ابعاد D، B، C، A، d، ch در محدوده تلرانس نقشه','D, B, C, A, d, ch within drawing tolerance'),
   freq:b('هر بچ تولید (نمونه‌برداری)','Each production batch (sampling)'),
   steps:b(['قطر لوله در ۳ مقطع و دو جهت عمود اندازه‌گیری شود (دوپهنی).','طول B، C و A و عرض تخت ch با گیج بررسی شود.','وضعیت جوش درپوش، رنگ، تمیزی و نبود ضربه بررسی شود.','نتایج در فرم ثبت و با نقشه مقایسه شود.'],
            ['Measure tube OD at 3 sections, two perpendicular directions (ovality).','Check B, C, A and flat width ch with gauges.','Check end-cap welds, paint, cleanliness, dents.','Record and compare with the drawing.'])},
  {code:'T02', name:b('لنگی شعاعی (TIR / Run-out)','Radial run-out (TIR)'), ref:'ISO 1537 · DIN 15207 · CEMA 502',
   eq:b('ساعت اندیکاتور با پایه مغناطیسی، فیکسچر V یا نگهدارنده تخت شافت','Dial indicator, magnetic base, V-block / flat holder'),
   acc:b('پیش‌فرض: D ≤ 108: ≤ 0.5 mm ؛ D 133–159: ≤ 0.6 mm ؛ D ≥ 194: ≤ 0.7 mm (طبق استاندارد/قرارداد اصلاح شود)','Default: D ≤ 108: ≤ 0.5 mm; D 133–159: ≤ 0.6 mm; D ≥ 194: ≤ 0.7 mm (adjust per standard/contract)'),
   freq:b('۱۰۰٪ یا نمونه‌برداری طبق برنامه QC','100% or per QC sampling plan'),
   steps:b(['شافت از دو تخت در فیکسچر ثابت شود (شافت نچرخد).','اندیکاتور عمود بر سطح لوله در وسط و دو انتها قرار گیرد.','لوله آهسته یک دور کامل چرخانده شود.','اختلاف بیشینه و کمینه = TIR ؛ بیشترین مقدار سه نقطه ثبت شود.'],
            ['Clamp the shaft by its flats (shaft stationary).','Place indicator normal to tube at centre and both ends.','Rotate the tube slowly one full turn.','Max − min = TIR; record the largest of the three.'])},
  {code:'T03', name:b('مقاومت چرخشی (گشتاور شروع و کار)','Rotational resistance (starting & running)'), ref:'ISO 1537 · CEMA 502',
   eq:b('ترازو/نیروسنج دیجیتال با نخ دور لوله یا تستر گشتاور، موتور با دور ثابت','Spring/digital force gauge with cord around tube or torque tester, constant-speed drive'),
   acc:b('پیش‌فرض: نیروی کار در محیط لوله ≤ 2.5 N در 100 rpm بدون بار (پس از آب‌بندی اولیه)','Default: running force at tube surface ≤ 2.5 N at 100 rpm, no load (after run-in)'),
   freq:b('نمونه از هر بچ','Sample per batch'),
   steps:b(['رولیک ۳۰ دقیقه در دمای محیط با دور ثابت آب‌بندی (Run-in) شود.','نیروی لازم برای شروع چرخش ثبت شود (Starting).','در دور ثابت ۱۰۰ rpm نیروی مقاوم در محیط لوله ثبت شود (Running).','گشتاور = نیرو × شعاع لوله.'],
            ['Run-in the roller 30 min at constant speed and room temperature.','Record force to start rotation (starting).','At constant 100 rpm record resisting force at tube surface (running).','Torque = force × tube radius.'])},
  {code:'T04', name:b('لقی محوری','Axial end play'), ref:'CEMA 502 · DIN 15207',
   eq:b('ساعت اندیکاتور، فیکسچر','Dial indicator, fixture'),
   acc:b('پیش‌فرض: ≤ 0.7 mm','Default: ≤ 0.7 mm'), freq:b('نمونه از هر بچ','Sample per batch'),
   steps:b(['شافت ثابت شود و اندیکاتور روی پیشانی لوله قرار گیرد.','لوله با دست در دو جهت محوری کشیده/فشرده شود.','جابه‌جایی کل ثبت شود.'],
            ['Fix the shaft; put the indicator on the tube end face.','Push/pull the tube axially both ways by hand.','Record total movement.'])},
  {code:'T05', name:b('خیز و شیب شافت زیر بار','Shaft deflection / slope under load'), ref:'CEMA 502 · Rulmeca',
   eq:b('پرس یا وزنه، اندیکاتور، تکیه‌گاه‌هایی به فاصله C','Press or weights, indicator, supports at span C'),
   acc:b('شیب شافت در محل بلبرینگ ≤ 0.0025 rad (حدود ۹ دقیقه)','Shaft slope at bearing ≤ 0.0025 rad (≈ 9′)'),
   freq:b('تأیید طرح (Type test)','Design verification (type test)'),
   steps:b(['شافت روی دو تکیه‌گاه به فاصله C قرار گیرد.','بار محاسبه‌ای رولیک روی لوله اعمال شود.','خیز در محل بلبرینگ‌ها اندازه‌گیری و شیب محاسبه شود (تب طراحی).'],
            ['Support the shaft at span C.','Apply the design roller load on the tube.','Measure deflection at bearings; slope is calculated in the Design tab.'])},
  {code:'T06', name:b('نفوذ آب','Water ingress'), ref:'CEMA 502 · SANS 1313 (مرجع)',
   eq:b('محفظه پاشش آب، موتور چرخاننده، ترازو دقیق','Water spray chamber, drive, precision scale'),
   acc:b('پیش‌فرض: پس از ۷۲ ساعت پاشش و چرخش، آب به بلبرینگ نرسد (وزن آب نفوذی ≤ 2 g)','Default: after 72 h spray while rotating, no water at bearing (ingress ≤ 2 g)'),
   freq:b('تأیید طرح آب‌بند','Seal design verification'),
   steps:b(['رولیک توزین شود.','حین چرخش با دور کاری، آب از زاویه به ناحیه آب‌بند پاشیده شود.','پس از مدت تست، رولیک خشک و دوباره توزین و باز شود.','وجود آب در بلبرینگ/گریس بررسی شود.'],
            ['Weigh the roller.','While rotating at service speed, spray water at the seal area.','After the test period dry, weigh and dismantle.','Check bearing/grease for water.'])},
  {code:'T07', name:b('نفوذ گردوغبار','Dust ingress'), ref:'CEMA 502 (مرجع)',
   eq:b('محفظه گردوغبار (سیمان/سیلیس)، موتور چرخاننده','Dust chamber (cement/silica), drive'),
   acc:b('پیش‌فرض: پس از ۲۰۰ ساعت، گردوغبار به بلبرینگ نرسد','Default: after 200 h no dust reaches the bearing'),
   freq:b('تأیید طرح آب‌بند','Seal design verification'),
   steps:b(['رولیک در محفظه پر از گردوغبار با دور کاری چرخانده شود.','پس از مدت تست باز شود و بلبرینگ و گریس بررسی شود.'],
            ['Rotate the roller at service speed inside the dust chamber.','Dismantle after the period; inspect bearing and grease.'])},
  {code:'T08', name:b('سطح صدا','Noise level'), ref:'ISO 3744 (روش اندازه‌گیری)',
   eq:b('صداسنج کلاس ۲، موتور چرخاننده','Class 2 sound level meter, drive'),
   acc:b('پیش‌فرض: ≤ 65 dB(A) در فاصله ۱ متر در دور کاری','Default: ≤ 65 dB(A) at 1 m, service speed'),
   freq:b('نمونه از هر بچ','Sample per batch'),
   steps:b(['صدای زمینه ثبت شود.','رولیک با دور کاری چرخانده و صدا در فاصله ۱ متر اندازه‌گیری شود.','صدای ضربه‌ای/غیرعادی بلبرینگ گزارش شود.'],
            ['Record background noise.','Rotate at service speed; measure at 1 m.','Report knocking/abnormal bearing noise.'])},
  {code:'T09', name:b('تست دوام و دمای بلبرینگ','Endurance & bearing temperature'), ref:'Rulmeca · CEMA 502',
   eq:b('دستگاه تست با بار شعاعی و دور ثابت، دماسنج لیزری/ترموکوپل','Rig with radial load and constant speed, IR thermometer/thermocouple'),
   acc:b('پیش‌فرض: افزایش دما نسبت به محیط ≤ 40 °C و بدون صدای غیرعادی پس از ۲۴ ساعت','Default: temperature rise ≤ 40 °C over ambient, no abnormal noise after 24 h'),
   freq:b('تأیید طرح','Design verification'),
   steps:b(['بار محاسبه‌ای و دور کاری اعمال شود.','دمای درپوش هر ساعت ثبت شود تا پایدار شود.','در پایان مقاومت چرخشی دوباره اندازه‌گیری شود.'],
            ['Apply design load and service speed.','Record end-cap temperature hourly until stable.','Re-measure rotational resistance at the end.'])},
  {code:'T10', name:b('بازرسی جوش درپوش و لوله','End-cap and tube weld inspection'), ref:'ISO 5817 (سطح C) · ISO 17637',
   eq:b('بازرسی چشمی، گیج جوش، مایع نافذ (PT) در صورت نیاز','Visual, weld gauge, dye penetrant (PT) if required'),
   acc:b('بدون ترک، نفوذ کامل محیطی، بدون سوراخ؛ سطح کیفی C طبق ISO 5817','No cracks, full circumferential fusion, no porosity; quality level C per ISO 5817'),
   freq:b('۱۰۰٪ چشمی ؛ PT نمونه‌ای','100% visual; PT by sampling'),
   steps:b(['جوش محیطی دو سر لوله چشمی بررسی شود.','در نمونه‌ها تست مایع نافذ انجام شود.','در تست مخرب، مقطع جوش برش و نفوذ بررسی شود.'],
            ['Inspect both circumferential welds visually.','Perform PT on samples.','For destructive test, section the weld and check penetration.'])},
  {code:'T11', name:b('ضخامت و چسبندگی رنگ','Paint thickness & adhesion'), ref:'ISO 2808 · ISO 2409',
   eq:b('ضخامت‌سنج DFT، تیغ برش شطرنجی و چسب استاندارد','DFT gauge, cross-cut tool and tape'),
   acc:b('پیش‌فرض: DFT ≥ 70 µm ؛ چسبندگی کلاس 0 یا 1','Default: DFT ≥ 70 µm; adhesion class 0 or 1'),
   freq:b('نمونه از هر بچ رنگ','Sample per paint batch'),
   steps:b(['ضخامت رنگ خشک در ۵ نقطه اندازه‌گیری شود.','برش شطرنجی با فاصله ۱ تا ۲ میلی‌متر زده و چسب کنده شود.','کلاس چسبندگی ۰ تا ۵ ثبت شود.'],
            ['Measure dry film thickness at 5 points.','Make a 1–2 mm cross-cut, apply and pull tape.','Record adhesion class 0–5.'])},
  {code:'T12', name:b('سختی لاستیک (Shore A)','Rubber hardness (Shore A)'), ref:'ISO 7619-1 · ASTM D2240',
   eq:b('سختی‌سنج Shore A','Shore A durometer'),
   acc:b('مقدار اسمی ± 5 Shore A (مثلاً 60 ± 5)','Nominal ± 5 Shore A (e.g. 60 ± 5)'),
   freq:b('هر بچ لاستیک','Each rubber batch'),
   steps:b(['نمونه حداقل ۶ میلی‌متر ضخامت داشته باشد و در دمای ۲۳ درجه نگه داشته شود.','در ۵ نقطه با فاصله اندازه‌گیری و پس از ۳ ثانیه قرائت شود.','میانگین ثبت شود.'],
            ['Specimen ≥ 6 mm thick, conditioned at 23 °C.','Measure at 5 points, read after 3 s.','Record the average.'])},
  {code:'T13', name:b('چسبندگی/لغزش رینگ روی لوله','Ring adhesion / slip on tube'), ref:'Rulmeca (مرجع)',
   eq:b('آچار گشتاورسنج یا نیروسنج محوری','Torque wrench or axial force gauge'),
   acc:b('رینگ در گشتاور/نیروی تعیین‌شده نچرخد و جابه‌جا نشود','Ring must not rotate or slide at the specified torque/force'),
   freq:b('نمونه از هر بچ مونتاژ','Sample per assembly batch'),
   steps:b(['لوله ثابت شود.','گشتاور مماسی/نیروی محوری به رینگ اعمال شود.','لغزش یا جابه‌جایی ثبت شود.'],
            ['Fix the tube.','Apply tangential torque / axial force to the ring.','Record any slip or movement.'])},
  {code:'T14', name:b('بار استاتیک و ضربه','Static load & impact (drop) test'), ref:'CEMA 502 · Rulmeca',
   eq:b('پرس هیدرولیک، وزنه سقوط آزاد','Hydraulic press, drop weight'),
   acc:b('بدون تغییر شکل دائم لوله، ترک جوش یا آسیب بلبرینگ','No permanent tube deformation, weld crack or bearing damage'),
   freq:b('تأیید طرح','Design verification'),
   steps:b(['بار استاتیک ۲ برابر بار طراحی به مدت ۱ دقیقه اعمال شود.','وزنه از ارتفاع تعیین‌شده روی رولیک ضربه‌گیر رها شود.','TIR و مقاومت چرخشی دوباره کنترل شود.'],
            ['Apply 2× design load for 1 minute.','Drop the weight from the specified height on the impact roller.','Re-check TIR and rotational resistance.'])}
].map(t => Object.assign({id:'ts|'+t.code, src:'ref'}, t));

/* ── انواع پایه (Idler frames) ── */
const FRAMES = [
  {k:'t3', ang:[20,30,35,45], name:b('پایه ناودانی ۳ رولیکی','3-roll troughing set'),
   desc:b('رایج‌ترین پایه برای سمت رفت؛ رولیک وسط افقی و دو رولیک کناری با زاویه λ. زاویه بیشتر ← ظرفیت بیشتر و نیاز به نوار انعطاف‌پذیرتر.','Most common carrying set; centre roll horizontal, wing rolls at angle λ. Higher angle → more capacity, needs a more flexible belt.')},
  {k:'t3o', ang:[20,30,35,45], name:b('پایه ناودانی ۳ رولیکی جابه‌جا (Offset)','3-roll troughing set, offset centre'),
   desc:b('رولیک وسط جلوتر/عقب‌تر از رولیک‌های کناری؛ فاصله بین رولیک‌ها کمتر و مناسب نوارهای پرسرعت و سنگین.','Centre roll offset from wing rolls; smaller junction gap, suits fast and heavy belts.')},
  {k:'v2', ang:[20], name:b('پایه V دو رولیکی','2-roll V carrying set'),
   desc:b('برای نوارهای باریک و ظرفیت کم؛ ساختار ساده.','Narrow belts and low capacity; simple design.')},
  {k:'flat', ang:[0], name:b('پایه تخت رفت','Flat carrying idler'),
   desc:b('برای حمل بسته‌بندی/کیسه یا نوارهای سرند و پیکینگ.','For packages/bags, picking or sorting belts.')},
  {k:'ret', ang:[0], name:b('پایه برگشت تخت','Flat return idler'),
   desc:b('زیر شاسی آویزان می‌شود؛ رولیک ساده، لاستیکی یا خودتمیزکن.','Hung under the frame; plain, rubber-ring or self-cleaning roller.')},
  {k:'vret', ang:[10], name:b('پایه برگشت V (۱۰°)','V-return set (10°)'),
   desc:b('برای نوارهای عریض؛ به هدایت (مرکزیت) نوار در سمت برگشت کمک می‌کند.','Wide belts; helps centring the return belt.')},
  {k:'imp', ang:[20,30,35,45], name:b('پایه ضربه‌گیر','Impact set'),
   desc:b('زیر محل بارگیری با رولیک‌های ضربه‌گیر و فاصله کم (۰.۳ تا ۰.۶ متر)؛ جایگزین: بستر ضربه‌گیر (Impact bed).','Under loading zone, impact rollers at reduced pitch (0.3–0.6 m); alternative: impact bed.')},
  {k:'sa', ang:[20,30,35], name:b('پایه خودتنظیم (هدایت نوار)','Self-aligning (training) set'),
   desc:b('روی محور مرکزی دوران می‌کند و نوار منحرف را به مرکز برمی‌گرداند؛ هر ۱۵ تا ۳۰ متر در رفت و برگشت.','Pivots on a centre pin to re-centre a mistracking belt; every 15–30 m on carry and return.')},
  {k:'tr', ang:[0,10,20,30,35,45], name:b('پایه انتقالی (Transition)','Transition idlers'),
   desc:b('نزدیک درام‌ها با زاویه کمتر برای کاهش تنش لبه نوار هنگام تغییر از حالت ناودانی به تخت.','Near pulleys with reduced angle to limit belt edge stress between troughed and flat.')},
  {k:'gar', ang:[30,45], name:b('پایه آویز (گارلند) ۳ یا ۵ رولیکی','Garland (suspended) 3 / 5-roll'),
   desc:b('رولیک‌ها با زنجیر یا لینک به هم متصل و آویزانند؛ جذب ضربه و ظرفیت بالا در نوارهای سنگین معدنی.','Rolls linked and suspended; absorbs impact, high capacity on heavy mining belts.')},
  {k:'gd', ang:[90], name:b('براکت رولیک راهنما','Guide roller bracket'),
   desc:b('رولیک عمودی کنار نوار برای جلوگیری از خروج لبه نوار (فقط حفاظتی، نه هدایت دائمی).','Vertical roller at belt edge to stop belt run-off (protective, not continuous training).')}
];

/* ── راهنمای علائم ── */
const GLOSSARY = [
  ['D',b('قطر خارجی لوله رولیک','Roller tube outside diameter')],['s',b('ضخامت جداره لوله','Tube wall thickness')],
  ['B',b('طول لوله','Tube length')],['C',b('طول نصب؛ فاصله بین دو تخت شافت','Installed length; distance between spindle flats')],
  ['A',b('طول کل شافت','Overall spindle length')],['d',b('قطر شافت','Spindle diameter')],['d1',b('قطر شافت در محل هوزینگ','Spindle diameter at housing')],
  ['ch',b('عرض تخت (آچارخور) سر شافت','Width across spindle flats')],['e',b('فاصله تخت تا انتهای لوله','Flat to tube end distance')],['g',b('طول تخت سر شافت','Flat length')],
  ['øe',b('قطر خارجی رینگ لاستیکی','Rubber ring outside diameter')],['øi',b('قطر داخلی رینگ لاستیکی','Rubber ring bore')],
  ['ET',b('عرض لاستیک تخت','Flat ring width')],['ER',b('عرض لاستیک خم / نوک‌تیز (R دار)','Curved / pointed ring width')],
  ['E / E1',b('عرض رینگ (کاتالوگ رولمکا: E نوک‌تیز/ضربه‌گیر، E1 تخت)','Ring width (Rulmeca: E pointed/impact, E1 flat)')],
  ['a',b('طول دسته رینگ کناری','Side ring set length')],['b',b('فاصله رینگ‌های میانی','Pitch of central rings')],['t',b('فاصله بین دسته‌های کناری','Distance between side sets')],
  ['L',b('طول بخش مارپیچ','Helix length')],['BW',b('عرض نوار','Belt width')],['λ',b('زاویه ناودانی','Troughing angle')],['β',b('زاویه سرریز (Surcharge) دینامیکی','Dynamic surcharge angle')],
  ['δ',b('زاویه شیب نوار','Conveyor inclination')],['v',b('سرعت نوار','Belt speed')],['ρ',b('چگالی توده‌ای مواد','Bulk density')],
  ['Iv / Qm',b('ظرفیت جرمی (t/h)','Mass capacity (t/h)')],['Qv',b('ظرفیت حجمی (m³/h)','Volumetric capacity (m³/h)')],
  ['a0 / au',b('فاصله پایه‌های رفت / برگشت','Carrying / return idler pitch')],['qb',b('وزن نوار در متر','Belt mass per metre')],
  ['Ca / ca',b('بار روی پایه رفت / بار روی رولیک وسط','Load on carrying set / on centre roll')],['Cr / cr',b('بار روی پایه برگشت / رولیک برگشت','Load on return set / roller')],
  ['Fp',b('ضریب مشارکت رولیک پرباری','Participation factor of the most loaded roll')],['Fd',b('ضریب ضربه (اندازه کلوخه)','Impact (lump size) factor')],
  ['Fs',b('ضریب سرویس (ساعت کار)','Service factor (operating hours)')],['Fm',b('ضریب محیط','Environment factor')],
  ['C / C0',b('ظرفیت بار دینامیکی / استاتیکی بلبرینگ','Bearing dynamic / static load rating')],['L10h',b('عمر اسمی بلبرینگ (ساعت)','Bearing basic rating life (hours)')],
  ['TIR',b('لنگی کل قرائت‌شده (Run-out)','Total indicated run-out')],
  ['NA',b('رولیک ضربه‌گیر','Impact roller')],['NG',b('برگشت با رینگ نوک‌تیز','Return with pointed rings')],['NL',b('برگشت با دسته تخت کناری + نوک‌تیز میانی','Return with flat side sets + pointed centre')],
  ['NC',b('برگشت V با رینگ','V-return with rings')],['NM',b('خودتمیزکن مارپیچ لاستیکی','Self-cleaning rubber helix')],['S / NS',b('خودتمیزکن فنر فولادی','Self-cleaning steel spiral')],
  ['F / B',b('نوع سر شافت در کد سفارش (F: تخت‌دار، B: بوش‌دار)','Spindle end in order code (F: flats, B: bush)')],
  ['CEMA B…F',b('کلاس رولیک طبق CEMA 502','Idler class per CEMA 502')]
].map(([ab,desc]) => ({id:'gl|'+ab, ab, desc}));
