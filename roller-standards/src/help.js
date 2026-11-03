/* ═══ خودآموز: توضیح فیلدها (ⓘ) و راهنمای بخش‌ها (📘) ═══ */
const HINTS = {
  /* طراحی کامل نوار */
  mat: b('ماده‌ای که حمل می‌شود. با انتخاب آن چگالی و زاویه سرریز خودکار پر می‌شوند. اگر در لیست نیست، نزدیک‌ترین را انتخاب و چگالی را دستی وارد کنید.','Material to convey. Density and surcharge angle fill in automatically. If it is not listed, pick the closest and type the density.'),
  Q: b('ظرفیت طراحی: بیشترین تُن مواد در ساعت (نه متوسط). مثال: 800','Design capacity: maximum tonnes per hour (not average). Example: 800'),
  rho: b('چگالی توده‌ای = وزن یک متر مکعب مواد ریخته‌شده (تن بر متر مکعب). از ماده پر می‌شود؛ اگر عدد آزمایشگاهی دارید آن را وارد کنید. مثال: زغال 0.8 ، سنگ آهن 2.4','Bulk density = mass of one cubic metre of loose material (t/m³). Filled from the material; enter a lab value if you have one. E.g. coal 0.8, iron ore 2.4'),
  beta: b('زاویه سطح مواد روی نوار در حال حرکت (معمولاً 10 تا 25 درجه). از ماده پر می‌شود.','Angle of the material surface on the moving belt (usually 10–25°). Filled from the material.'),
  lump: b('بزرگ‌ترین اندازه کلوخه‌ها؛ برای ضریب ضربه رولیک‌ها و ضخامت روکش تسمه.','Largest lump size; used for the roller impact factor and belt cover thickness.'),
  drop: b('ارتفاع سقوط مواد از شوت تا روی نوار در محل بارگیری (متر). مثال: 1.5','Free-fall height from the chute onto the belt (m). Example: 1.5'),
  temp: b('دمای مواد هنگام بارگیری. بالاتر از 60 درجه، تسمه مقاوم به حرارت انتخاب می‌شود.','Material temperature at loading. Above 60 °C a heat-resistant belt is selected.'),
  sticky: b('اگر مواد به نوار می‌چسبد (خاک رس، مواد مرطوب)، رولیک برگشت لاستیکی و بلت کلینر ثانویه انتخاب می‌شود.','Tick if material sticks to the belt (clay, wet material): rubber-ring return rollers and a secondary cleaner are selected.'),
  wet: b('محیط یا مواد خیس؛ اصطکاک درام محرک کمتر در نظر گرفته می‌شود.','Wet conditions; lower drive-pulley friction is assumed.'),
  oil: b('مواد روغنی؛ تسمه با روکش مقاوم به روغن انتخاب می‌شود.','Oily material; an oil-resistant cover is selected.'),
  fire: b('معدن زیرزمینی یا محیط با خطر آتش؛ تسمه ضد آتش انتخاب می‌شود.','Underground or fire-risk area; a fire-resistant belt is selected.'),
  L: b('فاصله مرکز درام سر تا مرکز درام دم، در امتداد نوار (متر). مثال: 150','Distance between head and tail pulley centres along the belt (m). Example: 150'),
  H: b('اختلاف ارتفاع دو سر نوار (متر). بالارو مثبت، سرازیر منفی، افقی صفر.','Height difference between the ends (m). Uphill positive, downhill negative, horizontal 0.'),
  v: b('سرعت نوار (متر بر ثانیه). خالی بگذارید تا بر اساس سایندگی ماده پیشنهاد شود (معمولاً 1.5 تا 4).','Belt speed (m/s). Leave blank for a suggestion based on abrasiveness (usually 1.5–4).'),
  bw: b('عرض نوار. «خودکار» کوچک‌ترین عرضی را انتخاب می‌کند که ظرفیت را با 10٪ حاشیه بدهد.','Belt width. “Auto” picks the smallest width giving the capacity with a 10% margin.'),
  arr: b('شکل پایه‌های رفت. ناودانی سه‌رولیکی رایج‌ترین است.','Carrying idler shape. 3-roll troughed is the most common.'),
  lam: b('زاویه رولیک‌های کناری. 35 درجه رایج است؛ زاویه بیشتر = ظرفیت بیشتر.','Wing roll angle. 35° is common; larger angle = more capacity.'),
  rarr: b('شکل پایه‌های برگشت. خودکار: تخت، و برای عرض 1200 و بیشتر V.','Return idler shape. Auto: flat, V for widths of 1200 and above.'),
  hLeg: b('ارتفاع متوسط پایه‌های سازه از زمین تا شاسی (متر)؛ برای وزن پایه‌ها.','Average height of the support legs (m); used for leg weight.'),
  walk: b('راهروی سرویس کنار نوار (گریتینگ و نرده)؛ در وزن سازه حساب می‌شود.','Service walkway beside the conveyor (grating and handrail); included in structure weight.'),
  cover: b('چند درصد طول نوار کاور (پوشش) دارد.','Percentage of the conveyor length that is covered.'),
  fs: b('ساعت کار روزانه؛ روی ضریب بار رولیک‌ها و ضریب سرویس گیربکس اثر دارد.','Daily operating hours; affects roller load factor and gearbox service factor.'),
  fm: b('شرایط محیط از نظر گرد و غبار، سایش و خوردگی.','Environment: dust, abrasion and corrosion.'),
  f: b('ضریب اصطکاک فرضی DIN 22101. برای شرایط عادی 0.020 را نگه دارید.','DIN 22101 artificial friction factor. Keep 0.020 for normal conditions.'),
  beltType: b('EP پارچه‌ای برای بیشتر نوارها؛ ST سیم‌فولادی برای نوارهای بلند و کشش زیاد.','EP fabric for most conveyors; ST steel cord for long, high-tension conveyors.'),
  wrap: b('زاویه پیچیدن تسمه دور درام محرک. با درام اسناب (210 یا 240 درجه) کشش کمتری لازم است.','Belt wrap on the drive pulley. With a snub pulley (210° / 240°) less tension is needed.'),
  lag: b('روکش درام محرک برای اصطکاک بیشتر؛ سرامیکی برای محیط خیس و کشش زیاد.','Drive pulley lagging for grip; ceramic for wet, high-tension duty.'),
  lagAll: b('روکش لاستیکی روی درام‌های غیرمحرک برای کاهش سایش و چسبندگی.','Rubber lagging on non-drive pulleys to reduce wear and build-up.'),
  start: b('روش راه‌اندازی موتور؛ روی نیروی لحظه راه‌اندازی و استحکام لازم تسمه اثر دارد.','Motor starting method; affects start-up force and required belt strength.'),
  eta: b('راندمان گیربکس و کوپلینگ؛ معمولاً 0.90 تا 0.95.','Gearbox and coupling efficiency; usually 0.90–0.95.'),
  takeup: b('سیستم کشش تسمه. خودکار: پیچی تا 60 متر، وزنه‌ای برای نوارهای بلندتر.','Take-up system. Auto: screw up to 60 m, gravity for longer conveyors.'),
  secBlade: b('جنس تیغه بلت کلینر ثانویه آسارول. خودکار بر اساس سرعت و سایندگی.','Asaroll secondary cleaner blade. Auto by speed and abrasiveness.'),
  heavy: b('برای کاربرد صنعتی سنگین، سری‌های سبک (M، RTL، MPS) حذف شوند.','For heavy industrial duty exclude light series (M, RTL, MPS).'),
  poly: b('اجازه انتخاب رولیک با لوله پلیمری (برای محیط خورنده).','Allow polymer-tube rollers (corrosive environments).'),
  /* محاسبه ظرفیت و بار */
  c_mat: b('ماده را انتخاب کنید تا چگالی و زاویه سرریز پر شود.','Pick a material to fill density and surcharge angle.'),
  c_Q: b('اگر ظرفیت لازم را وارد کنید، کمترین عرض نوار کافی مشخص می‌شود.','Enter the required capacity to get the minimum sufficient belt width.'),
  c_delta: b('زاویه شیب نوار نسبت به افق (درجه). افقی صفر.','Belt inclination from horizontal (°). Horizontal 0.'),
  l_a0: b('فاصله بین دو پایه رفت (متر). دکمه «پیشنهاد DIN» بر اساس عرض و چگالی پر می‌کند.','Distance between carrying idlers (m). “DIN suggestion” fills it from width and density.'),
  l_au: b('فاصله بین دو پایه برگشت (متر). معمولاً 3.','Distance between return idlers (m). Usually 3.'),
  l_qb: b('وزن هر متر تسمه (کیلوگرم). دکمه «تخمین» برای تسمه EP معمولی پر می‌کند.','Belt mass per metre (kg). “Estimate” fills a typical EP value.'),
  l_life: b('عمر مورد انتظار بلبرینگ رولیک (ساعت). معمولاً 30000.','Required roller bearing life (h). Usually 30,000.')
};
const GUIDES = {
  wiz: b(['ماده و ظرفیت (تن بر ساعت) را وارد کنید؛ چگالی خودکار پر می‌شود.','طول نوار و اختلاف ارتفاع را وارد کنید. بقیه را می‌توانید روی «خودکار» بگذارید.','در صورت نیاز «شرایط کار، تسمه و محرک» را باز و تنظیم کنید.','نتیجه بلافاصله در تب‌های پایین می‌آید: خلاصه، محاسبات، رولیک‌ها، تسمه، درام‌ها، موتور و گیربکس، بلت کلینر، وزن.','هر انتخاب خودکار (رولیک، تسمه، درام، موتور، نسبت گیربکس) را می‌توانید از منوی همان تب عوض کنید.','در «وزن و لیست قطعات» تعداد و وزن هر قطعه قابل ویرایش است.','پروژه را ذخیره کنید و «گزارش کامل PDF» یا «گزارش اکسل» بگیرید.'],
    ['Enter material and capacity (t/h); density fills in automatically.','Enter conveyor length and lift. Everything else can stay on “auto”.','If needed open “Operation, belt & drive” and adjust.','Results appear immediately in the tabs below: summary, calculations, idlers, belt, pulleys, motor & gearbox, cleaners, weights.','Every automatic choice (roller, belt, pulley, motor, ratio) can be changed from that tab’s menu.','In “Weights & BOM” each quantity and mass is editable.','Save the project and export the full PDF or Excel report.']),
  cap: b(['روش را انتخاب کنید: DIN/ISO (متریک) یا CEMA (اینچی).','ماده را انتخاب کنید یا چگالی و زاویه سرریز را وارد کنید.','عرض، چیدمان، زاویه و سرعت را تنظیم کنید؛ ظرفیت فوراً محاسبه می‌شود.','برای پیدا کردن عرض لازم، «ظرفیت لازم» را وارد کنید؛ ردیف‌های سبز کافی هستند.'],
    ['Choose the method: DIN/ISO (metric) or CEMA (imperial).','Pick a material or enter density and surcharge angle.','Set width, arrangement, angle and speed; capacity updates instantly.','Enter the “required capacity” to find the width; green rows are sufficient.']),
  load: b(['ظرفیت، سرعت، عرض و چیدمان نوار را وارد کنید.','فاصله پایه‌ها را وارد کنید یا «پیشنهاد DIN» را بزنید.','قطر رولیک و ضرایب (کلوخه، ساعت کار، محیط) را انتخاب کنید.','جدول پایین عمر بلبرینگ هر سری را نشان می‌دهد؛ ردیف سبز مناسب است و سبک‌ترین سری مناسب پیشنهاد می‌شود.'],
    ['Enter capacity, speed, width and arrangement.','Enter idler pitches or press “DIN suggestion”.','Choose roller diameter and factors (lump size, hours, environment).','The table shows bearing life per series; green rows pass and the lightest suitable series is suggested.']),
  ds: b(['در کادر جستجو هر چیزی تایپ کنید (مثلاً «ASA-2 133» یا «6205»).','با دکمه‌های گروه (بالای جدول) و فیلترها نتیجه را محدود کنید.','روی هر ردیف کلیک کنید تا تصویر و مشخصات کامل باز شود.','از دکمه‌های Excel و PDF برای خروجی همین نتیجه فیلترشده استفاده کنید.','برای افزودن یا ویرایش، قفل 🔒 بالای صفحه را با رمز مدیر باز کنید.'],
    ['Type anything in the search box (e.g. “ASA-2 133” or “6205”).','Narrow results with the group buttons and filters.','Click a row to open its drawing and full specification.','Use Excel and PDF to export the filtered result.','To add or edit, unlock 🔒 at the top with the admin password.']),
  cards: b(['روی هر کارت کلیک کنید تا تصویر و توضیح کامل آن باز شود.','در پنجره باز شده می‌توانید چاپ یا PDF بگیرید.'],
    ['Click a card to open its drawing and full description.','You can print or save as PDF from that window.'])
};
const WELCOME = b(['📚 <b>رولیک‌ها، لوله‌ها، شافت‌ها، بلبرینگ، لاستیک و پایه‌ها:</b> جدول‌ها و کارت‌های مرجع با تصویر.','🧮 <b>طراحی و محاسبات:</b> طراحی کامل نوار نقاله از ظرفیت تا لیست قطعات و وزن.','🧪 <b>آزمایش‌ها:</b> روش انجام و فرم ثبت نتایج قابل چاپ.','ⓘ کنار هر فیلد = توضیح کوتاه؛ 📘 در هر بخش = راهنمای قدم‌به‌قدم؛ ❓ بالای صفحه = لینک، نصب و پشتیبان‌گیری.','EN / فا = تغییر زبان کل برنامه.'],
  ['📚 <b>Rollers, tubes, shafts, bearings, rubber and frames:</b> reference tables and illustrated cards.','🧮 <b>Design & calculations:</b> complete conveyor design from capacity to BOM and weights.','🧪 <b>Tests:</b> methods and printable record forms.','ⓘ next to a field = short explanation; 📘 in each section = step-by-step guide; ❓ at the top = link, install and backup.','EN / فا switches the whole app language.']);

const tip = h => h ? `<span class="tip" tabindex="0" role="note" data-tip="${esc(L(h))}" onclick="event.preventDefault();event.stopPropagation();this.focus()">ⓘ</span>` : '';
const guideBtn = k => `<button class="gbtn" type="button" onclick="showGuide('${k}')">📘 ${esc(L(b('راهنما','Guide')))}</button>`;
window.showGuide = k => {
  const g = L(GUIDES[k]) || [];
  openModal('📘 ' + L(b('راهنمای این بخش','Guide to this section')), `<ol class="steps">${g.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`);
};
function showWelcome(){
  if (LS.get('rs_welcomed', false)) return;
  openModal('👋 ' + L(b('به «رولیک و استانداردها» خوش آمدید','Welcome to “Rollers & Standards”')), `<ul class="steps">${L(WELCOME).map(s => `<li>${s}</li>`).join('')}</ul>`,
    `<button class="btn pri" onclick="LS.set('rs_welcomed', true); closeModal()">✓ ${esc(L(b('متوجه شدم','Got it')))}</button>`);
}

/* حباب توضیح: یک کادر ثابت که همیشه داخل صفحه می‌ماند (موس، لمس، کیبورد) */
(() => {
  let box = null, cur = null;
  const show = t => { if (!box){ box = document.createElement('div'); box.id = 'tipbox'; document.body.appendChild(box); }
    cur = t; box.textContent = t.dataset.tip; box.dir = document.documentElement.dir || 'rtl'; box.style.display = 'block';
    const r = t.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
    let x = (box.dir === 'rtl' ? r.right - w : r.left), y = r.bottom + 6;
    x = Math.max(12, Math.min(x, innerWidth - w - 12)); if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 6);
    box.style.left = x + 'px'; box.style.top = y + 'px'; };
  const hide = () => { if (box) box.style.display = 'none'; cur = null; };
  document.addEventListener('mouseover', e => { const t = e.target.closest && e.target.closest('.tip'); if (t) show(t); else if (cur && document.activeElement !== cur) hide(); });
  document.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('.tip'); if (t) show(t); else hide(); });
  document.addEventListener('focusout', e => { if (e.target === cur) hide(); });
  addEventListener('scroll', () => { if (cur) show(cur); }, true);
})();
