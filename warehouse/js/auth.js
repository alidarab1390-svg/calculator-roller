/* ورود کاربران، نقش‌ها و دسترسی‌ها، گزارش ورود، قفل خودکار */
'use strict';
const PERMS = {
  view: 'مشاهده موجودی', in: 'ثبت ورود کالا', out: 'ثبت خروج کالا', transfer: 'انتقال بین انبارها', loan: 'امانی (ارسال/برگشت)',
  edit: 'ویرایش اسناد ثبت‌شده', del: 'ابطال/حذف اسناد', approve: 'صدور مجوز ورود/خروج', qc: 'تایید کنترل کیفی',
  count: 'انبارگردانی', items: 'تعریف کالا و اطلاعات پایه', reports: 'گزارش‌ها', forms: 'سفارشی‌سازی فرم‌ها', settings: 'تنظیمات و همگام‌سازی', users: 'مدیریت کاربران'
};
const ROLES = {
  admin: {t: 'مدیر سیستم', p: Object.keys(PERMS)},
  manager: {t: 'مدیر انبار', p: ['view', 'in', 'out', 'transfer', 'loan', 'edit', 'del', 'approve', 'count', 'items', 'reports', 'forms']},
  keeper: {t: 'انباردار', p: ['view', 'in', 'out', 'transfer', 'loan', 'count', 'items', 'reports']},
  qc: {t: 'کنترل کیفی', p: ['view', 'qc', 'reports']},
  viewer: {t: 'فقط مشاهده', p: ['view', 'reports']}
};
const Auth = (() => {
  let cur = null, idleT = null;
  const hash = (u, p) => sha256('asaroul-wh|' + u.toLowerCase() + '|' + p);
  const device = () => { const ua = navigator.userAgent; const os = /Windows/.test(ua) ? 'ویندوز' : /Android/.test(ua) ? 'اندروید' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac/.test(ua) ? 'مک' : /Linux/.test(ua) ? 'لینوکس' : 'نامشخص'; const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''; return os + ' / ' + br + (matchMedia('(display-mode: standalone)').matches ? ' (نصب‌شده)' : ''); };
  function logLogin(username, ok, note) {
    DB.logins.unshift({id: uid(), u: Date.now(), at: nowStamp(), ts: Date.now(), user: username, ok, device: device(), online: navigator.onLine, note: note || ''});
    if (DB.logins.length > 5000) DB.logins.length = 5000; saveDB();
  }
  function resetIdle() { clearTimeout(idleT); const m = +DB.settings.sessionMin || 0; if (cur && m > 0) idleT = setTimeout(() => { logLogin(cur.username, true, 'قفل خودکار پس از ' + m + ' دقیقه بی‌کاری'); Auth.logout(true); }, m * 60000); }
  ['click', 'keydown', 'touchstart'].forEach(e => addEventListener(e, () => cur && resetIdle(), {passive: true}));
  return {
    hash, device,
    user: () => cur,
    name: () => cur ? (cur.name || cur.username) : 'سیستم',
    can: p => !!cur && (cur.role === 'admin' || (cur.perms || ROLES[cur.role].p).includes(p)),
    whAllowed: wh => !cur || !cur.whs || !cur.whs.length || cur.whs.includes(wh),
    needsSetup: () => !DB.users.length,
    async setup(name, username, pass) {
      const u = {id: uid(), u: Date.now(), name, username: username.trim(), pass: hash(username.trim(), pass), role: 'admin', active: true, whs: []};
      DB.users.push(u); cur = u; audit('ایجاد', 'users', u, 'مدیر سیستم در راه‌اندازی اولیه'); logLogin(u.username, true, 'راه‌اندازی اولیه'); await saveDB(); resetIdle(); return u;
    },
    login(username, pass) {
      username = toEn(username).trim();
      const u = DB.users.find(x => x.username.toLowerCase() === username.toLowerCase());
      if (!u || u.pass !== hash(u.username, toEn(pass))) { logLogin(username, false, 'رمز یا نام کاربری نادرست'); return 'نام کاربری یا رمز عبور نادرست است.'; }
      if (!u.active) { logLogin(username, false, 'حساب غیرفعال'); return 'این حساب غیرفعال شده است. با مدیر سیستم تماس بگیرید.'; }
      cur = u; u.lastLogin = nowStamp(); logLogin(u.username, true); try { sessionStorage.setItem('wh_user', u.id); } catch (e) {}
      resetIdle(); return null;
    },
    resume() { try { const id = sessionStorage.getItem('wh_user'); const u = id && byId('users', id); if (u && u.active) { cur = u; resetIdle(); return true; } } catch (e) {} return false; },
    logout(auto) { if (cur && !auto) logLogin(cur.username, true, 'خروج از حساب'); cur = null; clearTimeout(idleT); try { sessionStorage.removeItem('wh_user'); } catch (e) {} UI.showLogin(auto ? 'به دلیل بی‌کاری، برنامه قفل شد.' : ''); },
    setPass(u, p) { u.pass = hash(u.username, toEn(p)); }
  };
})();
