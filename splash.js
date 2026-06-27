/*!
 * مدرسك — Splash Screen v2.0
 * GSAP-powered | Zero FOUC | Minimal | 2.3s
 * ─────────────────────────────────────────
 * المتطلبات (مُضافة تلقائياً في index.html):
 *  • Anti-FOUC <style> في <head>
 *  • GSAP من cdnjs في <head>
 *  • HTML الشاشة inline في <body>
 */
(function () {
  'use strict';

  var KEY = 'mdrsk_splash_v2';
  var sp  = document.getElementById('ms-sp');

  /* ── إظهار محتوى الصفحة ─────────────────────────── */
  function showPage() {
    document.body.style.visibility = '';
    var f = document.getElementById('ms-fouc');
    if (f) f.remove();
  }

  /* ── هل الشاشة مطلوبة؟ ──────────────────────────── */
  var needed = true;
  try { if (sessionStorage.getItem(KEY)) needed = false; } catch (_) {}

  if (!needed) { showPage(); if (sp) sp.remove(); return; }

  showPage(); /* الـ overlay يغطي الصفحة */
  if (!sp) return;

  /* ══════════════════════════════════════════════════
     CSS — حقن ديناميكي
  ══════════════════════════════════════════════════ */
  var ST = document.createElement('style');
  ST.textContent = [
    /* reset داخل الشاشة فقط */
    '#ms-sp *{box-sizing:border-box;margin:0;padding:0}',

    /* نقطة الضوء — بسيطة وخفيفة */
    '#ms-glow{',
      'position:absolute;',
      'width:10px;height:10px;border-radius:50%;',
      'background:#2563EB;',
      'box-shadow:0 0 16px 6px rgba(37,99,235,.32);', /* ظل واحد خفيف */
    '}',

    /* غلاف الشعار */
    '#ms-logo-wrap{',
      'position:relative;display:flex;',
      'align-items:center;justify-content:center;',
      'margin-bottom:28px;',
    '}',

    /* هالة — خفيفة جداً */
    '#ms-ring{',
      'position:absolute;width:148px;height:148px;',
      'border-radius:50%;',
      'background:radial-gradient(circle,rgba(37,99,235,.055) 0%,transparent 60%);',
    '}',

    /* غلاف يُدار للـ scale + opacity */
    '#ms-logo-w{position:relative;z-index:1}',

    /* الشعار — نظيف بدون زخرفة */
    '#ms-logo{',
      'width:96px;height:96px;',
      'object-fit:contain;',
      'border-radius:20px;',
      'display:block;',
    '}',

    /* كتلة النص */
    '#ms-brand{text-align:center}',

    '#ms-name{',
      'font-family:"Cairo","Tajawal",sans-serif;',
      'font-size:2.4rem;font-weight:900;',
      'color:#0D1B4B;letter-spacing:-.5px;line-height:1.15;',
    '}',

    /* الخط المتدرج */
    '#ms-line{',
      'height:2.5px;width:138px;',
      'background:linear-gradient(90deg,#2563EB 0%,#0EA5E9 50%,#10B981 100%);',
      'border-radius:50px;margin:11px auto;',
    '}',

    /* الشعار الفرعي */
    '#ms-tagline{',
      'font-family:"Tajawal","Cairo",sans-serif;',
      'font-size:.87rem;font-weight:500;',
      'color:#64748B;letter-spacing:.2px;',
    '}',

    /* رسالة التخطي */
    '#ms-skip{',
      'position:absolute;bottom:24px;',
      'font-family:"Tajawal",sans-serif;',
      'font-size:.68rem;color:#D1D5DB;',
      'left:0;right:0;text-align:center;',
    '}',

    /* موبايل */
    '@media(max-width:400px){',
      '#ms-logo{width:80px;height:80px;border-radius:16px}',
      '#ms-name{font-size:2rem}',
      '#ms-ring{width:128px;height:128px}',
      '#ms-line{width:114px}',
    '}',

    /* تقليل الحركة */
    '@media(prefers-reduced-motion:reduce){',
      '#ms-sp{transition:none!important}',
    '}',
  ].join('');
  document.head.appendChild(ST);

  /* ══════════════════════════════════════════════════
     منطق الإنهاء والتخطي
  ══════════════════════════════════════════════════ */
  var done = false;
  var _tl  = null; /* مرجع الـ timeline لإلغائها عند التخطي */

  function cleanup() {
    try { sp.remove(); ST.remove(); } catch (_) {}
    try { sessionStorage.setItem(KEY, '1'); } catch (_) {}
  }

  /* نهاية طبيعية — Fade Out ثم تنظيف */
  function end() {
    if (done) return; done = true;
    if (typeof gsap !== 'undefined') {
      gsap.to(sp, { opacity:0, duration:.4, ease:'power2.inOut', onComplete:cleanup });
    } else {
      sp.style.transition = 'opacity .4s ease';
      sp.style.opacity    = '0';
      setTimeout(cleanup, 420);
    }
  }

  /* تخطي بالضغط — Fade Out سريع */
  function skip() {
    if (done) return; done = true;
    if (_tl) _tl.kill();
    if (typeof gsap !== 'undefined') {
      gsap.to(sp, { opacity:0, duration:.22, ease:'power2.inOut', onComplete:cleanup });
    } else {
      sp.style.transition = 'opacity .22s ease';
      sp.style.opacity    = '0';
      setTimeout(cleanup, 240);
    }
  }

  sp.addEventListener('click',    skip, { once:true });
  sp.addEventListener('touchend', skip, { once:true, passive:true });

  /* ══════════════════════════════════════════════════
     GSAP Timeline — المدة الكلية: ~2.3 ثانية
  ══════════════════════════════════════════════════ */
  function run() {

    /* Fallback إذا لم يُحمَّل GSAP */
    if (typeof gsap === 'undefined') {
      setTimeout(end, 2300);
      return;
    }

    var G  = document.getElementById('ms-glow');
    var LW = document.getElementById('ms-logo-w');
    var L  = document.getElementById('ms-logo');
    var RN = document.getElementById('ms-ring');
    var B  = document.getElementById('ms-brand');
    var LN = document.getElementById('ms-line');
    var TG = document.getElementById('ms-tagline');
    var SK = document.getElementById('ms-skip');

    /* ── الحالة الأولية (كل شيء مخفي) ─────────────── */
    gsap.set(G,  { opacity:0, scale:0 });
    gsap.set(LW, { opacity:0, scale:.6 });
    gsap.set(L,  { filter:'blur(12px)' });
    gsap.set(RN, { opacity:0 });
    gsap.set(B,  { opacity:0, y:18 });
    gsap.set(LN, { scaleX:0, transformOrigin:'center center' });
    gsap.set(TG, { opacity:0, y:5 });
    gsap.set(SK, { opacity:0 });

    /* ── Timeline ───────────────────────────────────── */
    _tl = gsap.timeline({ onComplete:end });

    _tl

      /* 0.00s — نقطة الضوء تظهر */
      .to(G, {
        opacity: 1, scale: 1,
        duration: .24, ease: 'back.out(2.5)'
      })

      /* 0.28s — الشعار يظهر: Blur → Clear, Scale .6 → 1, Opacity 0 → 1 */
      .to(LW, {
        opacity: 1, scale: 1,
        duration: .44, ease: 'power3.out'
      }, .28)
      .to(L, {
        filter: 'blur(0px)',
        duration: .44, ease: 'power2.out'
      }, .28)

      /* 0.30s — نقطة الضوء تتبخر */
      .to(G, {
        opacity: 0, scale: 4.5,
        duration: .2, ease: 'power2.in'
      }, .30)

      /* 0.58s — هالة خفيفة جداً تظهر */
      .to(RN, {
        opacity: 1,
        duration: .3, ease: 'power2.out'
      }, .58)

      /* 0.74s — Pulse واحد بعد اكتمال ظهور الشعار */
      .to(LW, { scale: 1.052, duration: .17, ease: 'power2.out' }, .74)
      .to(LW, { scale: 1,     duration: .2,  ease: 'power2.in'  }, .91)

      /* 1.06s — اسم المنصة يصعد للأعلى */
      .to(B, {
        opacity: 1, y: 0,
        duration: .28, ease: 'power3.out'
      }, 1.06)

      /* 1.20s — الخط يتمدد بـ scaleX */
      .to(LN, {
        scaleX: 1,
        duration: .32, ease: 'power3.inOut'
      }, 1.20)

      /* 1.34s — الشعار الفرعي */
      .to(TG, {
        opacity: 1, y: 0,
        duration: .24, ease: 'power2.out'
      }, 1.34)

      /* 1.60s — رسالة التخطي تظهر ببطء */
      .to(SK, {
        opacity: 1,
        duration: .28, ease: 'power2.out'
      }, 1.60)

      /* 1.90s — Fade Out الشاشة بالكامل */
      .to(sp, {
        opacity: 0,
        duration: .4, ease: 'power2.inOut'
      }, 1.90);

    /* الإجمالي ≈ 2.30 ثانية */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();
