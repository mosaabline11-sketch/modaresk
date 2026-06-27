/*!
 * مدرسك — Splash Screen v1.0
 * شاشة افتتاحية احترافية بـ HTML + CSS + JavaScript بحت
 * ─────────────────────────────────────────────────────
 * للتفعيل: أضف هذا السطر الواحد مباشرة بعد <body> في index.html
 *   <script src="splash.js?v=1.0"></script>
 *
 * لإعادة الاختبار: افتح Console وأكتب:
 *   localStorage.removeItem('mdrsk_splash_v1')
 * ─────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  // ══════════════════════════════════════════════════
  // الإعدادات
  // ══════════════════════════════════════════════════
  const KEY     = 'mdrsk_splash_v1';   // مفتاح localStorage
  const LOGO    = 'logo.png';           // مسار الشعار (نفس مجلد index.html)

  // توقيتات الأنيميشن بالملي ثانية
  const T = {
    glow    :   50,   // نقطة الضوء
    logo    :  500,   // ظهور الشعار
    ring    :  710,   // هالة الضوء حول الشعار
    pulse   : 1250,   // نبضة الشعار
    text    : 2000,   // كتلة النص
    line    : 2215,   // الخط المتدرج
    tag     : 2330,   // الشعار الفرعي
    fadeOut : 2850,   // بداية الاختفاء
    remove  : 3440    // إزالة العنصر من DOM
  };

  // ── لا تُظهر الشاشة إذا سبق وظهرت ──────────────
  try { if (localStorage.getItem(KEY)) return; } catch (_) {}

  // ══════════════════════════════════════════════════
  // CSS (مُحقَن برمجياً — لا ملف إضافي)
  // ══════════════════════════════════════════════════
  const CSS = `

    /* ── Keyframes ───────────────────────────────── */

    @keyframes ms-gi {
      from { opacity:0; transform:scale(0) }
      to   { opacity:1; transform:scale(1) }
    }
    @keyframes ms-go {
      to { opacity:0; transform:scale(7); filter:blur(4px) }
    }
    @keyframes ms-li {
      0%   { opacity:0; transform:scale(.45) rotate(-6deg) }
      62%  { opacity:1; transform:scale(1.07) rotate(1.5deg) }
      100% { opacity:1; transform:scale(1)    rotate(0deg) }
    }
    @keyframes ms-lp {
      0%,100% { transform:scale(1) }
      48%     { transform:scale(1.09); filter:brightness(1.06) }
    }
    @keyframes ms-bi {
      from { opacity:0; transform:translateY(24px) }
      to   { opacity:1; transform:translateY(0) }
    }
    @keyframes ms-lg {
      from { transform:scaleX(0) }
      to   { transform:scaleX(1) }
    }
    @keyframes ms-ti {
      from { opacity:0; transform:translateY(8px) }
      to   { opacity:1; transform:translateY(0) }
    }
    @keyframes ms-sk {
      to { opacity:1 }
    }
    @keyframes ms-dots {
      0%,80%,100% { transform:scale(0) }
      40%         { transform:scale(1) }
    }

    /* ── الغلاف الرئيسي ──────────────────────────── */
    #ms-sp {
      position     : fixed;
      inset        : 0;
      background   : #FFFFFF;
      z-index      : 99999;
      display      : flex;
      align-items  : center;
      justify-content: center;
      flex-direction : column;
      font-family  : 'Tajawal','Cairo',system-ui,sans-serif;
      direction    : rtl;
      cursor       : pointer;
      will-change  : opacity;
      -webkit-tap-highlight-color: transparent;
    }

    /* حالة الاختفاء */
    #ms-sp.ms-x {
      opacity        : 0;
      pointer-events : none;
      transition     : opacity .58s cubic-bezier(.4,0,.2,1);
    }

    /* ── نقطة الضوء ──────────────────────────────── */
    #ms-glow {
      position     : absolute;
      width        : 14px;
      height       : 14px;
      border-radius: 50%;
      background   : #2563EB;
      opacity      : 0;
      will-change  : transform, opacity;
      box-shadow   :
        0  0 26px 11px rgba(37,99,235,.55),
        0  0 75px 32px rgba(37,99,235,.18),
        0  0 120px 55px rgba(14,165,233,.10);
    }
    #ms-glow.gi { animation: ms-gi .38s cubic-bezier(.34,1.56,.64,1) forwards }
    #ms-glow.go { animation: ms-go .38s ease forwards }

    /* ── غلاف الشعار ─────────────────────────────── */
    #ms-lw {
      position       : relative;
      display        : flex;
      align-items    : center;
      justify-content: center;
      margin-bottom  : 30px;
    }

    /* هالة ضوئية حول الشعار */
    #ms-ring {
      position     : absolute;
      width        : 168px;
      height       : 168px;
      border-radius: 50%;
      background   : radial-gradient(
        circle,
        rgba(37,99,235,.12) 0%,
        rgba(14,165,233,.06) 40%,
        transparent 68%
      );
      opacity    : 0;
      transition : opacity .55s ease;
    }
    #ms-lw.rn #ms-ring { opacity: 1 }

    /* الشعار */
    #ms-logo {
      width        : 100px;
      height       : 100px;
      object-fit   : contain;
      border-radius: 22px;
      opacity      : 0;
      transform    : scale(.45) rotate(-6deg);
      position     : relative;
      z-index      : 1;
      will-change  : transform, opacity;
      box-shadow   :
        0 10px 40px rgba(37,99,235,.22),
        0  2px  8px rgba(0,0,0,.07);
    }
    #ms-logo.li { animation: ms-li .58s cubic-bezier(.34,1.4,.64,1) forwards }
    #ms-logo.lp { animation: ms-lp .46s ease-in-out forwards }

    /* ── كتلة النص ───────────────────────────────── */
    #ms-brd {
      text-align  : center;
      opacity     : 0;
      transform   : translateY(24px);
      will-change : transform, opacity;
    }
    #ms-brd.bi { animation: ms-bi .52s cubic-bezier(.34,1.2,.64,1) forwards }

    #ms-name {
      font-family  : 'Cairo','Tajawal',sans-serif;
      font-size    : 2.5rem;
      font-weight  : 900;
      color        : #0D1B4B;
      letter-spacing: -.5px;
      line-height  : 1.15;
    }

    /* الخط المتدرج */
    #ms-ln {
      height          : 3px;
      width           : 148px;
      margin          : 12px auto;
      border-radius   : 50px;
      background      : linear-gradient(90deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%);
      transform       : scaleX(0);
      transform-origin: center;
      will-change     : transform;
    }
    #ms-ln.lg { animation: ms-lg .5s cubic-bezier(.25,1,.5,1) forwards }

    /* الشعار الفرعي */
    #ms-tag {
      font-size     : .88rem;
      color         : #64748B;
      font-weight   : 500;
      letter-spacing: .3px;
      opacity       : 0;
    }
    #ms-tag.ti { animation: ms-ti .42s ease forwards }

    /* رسالة التخطي */
    #ms-skip {
      position   : absolute;
      bottom     : 28px;
      left       : 0;
      right      : 0;
      text-align : center;
      font-size  : .68rem;
      color      : #CBD5E1;
      opacity    : 0;
      animation  : ms-sk .3s ease 1.9s forwards;
    }

    /* ── احترام تفضيل تقليل الحركة ───────────────── */
    @media (prefers-reduced-motion: reduce) {
      #ms-logo.li, #ms-logo.lp,
      #ms-glow.gi, #ms-glow.go,
      #ms-brd.bi, #ms-ln.lg, #ms-tag.ti {
        animation-duration: .01ms !important;
      }
      #ms-sp.ms-x { transition-duration: .2s }
    }

    /* ── شاشات صغيرة ─────────────────────────────── */
    @media (max-width: 400px) {
      #ms-logo { width:82px; height:82px; border-radius:18px }
      #ms-name  { font-size:2rem }
      #ms-ring  { width:138px; height:138px }
      #ms-ln    { width:120px }
    }
  `;

  // ══════════════════════════════════════════════════
  // المؤثرات الصوتية — Web Audio API
  // (تعمل مع Chrome/Firefox، قد تُصمَت على iOS بدون تفاعل)
  // ══════════════════════════════════════════════════
  let _ac = null;

  function getAC() {
    if (_ac && _ac.state !== 'closed') return _ac;
    if (_ac === false) return null;
    try {
      _ac = new (window.AudioContext || window.webkitAudioContext)();
      if (_ac.state === 'suspended') _ac.resume().catch(() => {});
    } catch (_) { _ac = false; return null; }
    return _ac;
  }

  /* ── Whoosh: هواء خفيف عند نقطة الضوء ─────────── */
  function snd_whoosh() {
    const c = getAC(); if (!c) return;
    try {
      const n   = Math.floor(c.sampleRate * .45);
      const buf = c.createBuffer(1, n, c.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < n; i++)
        d[i] = (Math.random() * 2 - 1) * Math.exp(-3.8 * i / n);

      const src = c.createBufferSource(); src.buffer = buf;
      const flt = c.createBiquadFilter();
      flt.type = 'bandpass'; flt.Q.value = 1.2;
      flt.frequency.setValueAtTime(1600, c.currentTime);
      flt.frequency.exponentialRampToValueAtTime(120, c.currentTime + .45);

      const g = c.createGain();
      g.gain.setValueAtTime(.13, c.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .45);

      src.connect(flt); flt.connect(g); g.connect(c.destination);
      src.start();
    } catch (_) {}
  }

  /* ── Sparkle/Chime: أربع نغمات تصاعدية ─────────── */
  function snd_sparkle() {
    const c = getAC(); if (!c) return;
    try {
      [1047, 1319, 1568, 2093].forEach((freq, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        const t = c.currentTime + i * .062;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(.078, t + .03);
        g.gain.exponentialRampToValueAtTime(.0001, t + .36);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + .4);
      });
    } catch (_) {}
  }

  /* ── Page Flip: صوت تقليب صفحة كتاب ───────────── */
  function snd_pageFlip() {
    const c = getAC(); if (!c) return;
    try {
      [[660, 185, .08, 0], [400, 145, .045, .082]].forEach(([f1, f2, vol, dt]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        const t = c.currentTime + dt;
        o.frequency.setValueAtTime(f1, t);
        o.frequency.exponentialRampToValueAtTime(f2, t + .2);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(.0001, t + .22);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + .26);
      });
    } catch (_) {}
  }

  /* ── Success Ding: وتر C ماجور للنجاح ──────────── */
  function snd_ding() {
    const c = getAC(); if (!c) return;
    try {
      // C5 - E5 - G5 - C6
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        const t   = c.currentTime + i * .042;
        const vol = [.08, .07, .055, .034][i];
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + .03);
        g.gain.exponentialRampToValueAtTime(.0001, t + .68);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + .72);
      });
    } catch (_) {}
  }

  // ══════════════════════════════════════════════════
  // تسلسل الأنيميشن
  // ══════════════════════════════════════════════════
  let sp, done = false;

  function end() {
    if (done) return;
    done = true;
    sp && sp.classList.add('ms-x');
    setTimeout(() => {
      try { sp && sp.remove(); }           catch (_) {}
      try { localStorage.setItem(KEY,'1'); } catch (_) {}
    }, T.remove - T.fadeOut + 10);
  }

  function runAnim() {
    const G  = document.getElementById('ms-glow');
    const LW = document.getElementById('ms-lw');
    const L  = document.getElementById('ms-logo');
    const B  = document.getElementById('ms-brd');
    const LN = document.getElementById('ms-ln');
    const TG = document.getElementById('ms-tag');

    /* 0.05s — نقطة ضوء + Whoosh ─────────────────── */
    setTimeout(() => {
      G && G.classList.add('gi');
      snd_whoosh();
    }, T.glow);

    /* 0.5s — شعار يظهر + Sparkle ──────────────── */
    setTimeout(() => {
      if (G) { G.classList.remove('gi'); G.classList.add('go'); }
      L && L.classList.add('li');
      snd_sparkle();
    }, T.logo);

    /* 0.71s — هالة الضوء ────────────────────────── */
    setTimeout(() => { LW && LW.classList.add('rn'); }, T.ring);

    /* 1.25s — نبضة + Page Flip ─────────────────── */
    setTimeout(() => {
      L && L.classList.add('lp');
      snd_pageFlip();
    }, T.pulse);

    /* 2.0s — نص + Success Ding ─────────────────── */
    setTimeout(() => {
      B  && B.classList.add('bi');
      snd_ding();
    }, T.text);

    /* 2.215s — خط متدرج ──────────────────────── */
    setTimeout(() => { LN && LN.classList.add('lg'); }, T.line);

    /* 2.33s — شعار فرعي ─────────────────────── */
    setTimeout(() => { TG && TG.classList.add('ti'); }, T.tag);

    /* 2.85s — Fade Out ─────────────────────────── */
    setTimeout(end, T.fadeOut);

    /* Safety net ─────────────────────────────── */
    setTimeout(end, 5000);
  }

  // ══════════════════════════════════════════════════
  // التهيئة — حقن HTML و CSS في الصفحة
  // ══════════════════════════════════════════════════
  function init() {
    // ── حقن CSS ───────────────────────────────────
    const st = document.createElement('style');
    st.id = 'ms-css'; st.textContent = CSS;
    document.head.appendChild(st);

    // ── بناء HTML ─────────────────────────────────
    sp = document.createElement('div');
    sp.id = 'ms-sp';
    sp.setAttribute('role', 'status');
    sp.setAttribute('aria-label', 'شاشة افتتاحية لمنصة مدرسك');
    sp.innerHTML = `
      <div id="ms-glow"></div>

      <div id="ms-lw">
        <div id="ms-ring"></div>
        <img
          id="ms-logo"
          src="${LOGO}"
          alt="شعار مدرسك"
          draggable="false"
          onerror="this.style.filter='opacity(.5)'"
        >
      </div>

      <div id="ms-brd">
        <div id="ms-name">مدرسك</div>
        <div id="ms-ln"></div>
        <div id="ms-tag">فهم أفضل... مستقبل أفضل</div>
      </div>

      <div id="ms-skip">اضغط للمتابعة</div>
    `;

    // ── إضافة في أول الـ body ─────────────────────
    document.body.prepend(sp);

    // ── التخطي بالضغط أو اللمس ───────────────────
    sp.addEventListener('click',    end, { once: true });
    sp.addEventListener('touchend', end, { once: true, passive: true });

    // ── تشغيل الأنيميشن ───────────────────────────
    runAnim();
  }

  // تشغيل فوري أو بعد تحميل DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
