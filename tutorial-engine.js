/*!
 * مدرسك — محرك التوتوريال التفاعلي (Spotlight Tutorial Engine) v1.0
 * ─────────────────────────────────────────────────────────────────
 * محرك واحد قابل لإعادة الاستخدام في أي صفحة: بيضيء العنصر الحقيقي
 * في الصفحة (Spotlight) وبيحط بالونة شرح جنبه، بدل Popup تقليدي.
 *
 * الاستخدام:
 *   Tutorial.run('tour_id', [
 *     {selector:'#el-1', title:'العنوان', text:'الشرح'},
 *     {selector:'.el-2, .fallback', title:'...', text:'...'},
 *   ]);
 *
 *   Tutorial.registerMenu([
 *     {label:'🏠 جولة كذا', run:() => Tutorial.run('id', steps, {force:true})},
 *   ]);
 *
 * ملاحظات:
 *  • كل جولة ليها مفتاح تخزين محلي مستقل (localStorage) فتظهر أول مرة بس.
 *  • الخطوة اللي عنصرها مش موجود/مخفي بيتم تخطيها تلقائيًا بدون ما تكسر التتابع.
 *  • ما بيتقفلش بالنقر برة الشاشة — لازم "تخطي" أو الوصول لآخر خطوة.
 *  • ما بيشتغلش وقت ما فيه Modal/رسالة/استطلاع مفتوح — بيستنى ويحاول تاني.
 */
(function (global) {
  'use strict';

  var STORE_PREFIX = 'mdrsk_tut_';

  /* ── تخزين محلي: هل الجولة دي اتشافت قبل كده؟ ─────────────── */
  function hasSeen(id) {
    try { return !!localStorage.getItem(STORE_PREFIX + id); } catch (_) { return false; }
  }
  function markSeen(id) {
    try { localStorage.setItem(STORE_PREFIX + id, '1'); } catch (_) {}
  }
  function resetSeen(id) {
    try { localStorage.removeItem(STORE_PREFIX + id); } catch (_) {}
  }

  /* ── هل في حاجة تانية مفتوحة دلوقتي (Modal/رسالة/استطلاع)؟ ──
     opts.allowModal بتسمح بتجاهل فحص الـ modal-overlay، مستخدمة
     للجولات اللي بتشرح حاجة جوه مودال (زي فورم إضافة إعلان) ─── */
  function isBlocked(opts) {
    if (!(opts && opts.allowModal) && document.querySelector('.modal-overlay.open')) return true;
    if (document.querySelector('.ann-modal-overlay')) return true;
    if (document.querySelector('.survey-modal-overlay')) return true;
    var menu = document.getElementById('mt-menu');
    if (menu && menu.classList.contains('open')) return true;
    return false;
  }

  /* ══════════════════════════════════════════════════
     CSS — حقن ديناميكي (مرة واحدة بس)
  ══════════════════════════════════════════════════ */
  var stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return; stylesInjected = true;
    var st = document.createElement('style');
    st.id = 'mt-styles';
    st.textContent = [
      '#mt-veil{position:fixed;inset:0;z-index:999998;background:transparent;',
        'opacity:0;visibility:hidden;pointer-events:none;}',
      '#mt-veil.mt-show{opacity:1;visibility:visible;pointer-events:auto;}',

      '#mt-spot{position:fixed;z-index:999998;border-radius:14px;pointer-events:none;',
        'opacity:0;visibility:hidden;',
        'transition:top .35s ease,left .35s ease,width .35s ease,height .35s ease,opacity .25s ease;',
        'box-shadow:0 0 0 9999px rgba(13,27,75,.74),0 0 0 3px #fff,0 0 26px 6px rgba(37,99,235,.5);}',
      '#mt-spot.mt-show{opacity:1;visibility:visible;}',

      '#mt-tooltip{position:fixed;z-index:999999;max-width:340px;width:calc(100vw - 32px);',
        'background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(13,27,75,.35);',
        'padding:18px 20px;opacity:0;visibility:hidden;transform:translateY(6px);',
        'transition:opacity .25s ease,transform .25s ease,top .35s ease,left .35s ease;',
        'font-family:"Tajawal",sans-serif;direction:rtl;text-align:right;box-sizing:border-box;}',
      '#mt-tooltip.mt-show{opacity:1;visibility:visible;transform:translateY(0);}',
      '#mt-tooltip *{box-sizing:border-box;}',

      '.mt-tt-title{font-family:"Cairo",sans-serif;font-weight:800;font-size:1rem;',
        'color:#0D1B4B;margin-bottom:6px;line-height:1.4;}',
      '.mt-tt-text{font-size:.87rem;color:#475569;line-height:1.7;margin-bottom:14px;}',

      '.mt-tt-dots{display:flex;gap:5px;justify-content:center;margin-bottom:14px;}',
      '.mt-dot{width:6px;height:6px;border-radius:50%;background:#E2E8F0;transition:.25s;}',
      '.mt-dot.active{background:#2563EB;width:16px;border-radius:50px;}',

      '.mt-tt-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;}',
      '.mt-tt-nav{display:flex;gap:8px;}',
      '.mt-btn{border:none;border-radius:10px;font-family:"Tajawal",sans-serif;',
        'font-size:.82rem;font-weight:700;padding:9px 16px;cursor:pointer;transition:.2s;}',
      '.mt-btn-ghost{background:transparent;color:#94A3B8;padding-right:2px;padding-left:2px;}',
      '.mt-btn-ghost:hover{color:#475569;}',
      '.mt-btn-primary{background:#2563EB;color:#fff;}',
      '.mt-btn-primary:hover{background:#1D4ED8;}',

      '#mt-fab{position:fixed;bottom:20px;right:20px;width:48px;height:48px;border-radius:50%;',
        'background:#2563EB;color:#fff;border:none;font-family:"Cairo",sans-serif;',
        'font-weight:900;font-size:1.15rem;box-shadow:0 8px 24px rgba(37,99,235,.4);',
        'cursor:pointer;z-index:900;transition:.2s;line-height:1;}',
      '#mt-fab:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(37,99,235,.5);}',

      '#mt-fab-label{position:fixed;bottom:74px;right:16px;z-index:900;',
        'background:#fff;color:#0D1B4B;border:1px solid #E2E8F0;border-radius:50px;',
        'padding:8px 16px;font-family:"Tajawal",sans-serif;font-weight:700;font-size:.78rem;',
        'white-space:nowrap;box-shadow:0 8px 20px rgba(13,27,75,.16);cursor:pointer;',
        'transition:.2s;direction:rtl;animation:mt-float 2.6s ease-in-out infinite;}',
      '#mt-fab-label:hover{background:#F8FAFC;transform:translateY(-2px);}',
      '@keyframes mt-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}',

      '#mt-menu{position:fixed;bottom:78px;right:20px;width:230px;background:#fff;',
        'border:1px solid #E2E8F0;border-radius:14px;box-shadow:0 12px 32px rgba(13,27,75,.18);',
        'z-index:900;overflow-x:hidden;overflow-y:auto;max-height:60vh;opacity:0;visibility:hidden;transform:translateY(8px);',
        'transition:.2s;direction:rtl;}',
      '#mt-menu.open{opacity:1;visibility:visible;transform:translateY(0);}',
      '.mt-menu-hd{padding:11px 14px;font-family:"Cairo",sans-serif;font-weight:700;',
        'font-size:.8rem;color:#475569;border-bottom:1px solid #F1F5F9;}',
      '.mt-menu-item{display:block;width:100%;text-align:right;padding:11px 14px;',
        'background:none;border:none;font-family:"Tajawal",sans-serif;font-size:.85rem;',
        'color:#0F172A;cursor:pointer;transition:.15s;}',
      '.mt-menu-item:hover{background:#F1F5F9;}',

      '@media(max-width:480px){',
        '#mt-fab{width:44px;height:44px;bottom:16px;right:16px;}',
        '#mt-fab-label{bottom:68px;right:14px;font-size:.74rem;padding:7px 14px;}',
        '#mt-menu{right:16px;bottom:70px;width:calc(100vw - 32px);max-width:260px;}',
      '}',
      '@media(prefers-reduced-motion:reduce){',
        '#mt-spot,#mt-tooltip{transition:opacity .15s ease!important;}',
        '#mt-fab-label{animation:none!important;}',
      '}',
    ].join('');
    document.head.appendChild(st);
  }

  /* ══════════════════════════════════════════════════
     العناصر (تتبني مرة واحدة وتتعاد استخدامها)
  ══════════════════════════════════════════════════ */
  var els = {};
  function buildDom() {
    if (els.veil) return;
    els.veil = document.createElement('div');
    els.veil.id = 'mt-veil';
    els.veil.addEventListener('click', function (e) { e.stopPropagation(); });

    els.spot = document.createElement('div');
    els.spot.id = 'mt-spot';

    els.tooltip = document.createElement('div');
    els.tooltip.id = 'mt-tooltip';
    els.tooltip.setAttribute('role', 'dialog');
    els.tooltip.setAttribute('aria-modal', 'true');
    els.tooltip.setAttribute('dir', 'rtl');
    els.tooltip.innerHTML =
      '<div class="mt-tt-title" id="mt-tt-title"></div>' +
      '<div class="mt-tt-text" id="mt-tt-text"></div>' +
      '<div class="mt-tt-dots" id="mt-tt-dots"></div>' +
      '<div class="mt-tt-actions">' +
        '<button type="button" class="mt-btn mt-btn-ghost" id="mt-btn-skip">تخطي</button>' +
        '<div class="mt-tt-nav">' +
          '<button type="button" class="mt-btn mt-btn-ghost" id="mt-btn-prev">السابق</button>' +
          '<button type="button" class="mt-btn mt-btn-primary" id="mt-btn-next">التالي</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(els.veil);
    document.body.appendChild(els.spot);
    document.body.appendChild(els.tooltip);

    els.ttTitle = document.getElementById('mt-tt-title');
    els.ttText  = document.getElementById('mt-tt-text');
    els.ttDots  = document.getElementById('mt-tt-dots');
    els.btnSkip = document.getElementById('mt-btn-skip');
    els.btnPrev = document.getElementById('mt-btn-prev');
    els.btnNext = document.getElementById('mt-btn-next');

    els.btnSkip.addEventListener('click', function () { endTour(true); });
    els.btnPrev.addEventListener('click', function () {
      if (state && state.idx > 0) goToStep(state.idx - 1);
    });
    els.btnNext.addEventListener('click', function () {
      if (!state) return;
      if (state.idx === state.steps.length - 1) endTour(true);
      else goToStep(state.idx + 1);
    });
  }

  /* ══════════════════════════════════════════════════
     منطق تحديد مكان الإضاءة والبالونة
  ══════════════════════════════════════════════════ */
  function placeSpot(rect) {
    var pad = 8;
    els.spot.style.top    = (rect.top - pad) + 'px';
    els.spot.style.left   = (rect.left - pad) + 'px';
    els.spot.style.width  = (rect.width + pad * 2) + 'px';
    els.spot.style.height = (rect.height + pad * 2) + 'px';
  }

  function placeTooltip(rect) {
    var margin = 14;
    var tt = els.tooltip;
    var ttRect = tt.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;

    var spaceBelow = vh - rect.bottom;
    var spaceAbove = rect.top;
    var top;
    if (spaceBelow >= ttRect.height + margin || spaceBelow >= spaceAbove) {
      top = rect.bottom + margin;
      if (top + ttRect.height > vh - margin) top = Math.max(margin, vh - margin - ttRect.height);
    } else {
      top = rect.top - margin - ttRect.height;
      if (top < margin) top = margin;
    }

    var left = rect.left + rect.width / 2 - ttRect.width / 2;
    if (left < margin) left = margin;
    if (left + ttRect.width > vw - margin) left = vw - margin - ttRect.width;

    tt.style.top = top + 'px';
    tt.style.left = left + 'px';
  }

  /* ── إيجاد أول عنصر ظاهر فعليًا من قائمة selectors ─────────── */
  function resolveTarget(selector) {
    var nodes;
    try { nodes = document.querySelectorAll(selector); } catch (_) { return null; }
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
    return null;
  }

  function buildVisibleSteps(steps) {
    var out = [];
    (steps || []).forEach(function (s) {
      var el = resolveTarget(s.selector);
      if (el) out.push({ title: s.title, text: s.text, el: el });
    });
    return out;
  }

  /* ══════════════════════════════════════════════════
     تشغيل الجولة
  ══════════════════════════════════════════════════ */
  var state = null;
  var rafPending = false;

  function render() {
    var i = state.idx, total = state.steps.length, step = state.steps[i];
    els.ttTitle.textContent = step.title || '';
    els.ttText.textContent  = step.text  || '';

    var dots = '';
    for (var k = 0; k < total; k++) dots += '<span class="mt-dot' + (k === i ? ' active' : '') + '"></span>';
    els.ttDots.innerHTML = dots;

    els.btnPrev.style.display = i === 0 ? 'none' : 'inline-flex';
    els.btnNext.textContent = (i === total - 1) ? 'فهمت! 🎉' : 'التالي';

    var rect = step.el.getBoundingClientRect();
    placeSpot(rect);
    requestAnimationFrame(function () { placeTooltip(rect); });
  }

  function goToStep(i) {
    state.idx = i;
    var step = state.steps[i];
    try { step.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    catch (_) { try { step.el.scrollIntoView(); } catch (__) {} }
    clearTimeout(state._t);
    state._t = setTimeout(render, 380);
  }

  function onViewportChange() {
    if (!state || rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      if (!state) return;
      var rect = state.steps[state.idx].el.getBoundingClientRect();
      placeSpot(rect);
      placeTooltip(rect);
    });
  }

  function onKeydown(e) {
    if (e.key === 'Escape') endTour(true);
  }

  function endTour(markDone) {
    if (markDone && state) markSeen(state.id);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
    if (els.veil)    els.veil.classList.remove('mt-show');
    if (els.spot)    els.spot.classList.remove('mt-show');
    if (els.tooltip) els.tooltip.classList.remove('mt-show');
    if (state && state._t) clearTimeout(state._t);
    // يرجع المستخدم لمكانه قبل ما الجولة تبدأ تلف في الصفحة تشرح كل عنصر،
    // بدل ما يفضل واقف في نص الصفحة (زي لو كانت آخر خطوة تحت خالص)
    if (state && typeof state.startScrollY === 'number') {
      var backTo = state.startScrollY;
      setTimeout(function () { window.scrollTo({ top: backTo, behavior: 'smooth' }); }, 60);
    }
    state = null;
  }

  function run(id, steps, opts) {
    opts = opts || {};
    if (state) return; // جولة شغالة فعلاً — ما نبدأش وحدة تانية فوقها
    if (!opts.force && hasSeen(id)) return;

    if (isBlocked(opts)) {
      opts._retries = (opts._retries || 0) + 1;
      if (opts._retries <= 6) setTimeout(function () { run(id, steps, opts); }, 500);
      return;
    }

    var visible = buildVisibleSteps(steps);
    if (!visible.length) return; // مفيش عناصر ظاهرة دلوقتي — ما نعلّمهاش "اتشافت" عشان تحاول تاني بعدين

    injectStyles();
    buildDom();

    state = { id: id, steps: visible, idx: 0, _t: null, startScrollY: window.scrollY };
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    els.veil.classList.add('mt-show');
    els.spot.classList.add('mt-show');
    els.tooltip.classList.add('mt-show');
    goToStep(0);
  }

  function forceEnd() {
    if (state) endTour(true);
  }

  /* ══════════════════════════════════════════════════
     زر "؟" العائم + قائمة إعادة عرض الجولات
  ══════════════════════════════════════════════════ */
  var menuItems = [];

  function toggleMenu() {
    var m = document.getElementById('mt-menu');
    if (!m) return;
    m.classList.toggle('open');
    var lbl = document.getElementById('mt-fab-label');
    if (lbl) lbl.style.display = m.classList.contains('open') ? 'none' : '';
  }
  function closeMenu() {
    var m = document.getElementById('mt-menu');
    if (m) m.classList.remove('open');
    var lbl = document.getElementById('mt-fab-label');
    if (lbl) lbl.style.display = '';
  }
  function renderMenuList() {
    var menu = document.getElementById('mt-menu');
    if (!menu) return;
    var html = '<div class="mt-menu-hd">🎓 جولات تعريفية</div>';
    menuItems.forEach(function (it, i) {
      html += '<button type="button" class="mt-menu-item" data-i="' + i + '">' + it.label + '</button>';
    });
    menu.innerHTML = html;
    Array.prototype.forEach.call(menu.querySelectorAll('.mt-menu-item'), function (btn) {
      btn.addEventListener('click', function () {
        var it = menuItems[Number(btn.getAttribute('data-i'))];
        closeMenu();
        if (it && typeof it.run === 'function') it.run();
      });
    });
  }

  function buildFab() {
    if (!menuItems.length) return;
    injectStyles();
    if (document.getElementById('mt-fab')) { renderMenuList(); return; }

    var label = document.createElement('button');
    label.id = 'mt-fab-label';
    label.type = 'button';
    label.textContent = 'مش فاهم الموقع؟';
    label.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); quietLabel(); });
    document.body.appendChild(label);
    if (hasSeen('_fab_seen')) quietLabel();

    var fab = document.createElement('button');
    fab.id = 'mt-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'مساعدة وجولات تعريفية');
    fab.textContent = '؟';
    fab.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); quietLabel(); });
    document.body.appendChild(fab);

    var menu = document.createElement('div');
    menu.id = 'mt-menu';
    document.body.appendChild(menu);
    renderMenuList();

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#mt-fab') && !e.target.closest('#mt-menu') && !e.target.closest('#mt-fab-label')) closeMenu();
    });
  }

  // بعد أول تفاعل، بتفضل الكلمة ظاهرة بس من غير حركة الطفو المستمرة
  function quietLabel() {
    markSeen('_fab_seen');
    var lbl = document.getElementById('mt-fab-label');
    if (lbl) lbl.style.animation = 'none';
  }

  function registerMenu(items) {
    menuItems = items || [];
    buildFab();
  }

  /* ══════════════════════════════════════════════════
     الواجهة العامة
  ══════════════════════════════════════════════════ */
  global.Tutorial = {
    run: run,
    hasSeen: hasSeen,
    reset: resetSeen,
    resetAll: function (ids) { (ids || []).forEach(resetSeen); },
    registerMenu: registerMenu,
    end: forceEnd,
  };

})(window);
