/* ══════════════════════════════════════════════════
   dashboard_logic.js — مدرسك v8
   منطق لوحة المدرس المُعاد تصميمها
══════════════════════════════════════════════════ */

/* ══ CONSTANTS ══ */
const GM_LEVELS = [
  {name:'مبتدئ',        icon:'level-beginner', min:0,     max:500,   color:'#6B7280', track:'#E5E7EB'},
  {name:'صاعد',         icon:'level-rising',   min:500,   max:2000,  color:'#2563EB', track:'#DBEAFE'},
  {name:'متقدم',        icon:'level-advanced', min:2000,  max:5000,  color:'#0EA672', track:'#A7F3D0'},
  {name:'خبير',         icon:'level-expert',   min:5000,  max:10000, color:'#F59E0B', track:'#FEF3C7'},
  {name:'أسطورة مدرسك', icon:'level-legend',   min:10000, max:99999, color:'#7C3AED', track:'#EDE9FE'},
];

const ACH_DEFS = [
  {id:'first_ad',  icon:'rocket', title:'الانطلاقة',   desc:'نشرت أول إعلان',             pts:10,  color:'#20C997'},
  {id:'first_wa',  icon:'chat',   title:'أول تواصل',   desc:'أول ضغطة واتساب',            pts:20,  color:'#2563EB'},
  {id:'100_views', icon:'eye',    title:'مئة عين',     desc:'١٠٠ مشاهدة إجمالية',         pts:30,  color:'#0EA672'},
  {id:'500_views', icon:'trophy', title:'نصف الألف',   desc:'٥٠٠ مشاهدة',                 pts:75,  color:'#EF4444'},
  {id:'img_ad',    icon:'photo',  title:'إعلان بصورة', desc:'أضفت صورة لإعلانك',          pts:15,  color:'#0EA5E9'},
  {id:'desc_ad',   icon:'writing',title:'وصف متكامل',  desc:'وصف أكثر من ١٠٠ حرف',        pts:10,  color:'#8B5CF6'},
  {id:'10_wa',     icon:'target', title:'١٠ تواصل',    desc:'١٠ ضغطات واتساب',            pts:40,  color:'#20C997'},
  {id:'lv_2',      icon:'rocket', title:'مستوى صاعد',  desc:'الوصول إلى ٥٠٠ XP',          pts:50,  color:'#2563EB'},
  {id:'lv_3',      icon:'star',   title:'مستوى متقدم', desc:'الوصول إلى ٢٠٠٠ XP',         pts:100, color:'#0EA672'},
  {id:'lv_4',      icon:'medal',  title:'مستوى خبير',  desc:'الوصول إلى ٥٠٠٠ XP',         pts:200, color:'#F59E0B'},
];

const CH_DEFS = [
  {id:'daily_views',   icon:'eye',    title:'٢٠ مشاهدة اليوم',     metric:'ad_card_view',   target:20, reward:10, period:'daily'},
  {id:'weekly_wa',     icon:'chat',   title:'٣ تواصل هذا الأسبوع', metric:'whatsapp_click', target:3,  reward:25, period:'weekly'},
  {id:'daily_details', icon:'zoom',   title:'٥ فتح تفاصيل اليوم',  metric:'ad_detail_view', target:5,  reward:8,  period:'daily'},
  {id:'streak_7',      icon:'streak', title:'٧ أيام نشاط متواصل',  metric:'streak',         target:7,  reward:50, period:'streak'},
];

/* ══════════════════════════════════════════════════════
   طبقة الأيقونات (Icon Mapping Layer)
   ──────────────────────────────────────────────────────
   الهدف: فصل الكود والبيانات عن مكتبة الأيقونات المستخدمة.
   البيانات (المستويات/الإنجازات/التحديات) والكود يشيروا لأسماء
   *دلالية* محايدة (مثل 'level', 'trophy', 'streak')، والطبقة دي
   بتترجمها لأصناف المكتبة الحالية (Tabler). لو غيّرنا المكتبة
   مستقبلًا، نعدّل ICON_MAP هنا في مكان واحد فقط — من غير أي لمس
   للـ Logic أو للبيانات أو للـ IDs.
   ══════════════════════════════════════════════════════ */
/* محوّل الأرقام للعربية (٠١٢٣...) — لتوحيد كل الأرقام المعروضة
   في اللوحة مع النص العربي. يقبل رقم أو نص. */
function toAr(val) {
  if (val == null) return '';
  const n = Number(val);
  if (!isNaN(n) && val !== '' && val !== true && val !== false) return n.toLocaleString('ar-EG');
  return String(val).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

const ICON_MAP = {
  // مستويات
  'level-beginner': 'seeding',
  'level-rising':   'rocket',
  'level-advanced': 'star',
  'level-expert':   'medal',
  'level-legend':   'crown',
  // إنجازات / عام
  'rocket':         'rocket',
  'chat':           'message-circle',
  'eye':            'eye',
  'trophy':         'trophy',
  'photo':          'photo',
  'writing':        'writing',
  'target':         'target-arrow',
  'star':           'star',
  'medal':          'medal',
  'crown':          'crown',
  // تحديات
  'zoom':           'zoom-in',
  'streak':         'flame',
  // حالات
  'check':          'check',
  'circle-check':   'circle-check',
  'lock':           'lock',
  'gift':           'gift',
  // تنبيهات
  'ban':            'ban',
  'warning':        'alert-triangle',
  'clipboard':      'clipboard-text',
  'clock':          'clock',
  'phone':          'phone',
  // اكتمال الملف
  'camera':         'camera',
  'user':           'user',
  'link':           'link',
};

/* يحوّل الاسم الدلالي إلى صنف أيقونة المكتبة الحالية.
   لو الاسم غير موجود بالخريطة، نستخدمه كما هو (fallback مرن). */
function iconClass(name) {
  return ICON_MAP[name] || name || 'square';
}

/* يبني وسم أيقونة جاهز للعرض من اسم دلالي.
   opts.style اختياري لتلوين/تحجيم الأيقونة. */
function gmIcon(name, opts) {
  opts = opts || {};
  const style = opts.style ? ` style="${opts.style}"` : '';
  return `<i class="ti ti-${iconClass(name)}" aria-hidden="true"${style}></i>`;
}

const PERIOD_LBL = {daily:'يومي', weekly:'أسبوعي', streak:'متواصل'};
const PERIOD_CLR = {daily:'#2563EB', weekly:'#0EA672', streak:'#F59E0B'};
const CHART_FONT = "'Tajawal','Cairo',sans-serif";

/* ══ TUTORIAL: خطوات الجولات التعريفية لكل قسم ══
   كل مصفوفة بتتغذى لمحرك Tutorial (tutorial-engine.js). كل خطوة فيها
   selector (ممكن يكون فيه أكتر من احتمال مفصول بفاصلة كـ fallback،
   زي حالة "مفيش إعلانات بعد")، title، و text. */
const TUT_HOME = [
  {selector:'#welcome-banner',  title:'أهلاً بيك في لوحتك 👋', text:'من هنا بتتابع مستواك، نقاط خبرتك (XP)، ومكافآتك أول بأول.'},
  {selector:'.quick-actions',   title:'اختصارات سريعة',        text:'ضيف إعلان، عدّل واحد موجود، افتح إحصائياتك، أو رقّي باقتك من هنا على طول.'},
  {selector:'.main-tabs-bar',   title:'أقسام لوحتك',           text:'من هنا بتنقل بين الرئيسية وإعلاناتي والتحليلات ولوحة الشرف — وكل قسم هيشرحلك نفسه أول مرة تفتحه.'},
  {selector:'.home-chart-wrap', title:'نشاطك أول بأول',        text:'الرسم ده بيوريك مشاهدات وتواصل آخر ٧ أيام.'},
  {selector:'#more-btn',        title:'لسه فيه أكتر',          text:'من هنا (⋮) هتلاقي ملفك الشخصي، الباقة والمميزات، والفعاليات والمكافآت.'},
];
const TUT_ADS = [
  {selector:'.ads-stats',  title:'عداد إعلاناتك',    text:'كام إعلان مقبول، كام لسه تحت المراجعة، وكام اتم رفضه.'},
  {selector:'#add-ad-btn', title:'إضافة إعلان جديد', text:'دوس هنا في أي وقت عشان تضيف إعلان جديد يظهر للطلاب.'},
  {selector:'#ads-list .ad-card:first-child .ad-card-actions, #ads-empty', title:'تعديل أو حذف', text:'جنب كل إعلان تقدر تعاينه 👁، تعدّله ✏️، أو تحذفه 🗑.'},
];
const TUT_STATS = [
  {selector:'.stats-kpi', title:'أرقامك المهمة', text:'إجمالي المشاهدات، تواصل الواتساب، معدل التحويل، وعدد فتح التفاصيل.'},
  {selector:'.gam-tabs',  title:'تفاصيل أكتر',    text:'من هنا تشوف النشاط اليومي، أداء كل إعلان لوحده، إنجازاتك، تحدياتك، ومستوياتك.'},
  {selector:'.chart-card',title:'نشاطك بالتفصيل', text:'الرسم ده بيوريك تطور مشاهداتك وتواصلك يوم بيوم.'},
];
const TUT_LEADERBOARD = [
  {selector:'#tab-leaderboard .profile-card', title:'لوحة الشرف', text:'ترتيبك بين كل مدرسين مدرسك حسب نقاط الخبرة (XP) اللي جمعتها.'},
];

/* جولة تفصيلية: فورم إضافة/تعديل إعلان — بتفتح جوه المودال نفسه */
const TUT_AD_MODAL = [
  {selector:'#ad-title', title:'عنوان الإعلان', text:'اكتب عنوان واضح وجذاب، زي: "دروس رياضيات للصف الثالث الإعدادي".'},
  {selector:'#ad-subject, #ad-grades-box', title:'المادة والفصول', text:'اختار المادة والفصول الدراسية اللي بتدرّسها، تقدر تختار أكتر من فصل.'},
  {selector:'#ad-price, #ad-lesson-type', title:'السعر ونوع الدرس', text:'حدد سعر الحصة، ونوع الدرس: أونلاين، حضوري، أو الاتنين.'},
  {selector:'#ad-class-format', title:'نوع الفصل', text:'خصوصي (طالب لوحده) و لا مجموعات؟'},
  {selector:'#ad-description', title:'الوصف', text:'وصف تفصيلي لأسلوبك في التدريس بيزوّد ثقة الطالب فيك.'},
  {selector:'#ad-main-image', title:'الصورة الرئيسية', text:'صورة بجودة كويسة بتخلي إعلانك ياخد تفاعل أكتر من الطلاب.'},
  {selector:'#ad-submit-btn', title:'نشر الإعلان', text:'بعد ما تخلص، إعلانك هيتراجع من الإدارة قبل ما يظهر للطلاب.'},
];

/* جولة تفصيلية: الملف الشخصي */
const TUT_PROFILE = [
  {selector:'#p-avatar-file', title:'صورتك الشخصية', text:'صورة واضحة بتظهر في كارت إعلانك وصفحة التفاصيل، بتزوّد ثقة الطالب.'},
  {selector:'#p-name', title:'الاسم ورقم الجوال', text:'اسمك الكامل ورقم جوالك.'},
  {selector:'#p-whatsapp', title:'واتساب وفيسبوك', text:'دول أهم وسيلتين بيتواصل بيهم الطلاب معاك، تأكد إنهم صحيحين.'},
  {selector:'#p-bio', title:'نبذة عنك', text:'اكتب نبذة مختصرة عن خبرتك وأسلوبك في التدريس.'},
  {selector:'#p-contact-methods', title:'وسائل تواصل إضافية', text:'لو عندك تيليجرام أو إنستجرام، ضيفهم هنا اختياريًا.'},
  {selector:'#profile-save-btn', title:'الحفظ', text:'متنساش تدوس هنا بعد أي تعديل عشان تتحفظ بياناتك.'},
];

/* جولات تفصيلية: تابات التحليلات الفرعية */
const TUT_STATS_PERAD = [
  {selector:'#perad-content', title:'أداء كل إعلان', text:'شوف مشاهدات وتواصل كل إعلان لوحده، عشان تعرف مين الأنشط.'},
];
const TUT_STATS_ACH = [
  {selector:'#ach-grid, #ach-summary', title:'إنجازاتك', text:'شارات بتفتحها كل ما توصل لهدف معيّن (زي أول إعلان أو أول تواصل).'},
];
const TUT_STATS_CHALLENGES = [
  {selector:'#ch-grid', title:'التحديات', text:'مهام قصيرة بتكسب منها نقاط خبرة (XP) إضافية.'},
];
const TUT_STATS_LEVELS = [
  {selector:'#lpath-content', title:'مسار المستويات', text:'كل ما تجمع XP أكتر، مستواك بيترقّى ويفتحلك مميزات جديدة.'},
];

/* جولات خفيفة: الباقة/المميزات والفعاليات */
const TUT_FEATURES = [
  {selector:'#features-content', title:'باقتك ومميزاتك', text:'شوف باقتك الحالية، قارن الباقات التانية، واطلب ترقية لو حابب مميزات أكتر.'},
];
const TUT_EVENTS = [
  {selector:'#events-content', title:'الفعاليات النشطة', text:'فعاليات وتحديات مؤقتة تقدر تشارك فيها وتكسب نقاط إضافية.'},
  {selector:'#rewards-tiers-content', title:'استرداد النقاط', text:'لما توصل لعدد معيّن من النقاط تقدر تستبدلها بمكافآت من الإدارة.'},
];

/* ══ STATE ══ */
let teacher = null;
let teacherAds = [];
let gamEvents = [];
let homeAreaChart = null;
let areaChart = null;
let curMetric = 'views';
let homeMetric = 'views';
let notifData = [];
let statsLoaded = false;
let teacherClaims = new Set(); // "reward_key|period_key" لكل مكافأة استلمها المدرس فعليًا

/* ══ INIT ══ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireTeacher()) return;
  teacher = Auth.getTeacherSession();
  document.getElementById('teacher-name-display').textContent = teacher.name;
  document.getElementById('nav-teacher-name').textContent = teacher.name;
  await loadSubjectsSafe();
  populateAllSubjectAndGradeSelects();
  await loadTeacherData();
  await loadAds();
  setupMainImagePositionControls();
  setupAvatarPreview();
  loadNotifDropdown();
  // نظام الرسائل الهامة والاستطلاعات — بعد استقرار بيانات المدرس
  // ملاحظة UX: بينهم تأخير بسيط عمدًا حتى ما يظهروش فوق بعض في نفس اللحظة
  // (لو فيه رسالة عاجلة، إديها فرصة تتقرأ وتتقفل قبل ما يظهر الاستطلاع).
  try { await Announcements.renderForTeacher(teacher.id); } catch (_) {}
  setTimeout(() => {
    Surveys.checkAndShow(teacher).catch(() => {}).finally(() => {
      // الجولة التعريفية بتستنى نتيجة فحص الاستطلاع فعليًا (مش تأخير تخميني)
      // عشان ميحصلش تزاحم بينها وبين مودال الاستطلاع لو ظهر
      setTimeout(() => initHomeTour(), 400);
    });
  }, 1800);
  // Load home stats async
  setTimeout(loadHomeStats, 600);
  // تسجيل قائمة الجولات في زرار "؟" العائم — ده مستقل عن جولة الرئيسية التلقائية
  registerTutorialMenu();
  // لو المدرس راجع من دفع إضافة (paymob) — نتأكد من حالتها ونفعّلها في الواجهة
  checkAddonPaymentReturn();
  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-wrap')) closeNotifDropdown();
    if (!e.target.closest('.more-menu-wrap')) closeMoreMenu();
  });

  // إغلاق modal الإعلان عند الضغط على الخلفية
  const adModal = document.getElementById('ad-modal');
  if (adModal) adModal.addEventListener('click', e => { if (e.target === e.currentTarget) closeAdModal(); });
});

/* ══════════════════════════════════════
   TUTORIALS — الجولات التعريفية
   جولة الرئيسية تظهر تلقائيًا أول زيارة (بعد ما فحص الاستطلاع يخلص فعليًا).
   جولات باقي الأقسام بتتشغّل من switchTab أول مرة يتفتح كل قسم.
   زر "؟" العائم بيسمح بإعادة عرض أي جولة وقت ما حبّ المدرس.
══════════════════════════════════════ */
function initHomeTour() {
  if (typeof Tutorial === 'undefined') return;
  Tutorial.run('dash_home', TUT_HOME);
}

function registerTutorialMenu() {
  if (typeof Tutorial === 'undefined') return; // لو الملف ما اتحملش لأي سبب، منكسرش الصفحة

  const menuItems = [
    {label:'🏠 جولة الرئيسية', run:() => {
      switchTab('home', document.getElementById('tab-btn-home'));
      setTimeout(() => Tutorial.run('dash_home', TUT_HOME, {force:true}), 300);
    }},
    {label:'📋 جولة الإعلانات', run:() => {
      switchTab('ads', document.getElementById('tab-btn-ads'));
      setTimeout(() => Tutorial.run('dash_ads', TUT_ADS, {force:true}), 400);
    }},
    {label:'🆕 جولة إضافة إعلان', run:() => {
      switchTab('ads', document.getElementById('tab-btn-ads'));
      setTimeout(() => {
        openAddAdModal();
        setTimeout(() => Tutorial.run('dash_ad_modal', TUT_AD_MODAL, {force:true, allowModal:true}), 400);
      }, 350);
    }},
    {label:'📈 جولة التحليلات', run:() => {
      switchTab('stats', document.getElementById('tab-btn-stats'));
      setTimeout(() => Tutorial.run('dash_stats', TUT_STATS, {force:true}), 650);
    }},
    {label:'📊 جولة أداء الإعلانات', run:() => {
      switchTab('stats', document.getElementById('tab-btn-stats'));
      setTimeout(() => {
        switchGTab('g-perad', document.querySelector(".gtab[onclick*=\"g-perad\"]"));
        setTimeout(() => Tutorial.run('dash_stats_perad', TUT_STATS_PERAD, {force:true}), 350);
      }, 650);
    }},
    {label:'🏅 جولة الإنجازات', run:() => {
      switchTab('stats', document.getElementById('tab-btn-stats'));
      setTimeout(() => {
        switchGTab('g-achievements', document.querySelector(".gtab[onclick*=\"g-achievements\"]"));
        setTimeout(() => Tutorial.run('dash_stats_ach', TUT_STATS_ACH, {force:true}), 350);
      }, 650);
    }},
    {label:'🎯 جولة التحديات', run:() => {
      switchTab('stats', document.getElementById('tab-btn-stats'));
      setTimeout(() => {
        switchGTab('g-challenges', document.querySelector(".gtab[onclick*=\"g-challenges\"]"));
        setTimeout(() => Tutorial.run('dash_stats_challenges', TUT_STATS_CHALLENGES, {force:true}), 350);
      }, 650);
    }},
    {label:'⬆️ جولة المستويات', run:() => {
      switchTab('stats', document.getElementById('tab-btn-stats'));
      setTimeout(() => {
        switchGTab('g-levels', document.querySelector(".gtab[onclick*=\"g-levels\"]"));
        setTimeout(() => Tutorial.run('dash_stats_levels', TUT_STATS_LEVELS, {force:true}), 350);
      }, 650);
    }},
    {label:'🏆 جولة لوحة الشرف', run:() => {
      switchTab('leaderboard', document.getElementById('tab-btn-leaderboard'));
      setTimeout(() => Tutorial.run('dash_leaderboard', TUT_LEADERBOARD, {force:true}), 500);
    }},
    {label:'👤 جولة الملف الشخصي', run:() => {
      switchTab('profile');
      setTimeout(() => Tutorial.run('dash_profile', TUT_PROFILE, {force:true}), 400);
    }},
    {label:'💎 جولة الباقة والمميزات', run:() => {
      switchTab('features');
      setTimeout(() => Tutorial.run('dash_features', TUT_FEATURES, {force:true}), 500);
    }},
    {label:'🎉 جولة الفعاليات', run:() => {
      switchTab('events');
      setTimeout(() => Tutorial.run('dash_events', TUT_EVENTS, {force:true}), 650);
    }},
  ];

  Tutorial.registerMenu(menuItems);
}

/* ══════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════ */
let notifReadIds = new Set();

async function loadNotifDropdown() {
  try {
    // مهم: نجيب الرسائل العامة + أي رسالة موجهة لهذا المدرس بالذات، وبعدين
    // فلترة إضافية من جهة العميل (طبقة أمان ثانية) تستبعد نهائيًا أي رسالة
    // خاصة بمدرس تاني. قبل كده كان الاستعلام بيجيب كل رسالة target='teachers'
    // من غير فلترة، فأي "رسالة خاصة" لمدرس معيّن كانت تظهر لكل المدرسين.
    const { data } = await supabase.from('notifications').select('*')
      .or(`target.eq.all,target.eq.teachers,teacher_id.eq.${teacher.id}`)
      .order('created_at', {ascending: false}).limit(50);
    notifData = (data || []).filter(n => !n.teacher_id || n.teacher_id === teacher.id);

    // جلب الإشعارات التي سبق للمدرس تعليمها كمقروءة (محفوظة في قاعدة
    // البيانات وليس محليًا فقط، فتبقى صحيحة حتى بعد إغلاق المتصفح)
    try {
      const { data: reads } = await supabase.from('notification_reads')
        .select('notification_id').eq('teacher_id', teacher.id);
      notifReadIds = new Set((reads || []).map(r => r.notification_id));
    } catch (_) { notifReadIds = new Set(); }

    const unread = notifData.filter(n => !notifReadIds.has(n.id)).length;
    const badge = document.getElementById('notif-count');
    if (unread > 0) { badge.textContent = unread > 9 ? '٩+' : toAr(unread); badge.classList.add('show'); }
    else { badge.classList.remove('show'); }
    renderNotifList();
  } catch(_) {}
}

function renderNotifList() {
  const list = document.getElementById('notif-dd-list');
  if (!notifData.length) { list.innerHTML = '<div class="notif-empty">لا توجد إشعارات</div>'; return; }
  list.innerHTML = notifData.map(n => {
    const date = new Date(n.created_at).toLocaleDateString('ar-EG', {month:'short', day:'numeric'});
    const isUnread = !notifReadIds.has(n.id);
    return `<div class="notif-item${isUnread ? ' notif-item-unread' : ''}">
      ${n.title ? `<div class="notif-item-title">${isUnread ? '<span class="notif-dot" aria-hidden="true"></span> ' : ''}${escapeHtml(n.title)}</div>` : ''}
      <div class="notif-item-msg">${escapeHtml(n.message)}</div>
      <div class="notif-item-date">${date}</div>
    </div>`;
  }).join('');
}

function toggleNotifDropdown() {
  document.getElementById('notif-dropdown').classList.toggle('open');
  document.getElementById('more-dropdown').classList.remove('open');
}
function closeNotifDropdown() { document.getElementById('notif-dropdown').classList.remove('open'); }

function toggleMoreMenu() {
  document.getElementById('more-dropdown').classList.toggle('open');
  document.getElementById('notif-dropdown').classList.remove('open');
}
function closeMoreMenu() { document.getElementById('more-dropdown').classList.remove('open'); }

async function markAllRead() {
  const unreadIds = notifData.filter(n => !notifReadIds.has(n.id)).map(n => n.id);
  document.getElementById('notif-count').classList.remove('show');
  closeNotifDropdown();
  if (!unreadIds.length) return;
  unreadIds.forEach(id => notifReadIds.add(id));
  renderNotifList();
  try {
    await supabase.from('notification_reads')
      .upsert(
        unreadIds.map(id => ({ notification_id: id, teacher_id: teacher.id })),
        { onConflict: 'notification_id,teacher_id', ignoreDuplicates: true }
      );
  } catch (_) { /* حتى لو فشل الحفظ، الواجهة تبقى محدَّثة لهذه الزيارة */ }
}

/* ══════════════════════════════════════
   LOAD TEACHER DATA
══════════════════════════════════════ */
async function loadTeacherData() {
  let data;
  try {
    const res = await supabase.from('teachers')
      .select('name,bio,avatar_url,whatsapp,facebook,phone,contact_methods,ads_limit,is_active,plan_type,subscription_start,subscription_end,subscription_status,allow_basic_stats,allow_advanced_stats,allow_unlimited_edits,allow_fast_support,custom_features,points,xp,reward_points,created_at')
      .eq('id', teacher.id).single();
    if (res.error) throw res.error;
    data = res.data;
  } catch (err) {
    const msg = String(err?.message || '');
    if (/points|xp|reward/i.test(msg)) {
      const res2 = await supabase.from('teachers')
        .select('name,bio,avatar_url,whatsapp,facebook,phone,contact_methods,ads_limit,is_active,plan_type,subscription_start,subscription_end,subscription_status,allow_basic_stats,allow_advanced_stats,allow_unlimited_edits,allow_fast_support,custom_features,created_at')
        .eq('id', teacher.id).single();
      data = res2.data || {};
      data.points = 0; data.xp = 0; data.reward_points = 0;
    } else { console.error(err); return; }
  }
  if (!data) return;

  // Early adopter: accounts created before April 2026
  data.is_early_adopter = new Date(data.created_at || '2026-01-01') <= new Date('2026-04-01');

  // Fill profile form
  document.getElementById('p-name').value = data.name || '';
  document.getElementById('p-bio').value = data.bio || '';
  document.getElementById('p-whatsapp').value = data.whatsapp || '';
  document.getElementById('p-facebook').value = data.facebook || '';
  document.getElementById('p-contact-methods').value = data.contact_methods || '';
  document.getElementById('p-phone').value = data.phone || '';
  renderAvatarPreview(data.avatar_url || '');

  Object.assign(teacher, data);
  const xp = typeof data.xp === 'number' ? data.xp : (data.points || 0);
  const rp = typeof data.reward_points === 'number' ? data.reward_points : xp;
  teacher.xp = xp; teacher.reward_points = rp; teacher.points = xp;
  Auth.setTeacherSession({...teacher, name: data.name || teacher.name, xp, reward_points: rp});

  document.getElementById('subscription-banner').innerHTML = subscriptionBannerHtml(teacher);
  const earlyBadge = document.getElementById('early-adopter-badge');
  if (earlyBadge) earlyBadge.style.display = data.is_early_adopter ? '' : 'none';

  renderFeatures();
  updateHeroGamification(xp, rp);
  renderProfileCompletion();
}

/* ══════════════════════════════════════
   HERO GAMIFICATION
══════════════════════════════════════ */
function updateHeroGamification(xp, rp) {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('teacher-xp', xp.toLocaleString('ar-EG'));
  setEl('teacher-rp', (rp ?? xp).toLocaleString('ar-EG'));
  setEl('teacher-points', xp.toLocaleString('ar-EG'));
  setEl('events-xp-display', xp.toLocaleString('ar-EG'));
  setEl('events-points-display', (rp ?? xp).toLocaleString('ar-EG'));

  const cur = GM_LEVELS.find(l => xp >= l.min && xp < l.max) || GM_LEVELS[GM_LEVELS.length - 1];
  const next = GM_LEVELS.find(l => l.min > xp);
  const lvIconEl = document.getElementById('lv-icon');
  if (lvIconEl) lvIconEl.innerHTML = gmIcon(cur.icon, {style:'color:#fff'});
  setEl('lv-name', cur.name);
  const dot = document.getElementById('lv-dot'); if (dot) dot.style.background = cur.color;
  setEl('lv-cur', cur.name);
  setEl('lv-next', next ? next.name : '—');

  const range = next ? (next.min - cur.min) : (cur.max - cur.min);
  const pct = next ? Math.min(Math.round(((xp - cur.min) / range) * 100), 100) : 100;
  setEl('lv-pts-lbl', `${xp.toLocaleString('ar-EG')} / ${next ? next.min.toLocaleString('ar-EG') : '∞'}`);
  const fill = document.getElementById('lv-prog-fill');
  if (fill) {
    fill.style.width = pct + '%';
    fill.style.background = `linear-gradient(90deg,${cur.color},${next ? next.color : cur.color})`;
  }
  setEl('lv-prog-pct', toAr(pct) + '% للمستوى التالي');
}

function updateCircularGoal(todayPts) {
  const max = 100, pct = Math.min(todayPts / max, 1), circ = 138.2;
  const arc = document.getElementById('circ-arc');
  if (arc) {
    arc.setAttribute('stroke-dashoffset', (circ * (1 - pct)).toFixed(1));
    arc.setAttribute('stroke', todayPts >= max ? '#F59E0B' : '#20C997');
  }
  const el = document.getElementById('circ-today'); if (el) el.textContent = toAr(Math.min(todayPts, max));
}

function calcStreak(events) {
  if (!events.length) return 0;
  const days = new Set(events.map(e => (e.created_at || '').slice(0, 10)));
  let streak = 0; const d = new Date();
  for (let i = 0; i < 365; i++) {
    if (days.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

/* ══════════════════════════════════════
   PROFILE COMPLETION
══════════════════════════════════════ */
function renderProfileCompletion() {
  // "وسيلة تواصل" بند واحد يتحقق لو أي وسيلة منها موجودة (بدل ما كل وسيلة
  // تُحسب لوحدها)، ونفس المنطق المستخدم في renderHomeAlerts تمامًا — فيسبوك
  // كان قبل كده مش محسوب هنا رغم إنه وسيلة تواصل فعلية ومقبولة في كل مكان تاني.
  const hasContact = !!(teacher.whatsapp || teacher.facebook || teacher.phone);
  const fields = [
    {key:'avatar_url', label:'الصورة', icon:'camera', done: !!teacher.avatar_url},
    {key:'name', label:'الاسم', icon:'user', done: !!teacher.name},
    {key:'bio', label:'النبذة', icon:'writing', done: !!teacher.bio},
    {key:'contact', label:'وسيلة تواصل', icon:'chat', done: hasContact},
    {key:'contact_methods', label:'تواصل إضافي', icon:'link', done: !!teacher.contact_methods},
  ];
  const filled = fields.filter(f => f.done);
  const pct = Math.round((filled.length / fields.length) * 100);
  const missing = fields.filter(f => !f.done);
  const color = pct >= 80 ? '#0EA672' : pct >= 50 ? '#F59E0B' : '#EF4444';
  const box = document.getElementById('home-profile-completion');
  if (!box) return;
  box.style.display = pct < 100 ? '' : 'none';
  const pctEl = document.getElementById('home-completion-pct');
  const barEl = document.getElementById('home-completion-bar');
  const msgEl = document.getElementById('home-completion-msg');
  if (pctEl) { pctEl.textContent = pct + '%'; pctEl.style.color = color; }
  if (barEl) { barEl.style.width = pct + '%'; barEl.style.background = color; }
  if (msgEl && missing.length) {
    msgEl.innerHTML = `ناقص: ${missing.map(f => `<span style="background:#FEF3C7;color:#92400E;border-radius:50px;padding:2px 8px;margin-left:3px;font-size:.7rem;font-weight:600">${gmIcon(f.icon)} ${f.label}</span>`).join('')}
    <button onclick="switchTab('profile')" style="background:none;border:none;color:var(--primary);font-size:.74rem;font-weight:600;cursor:pointer;margin-right:6px;font-family:inherit">إكمال الملف ←</button>`;
  }
}

/* ══════════════════════════════════════
   LOAD ADS
══════════════════════════════════════ */
async function loadAds() {
  document.getElementById('ads-loading').style.display = 'flex';
  document.getElementById('ads-list').style.display = 'none';
  try {
    const token = Auth.getToken();
    if (!token) { showToast('انتهت الجلسة، سجّل دخول تاني', 'warning'); setTimeout(() => location.href = 'login.html?role=teacher', 1200); return; }
    const { data, error } = await supabase.rpc('get_my_ads', { p_token: token });
    if (error) throw error;
    teacherAds = data || [];
  } catch (err) {
    showToast('تعذّر تحميل الإعلانات: ' + (err?.message || ''), 'danger');
    teacherAds = [];
  }
  renderAds(); updateAdsStats(); updateLimitDisplay();
  document.getElementById('ads-loading').style.display = 'none';
  document.getElementById('home-active-ads').textContent = toAr(teacherAds.filter(a => a.status === 'active').length);
  const gscAds = document.getElementById('gsc-ads'); if (gscAds) gscAds.textContent = toAr(teacherAds.filter(a => a.status === 'active').length);
}

function updateAdsStats() {
  document.getElementById('stat-active').textContent = toAr(teacherAds.filter(a => a.status === 'active').length);
  document.getElementById('stat-pending').textContent = toAr(teacherAds.filter(a => a.status === 'pending').length);
  document.getElementById('stat-rejected').textContent = toAr(teacherAds.filter(a => a.status === 'rejected').length);
}

// الإعلان المرفوض ما بيستهلكش سلوت من حد الإعلانات المسموح — بس النشط والمعلّق
// (اللي لسه ممكن يتفعّل) هما اللي بيتحسبوا. كان قبل كده أي رفض بيقفل السلوت
// للأبد لحد ما المدرس يمسحه يدويًا بنفسه بدون أي توضيح لسبب الرسالة.
function countUsedAdSlots() {
  return teacherAds.filter(a => a.status !== 'rejected').length;
}

function updateLimitDisplay() {
  const limit = getTeacherFeatures(teacher).ads_limit;
  const used = countUsedAdSlots();
  const addBtn = document.getElementById('add-ad-btn');
  if (!addBtn) return;
  if (!isSubscriptionActive(teacher)) { addBtn.disabled = true; addBtn.textContent = 'منتهي'; }
  else if (used >= limit) { addBtn.disabled = true; addBtn.textContent = `الحد (${limit})`; }
  else { addBtn.disabled = false; addBtn.textContent = '+ إعلان جديد'; }
}

function renderAds() {
  const list = document.getElementById('ads-list');
  const empty = document.getElementById('ads-empty');
  if (!teacherAds.length) { list.style.display = 'none'; empty.style.display = ''; return; }
  list.style.display = ''; empty.style.display = 'none';
  list.innerHTML = teacherAds.map(ad => `
    <div class="ad-card animate-in">
      <div class="ad-card-hd">
        <div style="flex:1;min-width:0">
          <div class="ad-card-title">${escapeHtml(ad.title || ad.subject)}
            ${teacher.is_early_adopter ? '<span style="background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;border-radius:50px;padding:2px 8px;font-size:.57rem;font-weight:700;margin-right:4px"><i class="ti ti-medal" aria-hidden="true"></i> أوائل</span>' : ''}
          </div>
          <div class="ad-card-meta">
            <span class="tc-badge badge-grade"><i class="ti ti-book-2" aria-hidden="true"></i> ${gradeDisplay(ad)}</span>
            <span class="tc-badge ${lessonTypeBadgeClass(ad.lesson_type)}">${lessonTypeLabel(ad.lesson_type)}</span>
            ${ad.class_format ? `<span class="tc-badge ${classFormatBadgeClass(ad.class_format)}">${classFormatLabel(ad.class_format)}</span>` : ''}
            <span class="tc-badge ${statusBadgeClass(ad.status)}">${statusLabel(ad.status)}</span>
          </div>
        </div>
        <div class="ad-card-actions">
          <a href="teacher.html?ad=${ad.id}${ad.status !== 'active' ? '&preview=1' : ''}" target="_blank" class="btn btn-ghost btn-sm" title="معاينة"><i class="ti ti-eye" aria-hidden="true"></i></a>
          ${(!getTeacherFeatures(teacher).unlimited_edits && Number(ad.edit_count || 0) >= 3)
            ? '<button class="btn btn-ghost btn-sm" disabled title="وصلت للحد"><i class="ti ti-lock" aria-hidden="true"></i></button>'
            : `<button class="btn btn-ghost btn-sm" onclick="openEditAdModal('${ad.id}')" title="تعديل"><i class="ti ti-edit" aria-hidden="true"></i></button>`}
          <button class="btn btn-danger btn-sm" onclick="deleteAd('${ad.id}')"><i class="ti ti-trash" aria-hidden="true"></i></button>
        </div>
      </div>
      <div class="ad-card-body">
        <div class="ad-price"><i class="ti ti-coin" aria-hidden="true"></i> ${formatPrice(ad.price)} / الحصة</div>
        ${ad.main_image_url ? `<div class="media-preview"><img src="${escapeHtml(ad.main_image_url)}" style="object-position:${escapeHtml(ad.main_image_position || '50% 50%')}" onerror="this.style.display='none'"></div>` : ''}
        ${!getTeacherFeatures(teacher).unlimited_edits ? `<div style="font-size:.76rem;color:var(--text-muted);margin-top:5px"><i class="ti ti-edit" aria-hidden="true"></i> تعديلات: ${toAr(Number(ad.edit_count || 0))} / ٣</div>` : ''}
        ${ad.description ? `<div style="font-size:.81rem;color:var(--text-secondary);margin-top:5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escapeHtml(ad.description)}</div>` : ''}
        ${ad.status === 'pending' ? '<div class="alert alert-info mt-8" style="padding:6px 10px;font-size:.76rem"><i class="ti ti-clock" aria-hidden="true"></i> قيد مراجعة الإدارة</div>' : ''}
        ${ad.status === 'rejected' ? '<div class="alert alert-danger mt-8" style="padding:6px 10px;font-size:.76rem"><i class="ti ti-x" aria-hidden="true"></i> مرفوض من الإدارة</div>' : ''}
      </div>
    </div>`).join('');
}

/* ══════════════════════════════════════
   AD CRUD
══════════════════════════════════════ */
function openAddAdModal() {
  if (!isSubscriptionActive(teacher)) { showToast('اشتراكك منتهي. جدّد أولاً', 'danger'); return; }
  if (countUsedAdSlots() >= getTeacherFeatures(teacher).ads_limit) { showToast('وصلت للحد الأقصى من الإعلانات النشطة/المعلّقة. احذف إعلانًا قديمًا لو محتاج تضيف جديد', 'warning', 6000); return; }
  document.getElementById('modal-title').textContent = '+ إعلان جديد';
  document.getElementById('ad-submit-btn').textContent = 'نشر الإعلان';
  document.getElementById('ad-id').value = '';
  document.getElementById('ad-form').reset();
  document.getElementById('ad-current-main-image').innerHTML = '';
  document.getElementById('ad-current-gallery').innerHTML = '';
  initMainImagePositionEditor('', '50% 50%');
  populateSubjectSelect('ad-subject');
  renderGradeCheckboxes('ad-grades-box', []);
  document.getElementById('modal-error').style.display = 'none';
  openModal('ad-modal');
  if (typeof Tutorial !== 'undefined') setTimeout(() => Tutorial.run('dash_ad_modal', TUT_AD_MODAL, {allowModal:true}), 450);
}

async function openEditAdModal(adId) {
  if (!isSubscriptionActive(teacher)) { showToast('اشتراكك منتهي', 'danger'); return; }
  const ad = teacherAds.find(a => a.id === adId);
  if (!ad) return;
  const f = getTeacherFeatures(teacher);
  if (!f.unlimited_edits && Number(ad?.edit_count || 0) >= 3) {
    showToast('وصلت للحد الأقصى: ٣ تعديلات. راسل الإدارة للترقية.', 'warning', 6500); return;
  }
  document.getElementById('modal-title').textContent = 'تعديل الإعلان';
  document.getElementById('ad-submit-btn').textContent = 'حفظ التعديلات';
  document.getElementById('ad-id').value = adId;
  document.getElementById('ad-title').value = ad.title || '';
  populateSubjectSelect('ad-subject', ad.subject || '');
  renderGradeCheckboxes('ad-grades-box', getAdGrades(ad));
  document.getElementById('ad-subject').value = ad.subject || '';
  document.getElementById('ad-price').value = ad.price || '';
  document.getElementById('ad-lesson-type').value = ad.lesson_type || '';
  document.getElementById('ad-class-format').value = ad.class_format || '';
  document.getElementById('ad-description').value = ad.description || '';
  document.getElementById('ad-extra-contact').value = ad.extra_contact || '';
  document.getElementById('ad-main-image-position').value = ad.main_image_position || '50% 50%';
  document.getElementById('ad-main-image').value = '';
  document.getElementById('ad-gallery-images').value = '';
  document.getElementById('ad-current-main-image').innerHTML = ad.main_image_url ? `<img src="${escapeHtml(ad.main_image_url)}" onerror="this.style.display='none'">` : '';
  initMainImagePositionEditor(ad.main_image_url || '', ad.main_image_position || '50% 50%');
  document.getElementById('ad-current-gallery').innerHTML = normalizeList(ad.gallery_images).map(u => `<img src="${escapeHtml(u)}" onerror="this.style.display='none'">`).join('');
  document.getElementById('modal-error').style.display = 'none';
  openModal('ad-modal');
  if (typeof Tutorial !== 'undefined') setTimeout(() => Tutorial.run('dash_ad_modal', TUT_AD_MODAL, {allowModal:true}), 450);
}

function quickEditFirstAd() {
  if (!teacherAds.length) { showToast('لا توجد إعلانات للتعديل', 'warning'); return; }
  // لو عنده إعلان واحد بس، افتح تعديله فورًا بدون شاشة اختيار زيادة
  if (teacherAds.length === 1) { switchTab('ads'); openEditAdModal(teacherAds[0].id); return; }
  openAdPickerModal('edit');
}

/* ══════════════════════════════════════
   AD PICKER — لاختيار إعلان محدد عند وجود
   أكثر من إعلان، سواء للتعديل أو للمعاينة
══════════════════════════════════════ */
function openAdPickerModal(purpose) {
  const list = document.getElementById('ad-picker-list');
  const title = document.getElementById('ad-picker-title');
  if (!list || !title) return;
  title.textContent = purpose === 'edit' ? 'اختر الإعلان المطلوب تعديله' : 'اختر الإعلان لعرضه كما يراه الطلاب';
  list.innerHTML = teacherAds.map(ad => `
    <button type="button" class="ad-picker-item" onclick="pickAd('${ad.id}','${purpose}')">
      <span class="ad-picker-item-main">
        <span class="ad-picker-item-title">${escapeHtml(ad.title || ad.subject)}</span>
        <span class="ad-picker-item-meta">${escapeHtml(ad.subject)} · ${escapeHtml(gradeDisplay(ad))}</span>
      </span>
      <span class="tc-badge ${statusBadgeClass(ad.status)}">${statusLabel(ad.status)}</span>
    </button>`).join('');
  openModal('ad-picker-modal');
}

function pickAd(adId, purpose) {
  closeModal('ad-picker-modal');
  if (purpose === 'edit') { switchTab('ads'); openEditAdModal(adId); return; }
  const ad = teacherAds.find(a => a.id === adId);
  window.open('teacher.html?ad=' + adId + (ad && ad.status !== 'active' ? '&preview=1' : ''), '_blank');
}

async function submitAd(e) {
  e.preventDefault();
  if (!isSubscriptionActive(teacher)) { showToast('اشتراكك منتهي', 'danger'); return; }
  const btn = document.getElementById('ad-submit-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  const adId = document.getElementById('ad-id').value, isEdit = !!adId;
  const currentAd = isEdit ? teacherAds.find(a => a.id === adId) : null;
  try {
    if (!isEdit) {
      const lc = teacherAds.filter(a => a.status !== 'rejected').length;
      if (lc >= getTeacherFeatures(teacher).ads_limit) throw new Error('وصلت للحد الأقصى');
    }
    const folder = `ads/${teacher.id}`;
    const uploadedMain = await uploadImageInput('ad-main-image', folder);
    const oldGallery = normalizeList(currentAd?.gallery_images);
    const newGallInput = document.getElementById('ad-gallery-images');
    if (oldGallery.length + (newGallInput?.files?.length || 0) > MAX_GALLERY_IMAGES) throw new Error(`الحد الأقصى ${MAX_GALLERY_IMAGES} صور.`);
    const uploadedGallery = await uploadMultipleImagesInput('ad-gallery-images', folder, MAX_GALLERY_IMAGES - oldGallery.length);
    const gradeCheck = validateSameGradeSection(getSelectedGrades('ad-grades-box'));
    if (!gradeCheck.ok) throw new Error(gradeCheck.message);
    const payload = {
      teacher_id: teacher.id,
      title: document.getElementById('ad-title').value.trim(),
      subject: document.getElementById('ad-subject').value,
      grade: gradeCheck.grades.join('، '), grades: gradeCheck.grades, grade_section: gradeCheck.section,
      price: parseFloat(document.getElementById('ad-price').value),
      lesson_type: document.getElementById('ad-lesson-type').value,
      class_format: document.getElementById('ad-class-format').value,
      description: document.getElementById('ad-description').value.trim(),
      extra_contact: document.getElementById('ad-extra-contact').value.trim(),
      main_image_url: uploadedMain || currentAd?.main_image_url || null,
      main_image_position: document.getElementById('ad-main-image-position').value || '50% 50%',
      gallery_images: [...oldGallery, ...uploadedGallery], video_links: [],
      status: isEdit ? undefined : 'pending',
      edit_count: isEdit ? Number(currentAd?.edit_count || 0) + (getTeacherFeatures(teacher).unlimited_edits ? 0 : 1) : 0,
    };
    if (isEdit) { delete payload.status; delete payload.teacher_id; }
    // كل كتابة على الإعلان بتمر عبر دالة سيرفر متحقّقة برمز الجلسة، بحيث السيرفر
    // هو اللي بيحدد teacher_id/الملكية — مش كلام المتصفح. (يمنع تعديل/حذف إعلان
    // مدرّس تاني). teacher_id / status / edit_count كلها بتتحدد على الخادم.
    const token = Auth.getToken();
    if (!token) throw new Error('انتهت الجلسة. سجّل دخول تاني من فضلك.');
    let error;
    if (isEdit) {
      const r = await supabase.rpc('update_ad', {
        p_token: token, p_ad_id: adId,
        p_title: payload.title, p_subject: payload.subject, p_grade: payload.grade,
        p_grades: payload.grades, p_grade_section: payload.grade_section, p_price: payload.price,
        p_lesson_type: payload.lesson_type, p_class_format: payload.class_format,
        p_description: payload.description, p_extra_contact: payload.extra_contact,
        p_main_image_url: payload.main_image_url, p_main_image_position: payload.main_image_position,
        p_gallery_images: payload.gallery_images,
      });
      error = r.error;
    } else {
      const r = await supabase.rpc('create_ad', {
        p_token: token,
        p_title: payload.title, p_subject: payload.subject, p_grade: payload.grade,
        p_grades: payload.grades, p_grade_section: payload.grade_section, p_price: payload.price,
        p_lesson_type: payload.lesson_type, p_class_format: payload.class_format,
        p_description: payload.description, p_extra_contact: payload.extra_contact,
        p_main_image_url: payload.main_image_url, p_main_image_position: payload.main_image_position,
        p_gallery_images: payload.gallery_images,
      });
      error = r.error;
    }
    if (error) throw error;
    // ملاحظة: بونص "أكمل إعلانك الأول" بقى بيتحسب جوّه create_ad على الخادم
    // بالهوية المتحقّقة — مفيش نداء منفصل من المتصفح.
    closeModal('ad-modal');
    showToast(isEdit ? 'تم تعديل الإعلان ✅' : 'تم الإضافة وهو قيد المراجعة ⏳', 'success');
    statsLoaded = false;
    await loadAds();
  } catch (err) {
    const msg = String(err?.message || '');
    let friendly = msg;
    if (/row[- ]level security|violates.*security policy/i.test(msg)) friendly = 'تعذّر الحفظ، حاول تاني أو تواصل مع الدعم.';
    const errEl = document.getElementById('modal-error');
    if (errEl) { errEl.textContent = friendly; errEl.style.display = 'block'; }
  } finally {
    btn.disabled = false; btn.textContent = isEdit ? 'حفظ التعديلات' : 'نشر الإعلان';
  }
}

async function deleteAd(adId) {
  confirmDialog('هل أنت متأكد من حذف هذا الإعلان؟', async () => {
    const token = Auth.getToken();
    if (!token) { showToast('انتهت الجلسة، سجّل دخول تاني', 'warning'); setTimeout(() => location.href = 'login.html?role=teacher', 1200); return; }
    const { error } = await supabase.rpc('delete_ad', { p_token: token, p_ad_id: adId });
    if (error) { showToast('حدث خطأ عند الحذف', 'danger'); return; }
    showToast('تم حذف الإعلان', 'success'); statsLoaded = false; await loadAds();
  });
}

/* ══════════════════════════════════════
   PROFILE
══════════════════════════════════════ */
async function saveProfile(e) {
  e.preventDefault();
  // كل تعديل على الملف بيمر عبر دالة سيرفر متحقّقة برمز الجلسة — السيرفر بيحدد
  // teacher_id من الجلسة، فمحدش يقدر يعدّل بيانات (اسم/واتساب/فيسبوك...) مدرّس تاني.
  const token = Auth.getToken();
  if (!token) { showToast('انتهت الجلسة، سجّل دخول تاني', 'warning'); setTimeout(() => location.href = 'login.html?role=teacher', 1200); return; }
  const btn = document.getElementById('profile-save-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  try {
    const uploadedAvatar = await uploadImageInput('p-avatar-file', `teachers/${teacher.id}`);
    const updates = {
      name: document.getElementById('p-name').value.trim(),
      bio: document.getElementById('p-bio').value.trim(),
      whatsapp: document.getElementById('p-whatsapp').value.trim(),
      facebook: document.getElementById('p-facebook').value.trim(),
      phone: document.getElementById('p-phone').value.trim(),
      contact_methods: document.getElementById('p-contact-methods').value.trim(),
      avatar_url: uploadedAvatar || teacher.avatar_url || null,
    };
    const { error } = await supabase.rpc('update_teacher_profile', {
      p_token: token,
      p_name: updates.name,
      p_bio: updates.bio,
      p_whatsapp: updates.whatsapp,
      p_facebook: updates.facebook,
      p_phone: updates.phone,
      p_contact_methods: updates.contact_methods,
      p_avatar_url: updates.avatar_url,
    });
    if (error) throw error;
    Object.assign(teacher, updates);
    renderAvatarPreview(updates.avatar_url || '');
    Auth.setTeacherSession({...teacher, name: updates.name});
    document.getElementById('teacher-name-display').textContent = updates.name;
    document.getElementById('nav-teacher-name').textContent = updates.name;
    renderProfileCompletion();
    showToast('تم حفظ التغييرات ✅', 'success');
  } catch (err) { showToast(err.message || 'حدث خطأ', 'danger'); }
  finally { btn.disabled = false; btn.textContent = 'حفظ التغييرات'; }
}

/* ══════════════════════════════════════
   FEATURES
══════════════════════════════════════ */
async function renderFeatures() {
  const box = document.getElementById('features-content'); if (!box) return;
  const f = getTeacherFeatures(teacher);
  let addons = [];
  try {
    const { data, error } = await supabase.from('addons').select('*').eq('is_active', true).order('sort_order');
    if (error) throw error;
    addons = data || [];
  } catch (_) { addons = ADDON_DEFINITIONS.map(a => ({ addon_key: '', name: a.name, price: a.price, billing_type: a.unit.includes('مرة') ? 'one_time' : 'monthly', description: a.desc, icon: a.icon, color: (a.className || '').replace('addon-', '') })); }

  box.innerHTML = `
    ${subscriptionBannerHtml(teacher)}
    <div style="background:linear-gradient(135deg,#0D1B4B,#1E3A8A);color:white;border-radius:13px;padding:14px 18px;margin-bottom:14px;display:flex;gap:11px;align-items:flex-start">
      <span style="font-size:1.3rem;flex-shrink:0">ℹ️</span>
      <div>
        <div style="font-family:Cairo,sans-serif;font-weight:800;margin-bottom:5px">نظام النقاط المزدوج</div>
        <div style="font-size:.78rem;color:rgba(255,255,255,.8);line-height:1.7"><i class="ti ti-star" aria-hidden="true" style="color:#FCD34D"></i> <strong>نقاط الخبرة (XP):</strong> تتراكم ولا تنقص أبداً — تحدد مستواك<br><i class="ti ti-gift" aria-hidden="true" style="color:#FCA5A5"></i> <strong>نقاط المكافآت:</strong> يمكن صرفها على جوائز دون التأثير على XP</div>
      </div>
    </div>
    <div class="plan-grid">
      ${Object.values(PLAN_DEFINITIONS).map(plan => `
        <div class="plan-card ${plan.key === f.plan.key ? 'current' : ''}">
          <div class="plan-head ${plan.color === 'green' ? 'plan-green' : plan.color === 'blue' ? 'plan-blue' : 'plan-purple'}">${plan.key === f.plan.key ? '<i class="ti ti-circle-check" aria-hidden="true"></i> ' : ''}${escapeHtml(plan.name)}</div>
          <div class="plan-body">
            <div class="plan-price">${toAr(plan.price)}<small style="font-size:.68rem;color:var(--text-muted);font-weight:700;font-family:Tajawal"> ج</small></div>
            <ul class="clean-list">${plan.features.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          </div>
        </div>`).join('')}
    </div>
    <div class="profile-card" style="margin:13px 0">
      <h3 style="margin-bottom:11px;font-family:Cairo,sans-serif;font-weight:700;font-size:.95rem">المميزات الحالية</h3>
      <div style="display:grid;gap:7px">
        <div style="padding:8px 11px;background:var(--bg-soft);border-radius:8px;font-size:.84rem"><i class="ti ti-circle-check" aria-hidden="true" style="color:var(--success)"></i> إعلانات: ${toAr(f.ads_limit)}</div>
        <div style="padding:8px 11px;background:var(--bg-soft);border-radius:8px;font-size:.84rem">${f.unlimited_edits ? '<i class="ti ti-circle-check" aria-hidden="true" style="color:var(--success)"></i> تعديل غير محدود' : '<i class="ti ti-circle-check" aria-hidden="true" style="color:var(--success)"></i> ٣ تعديلات لكل إعلان'}</div>
        <div style="padding:8px 11px;background:var(--bg-soft);border-radius:8px;font-size:.84rem">${f.basic_stats ? '<i class="ti ti-circle-check" aria-hidden="true" style="color:var(--success)"></i> إحصائيات بسيطة' : '<i class="ti ti-lock" aria-hidden="true" style="color:var(--text-muted)"></i> إحصائيات بسيطة'}</div>
        <div style="padding:8px 11px;background:var(--bg-soft);border-radius:8px;font-size:.84rem">${f.advanced_stats ? '<i class="ti ti-circle-check" aria-hidden="true" style="color:var(--success)"></i> إحصائيات متقدمة' : '<i class="ti ti-lock" aria-hidden="true" style="color:var(--text-muted)"></i> إحصائيات متقدمة'}</div>
        ${f.custom_features ? `<div style="padding:8px 11px;background:var(--success-bg);border-radius:8px;font-size:.84rem"><i class="ti ti-gift" aria-hidden="true" style="color:#F59E0B"></i> ${escapeHtml(f.custom_features)}</div>` : ''}
      </div>
      <div class="alert alert-info mt-16" style="font-size:.82rem">للترقية أو أي طلب خاص: <a href="#" data-admin-contact data-message="أريد ترقية باقتي في مدرسك" style="color:var(--primary);font-weight:700">تواصل مع الإدارة</a></div>
    </div>
    <div class="profile-card">
      <h3 style="margin-bottom:6px;font-family:Cairo,sans-serif;font-weight:700;font-size:.95rem"><i class="ti ti-coin" aria-hidden="true" style="color:var(--primary)"></i> إضافات لحسابك</h3>
      <p style="font-size:.82rem;color:var(--text-secondary);margin-bottom:12px">فعّل أي إضافة فورًا بالدفع أونلاين، وتقدر تجمع بين أكتر من إضافة حسب احتياجك.</p>
      <div class="addon-grid" id="addon-buy-grid">${addons.map(a => {
        const pr = computeAddonProration(a.price, a.billing_type, teacher.subscription_end);
        const priceHtml = pr.isProrated
          ? `<div class="addon-price">${toAr(pr.prorated)}<span> جنيه</span></div>
             <div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">
               <span style="text-decoration:line-through">${toAr(pr.full)} ج</span>
               · محسوب لباقي <strong style="color:var(--primary)">${toAr(pr.days)} يوم</strong> من اشتراكك
             </div>`
          : `<div class="addon-price">${toAr(a.price)}<span> جنيه ${a.billing_type === 'monthly' ? '/ شهر' : 'مرة واحدة'}</span></div>`;
        return `
        <div class="addon-card addon-${escapeHtml(a.color || 'blue')}">
          <div class="addon-icon">${a.icon ? (String(a.icon).match(/^[a-z0-9-]+$/) ? gmIcon(a.icon) : a.icon) : gmIcon('puzzle')}</div>
          <h4>${escapeHtml(a.name)}</h4>
          ${priceHtml}
          <p>${escapeHtml(a.description || '')}</p>
          ${pr.isProrated ? `<div style="font-size:.68rem;color:var(--text-secondary);background:var(--primary-bg);border-radius:6px;padding:5px 8px;margin-bottom:8px"><i class="ti ti-info-circle" aria-hidden="true" style="color:var(--primary)"></i> تنتهي مع انتهاء اشتراكك الأساسي</div>` : ''}
          ${a.addon_key ? `<button type="button" class="btn btn-primary btn-block mt-16" onclick="buyAddon('${a.addon_key}', this)">اشترِ الآن</button>` : ''}
        </div>`;
      }).join('')}
      </div>
    </div>`;

  // إعادة ربط روابط "تواصل مع الإدارة" المُنشأة ديناميكيًا هنا
  // (bindAdminContactLinks تعمل عند تحميل الصفحة فقط، فنعيد استدعاءها
  //  بعد حقن محتوى جديد يحوي [data-admin-contact])
  if (typeof bindAdminContactLinks === 'function') bindAdminContactLinks();
}

// ══════════════════════════════════════════════════════
//  الحساب النسبي لسعر الإضافات (Proration)
//  ──────────────────────────────────────────────────────
//  دالة معزولة وواضحة: لو المدرس اشترك في إضافة شهرية وباقي
//  له أيام أقل من شهر، يدفع نسبة من السعر بقدر الأيام المتبقية
//  فقط، وتنتهي الإضافة مع انتهاء اشتراكه الأساسي.
//
//  ملاحظة: ده حساب *العرض* في الواجهة فقط. حساب الدفع الفعلي
//  يتم في الباك-إند (Paymob حاليًا، وسيتحوّل لكاشير لاحقًا).
//  عند التحويل لكاشير، تُربط هذه الدالة بنفس منطق الباك-إند
//  من مكان واحد — لأنها معزولة تمامًا هنا.
//
//  المدخلات:
//    price       سعر الإضافة الشهري الكامل
//    billingType 'monthly' أو 'one_time'
//    subEndISO   تاريخ انتهاء الاشتراك الأساسي (ISO)
//  المخرجات: كائن فيه:
//    prorated    السعر بعد الحساب النسبي (مقرّب)
//    full        السعر الكامل
//    days        الأيام المتبقية في الاشتراك
//    isProrated  هل حصل خصم نسبي فعلاً
//    cycleDays   طول الدورة المعتمدة (30 يوم)
// ══════════════════════════════════════════════════════
const ADDON_CYCLE_DAYS = 30;

function computeAddonProration(price, billingType, subEndISO) {
  const full = Number(price) || 0;
  const result = { prorated: full, full, days: null, isProrated: false, cycleDays: ADDON_CYCLE_DAYS };

  // الإضافات لمرة واحدة لا تخضع للحساب النسبي
  if (billingType !== 'monthly') return result;

  const days = daysUntil(subEndISO);
  result.days = days;

  // لو مفيش تاريخ انتهاء أو باقي شهر أو أكثر → السعر كامل
  if (days == null || days >= ADDON_CYCLE_DAYS || days <= 0) return result;

  // الحساب النسبي: السعر × (الأيام المتبقية ÷ ٣٠)
  const prorated = Math.round(full * (days / ADDON_CYCLE_DAYS));
  result.prorated = Math.max(prorated, 0);
  result.isProrated = true;
  return result;
}

// ── ينقل المدرس لتبويب المميزات ويمرّر لقسم الإضافات
// renderFeatures غير متزامنة (تنتظر جلب الإضافات)، فنحاول عدة مرات
// حتى يظهر الـ grid بدل الاعتماد على تأخير ثابت قد لا يكفي على شبكة بطيئة.
function goToAddons() {
  switchTab('features');
  let tries = 0;
  const tryScroll = () => {
    const grid = document.getElementById('addon-buy-grid');
    if (grid) { grid.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (++tries < 15) setTimeout(tryScroll, 200);
  };
  setTimeout(tryScroll, 150);
}

// ── شراء إضافة: بينشئ نية دفع ويحوّل لـ Paymob، أو يفعّل فورًا لو مجانية
async function buyAddon(addonKey, btnEl) {
  if (btnEl) { btnEl.disabled = true; btnEl.dataset.orig = btnEl.innerHTML; btnEl.innerHTML = '<span class="spinner"></span> جارٍ التجهيز...'; }
  try {
    const { data, error } = await supabase.functions.invoke('create-addon-payment-intention', {
      body: { teacher_id: teacher.id, addon_key: addonKey },
    });
    if (error) {
      let detail = error.message;
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errBody = await error.context.clone().json();
          if (errBody?.error) detail = errBody.error;
        }
      } catch (_) { /* هنستخدم الرسالة الافتراضية لو فشل الاستخراج */ }
      throw new Error(detail);
    }
    if (!data?.success) throw new Error(data?.error || 'تعذّر إتمام العملية، حاول مرة أخرى');

    if (data.activated) {
      showToast(`تم تفعيل "${data.addon_name}" فورًا! 🎉`, 'success');
      await loadTeacherData();
      return;
    }
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }
    throw new Error('تعذّر بدء عملية الدفع، حاول مرة أخرى');
  } catch (err) {
    showToast(err?.message || 'حدث خطأ غير متوقع', 'error');
    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = btnEl.dataset.orig; }
  }
}

// ── متابعة العودة من صفحة دفع إضافة (زي checkPaymentReturn في join.html بالظبط)
async function checkAddonPaymentReturn(attempt = 0) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('addon_payment_return') !== '1') return;
  const requestId = params.get('request_id');
  if (!requestId) return;

  if (attempt === 0) {
    switchTab('features');
    showToast('جارٍ التأكد من حالة الدفع...', 'default', 6000);
  }

  try {
    const { data, error } = await supabase.rpc('check_addon_purchase_status', { p_request_id: requestId });
    const row = Array.isArray(data) ? data[0] : data;

    if (!error && row?.status === 'active') {
      showToast(`تم تفعيل "${row.addon_name}" بنجاح! 🎉`, 'success');
      await loadTeacherData();
      history.replaceState(null, '', window.location.pathname);
      return;
    }
    if (!error && (row?.status === 'awaiting_payment' || !row?.status) && attempt < 6) {
      setTimeout(() => checkAddonPaymentReturn(attempt + 1), 3000);
      return;
    }
    showToast('لسه بنستنى تأكيد الدفع — حدّث الصفحة بعد شوية أو تواصل مع الإدارة لو استمرت المشكلة', 'default', 6000);
    history.replaceState(null, '', window.location.pathname);
  } catch (_) {
    showToast('حدث خطأ في التأكد من حالة الدفع', 'error');
  }
}

/* ══════════════════════════════════════
   HOME STATS LOADER
══════════════════════════════════════ */
async function loadHomeStats() {
  try {
    const { data } = await supabase.from('analytics_events')
      .select('event_type,created_at,ad_id').eq('teacher_id', teacher.id)
      .order('created_at', {ascending: false}).limit(2000);
    gamEvents = data || [];
    const cnt = t => gamEvents.filter(e => e.event_type === t).length;
    const totalViews = cnt('ad_card_view');
    const totalWa = cnt('whatsapp_click'), totalFb = cnt('facebook_click'), totalPhone = cnt('phone_click');
    const totalContacts = totalWa + totalFb + totalPhone;
    const convRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : '0.0';
    document.getElementById('home-views').textContent = totalViews.toLocaleString('ar-EG');
    document.getElementById('home-contacts').textContent = totalContacts.toLocaleString('ar-EG');
    document.getElementById('home-conv').textContent = toAr(convRate) + '%';
    buildHomeChart(gamEvents);
    const today = new Date().toISOString().slice(0, 10);
    const todayEv = gamEvents.filter(e => (e.created_at || '').slice(0, 10) === today);
    const todayPts = Math.min(
      todayEv.filter(e => e.event_type === 'ad_card_view').length
      + todayEv.filter(e => e.event_type === 'ad_detail_view').length * 2
      + todayEv.filter(e => e.event_type === 'whatsapp_click').length * 4
      + todayEv.filter(e => e.event_type === 'facebook_click').length * 3
      + todayEv.filter(e => e.event_type === 'phone_click').length * 5, 100);
    updateCircularGoal(todayPts);
    document.getElementById('tw-streak').textContent = toAr(calcStreak(gamEvents));

    // ── تنبيهات الصفحة الرئيسية ──
    renderHomeAlerts();
  } catch (e) {
    const el = document.getElementById('home-chart-loading');
    if (el) el.textContent = 'تعذّر تحميل البيانات';
  }
}

function renderHomeAlerts() {
  const box = document.getElementById('home-alerts');
  if (!box) return;
  const alerts = [];

  // تنبيه انتهاء الاشتراك
  if (!isSubscriptionActive(teacher)) {
    alerts.push({ type: 'danger', icon: 'ban', msg: 'اشتراكك منتهي — إعلاناتك مخفية حتى التجديد.' });
  } else {
    const days = daysUntil(teacher.subscription_end);
    if (days !== null && days <= 7 && days >= 0) {
      alerts.push({ type: 'warning', icon: 'warning', msg: `اشتراكك ينتهي خلال ${toAr(days)} يوم — تواصل مع الإدارة للتجديد.` });
    }
  }

  // تنبيه عدم وجود إعلانات نشطة
  const activeAds = teacherAds.filter(a => a.status === 'active');
  const pendingAds = teacherAds.filter(a => a.status === 'pending');
  if (teacherAds.length === 0) {
    alerts.push({ type: 'info', icon: 'clipboard', msg: 'لم تضف أي إعلان بعد — أضف إعلانك الأول ليظهر للطلاب.' });
  } else if (activeAds.length === 0 && pendingAds.length > 0) {
    alerts.push({ type: 'info', icon: 'clock', msg: `إعلانك قيد مراجعة الإدارة (${toAr(pendingAds.length)} إعلان).` });
  }

  // تنبيه اكتمال الملف الشخصي
  if (!teacher.whatsapp && !teacher.phone && !teacher.facebook) {
    alerts.push({ type: 'warning', icon: 'phone', msg: 'لم تضف وسائل تواصل — أضفها من ملفك الشخصي حتى يتصل بك الطلاب.' });
  }

  if (!alerts.length) { box.innerHTML = ''; return; }

  const colors = { danger: '#FEF2F2', warning: '#FFFBEB', info: '#EFF6FF' };
  const borders = { danger: '#FCA5A5', warning: '#FCD34D', info: '#BFDBFE' };
  const texts = { danger: '#9B1C1C', warning: '#92400E', info: '#1D4ED8' };

  box.innerHTML = alerts.map(a => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:11px 14px;border-radius:10px;border:1px solid ${borders[a.type]};background:${colors[a.type]};color:${texts[a.type]};font-size:.86rem;font-weight:600;margin-bottom:8px">
      <span style="flex-shrink:0;font-size:1.15rem;display:inline-flex">${gmIcon(a.icon)}</span>
      <span>${a.msg}</span>
    </div>`).join('');
}

/* ══════════════════════════════════════
   HOME CHART
══════════════════════════════════════ */
function buildHomeChart(events) {
  const days = [], labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().slice(0, 10));
    labels.push(i === 0 ? 'اليوم' : ['أحد','اثن','ثلا','أرب','خمس','جمع','سبت'][d.getDay()]);
  }
  const viewsData = days.map(ds => events.filter(e => (e.created_at||'').startsWith(ds) && e.event_type === 'ad_card_view').length);
  const contactsData = days.map(ds => events.filter(e => (e.created_at||'').startsWith(ds) && ['whatsapp_click','facebook_click','phone_click'].includes(e.event_type)).length);
  window._homeData = {views: viewsData, contacts: contactsData, labels};
  const loadEl = document.getElementById('home-chart-loading');
  const canvasEl = document.getElementById('home-area-chart');
  if (loadEl) loadEl.style.display = 'none';
  if (canvasEl) canvasEl.style.display = '';
  if (homeAreaChart) homeAreaChart.destroy();
  const ctx = canvasEl?.getContext('2d'); if (!ctx) return;
  const col = homeMetric === 'views' ? '#2563EB' : '#059669';
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, col + '44'); g.addColorStop(1, col + '00');
  homeAreaChart = new Chart(ctx, {
    type: 'line',
    data: {labels, datasets: [{data: homeMetric === 'views' ? viewsData : contactsData, borderColor: col, borderWidth: 2.5, backgroundColor: g, fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: col, pointBorderColor: 'white', pointBorderWidth: 2}]},
    options: chartOpts()
  });
}

function switchHomeMetric(metric, btn) {
  homeMetric = metric;
  document.querySelectorAll('#home-metric-btns .mbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (!window._homeData || !homeAreaChart) return;
  const col = metric === 'views' ? '#2563EB' : '#059669';
  homeAreaChart.data.datasets[0].data = window._homeData[metric];
  homeAreaChart.data.datasets[0].borderColor = col;
  homeAreaChart.data.datasets[0].pointBackgroundColor = col;
  const ctx = document.getElementById('home-area-chart')?.getContext('2d');
  if (ctx) { const g = ctx.createLinearGradient(0,0,0,200); g.addColorStop(0,col+'44'); g.addColorStop(1,col+'00'); homeAreaChart.data.datasets[0].backgroundColor = g; }
  homeAreaChart.update();
}

/* ══════════════════════════════════════
   FULL STATS LOADER
══════════════════════════════════════ */
async function loadTeacherStats() {
  if (statsLoaded) return;
  const f = getTeacherFeatures(teacher);
  const gamLoad = document.getElementById('gam-loading');
  const gamCont = document.getElementById('gam-content');
  const gamLock = document.getElementById('gam-locked');
  gamLoad.style.display = 'flex'; gamCont.style.display = 'none'; gamLock.style.display = 'none';
  try {
    const { data, error } = await supabase.from('analytics_events')
      .select('event_type,created_at,ad_id').eq('teacher_id', teacher.id)
      .order('created_at', {ascending: false}).limit(5000);
    if (error) throw error;
    gamEvents = data || [];
    try {
      const token = Auth.getToken();
      const { data: claims } = token
        ? await supabase.rpc('get_my_reward_claims', { p_token: token })
        : { data: [] };
      teacherClaims = new Set((claims || []).map(c => `${c.reward_key}|${c.period_key}`));
    } catch (_) { teacherClaims = new Set(); }
    const cnt = t => gamEvents.filter(e => e.event_type === t).length;
    const totalViews = cnt('ad_card_view'), totalDetails = cnt('ad_detail_view');
    const totalWa = cnt('whatsapp_click'), totalFb = cnt('facebook_click'), totalPhone = cnt('phone_click');
    const totalContacts = totalWa + totalFb + totalPhone;
    const convRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : '0.0';
    document.getElementById('gsc-views').textContent = totalViews.toLocaleString('ar-EG');
    document.getElementById('gsc-details').textContent = totalDetails.toLocaleString('ar-EG');
    document.getElementById('gsc-wa').textContent = totalWa.toLocaleString('ar-EG');
    document.getElementById('gsc-conv-rate').textContent = toAr(convRate) + '%';
    // Home KPIs sync
    document.getElementById('home-views').textContent = totalViews.toLocaleString('ar-EG');
    document.getElementById('home-contacts').textContent = totalContacts.toLocaleString('ar-EG');
    document.getElementById('home-conv').textContent = toAr(convRate) + '%';
    const today = new Date().toISOString().slice(0, 10);
    const todayEv = gamEvents.filter(e => (e.created_at||'').slice(0,10) === today);
    const todayPts = Math.min(
      todayEv.filter(e=>e.event_type==='ad_card_view').length
      +todayEv.filter(e=>e.event_type==='ad_detail_view').length*2
      +todayEv.filter(e=>e.event_type==='whatsapp_click').length*4
      +todayEv.filter(e=>e.event_type==='facebook_click').length*3
      +todayEv.filter(e=>e.event_type==='phone_click').length*5, 100);
    updateCircularGoal(todayPts);
    document.getElementById('tw-streak').textContent = toAr(calcStreak(gamEvents));
    const xp = teacher.xp || teacher.points || 0;
    const rp = teacher.reward_points != null ? teacher.reward_points : xp;
    updateHeroGamification(xp, rp);
    const cur = GM_LEVELS.find(l=>xp>=l.min&&xp<l.max)||GM_LEVELS[GM_LEVELS.length-1];
    const next = GM_LEVELS.find(l=>l.min>xp);
    document.getElementById('gam-insight-title').innerHTML = gmIcon(cur.icon) + ' مستواك: ' + cur.name + ' — ' + xp.toLocaleString('ar-EG') + ' XP';
    document.getElementById('gam-insight-sub').innerHTML = next
      ? 'تحتاج ' + (next.min-xp).toLocaleString('ar-EG') + ' XP للوصول لـ "' + next.name + '" ' + gmIcon(next.icon)
      : 'وصلت لأعلى مستوى! ' + gmIcon('crown');
    // رسالة ترقية الإحصائيات: تظهر فقط لو الإحصائيات المتقدمة غير مفعّلة.
    // لو عنده متقدمة (بالباقة أو بشراء الإضافة) تختفي تمامًا.
    if (!f.advanced_stats) {
      gamLock.style.display = '';
      gamLock.innerHTML = '<div class="alert alert-info" style="margin-bottom:13px;flex-direction:column;gap:9px;align-items:flex-start">'
        + '<div><i class="ti ti-lock" aria-hidden="true"></i> الإحصائيات التفصيلية المتقدمة متاحة في <strong>باقة ٣ شهور فأعلى</strong>، أو بشراء <strong>إضافة الإحصائيات المتقدمة</strong>.</div>'
        + '<button type="button" class="btn btn-primary btn-sm" onclick="goToAddons()"><i class="ti ti-shopping-cart" aria-hidden="true"></i> عرض الإضافات</button>'
        + '</div>';
    } else {
      gamLock.style.display = 'none';
    }
    buildActivityChart(gamEvents);
    buildConversionSection(totalViews, totalWa, totalFb, totalContacts, convRate);
    buildPerAdStats(gamEvents, f.advanced_stats);
    buildAchievements(gamEvents, xp);
    buildChallenges(gamEvents);
    buildLevelPath(xp);
    gamLoad.style.display = 'none'; gamCont.style.display = '';
    statsLoaded = true;
  } catch (err) {
    console.error('Stats error:', err);
    gamLoad.style.display = 'none'; gamLock.style.display = '';
    gamLock.innerHTML = '<div class="alert alert-danger"><i class="ti ti-x" aria-hidden="true"></i> تعذّر تحميل الإحصائيات: ' + escapeHtml(err.message) + '</div>';
    gamCont.style.display = '';
  }
}

/* ══ Activity Chart ══ */
function buildActivityChart(events) {
  const days = [], labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().slice(0, 10));
    labels.push(i === 0 ? 'اليوم' : ['أحد','اثن','ثلا','أرب','خمس','جمع','سبت'][d.getDay()]);
  }
  const dayData = days.map(ds => {
    const ev = events.filter(e => (e.created_at||'').startsWith(ds));
    return {views: ev.filter(e=>e.event_type==='ad_card_view').length, details: ev.filter(e=>e.event_type==='ad_detail_view').length, whatsapp: ev.filter(e=>e.event_type==='whatsapp_click').length};
  });
  window._gamDayData = dayData; window._gamLabels = labels;
  if (areaChart) areaChart.destroy();
  const ctx = document.getElementById('area-chart')?.getContext('2d'); if (!ctx) return;
  const col = '#2563EB';
  const g = ctx.createLinearGradient(0, 0, 0, 220); g.addColorStop(0, col+'44'); g.addColorStop(1, col+'00');
  areaChart = new Chart(ctx, {
    type: 'line',
    data: {labels, datasets: [{data: dayData.map(d => d[curMetric]), borderColor: col, borderWidth: 2.5, backgroundColor: g, fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: col, pointBorderColor: 'white', pointBorderWidth: 2}]},
    options: chartOpts()
  });
}

function switchMetric(metric, btn) {
  curMetric = metric;
  const cols = {views:'#2563EB', details:'#0EA672', whatsapp:'#059669'};
  const col = cols[metric];
  document.querySelectorAll('#metric-btns .mbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (!areaChart || !window._gamDayData) return;
  areaChart.data.datasets[0].data = window._gamDayData.map(d => d[metric]);
  areaChart.data.datasets[0].borderColor = col;
  areaChart.data.datasets[0].pointBackgroundColor = col;
  const ctx = document.getElementById('area-chart')?.getContext('2d');
  if (ctx) { const g=ctx.createLinearGradient(0,0,0,220); g.addColorStop(0,col+'44'); g.addColorStop(1,col+'00'); areaChart.data.datasets[0].backgroundColor=g; }
  areaChart.update();
}

function chartOpts() {
  return {
    responsive: true, maintainAspectRatio: true,
    plugins: {legend:{display:false}, tooltip:{titleFont:{family:CHART_FONT}, bodyFont:{family:CHART_FONT}, padding:8, cornerRadius:7}},
    scales: {
      x: {grid:{display:false}, ticks:{font:{family:CHART_FONT, size:10}}, border:{display:false}},
      y: {grid:{color:'#F1F5F9'}, ticks:{font:{family:CHART_FONT, size:10}}, border:{display:false}}
    }
  };
}

/* ══ Conversion Section ══ */
function buildConversionSection(views, wa, fb, total, rate) {
  const box = document.getElementById('conversion-section'); if (!box) return;
  box.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:9px;margin-bottom:11px">
      <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:9px;padding:11px;text-align:center"><div style="color:#059669;font-size:1.1rem"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i></div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.2rem;color:#059669">${toAr(wa)}</div><div style="font-size:.66rem;color:#065F46">واتساب</div></div>
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:9px;padding:11px;text-align:center"><div style="color:#2563EB;font-size:1.1rem"><i class="ti ti-brand-facebook" aria-hidden="true"></i></div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.2rem;color:#2563EB">${toAr(fb)}</div><div style="font-size:.66rem;color:#1D4ED8">فيسبوك</div></div>
      <div style="background:#F5F3FF;border:1px solid #C4B5FD;border-radius:9px;padding:11px;text-align:center"><div style="color:#7C3AED;font-size:1.1rem"><i class="ti ti-chart-bar" aria-hidden="true"></i></div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.2rem;color:#7C3AED">${toAr(total)}</div><div style="font-size:.66rem;color:#6D28D9">إجمالي</div></div>
      <div style="background:${Number(rate)>=5?'#FFF7ED':'#F8FAFC'};border:1px solid ${Number(rate)>=5?'#FED7AA':'#E2E8F0'};border-radius:9px;padding:11px;text-align:center"><div style="color:${Number(rate)>=5?'#EA580C':'#94A3B8'};font-size:1.1rem"><i class="ti ti-trending-up" aria-hidden="true"></i></div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.2rem;color:${Number(rate)>=5?'#EA580C':'#94A3B8'}">${toAr(rate)}%</div><div style="font-size:.66rem;color:${Number(rate)>=5?'#9A3412':'#64748B'}">معدل التحويل</div></div>
    </div>
    <div style="background:#F8FAFC;border-radius:8px;padding:8px 11px;font-size:.73rem;color:#64748B;display:flex;align-items:center;gap:6px">
      <i class="ti ti-bulb" aria-hidden="true" style="color:#F59E0B"></i> ${Number(rate)>=5?'أداء جيد — إعلاناتك تحوّل الزوار لتواصل':'أضف صورة ووصفاً تفصيلياً لتحسين معدل التحويل'}
    </div>`;
}

/* ══ Per-Ad Stats ══ */
function buildPerAdStats(events, isAdvanced) {
  const box = document.getElementById('perad-content'); if (!box) return;
  if (!teacherAds.length) { box.innerHTML='<div class="empty-state" style="padding:28px"><div class="empty-icon"><i class="ti ti-clipboard-text" aria-hidden="true"></i></div><div class="empty-title">لا توجد إعلانات</div></div>'; return; }
  const cnt = (t, adId) => events.filter(e => e.event_type===t && String(e.ad_id)===String(adId)).length;
  box.innerHTML = teacherAds.map(ad => {
    const views=cnt('ad_card_view',ad.id), details=cnt('ad_detail_view',ad.id), wa=cnt('whatsapp_click',ad.id);
    const rate = views > 0 ? Math.round((wa/views)*100) : 0;
    return `<div class="perad-card">
      <div style="font-family:Cairo,sans-serif;font-weight:700;font-size:.88rem;margin-bottom:7px;display:flex;align-items:center;gap:7px">
        ${escapeHtml(ad.title||ad.subject)}<span class="tc-badge ${statusBadgeClass(ad.status)}">${statusLabel(ad.status)}</span>
      </div>
      <div class="perad-row"><span>المشاهدات</span><strong>${toAr(views)}</strong></div>
      <div class="perad-row"><span>فتح التفاصيل</span><strong>${toAr(details)}</strong></div>
      <div class="perad-row"><span>تواصل واتساب</span><strong>${toAr(wa)}</strong></div>
      ${isAdvanced ? `<div class="perad-row"><span>معدل التحويل</span><strong>${toAr(rate)}%</strong></div>` : ''}
    </div>`;
  }).join('');
}

/* ══ Achievements ══ */
function buildAchievements(events, xp) {
  const cnt = t => events.filter(e => e.event_type===t).length;
  const totalViews=cnt('ad_card_view'), totalWa=cnt('whatsapp_click');
  const checkMap = {
    first_ad: teacherAds.length > 0, first_wa: totalWa >= 1,
    '100_views': totalViews >= 100, '500_views': totalViews >= 500,
    img_ad: teacherAds.some(a => !!a.main_image_url),
    desc_ad: teacherAds.some(a => (a.description||'').length >= 100),
    '10_wa': totalWa >= 10, lv_2: xp >= 500, lv_3: xp >= 2000, lv_4: xp >= 5000,
  };
  const progMap = {
    '100_views':{v:Math.min(totalViews,100),t:100}, '500_views':{v:Math.min(totalViews,500),t:500},
    '10_wa':{v:Math.min(totalWa,10),t:10}, lv_3:{v:Math.min(xp,2000),t:2000}, lv_4:{v:Math.min(xp,5000),t:5000},
  };
  const unlocked = ACH_DEFS.filter(a => checkMap[a.id]).length;
  const earnedPts = ACH_DEFS.filter(a => checkMap[a.id] && teacherClaims.has(`${a.id}|lifetime`)).reduce((s,a) => s+a.pts, 0);
  document.getElementById('ach-summary').innerHTML = `
    <div style="background:linear-gradient(135deg,#0F172A,#2563EB);border-radius:10px;padding:10px 14px;color:white;display:flex;align-items:center;gap:9px"><span style="font-size:1.15rem;display:inline-flex">${gmIcon('trophy')}</span><div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.15rem">${toAr(unlocked)}/${toAr(ACH_DEFS.length)}</div><div style="opacity:.7;font-size:.66rem">إنجاز مكتمل</div></div></div>
    <div style="background:linear-gradient(135deg,#0EA672,#20C997);border-radius:10px;padding:10px 14px;color:white;display:flex;align-items:center;gap:9px"><span style="font-size:1.15rem;display:inline-flex">${gmIcon('star')}</span><div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.15rem">${toAr(earnedPts)}</div><div style="opacity:.7;font-size:.66rem">نقطة مُستلمة فعليًا</div></div></div>`;
  document.getElementById('ach-grid').innerHTML = ACH_DEFS.map(a => {
    const done = !!checkMap[a.id], pg = progMap[a.id];
    const claimed = teacherClaims.has(`${a.id}|lifetime`);
    const progHtml = !done && pg ? `<div class="ach-prog-bar"><div class="ach-prog-fill" style="background:${a.color};width:${Math.min((pg.v/pg.t)*100,100)}%"></div></div><div style="font-size:.62rem;color:#94A3B8">${toAr(pg.v)}/${toAr(pg.t)}</div>` : '';
    const ptsBtn = claimed
      ? `<div class="ach-pts" style="background:${a.color}14"><span style="font-size:.72rem;display:inline-flex;color:${a.color}">${gmIcon('circle-check')}</span><span style="font-size:.66rem;font-weight:700;color:${a.color}">استُلمت +${toAr(a.pts)}</span></div>`
      : done
        ? `<button type="button" class="ach-pts" style="background:${a.color};color:white;border:none;cursor:pointer;font-family:inherit" onclick="claimReward('${a.id}', this)"><span style="font-size:.72rem;display:inline-flex">${gmIcon('gift')}</span><span style="font-size:.66rem;font-weight:700">استلم +${toAr(a.pts)}</span></button>`
        : `<div class="ach-pts" style="background:#F1F5F9"><span style="font-size:.72rem;display:inline-flex;color:#94A3B8">${gmIcon('star')}</span><span style="font-size:.66rem;font-weight:700;color:#94A3B8">+${toAr(a.pts)}</span></div>`;
    return `<div class="ach-card ${done?'':'locked'}" style="border-color:${done?a.color+'40':'#E2E8F0'};box-shadow:${done?`0 4px 13px ${a.color}18`:'none'}">
      ${done ? `<div class="ach-check">${gmIcon('check')}</div>` : ''}
      <div class="ach-ico" style="background:${done?a.color+'18':'#F1F5F9'};color:${done?a.color:'#94A3B8'}">
        ${done ? gmIcon(a.icon) : gmIcon('lock')}
      </div>
      <div class="ach-title" style="color:${done?'#0F172A':'#94A3B8'}">${a.title}</div>
      <div class="ach-desc">${a.desc}</div>
      ${progHtml}
      ${ptsBtn}
    </div>`;
  }).join('');
}

// نقطة الأربعاء ISO (نفس منطق date_trunc('week', now()) في بوستجرس)
function isoWeekMonday(d = new Date()) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0,10);
}

// استلام مكافأة إنجاز/تحدي فعليًا — السيرفر بيتحقق من الشرط بنفسه من بياناته
// الحقيقية (مش من كلام العميل)، فمينفعش حد "يستلم" حاجة معملهاش فعلاً.
async function claimReward(rewardKey, btnEl) {
  const token = Auth.getToken();
  if (!token) { showToast('انتهت الجلسة، سجّل دخول تاني', 'warning'); setTimeout(() => location.href = 'login.html?role=teacher', 1200); return; }
  if (btnEl) { btnEl.disabled = true; btnEl.style.opacity = '.6'; }
  try {
    const { data: awarded } = await supabase.rpc('claim_teacher_reward_secure', {
      p_token: token, p_reward_key: rewardKey,
    });
    if (awarded && awarded > 0) {
      showToast(`🎉 استلمت +${awarded} نقطة!`, 'success');
      teacher.xp = (teacher.xp || 0) + awarded;
      teacher.reward_points = (teacher.reward_points || 0) + awarded;
      teacher.points = teacher.xp;
      Auth.setTeacherSession({...teacher});
      statsLoaded = false;
      await loadTeacherStats();
      updateHeroGamification(teacher.xp, teacher.reward_points);
    } else {
      showToast('تم استلامها من قبل أو الشرط مش مكتمل بعد', 'warning');
      statsLoaded = false;
      await loadTeacherStats();
    }
  } catch (e) {
    showToast('تعذّر استلام المكافأة، حاول مرة أخرى', 'danger');
    if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = ''; }
  }
}

/* ══ Challenges ══ */
function buildChallenges(events) {
  const today = new Date().toISOString().slice(0,10);
  const weekAgo = new Date(Date.now()-7*86400000).toISOString();
  document.getElementById('ch-grid').innerHTML = CH_DEFS.map(ch => {
    let prog = 0, periodKey = today;
    if (ch.metric==='streak') { prog = calcStreak(events); periodKey = today.slice(0,7); }
    else if (ch.period==='daily') prog = events.filter(e=>e.event_type===ch.metric&&(e.created_at||'').startsWith(today)).length;
    else if (ch.period==='weekly') { prog = events.filter(e=>e.event_type===ch.metric&&e.created_at>=weekAgo).length; periodKey = isoWeekMonday(); }
    const pct=Math.min((prog/ch.target)*100,100), done=pct>=100, cc=PERIOD_CLR[ch.period]||'#2563EB';
    const claimed = teacherClaims.has(`${ch.id}|${periodKey}`);
    const rewardHtml = claimed
      ? `<div class="ch-reward"><span style="display:inline-flex;color:#0EA672">${gmIcon('circle-check')}</span><span style="font-size:.69rem;font-weight:700;color:#0EA672">استُلمت +${toAr(ch.reward)}</span></div>`
      : done
        ? `<button type="button" class="ch-reward" style="border:none;cursor:pointer;background:#FFFBEB;font-family:inherit" onclick="claimReward('${ch.id}', this)"><span style="display:inline-flex;color:#B45309">${gmIcon('gift')}</span><span style="font-size:.69rem;font-weight:700;color:#B45309">استلم +${toAr(ch.reward)} نقطة</span></button>`
        : `<div class="ch-reward"><span style="display:inline-flex;color:#B45309">${gmIcon('gift')}</span><span style="font-size:.69rem;font-weight:700;color:#B45309">+${toAr(ch.reward)} نقطة</span></div>`;
    return `<div class="ch-card ${done?'done':''}">
      ${done ? `<div class="ch-done-lbl">${gmIcon('circle-check')} مكتمل!</div>` : ''}
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
        <div class="ch-ico" style="background:${cc}18;color:${cc}">${gmIcon(ch.icon)}</div>
        <span class="ch-type-tag" style="background:${cc}14;color:${cc}">${PERIOD_LBL[ch.period]}</span>
      </div>
      <div class="ch-title">${ch.title}</div>
      ${rewardHtml}
      <div class="ch-bar-t"><div class="ch-bar-f" style="background:${done?'#20C997':`linear-gradient(90deg,${cc},${cc}cc)`};width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-top:4px">
        <span style="color:#64748B">${toAr(prog)}/${toAr(ch.target)}</span>
        <span style="font-weight:700;color:${cc}">${Math.round(pct)}%</span>
      </div>
    </div>`;
  }).join('');
}

/* ══ Level Path ══ */
function buildLevelPath(xp) {
  const box = document.getElementById('lpath-content'); if (!box) return;
  box.innerHTML = GM_LEVELS.map(lv => {
    const done=xp>=lv.max&&lv.max<99999, isCur=xp>=lv.min&&xp<lv.max;
    const pct=isCur?Math.min(Math.round(((xp-lv.min)/(lv.max-lv.min))*100),100):done?100:0;
    return `<div class="lpath-item">
      <div class="lpath-ico" style="background:${(done||isCur)?lv.color+'20':'#F8FAFC'};border-color:${isCur?lv.color:done?lv.color+'70':'#E2E8F0'};color:${(done||isCur)?lv.color:'#94A3B8'}">${gmIcon(lv.icon)}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-weight:${isCur?700:500};color:${isCur?lv.color:done?'#334155':'#94A3B8'};font-size:.78rem">${lv.name}</span>
          <span style="font-size:.58rem;color:#94A3B8">${lv.min.toLocaleString('ar-EG')}–${lv.max>=99999?'∞':lv.max.toLocaleString('ar-EG')}</span>
        </div>
        <div class="lpath-bar" style="background:${lv.track}">
          <div class="lpath-bar-fill" style="background:${lv.color};width:${pct}%"></div>
        </div>
      </div>
      ${done ? `<span style="font-size:.95rem;display:inline-flex;color:#20C997">${gmIcon('circle-check')}</span>` : ''}
      ${isCur ? `<span style="padding:2px 6px;border-radius:50px;font-size:.56rem;font-weight:700;background:${lv.color}18;color:${lv.color};white-space:nowrap">الحالي</span>` : ''}
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════
   LEADERBOARD
══════════════════════════════════════ */
async function loadLeaderboard() {
  const box = document.getElementById('leaderboard-content');
  box.innerHTML = '<div class="loading-spinner"><div class="spinner-lg"></div></div>';
  try {
    const { data, error } = await supabase.from('teachers').select('id,name,points,xp,reward_points,avatar_url')
      .order('points', {ascending: false}).order('created_at', {ascending: true}).limit(15);
    if (error) throw error;
    const list = data || [];
    const myRank = list.findIndex(t => t.id === teacher.id) + 1;
    if (myRank > 0) {
      document.getElementById('tw-rank').textContent = '#' + toAr(myRank);
      document.getElementById('rank-hstat').style.display = '';
    }
    if (!list.length) { box.innerHTML = '<div class="empty-state" style="padding:28px"><div class="empty-title">لا توجد بيانات بعد</div></div>'; return; }
    box.innerHTML = list.map((t, i) => {
      const isMe = t.id === teacher.id, rank = i + 1;
      const lv = GM_LEVELS.find(l => ((t.xp||t.points)||0)>=l.min && ((t.xp||t.points)||0)<l.max) || GM_LEVELS[GM_LEVELS.length-1];
      return `<div class="lb-row" style="background:${isMe?'linear-gradient(135deg,#EFF6FF,#E6FDF5)':rank<=3?'#FFFBEB':'transparent'};border:${isMe?'1.5px solid #BFDBFE':rank<=3?'1px solid #FDE68A':'1px solid transparent'}">
        <div style="width:26px;text-align:center;font-weight:700;font-size:${rank<=3?'1.1rem':'.8rem'};color:${rank<=3?'#F59E0B':'#94A3B8'}">
          ${rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'#'+rank}
        </div>
        <div class="lb-av">
          ${t.avatar_url?`<img src="${t.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none'">`:getInitials(t.name)}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:${isMe?800:600};font-size:.83rem;color:${isMe?'#2563EB':'#0F172A'};display:flex;align-items:center;gap:5px;overflow:hidden">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(t.name)}</span>
            ${isMe?'<span style="background:#2563EB;color:white;border-radius:50px;padding:1px 6px;font-size:.55rem;font-weight:700;white-space:nowrap">أنت</span>':''}
          </div>
          <div style="font-size:.64rem;font-weight:600;color:${lv.color}">${gmIcon(lv.icon)} ${lv.name}</div>
        </div>
        <div style="text-align:center;flex-shrink:0">
          <div style="font-family:'Cairo',sans-serif;font-weight:900;font-size:.92rem;color:${isMe?'#2563EB':'#0F172A'}">${((t.xp||t.points)||0).toLocaleString('ar-EG')}</div>
          <div style="font-size:.58rem;color:#94A3B8">XP</div>
        </div>
      </div>`;
    }).join('') + `<div style="margin-top:11px;background:linear-gradient(90deg,#EFF6FF,#E6FDF5);border:1px solid #BFDBFE;border-radius:9px;padding:9px 13px;text-align:center;font-size:.8rem;color:#0D1B4B;font-weight:600">
      <i class="ti ti-star" aria-hidden="true" style="color:#F59E0B"></i> ${myRank ? `ترتيبك #${toAr(myRank)} من ${toAr(list.length)} مدرس` : 'سجّل تفاعلات لتظهر في قائمة المتصدرين!'}
    </div>`;
  } catch (e) {
    box.innerHTML = `<div class="alert alert-danger">${escapeHtml(String(e?.message||'خطأ في التحميل'))}</div>`;
  }
}

/* ══════════════════════════════════════
   EVENTS & REWARDS
══════════════════════════════════════ */
async function loadTeacherEvents() {
  const evBox = document.getElementById('events-content');
  const rwBox = document.getElementById('rewards-tiers-content');
  const xp = teacher.xp || teacher.points || 0;
  const rp = teacher.reward_points ?? xp;
  const evXpEl = document.getElementById('events-xp-display'); if (evXpEl) evXpEl.textContent = xp.toLocaleString('ar-EG');
  const evPts = document.getElementById('events-points-display'); if (evPts) evPts.textContent = rp.toLocaleString('ar-EG');
  try {
    const { data: evs } = await supabase.from('platform_events').select('*').eq('is_active', true).order('created_at', {ascending: false});
    evBox.innerHTML = !evs?.length
      ? '<div class="empty-text" style="padding:18px;text-align:center">لا توجد فعاليات نشطة</div>'
      : evs.map(ev => `
        <div class="event-card">
          ${ev.image_url ? `<img src="${escapeHtml(ev.image_url)}" style="width:100%;max-height:170px;object-fit:cover" onerror="this.style.display='none'">` : ''}
          <div style="padding:13px">
            <div style="font-family:Cairo,sans-serif;font-weight:800;margin-bottom:4px">${escapeHtml(ev.title)}</div>
            <div style="color:var(--text-secondary);font-size:.86rem">${escapeHtml(ev.description||'')}</div>
            ${ev.reward ? `<div class="alert alert-success mt-8" style="padding:6px 10px"><i class="ti ti-gift" aria-hidden="true"></i> ${escapeHtml(ev.reward)}</div>` : ''}
          </div>
        </div>`).join('');
  } catch(_) { evBox.innerHTML = '<div class="empty-text" style="padding:18px;text-align:center">تعذّر تحميل الفعاليات</div>'; }
  try {
    const { data: tiers } = await supabase.from('rewards_tiers').select('*').order('points_required', {ascending: true});
    if (!tiers?.length) { rwBox.innerHTML = '<div class="empty-text" style="padding:18px;text-align:center">لا توجد مكافآت محددة</div>'; return; }
    const myPts = teacher.reward_points ?? xp;
    rwBox.innerHTML = '<div class="rewards-list">' + tiers.map(tier => {
      const achieved = myPts >= tier.points_required;
      return `<div class="reward-item ${achieved?'achieved':''}">
        <div>
          <div style="font-weight:700;font-size:.86rem">${escapeHtml(tier.title)}</div>
          <div style="font-size:.73rem;color:var(--text-secondary)">${escapeHtml(tier.description||'')}</div>
        </div>
        <div style="text-align:center;min-width:68px">
          <div style="font-family:Cairo,sans-serif;font-weight:900;color:${achieved?'var(--success)':'var(--text-muted)'}">${toAr(tier.points_required)}</div>
          <div style="font-size:.64rem;color:var(--text-muted)">نقطة</div>
          ${achieved ? '<div style="color:var(--success);font-size:.7rem;font-weight:700"><i class="ti ti-circle-check" aria-hidden="true"></i> أهّلت</div>' : ''}
        </div>
      </div>`;
    }).join('') + '</div>';
  } catch(_) { rwBox.innerHTML = '<div class="empty-text" style="padding:18px">تعذّر تحميل المكافآت</div>'; }
}

/* ══════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════ */
function switchTab(tab, clickedBtn) {
  const allTabs = ['home','ads','stats','leaderboard','profile','features','events'];
  allTabs.forEach(name => {
    const pane = document.getElementById('tab-' + name);
    if (pane) pane.classList.toggle('active', name === tab);
  });
  document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
  const mainTabMap = {home:'tab-btn-home', ads:'tab-btn-ads', stats:'tab-btn-stats', leaderboard:'tab-btn-leaderboard'};
  if (mainTabMap[tab]) document.getElementById(mainTabMap[tab])?.classList.add('active');
  if (clickedBtn) clickedBtn.classList.add('active');
  // ملاحظة أداء: statsLoaded ما بيتصفّرش هنا تلقائيًا زي الأول (كان بيلغي فايدة
  // الكاش خالص فيعمل استعلام كامل لـ5000 صف كل ضغطة على تبويب التحليلات حتى
  // لو زاره المدرس قبل كده بثانية). التحديث الفعلي بيحصل بس لما البيانات تتغيّر
  // فعلاً (بعد نشر/حذف إعلان — شوف submitAd وdeleteAd).
  if (tab === 'stats') loadTeacherStats();
  else if (tab === 'leaderboard') loadLeaderboard();
  else if (tab === 'events') loadTeacherEvents();
  else if (tab === 'features') renderFeatures();
  closeMoreMenu();

  // جولات تعريفية سياقية — بتظهر تلقائيًا أول مرة بس يتفتح فيها كل قسم
  // (ملحوظة: التاب ده ممكن يتفتح برمجيًا وإحنا لسه بنأكد حالة دفع إضافة،
  // فمش نفتح جولة فوقها ومنعملش تشتيت لحظة التأكيد)
  const isAddonReturn = new URLSearchParams(window.location.search).get('addon_payment_return') === '1';
  if (typeof Tutorial !== 'undefined' && !isAddonReturn) {
    if (tab === 'ads') setTimeout(() => Tutorial.run('dash_ads', TUT_ADS), 500);
    else if (tab === 'stats') setTimeout(() => Tutorial.run('dash_stats', TUT_STATS), 750);
    else if (tab === 'leaderboard') setTimeout(() => Tutorial.run('dash_leaderboard', TUT_LEADERBOARD), 550);
    else if (tab === 'profile') setTimeout(() => Tutorial.run('dash_profile', TUT_PROFILE), 500);
    else if (tab === 'features') setTimeout(() => Tutorial.run('dash_features', TUT_FEATURES), 550);
    else if (tab === 'events') setTimeout(() => Tutorial.run('dash_events', TUT_EVENTS), 700);
  }
}

function switchGTab(id, btn) {
  document.querySelectorAll('.gpane').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.gtab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // جولات فرعية لكل تاب تحت التحليلات — أول مرة بس يتفتح فيها كل واحد
  if (typeof Tutorial !== 'undefined') {
    const subTours = {
      'g-perad':        ['dash_stats_perad', TUT_STATS_PERAD],
      'g-achievements': ['dash_stats_ach', TUT_STATS_ACH],
      'g-challenges':   ['dash_stats_challenges', TUT_STATS_CHALLENGES],
      'g-levels':       ['dash_stats_levels', TUT_STATS_LEVELS],
    };
    if (subTours[id]) setTimeout(() => Tutorial.run(subTours[id][0], subTours[id][1]), 450);
  }
}

function toggleCollapsible(hdEl) {
  hdEl.classList.toggle('open');
  const body = hdEl.nextElementSibling;
  if (body) body.classList.toggle('open');
}

/* ══ PROFILE HELPERS ══ */
function renderAvatarPreview(url = '') {
  const box = document.getElementById('p-avatar-preview'); if (!box) return;
  box.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="صورة" onerror="this.style.display='none'">` : '<span>لا توجد صورة</span>';
}
function setupAvatarPreview() {
  document.getElementById('p-avatar-file')?.addEventListener('change', e => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader(); r.onload = () => renderAvatarPreview(r.result); r.readAsDataURL(file);
  });
}

/* ══ IMAGE POSITION ══ */
function parsePosition(v = '50% 50%') {
  const m = String(v||'50% 50%').match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  return m ? {x: Number(m[1]), y: Number(m[2])} : {x: 50, y: 50};
}
function initMainImagePositionEditor(imageUrl = '', position = '50% 50%') {
  const editor = document.getElementById('ad-main-position-editor');
  const img = document.getElementById('ad-main-position-preview');
  const x = document.getElementById('ad-pos-x'), y = document.getElementById('ad-pos-y');
  const hidden = document.getElementById('ad-main-image-position');
  const pos = parsePosition(position);
  x.value = pos.x; y.value = pos.y; if (hidden) hidden.value = `${pos.x}% ${pos.y}%`;
  if (imageUrl) { img.src = imageUrl; editor.style.display = ''; }
  else { img.removeAttribute('src'); editor.style.display = 'none'; }
  updateMainPositionPreview();
}
function updateMainPositionPreview() {
  const x = document.getElementById('ad-pos-x')?.value || 50;
  const y = document.getElementById('ad-pos-y')?.value || 50;
  const hidden = document.getElementById('ad-main-image-position');
  const img = document.getElementById('ad-main-position-preview');
  if (hidden) hidden.value = `${x}% ${y}%`;
  if (img) img.style.objectPosition = `${x}% ${y}%`;
}
function setupMainImagePositionControls() {
  ['ad-pos-x','ad-pos-y'].forEach(id => document.getElementById(id)?.addEventListener('input', updateMainPositionPreview));
  document.getElementById('ad-main-image')?.addEventListener('change', e => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => initMainImagePositionEditor(r.result, document.getElementById('ad-main-image-position')?.value || '50% 50%');
    r.readAsDataURL(file);
  });
}

/* ══ MODAL + AUTH ══ */
function openModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow = ''; }
function closeAdModal() { closeModal('ad-modal'); if (typeof Tutorial !== 'undefined') Tutorial.end(); }

function openTeacherProfile() {
  if (!teacherAds.length) { window.open('teacher.html?id=' + teacher.id, '_blank'); return; }
  // لو عنده إعلان واحد بس، افتحه مباشرة زي ما كان يحصل
  if (teacherAds.length === 1) {
    const ad = teacherAds[0];
    window.open('teacher.html?ad=' + ad.id + (ad.status !== 'active' ? '&preview=1' : ''), '_blank');
    return;
  }
  // لو عنده أكثر من إعلان، خليه يختار أي واحد يعرض بدل ما نفتح آخر واحد
  // نُشئ دائمًا بدون سؤاله (وده كان يظهر إعلان غير اللي يقصده)
  openAdPickerModal('preview');
}

function logout() {
  confirmDialog('هل تريد تسجيل الخروج من حسابك؟', () => {
    Auth.clearTeacher();
    window.location.href = 'login.html?role=teacher';
  });
}
