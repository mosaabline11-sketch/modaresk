/* ============================================================
   مدرسك — WhatsApp Chat Widget (Vanilla JS، بدون أي مكتبات)
   يعتمد على whatsapp-config.js فقط. حمّل الملفات بهذا الترتيب:
     1) whatsapp.css
     2) whatsapp-config.js
     3) whatsapp.js
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.MDRSK_WA_CONFIG || {};
  var PHONE = String(CFG.phone || '').replace(/[^0-9]/g, '');
  var STORAGE_KEY = CFG.storageKey || 'mdrsk_wa_widget_v1';
  var AUTO_OPEN_MS = (Number(CFG.autoOpenDelaySec) || 8) * 1000;
  var PULSE_MS = (Number(CFG.pulseIntervalSec) || 15) * 1000;

  if (!PHONE) {
    console.warn('WhatsApp Widget: لا يوجد رقم واتساب صالح في whatsapp-config.js');
    return;
  }

  /* ── أيقونات SVG مدمجة (بدون أي طلب خارجي) ── */
  var ICON_WHATSAPP = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.05-1.32A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm5.2 14.24c-.22.62-1.28 1.2-1.77 1.24-.46.05-1.02.07-1.65-.1-.38-.11-.87-.28-1.5-.55-2.63-1.14-4.35-3.79-4.48-3.96-.13-.18-1.07-1.42-1.07-2.7 0-1.29.68-1.92.92-2.18.24-.26.53-.32.7-.32h.5c.16 0 .38 0 .59.44.22.46.75 1.61.82 1.73.07.12.11.26.02.42-.09.16-.14.26-.27.4-.14.15-.28.34-.4.45-.13.13-.27.27-.12.53.15.26.68 1.13 1.47 1.83 1.01.9 1.86 1.18 2.12 1.31.26.13.41.11.56-.06.16-.17.65-.75.83-1.01.18-.26.35-.22.59-.13.24.09 1.5.71 1.76.84.26.13.44.19.5.3.06.12.06.66-.16 1.29Z" fill="currentColor"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function escapeHtmlLocal(str) {
    return String(str || '').replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function escapeAttr(str) { return escapeHtmlLocal(str).replace(/`/g, '&#96;'); }

  /* ── حالة الإغلاق المحفوظة في localStorage ── */
  function getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function setState(patch) {
    try {
      var next = getState();
      for (var k in patch) next[k] = patch[k];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
  }

  function buildWaLink() {
    var msg = encodeURIComponent(CFG.prefilledMessage || '');
    return 'https://wa.me/' + PHONE + (msg ? '?text=' + msg : '');
  }

  /* ── بناء الويدجت وحقنه في الصفحة ── */
  function buildWidget() {
    var root = document.createElement('div');
    root.id = 'mdrsk-wa-widget';
    var badgeHtml = CFG.showBadge === false ? '' :
      '<span class="mdrsk-wa-fab-badge" id="mdrsk-wa-badge">1</span>';

    root.innerHTML =
      '<div class="mdrsk-wa-panel" id="mdrsk-wa-panel" role="dialog" aria-label="محادثة واتساب" aria-hidden="true">' +
        '<div class="mdrsk-wa-header">' +
          '<img class="mdrsk-wa-avatar" src="' + escapeAttr(CFG.logo || 'logo.png') + '" alt="مدرسك" onerror="this.style.display=\'none\'">' +
          '<div class="mdrsk-wa-header-info">' +
            '<div class="mdrsk-wa-name">' + escapeHtmlLocal(CFG.accountName || 'فريق الدعم') + '</div>' +
            '<div class="mdrsk-wa-status"><span class="mdrsk-wa-dot"></span>' + escapeHtmlLocal(CFG.statusText || 'متصل الآن') + '</div>' +
          '</div>' +
          '<button type="button" class="mdrsk-wa-close" id="mdrsk-wa-close" aria-label="إغلاق">' + ICON_CLOSE + '</button>' +
        '</div>' +
        '<div class="mdrsk-wa-body">' +
          '<div class="mdrsk-wa-bubble">' + escapeHtmlLocal(CFG.welcomeMessage || '').replace(/\n/g, '<br>') + '<span class="mdrsk-wa-time">الآن</span></div>' +
        '</div>' +
        '<div class="mdrsk-wa-footer">' +
          '<a href="' + buildWaLink() + '" target="_blank" rel="noopener" class="mdrsk-wa-cta" id="mdrsk-wa-cta">' +
            ICON_WHATSAPP + '<span>' + escapeHtmlLocal(CFG.ctaLabel || 'ابدأ المحادثة') + '</span>' +
          '</a>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="mdrsk-wa-fab" id="mdrsk-wa-fab" aria-label="تواصل معنا عبر واتساب" aria-expanded="false" aria-controls="mdrsk-wa-panel">' +
        '<span class="mdrsk-wa-fab-ring"></span>' + ICON_WHATSAPP + badgeHtml +
      '</button>';

    document.body.appendChild(root);
    return root;
  }

  function init() {
    var root = buildWidget();
    var fab = root.querySelector('#mdrsk-wa-fab');
    var panel = root.querySelector('#mdrsk-wa-panel');
    var closeBtn = root.querySelector('#mdrsk-wa-close');
    var cta = root.querySelector('#mdrsk-wa-cta');
    var badge = root.querySelector('#mdrsk-wa-badge');

    var pulseTimer = null;
    var hasOpenedOnce = false;
    var userInteracted = false;

    function hideBadge() { if (badge) badge.classList.add('mdrsk-wa-hidden'); }

    function stopPulse() {
      userInteracted = true;
      if (pulseTimer) { clearInterval(pulseTimer); pulseTimer = null; }
    }
    function pulseOnce() {
      fab.classList.add('mdrsk-wa-pulse');
      setTimeout(function () { fab.classList.remove('mdrsk-wa-pulse'); }, 1500);
    }
    function startPulse() {
      pulseTimer = setInterval(function () { if (!userInteracted) pulseOnce(); }, PULSE_MS);
    }

    function openPanel() {
      panel.classList.add('mdrsk-wa-open');
      panel.setAttribute('aria-hidden', 'false');
      fab.setAttribute('aria-expanded', 'true');
      hasOpenedOnce = true;
      hideBadge();
      stopPulse();
    }
    // remember=true يعني: لا تظهر تلقائيًا تاني في أي زيارة قادمة (زرار الإغلاق ×)
    // remember=false يعني: إغلاق مؤقت لهذه الزيارة فقط (Escape / ضغط بره النافذة)
    function closePanel(remember) {
      panel.classList.remove('mdrsk-wa-open');
      panel.setAttribute('aria-hidden', 'true');
      fab.setAttribute('aria-expanded', 'false');
      if (remember) setState({ dismissed: true, ts: Date.now() });
    }
    function togglePanel() {
      userInteracted = true;
      if (panel.classList.contains('mdrsk-wa-open')) closePanel(true);
      else openPanel();
    }

    fab.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', function () { userInteracted = true; closePanel(true); });
    cta.addEventListener('click', function () {
      userInteracted = true;
      if (typeof trackEvent === 'function') {
        try {
          trackEvent('admin_contact_click', {
            page: location.pathname.split('/').pop() || 'index.html',
            meta: { source: 'wa_widget' }
          });
        } catch (_) {}
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('mdrsk-wa-open')) closePanel(false);
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('mdrsk-wa-open') && !root.contains(e.target)) closePanel(false);
    });

    // ── فتح تلقائي بعد المدة المحددة، فقط لو الزائر ما قفلهاش قبل كده فعلًا ──
    setTimeout(function () {
      var fresh = getState();
      if (!fresh.dismissed && !hasOpenedOnce) openPanel();
    }, AUTO_OPEN_MS);

    // ── حركة تنبيه دورية بسيطة، تتوقف نهائيًا أول ما الزائر يتفاعل ──
    setTimeout(startPulse, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
