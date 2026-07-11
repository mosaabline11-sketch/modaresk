/* =============================================
   مدرسك - Config & Utilities
   =============================================
   ⚠️  قم بتعديل القيم أدناه بيانات مشروعك
   ============================================= */

const CONFIG = {
  // ── Supabase ──
  SUPABASE_URL: "https://iazevtsralvjfsojrknt.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhemV2dHNyYWx2amZzb2pya250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzE3NDMsImV4cCI6MjA5MzY0Nzc0M30.1Y4Yt11SZ7niqWdDojHKZqrIoO0h76RgknnuG6V8hLQ",

  // ── App Settings ──
  // غيّر SITE_BASE_URL إلى رابط موقعك الحقيقي بعد النشر لتحسين SEO وملف sitemap.xml
  SITE_BASE_URL: "https://mosaabline11-sketch.github.io/modaresk",
  // ضع رقم واتساب الإدارة بصيغة دولية بدون + لتفعيل أزرار التواصل، مثال: 201234567890
  CONTACT_WHATSAPP: "+966 54 839 0129",
  CONTACT_EMAIL: "",
  APP_NAME: "مدرسك",
  APP_TAGLINE: "ابحث عن مدرسك المثالي",
  DEFAULT_ADS_LIMIT: 3,
};


// ── مدرسك shared data helpers ──
const GRADE_SECTIONS = {
  primary: { label: "الابتدائي", grades: ["أول ابتدائي", "ثاني ابتدائي", "ثالث ابتدائي", "رابع ابتدائي", "خامس ابتدائي", "سادس ابتدائي"] },
  prep: { label: "الإعدادي", grades: ["أول إعدادي", "ثاني إعدادي", "ثالث إعدادي"] },
  secondary: { label: "الثانوي", grades: ["أول ثانوي", "ثاني ثانوي", "ثالث ثانوي"] }
};
const GRADE_OPTIONS = [
  ...GRADE_SECTIONS.primary.grades,
  ...GRADE_SECTIONS.prep.grades,
  ...GRADE_SECTIONS.secondary.grades
];

function gradeSectionOf(grade = "") {
  const g = String(grade || "").trim();
  for (const [key, section] of Object.entries(GRADE_SECTIONS)) if (section.grades.includes(g)) return key;
  return "";
}
function getAdGrades(ad = {}) {
  const list = normalizeList(ad.grades);
  return list.length ? list : (ad.grade ? [ad.grade] : []);
}
function gradeDisplay(ad = {}) {
  // استخرج قائمة الفصول من الحقل grades (إن وُجد) أو من الحقل grade كنص مفصول بفواصل
  let list = getAdGrades(ad);
  if (!list.length && ad.grade) {
    list = String(ad.grade || '')
      .split(/[,،]/)
      .map(g => g.trim())
      .filter(Boolean);
  }
  // إذا كانت جميع الفصول المختارة تغطي مرحلة كاملة، أظهر اسم المرحلة بدل تعداد الفصول
  if (list.length) {
    for (const key of Object.keys(GRADE_SECTIONS)) {
      const sec = GRADE_SECTIONS[key];
      if (sec.grades.length === list.length && sec.grades.every(g => list.includes(g))) {
        return sec.label + ' كاملة';
      }
    }
    return list.join("، ");
  }
  return ad.grade || "—";
}
function validateSameGradeSection(grades = []) {
  const clean = [...new Set((grades || []).map(g => String(g || "").trim()).filter(Boolean))];
  if (!clean.length) return { ok:false, message:"اختر فصلًا واحدًا على الأقل", grades:[], section:"" };
  const sections = [...new Set(clean.map(gradeSectionOf).filter(Boolean))];
  if (sections.length !== 1) return { ok:false, message:"لا يمكن خلط فصول من مراحل مختلفة. اختر فصولًا من نفس القسم فقط.", grades:clean, section:"" };
  return { ok:true, message:"", grades:clean, section:sections[0] };
}
function renderGradeCheckboxes(containerId, selected = []) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const selectedSet = new Set(normalizeList(selected));
  const currentSection = [...selectedSet].map(gradeSectionOf).find(Boolean) || "";
  box.innerHTML = Object.entries(GRADE_SECTIONS).map(([sectionKey, section]) => `
    <div class="grade-check-section"><div class="grade-check-title">${escapeHtml(section.label)}</div><div class="grade-check-grid">
      ${section.grades.map(g => {
        const checked = selectedSet.has(g);
        const disabled = currentSection && currentSection !== sectionKey;
        return `<label class="grade-check ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}"><input type="checkbox" value="${escapeAttr(g)}" data-section="${sectionKey}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}><span>${escapeHtml(g)}</span></label>`;
      }).join("")}
    </div></div>`).join("");
  box.querySelectorAll('input[type="checkbox"]').forEach(input => input.addEventListener("change", () => updateGradeCheckboxState(containerId)));
  updateGradeCheckboxState(containerId);
}
function updateGradeCheckboxState(containerId) {
  const box = document.getElementById(containerId); if (!box) return;
  const checked = Array.from(box.querySelectorAll('input[type="checkbox"]:checked'));
  const activeSection = checked[0]?.dataset.section || "";
  box.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.disabled = !!activeSection && input.dataset.section !== activeSection;
    input.closest(".grade-check")?.classList.toggle("checked", input.checked);
    input.closest(".grade-check")?.classList.toggle("disabled", input.disabled);
  });
}
function getSelectedGrades(containerId) {
  const box = document.getElementById(containerId); if (!box) return [];
  return Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map(x => x.value);
}

const DEFAULT_SUBJECTS = ["رياضيات", "لغة عربية", "لغة إنجليزية", "علوم", "دراسات اجتماعية", "فيزياء", "كيمياء", "أحياء", "تاريخ", "جغرافيا", "فرنسي", "حاسب آلي", "أخرى"];
let SUBJECTS_CACHE = [...DEFAULT_SUBJECTS];

// أسماء المدرسين: تُحمّل مرة واحدة عند الحاجة لتقديم اقتراحات بحث
let TEACHER_NAMES_CACHE = [];
async function loadTeacherNames() {
  try {
    const { data, error } = await supabase.from('teachers').select('name');
    if (!error && data && data.length) {
      TEACHER_NAMES_CACHE = data.map(t => t.name).filter(Boolean);
    }
  } catch (_) {}
  return TEACHER_NAMES_CACHE;
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[ch]));
}
function escapeAttr(str = "") {
  return escapeHtml(str).replace(/`/g, "&#96;");
}
function nl2br(str = "") { return escapeHtml(str).replace(/\n/g, "<br>"); }


// ── Platform Contact Helpers ──
function adminContactUrl(message = "") {
  const phone = String(CONFIG.CONTACT_WHATSAPP || "").replace(/[^0-9]/g, "");
  if (!phone) return "#";
  return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
function bindAdminContactLinks() {
  document.querySelectorAll('[data-admin-contact]').forEach(link => {
    const msg = link.getAttribute('data-message') || 'مرحبًا، أريد الاستفسار عن منصة مدرسك';
    link.href = adminContactUrl(msg);
    link.target = CONFIG.CONTACT_WHATSAPP ? '_blank' : '_self';
    link.rel = 'noopener';
    link.addEventListener('click', (e) => {
      if (!CONFIG.CONTACT_WHATSAPP) {
        e.preventDefault();
        showToast('ضع رقم واتساب الإدارة في config.js داخل CONTACT_WHATSAPP', 'warning', 6000);
      } else {
        trackEvent('admin_contact_click', { page: location.pathname.split('/').pop() || 'index.html' });
      }
    });
  });
}
window.addEventListener('DOMContentLoaded', bindAdminContactLinks);

function bindLogoFallbacks() {
  document.querySelectorAll('img[src$="logo.png"]').forEach(img => {
    if (img.dataset.logoFallbackBound) return;
    img.dataset.logoFallbackBound = '1';
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const brand = img.closest('.nav-brand, .fnav-brand, .s-brand');
      if (brand && !brand.querySelector('.logo-text-fallback')) {
        const fallback = document.createElement('span');
        fallback.className = 'logo-text-fallback';
        fallback.textContent = CONFIG.APP_NAME || 'مدرسك';
        fallback.style.fontWeight = '800';
        fallback.style.color = 'inherit';
        brand.prepend(fallback);
      }
    }, { once: true });
  });
}
window.addEventListener('DOMContentLoaded', bindLogoFallbacks);


async function loadSubjectsSafe() {
  try {
    const { data, error } = await supabase.from('subjects').select('name').order('name');
    if (!error && data && data.length) SUBJECTS_CACHE = data.map(s => s.name).filter(Boolean);
  } catch (_) {}
  return SUBJECTS_CACHE;
}
function populateSubjectSelect(selectId, selected = "") {
  const el = document.getElementById(selectId);
  if (!el) return;
  const keepEmpty = el.querySelector('option[value=""]') ? '<option value="">اختر المادة</option>' : '';
  el.innerHTML = keepEmpty + SUBJECTS_CACHE.map(s => `<option ${s===selected?'selected':''}>${escapeHtml(s)}</option>`).join('');
}
function populateGradeSelect(selectId, selected = "") {
  const el = document.getElementById(selectId);
  if (!el) return;
  const keepEmpty = el.querySelector('option[value=""]') ? '<option value="">جميع الصفوف</option>' : '';
  el.innerHTML = keepEmpty + Object.values(GRADE_SECTIONS).map(section => `
    <optgroup label="${escapeHtml(section.label)}">
      ${section.grades.map(g => `<option value="${escapeAttr(g)}">${escapeHtml(g)}</option>`).join("")}
    </optgroup>`).join("");
  if (selected) el.value = selected;
}
function populateAllSubjectAndGradeSelects() {
  ['ad-subject','ea-subject','filter-subject','hero-subject','s-subject'].forEach(id => populateSubjectSelect(id, document.getElementById(id)?.value || ''));
  ['ad-grade','ea-grade','filter-grade','hero-grade','s-grade'].forEach(id => populateGradeSelect(id, document.getElementById(id)?.value || ''));
}
function parseExtraContacts(text = "") {
  return String(text || '').split(/\n|،/).map(x => x.trim()).filter(Boolean);
}
function buildContactButtons(teacher = {}, ad = {}, size = 'btn-sm', options = {}) {
  const btns = [];
  const adId = ad?.id || '';
  const teacherId = teacher?.id || ad?.teacher_id || '';
  const stop = "event.stopPropagation();";
  if (teacher.whatsapp) {
    const wa = `https://wa.me/${String(teacher.whatsapp).replace(/[^0-9]/g,'')}`;
    btns.push(`<a href="${escapeHtml(wa)}" target="_blank" onclick="${stop} trackEvent('whatsapp_click',{ad_id:'${escapeHtml(adId)}',teacher_id:'${escapeHtml(teacherId)}'})" class="btn btn-whatsapp ${size}">واتساب</a>`);
  }
  if (teacher.facebook) btns.push(`<a href="${escapeHtml(teacher.facebook)}" target="_blank" onclick="${stop} trackEvent('facebook_click',{ad_id:'${escapeHtml(adId)}',teacher_id:'${escapeHtml(teacherId)}'})" class="btn btn-facebook ${size}">فيسبوك</a>`);
  if (teacher.phone) btns.push(`<a href="tel:${escapeHtml(teacher.phone)}" onclick="${stop} trackEvent('phone_click',{ad_id:'${escapeHtml(adId)}',teacher_id:'${escapeHtml(teacherId)}'})" class="btn btn-ghost ${size}">📞 اتصال</a>`);

  const extras = [...parseExtraContacts(teacher.contact_methods), ...parseExtraContacts(ad.extra_contact)];
  if (extras.length && options.compactExtra) {
    btns.push(`<button type="button" onclick="${stop} window.location.href='teacher.html?ad=${escapeHtml(adId)}'" class="btn btn-ghost ${size} extra-contact-hint">طرق أخرى للتواصل</button>`);
  } else {
    extras.forEach(c => btns.push(`<span class="btn btn-ghost ${size} contact-extra-chip">${escapeHtml(c)}</span>`));
  }
  return btns;
}



// ── Media Upload Helpers (Supabase Storage) ──
const MEDIA_BUCKET = "uploads";
const MAX_IMAGE_SIZE_MB = 6;
const MAX_GALLERY_IMAGES = 10;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (_) {}
    return value.split(/\n|،|,/).map(x => x.trim()).filter(Boolean);
  }
  return [];
}

function getFileExt(file) {
  const fromName = (file.name || "").split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return (file.type || "image/png").split("/").pop() || "png";
}

async function uploadImageFile(file, folder = "ads") {
  if (!file) return "";
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("ارفع صورة فقط بصيغة JPG أو PNG أو WEBP أو GIF");
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) throw new Error(`حجم الصورة كبير. الحد الأقصى ${MAX_IMAGE_SIZE_MB}MB`);

  const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, "") || "ads";
  const path = `${safeFolder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${getFileExt(file)}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadImageInput(inputId, folder = "ads") {
  const input = document.getElementById(inputId);
  const file = input?.files?.[0];
  return file ? uploadImageFile(file, folder) : "";
}

async function uploadMultipleImagesInput(inputId, folder = "ads", maxFiles = MAX_GALLERY_IMAGES) {
  const input = document.getElementById(inputId);
  const files = Array.from(input?.files || []);
  if (files.length > maxFiles) throw new Error(`يمكنك رفع ${maxFiles} صور إضافية كحد أقصى`);
  const urls = [];
  for (const file of files) urls.push(await uploadImageFile(file, folder));
  return urls;
}

function mediaImage(url, alt = "صورة الإعلان", className = "") {
  if (!url) return "";
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" class="${className}" loading="lazy" onerror="this.remove()">`;
}

function videoEmbedHtml(url) {
  const safe = escapeHtml(url);
  let yt = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return `<div class="video-frame"><iframe src="https://www.youtube.com/embed/${yt[1]}" title="فيديو الإعلان" allowfullscreen loading="lazy"></iframe></div>`;
  return `<a class="media-link" href="${safe}" target="_blank" rel="noopener">🎬 فتح الفيديو</a>`;
}



// ── Plans / Subscriptions Helpers ──
const PLAN_DEFINITIONS = {
  monthly_40: {
    key: 'monthly_40', name: 'باقة الشهر', price: 40, months: 1, color: 'green',
    ads_limit: 1, max_edits_per_ad: 3,
    basic_stats: false, advanced_stats: false, unlimited_edits: false, fast_support: false,
    features: ['إعلان واحد', '3 تعديلات لكل إعلان']
  },
  quarter_100: {
    key: 'quarter_100', name: 'باقة 3 شهور', price: 100, months: 3, color: 'blue',
    ads_limit: 1, max_edits_per_ad: null,
    basic_stats: true, advanced_stats: false, unlimited_edits: true, fast_support: false,
    features: ['كل مميزات باقة الشهر', 'إحصائيات بسيطة', 'تعديل غير محدود']
  },
  nine_months_300: {
    key: 'nine_months_300', name: 'باقة 9 شهور', price: 300, months: 9, color: 'purple',
    ads_limit: 1, max_edits_per_ad: null,
    basic_stats: true, advanced_stats: true, unlimited_edits: true, fast_support: true,
    features: ['كل مميزات باقة 3 شهور', 'إحصائيات متقدمة', 'دعم أسرع']
  }
};

const ADDON_DEFINITIONS = [
  { name: 'إحصائيات بسيطة', price: 20, unit: 'جنيه / شهر', desc: 'عدد المشاهدات + عدد ضغطات التواصل', icon: '📊', className: 'addon-green' },
  { name: 'تعديل غير محدود', price: 25, unit: 'جنيه / شهر', desc: 'بدلاً من 3 تعديلات فقط لكل إعلان', icon: '✏️', className: 'addon-blue' },
  { name: 'إعلان إضافي', price: 30, unit: 'جنيه / شهر', desc: 'أضف إعلانًا إضافيًا إلى حسابك', icon: '📣', className: 'addon-purple' },
  { name: 'دعم أسرع', price: 30, unit: 'جنيه / شهر', desc: 'أولوية في الرد والمساعدة', icon: '🎧', className: 'addon-teal' },
  { name: 'إحصائيات متقدمة', price: 50, unit: 'جنيه / شهر', desc: 'واتساب + فيسبوك + اتصال + أفضل إعلان', icon: '💎', className: 'addon-indigo' },
  { name: 'تصميم إعلان احترافي', price: 75, unit: 'جنيه مرة واحدة', desc: 'تصميم صورة أو بوستر احترافي لإعلانك', icon: '🎨', className: 'addon-pink' }
];

function getPlan(planType = 'monthly_40') { return PLAN_DEFINITIONS[planType] || PLAN_DEFINITIONS.monthly_40; }
function toDateOnlyInput(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0,10);
}
function addMonthsToDate(dateStr, months = 1) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d)) return '';
  d.setMonth(d.getMonth() + Number(months || 1));
  return d.toISOString().slice(0,10);
}
function normalizeDateEnd(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (isNaN(d)) return null;
  d.setHours(23,59,59,999);
  return d;
}
function daysUntil(dateLike) {
  const end = normalizeDateEnd(dateLike);
  if (!end) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}
function isSubscriptionActive(teacher = {}) {
  if (!teacher || teacher.is_active === false) return false;
  if (teacher.subscription_status && teacher.subscription_status !== 'active') return false;
  const days = daysUntil(teacher.subscription_end);
  return days === null || days >= 0;
}
function getTeacherFeatures(teacher = {}) {
  const plan = getPlan(teacher.plan_type);
  return {
    plan,
    ads_limit: Number(teacher.ads_limit || plan.ads_limit || CONFIG.DEFAULT_ADS_LIMIT),
    basic_stats: !!(plan.basic_stats || teacher.allow_basic_stats),
    advanced_stats: !!(plan.advanced_stats || teacher.allow_advanced_stats),
    unlimited_edits: !!(plan.unlimited_edits || teacher.allow_unlimited_edits),
    fast_support: !!(plan.fast_support || teacher.allow_fast_support),
    max_edits_per_ad: (plan.unlimited_edits || teacher.allow_unlimited_edits) ? null : (plan.max_edits_per_ad || 3),
    custom_features: teacher.custom_features || ''
  };
}
function planLabel(planType) { return getPlan(planType).name; }
function subscriptionStatusText(teacher = {}) {
  if (teacher.is_active === false || teacher.subscription_status === 'suspended') return 'موقوف من الإدارة';
  const days = daysUntil(teacher.subscription_end);
  if (days !== null && days < 0) return 'منتهي';
  return 'نشط';
}
function subscriptionBannerHtml(teacher = {}) {
  const days = daysUntil(teacher.subscription_end);
  const plan = getPlan(teacher.plan_type);
  const active = isSubscriptionActive(teacher);
  if (!active) {
    return `<div class="sub-banner sub-expired">🚫 انتهى أو تعلّق اشتراكك. الإعلانات مخفية مؤقتًا، وستعود كما كانت بعد التجديد من الإدارة.</div>`;
  }
  if (days === null) return `<div class="sub-banner sub-ok">✅ اشتراكك نشط على ${escapeHtml(plan.name)}.</div>`;
  const danger = days <= 5;
  return `<div class="sub-banner ${danger ? 'sub-warning' : 'sub-ok'}">${danger ? '⚠️' : '✅'} اشتراكك في ${escapeHtml(plan.name)} نشط — متبقي ${days} يوم.</div>`;
}
function lockedFeatureHtml(title, requiredPlan = 'باقة أعلى') {
  return `<div class="locked-feature"><div class="lock-icon">🔒</div><strong>${escapeHtml(title)}</strong><span>هذه الميزة غير متاحة في باقتك الحالية. راسل الإدارة للترقية أو تفعيلها كمَيزة إضافية.</span><small>مطلوبة: ${escapeHtml(requiredPlan)}</small></div>`;
}

// ── Session ID للزوار الفريدين ──
// يُولَّد مرة واحدة لكل جلسة متصفح ويُحفظ في sessionStorage
function getSessionId() {
  // مفتاح دائم للجهاز (Unique Visitor) - لا يتجدد
  const DEVICE_KEY = 'mdrsk_did'; // device id - ثابت دائماً
  // مفتاح الجلسة اليومية لاحتساب الزيارات اليومية
  const SESSION_KEY = 'mdrsk_sid';
  const SESSION_EXP = 'mdrsk_sid_exp';

  function makeUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }

  try {
    // Device ID: ثابت للجهاز نفسه، لا يتغير أبداً
    let deviceId = localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = makeUUID();
      localStorage.setItem(DEVICE_KEY, deviceId);
    }

    // Session ID: يتجدد كل 30 دقيقة (جلسة حقيقية)
    const exp = parseInt(localStorage.getItem(SESSION_EXP) || '0');
    const now = Date.now();
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid || now > exp) {
      sid = deviceId + '_' + now.toString(36);
      localStorage.setItem(SESSION_KEY, sid);
      localStorage.setItem(SESSION_EXP, String(now + 30 * 60 * 1000)); // 30 دقيقة
    }
    return sid;
  } catch (_) {
    // Fallback بدون localStorage: استخدم fingerprint بسيط
    const fp = navigator.userAgent.length + '_' + screen.width + '_' + screen.height;
    return 'fp_' + fp.split('').reduce((a,c) => (a*31 + c.charCodeAt(0)) & 0xFFFFFF, 0).toString(36);
  }
}

/* إحصاء الزوار الفريدين - يعتمد على device_id لا session_id */
function getDeviceId() {
  try {
    let did = localStorage.getItem('mdrsk_did');
    if (!did) { did = getSessionId(); } // يُنشئ did ضمنياً
    return localStorage.getItem('mdrsk_did') || did;
  } catch(_) {
    const fp = navigator.userAgent.length + '_' + screen.width;
    return 'fp_' + fp.split('').reduce((a,c) => (a*31 + c.charCodeAt(0)) & 0xFFFFFF, 0).toString(36);
  }
}

// ══════════════════════════════════════════════════════════════
// نظام مكافحة الاحتيال في النقاط — AntiSpam
// يحمي من: Refresh، الضغط المتكرر، التجميع غير المحدود
// ══════════════════════════════════════════════════════════════
const AntiSpam = {

  // ── الحد الأقصى للنقاط يوميًا لكل مدرس ──
  DAILY_MAX_POINTS: 100,

  // ── قواعد كل نوع حدث ──
  // maxPerDay  : أقصى عدد مرات يُحتسب هذا الحدث يوميًا (بنفس الإعلان)
  // cooldownSec: فترة الانتظار بين كل تفاعلَين من نفس النوع (ثانية)
  EVENT_RULES: {
    ad_card_view:        { maxPerDay: 3,  cooldownSec: 45  },
    ad_detail_view:      { maxPerDay: 3,  cooldownSec: 30  },
    whatsapp_click:      { maxPerDay: 1,  cooldownSec: 90  },
    facebook_click:      { maxPerDay: 1,  cooldownSec: 90  },
    phone_click:         { maxPerDay: 1,  cooldownSec: 90  },
    site_visit:          { maxPerDay: 1,  cooldownSec: 3600 },
    admin_contact_click: { maxPerDay: 2,  cooldownSec: 180  },
  },

  // الأنواع التي تتعلق بإعلان محدد (تُفصل بـ ad_id)
  AD_EVENTS: new Set(['ad_card_view','ad_detail_view','whatsapp_click','facebook_click','phone_click']),

  // ────────────────────────────────────────
  _today() { return new Date().toISOString().slice(0, 10); },

  // مفتاح localStorage : mdrsk_as_{date}_{8 chars of teacherId}
  _key(tid) { return `mdrsk_as_${this._today()}_${String(tid||'').slice(0,8)}`; },

  _load(tid) {
    try {
      const raw = localStorage.getItem(this._key(tid));
      if (!raw) return { pts: 0, ev: {} };
      const obj = JSON.parse(raw);
      return (obj && typeof obj === 'object') ? obj : { pts: 0, ev: {} };
    } catch (_) { return { pts: 0, ev: {} }; }
  },

  _save(tid, state) {
    try { localStorage.setItem(this._key(tid), JSON.stringify(state)); } catch (_) {}
  },

  /**
   * هل يُسمح بتسجيل هذا الحدث الآن؟
   * يعيد: { insertDB: bool, awardPts: bool }
   *
   * insertDB  true  → أدرج الحدث في analytics_events
   * awardPts  true  → احسب النقاط للمدرس
   *
   * المنطق:
   *   1. Cooldown لم ينتهِ → block الكل (anti-refresh / anti-bot)
   *   2. تجاوز حد اليوم أو نقاط اليوم → أدرج للإحصاء فقط، لا نقاط
   *   3. طبيعي → أدرج + نقاط
   */
  check(eventType, teacherId, adId) {
    const rules = this.EVENT_RULES[eventType];

    // نوع غير معروف → اسمح بالإدراج فقط بدون نقاط
    if (!rules) return { insertDB: true, awardPts: false };

    // لا يوجد معلم → اسمح للتحليلات بدون نقاط
    if (!teacherId) return { insertDB: true, awardPts: false };

    const state = this._load(teacherId);
    const now   = Date.now();

    // بناء مفتاح الحدث (نفصل بـ adId لضمانات أقوى)
    const evKey = (this.AD_EVENTS.has(eventType) && adId)
      ? `${eventType}|${adId}`
      : eventType;

    const rec = state.ev[evKey] || { n: 0, t: 0 };

    // ── 1. Cooldown: إذا كان أقل من الفترة المسموحة → حجب كلي ──
    if (rec.t > 0 && (now - rec.t) / 1000 < rules.cooldownSec) {
      return { insertDB: false, awardPts: false };
    }

    // ── 2. هل تجاوز العدد اليومي أو سقف النقاط؟ ──
    const countMaxed  = rec.n >= rules.maxPerDay;
    const ptsDepleted = state.pts >= this.DAILY_MAX_POINTS;

    // ── تحديث السجل (دائمًا، لتجديد وقت آخر تفاعل) ──
    rec.n = countMaxed ? rec.n : rec.n + 1;
    rec.t = now;
    state.ev[evKey] = rec;
    this._save(teacherId, state);

    return {
      insertDB: true,                                       // سجّل الحدث دائمًا
      awardPts: !countMaxed && !ptsDepleted,               // النقاط فقط إذا ضمن الحدود
    };
  },

  // سجّل النقاط محليًا لمراقبة سقف اليوم
  trackLocalPts(tid, pts) {
    if (!tid || !pts) return;
    const state = this._load(tid);
    state.pts = Math.min((state.pts || 0) + pts, this.DAILY_MAX_POINTS + 50); // هامش أمان
    this._save(tid, state);
  },

  // أزل مفاتيح أقدم من يومين لتنظيف localStorage
  cleanup() {
    try {
      const today     = this._today();
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
      const toRemove  = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mdrsk_as_')) {
          const d = k.slice(9, 19); // yyyy-mm-dd
          if (d !== today && d !== yesterday) toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch (_) {}
  },
};

// تنظيف تلقائي عند تحميل الصفحة
try { AntiSpam.cleanup(); } catch (_) {}

// ── قيم النقاط الافتراضية (يُمكن تجاوزها من site_settings) ──
const DEFAULT_POINTS = {
  ad_card_view:   1,
  ad_detail_view: 2,
  whatsapp_click: 4,
  facebook_click: 3,
  phone_click:    5,
};

// ── cache لإعدادات النقاط حتى لا نستدعي Supabase في كل حدث ──
const _pointsCache = { loaded: false, data: {}, loadedAt: 0 };

async function _getPointsConfig() {
  const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 دقائق
  if (_pointsCache.loaded && Date.now() - _pointsCache.loadedAt < MAX_CACHE_AGE) {
    return _pointsCache.data;
  }
  const types = Object.keys(DEFAULT_POINTS);
  const result = {};
  try {
    for (const t of types) {
      const val = await getSiteSetting(`points_${t}`, null);
      const n   = Number(val);
      result[t] = isNaN(n) ? DEFAULT_POINTS[t] : n;
    }
  } catch (_) {
    Object.assign(result, DEFAULT_POINTS);
  }
  _pointsCache.data     = result;
  _pointsCache.loaded   = true;
  _pointsCache.loadedAt = Date.now();
  return result;
}

// ── مفاتيح التكرار اليومي للمشاهدات ──
const _viewedToday = {
  _key(adId, eventType) {
    const today = new Date().toISOString().slice(0,10);
    return `mdrsk_vt_${eventType}_${adId || 'null'}_${today}`;
  },
  check(adId, eventType) {
    try { return !!localStorage.getItem(this._key(adId, eventType)); } catch(_) { return false; }
  },
  mark(adId, eventType) {
    try { localStorage.setItem(this._key(adId, eventType), '1'); } catch(_) {}
  },
  // تنظيف مفاتيح من أمس وما قبل
  cleanup() {
    try {
      const today = new Date().toISOString().slice(0,10);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mdrsk_vt_') && !k.includes(today)) localStorage.removeItem(k);
      }
    } catch(_) {}
  }
};
try { _viewedToday.cleanup(); } catch(_) {}

// ── trackEvent المحمي بنظام AntiSpam + مشاهدات حقيقية ──
async function trackEvent(eventType, payload = {}) {
  try {
    if (!window.supabase || !eventType) return;

    const teacherId = payload.teacher_id || null;
    const adId      = payload.ad_id      || null;

    // ── فلتر المشاهدات: مرة واحدة في اليوم لكل إعلان لكل جهاز ──
    const VIEW_EVENTS = ['ad_card_view','ad_detail_view'];
    if (VIEW_EVENTS.includes(eventType) && adId) {
      if (_viewedToday.check(adId, eventType)) return; // سبق تسجيلها اليوم
      _viewedToday.mark(adId, eventType);
    }

    // ── فحص AntiSpam قبل أي عملية ──
    const verdict = AntiSpam.check(eventType, teacherId, adId);

    // إذا رفض الإدراج كليًا (cooldown لم ينتهِ) → توقف
    if (!verdict.insertDB) return;

    // ── إدراج الحدث في analytics_events ──
    await window.supabase.from('analytics_events').insert({
      event_type: eventType,
      teacher_id: teacherId,
      ad_id:      adId,
      page:       payload.page || location.pathname.split('/').pop() || 'index.html',
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
      meta:       payload.meta || {},
    });

    // ── إضافة النقاط فقط إذا أجازها AntiSpam ──
    if (verdict.awardPts && teacherId) {
      try {
        const cfg   = await _getPointsConfig();
        const delta = cfg[eventType] || 0;
        if (delta > 0) {
          AntiSpam.trackLocalPts(teacherId, delta);
          await incrementTeacherPoints(teacherId, delta);
        }
      } catch (_) {}
    }

  } catch (e) {
    console.warn('analytics skipped:', e.message);
  }
}


// ── Site Settings Helpers ──
async function getSiteSetting(key, fallback = null) {
  try {
    if (!window.supabase || !key) return fallback;
    const { data, error } = await window.supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.value;
  } catch (_) { return fallback; }
}

async function setSiteSetting(key, value) {
  if (!window.supabase || !key) throw new Error('Supabase غير جاهز');
  const { error } = await window.supabase.from('site_settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
  if (error) throw error;
  return true;
}

async function isLaunchBannerVisible() {
  const value = await getSiteSetting('launch_banner_visible', true);
  // Supabase JSONB may return true/false directly, a string, or an object.
  if (value === false || value === 'false') return false;
  if (value && typeof value === 'object' && value.enabled === false) return false;
  return value === true || value === 'true' || value?.enabled === true;
}


// ── Global Launch Banner Visibility ──
// Applies the "launch_banner_visible" setting on every page, not only index.html.
async function applyGlobalLaunchVisibility() {
  try {
    const visible = await isLaunchBannerVisible();

    // Hide/show notes and sections that explicitly talk about launch/development.
    document.querySelectorAll('[data-launch-controlled], .launch-note').forEach(el => {
      el.style.display = visible ? '' : 'none';
    });

    // Page-specific text cleanup when launch message is disabled.
    const heroBadge = document.getElementById('hero-badge');
    if (heroBadge) {
      heroBadge.innerHTML = visible
        ? '🚀 مدرسك في مرحلة الانطلاق — <span id="hero-count">0</span> مدرس متاح الآن'
        : '✨ أكثر من <span id="hero-count">0</span> مدرس متاح الآن';
    }

    document.querySelectorAll('[data-launch-alt]').forEach(el => {
      const normalText = el.getAttribute('data-normal-text');
      const launchText = el.getAttribute('data-launch-text');
      if (visible && launchText) el.textContent = launchText;
      if (!visible && normalText) el.textContent = normalText;
    });

    // Hide whole marketing blocks that only talk about early launch.
    document.querySelectorAll('.launch-card').forEach(el => {
      el.style.display = visible ? '' : 'none';
    });

    document.body.classList.toggle('launch-hidden', !visible);
  } catch (e) {
    console.warn('launch visibility skipped:', e?.message || e);
  }
}

function scheduleGlobalLaunchVisibility() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGlobalLaunchVisibility);
  } else {
    applyGlobalLaunchVisibility();
  }
}
scheduleGlobalLaunchVisibility();

function eventTypeLabel(type = '') {
  const map = {
    site_visit: 'زيارة الموقع',
    ad_card_view: 'ظهور كارت إعلان',
    ad_detail_view: 'فتح تفاصيل إعلان',
    whatsapp_click: 'ضغط واتساب',
    facebook_click: 'ضغط فيسبوك',
    phone_click: 'ضغط اتصال',
    admin_contact_click: 'تواصل مع الإدارة'
  };
  return map[type] || type || '—';
}

function trackedContactHref(href, eventType, adId, teacherId) {
  const safeHref = escapeAttr(href || "#");
  const safeEvent = escapeAttr(eventType || "");
  const safeAd = escapeAttr(adId || "");
  const safeTeacher = escapeAttr(teacherId || "");
  return `href="${safeHref}" onclick="trackEvent('${safeEvent}', {ad_id:'${safeAd}', teacher_id:'${safeTeacher}'});"`;
}

// ── Initialize Supabase ──
const _supabaseReady = (function () {
  // التحقق من صحة الإعدادات قبل الاتصال
  if (
    !CONFIG.SUPABASE_URL ||
    CONFIG.SUPABASE_URL.includes("YOUR_PROJECT") ||
    !CONFIG.SUPABASE_ANON_KEY ||
    CONFIG.SUPABASE_ANON_KEY === "YOUR_ANON_KEY_HERE"
  ) {
    console.error("❌ Supabase: بيانات الاتصال غير مضبوطة في config.js");
    // إظهار رسالة للمستخدم بعد تحميل الصفحة
    window.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        // إيقاف أي spinner موجود
        document
          .querySelectorAll(
            ".loading-spinner, #cards-loading, #ads-loading, #teachers-loading",
          )
          .forEach((el) => {
            el.style.display = "none";
          });
        document
          .querySelectorAll("#ads-grid, #ads-list, #teachers-table")
          .forEach((el) => {
            el.style.display = "";
          });
        // إظهار رسالة الخطأ
        const errDiv = document.querySelector(
          "#empty-state, #ads-empty, #teachers-empty",
        );
        if (errDiv) {
          errDiv.style.display = "";
          errDiv.innerHTML = `
            <div class="empty-icon">⚙️</div>
            <div class="empty-title">الموقع يحتاج إعداداً</div>
            <div class="empty-text" style="max-width:420px;margin:0 auto">
              يرجى فتح ملف <code>config.js</code> وإدخال بيانات Supabase الصحيحة
              (SUPABASE_URL و SUPABASE_ANON_KEY)
            </div>`;
        }
        showToast(
          "⚙️ يرجى إدخال بيانات Supabase في ملف config.js",
          "warning",
          8000,
        );
      }, 500);
    });
    return false;
  }
  try {
    const cleanUrl = CONFIG.SUPABASE_URL.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
    const supabaseLib = window.supabase;
    window.supabase = supabaseLib.createClient(
      cleanUrl,
      CONFIG.SUPABASE_ANON_KEY,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
    return true;
  } catch (e) {
    console.error("❌ Supabase init error:", e.message);
    return false;
  }
})();

// ── Auth Helpers ──
// ملاحظة مهمة: جلسة المدرس تُحفظ في localStorage (وليس sessionStorage) حتى:
//  1) تبقى موجودة بعد إغلاق المتصفح تمامًا وإعادة فتحه.
//  2) تظهر في أي تاب/نافذة جديدة يفتحها المدرس لنفس الموقع، لا تاب واحد فقط.
// مدة الصلاحية 30 يومًا، وتتجدد تلقائيًا مع أي نشاط (setTeacherSession تُستدعى
// عند كل تحديث لبيانات المدرس، فتُعيد ضبط عداد الوقت).
const TEACHER_SESSION_KEY = "teacher_session";
const TEACHER_SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 يوم

const Auth = {
  setTeacherSession(teacher) {
    localStorage.setItem(
      TEACHER_SESSION_KEY,
      JSON.stringify({
        id: teacher.id,
        username: teacher.username,
        name: teacher.name,
        ads_limit: teacher.ads_limit,
        ts: Date.now(),
      }),
    );
  },
  getTeacherSession() {
    try {
      const s = JSON.parse(localStorage.getItem(TEACHER_SESSION_KEY) || "null");
      if (!s) return null;
      if (Date.now() - s.ts > TEACHER_SESSION_MAX_AGE) {
        this.clearTeacher();
        return null;
      }
      return s;
    } catch {
      return null;
    }
  },
  clearTeacher() {
    localStorage.removeItem(TEACHER_SESSION_KEY);
  },

  // Admin now uses Supabase Auth + profiles.role = admin
  async getAdminSession() {
    if (!window.supabase?.auth) return null;

    const { data: { session }, error } = await window.supabase.auth.getSession();
    if (error || !session?.user) return null;

    const { data: profile, error: profileError } = await window.supabase
      .from("profiles")
      .select("role, teacher_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") return null;

    return { user: session.user, profile };
  },

  async clearAdmin() {
    try { await window.supabase?.auth?.signOut(); } catch (_) {}
    sessionStorage.removeItem("admin_session");
  },

  isTeacher() {
    return !!this.getTeacherSession();
  },

  async isAdmin() {
    return !!(await this.getAdminSession());
  },

  requireTeacher() {
    if (!this.isTeacher()) {
      window.location.href = "login.html?role=teacher";
      return false;
    }
    return true;
  },

  async requireAdmin() {
    const ok = await this.isAdmin();
    if (!ok) {
      window.location.href = "login.html?role=admin";
      return false;
    }
    return true;
  },
};

// ── Simple SHA-256 Hash ──
async function sha256(msg) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(msg),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Toast Notifications ──
function showToast(message, type = "default", duration = 3500) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  const icons = { success: "✅", danger: "❌", warning: "⚠️", default: "ℹ️" };
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || icons.default}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Format Helpers ──
function formatPrice(price) {
  return `${Number(price).toLocaleString("ar-EG")} جنيه`;
}

function lessonTypeLabel(type) {
  const map = { online: "أونلاين", inperson: "حضوري", both: "أونلاين وحضوري" };
  return map[type] || type;
}

function lessonTypeBadgeClass(type) {
  const map = {
    online: "badge-online",
    inperson: "badge-inperson",
    both: "badge-both",
  };
  return map[type] || "";
}

function statusLabel(status) {
  const map = { pending: "قيد المراجعة", active: "مقبول", rejected: "مرفوض" };
  return map[status] || status;
}

function statusBadgeClass(status) {
  const map = {
    pending: "badge-pending",
    active: "badge-active",
    rejected: "badge-rejected",
  };
  return map[status] || "";
}

function getInitials(name) {
  return name ? name.trim().charAt(0) : "؟";
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 30) return new Date(dateStr).toLocaleDateString("ar-SA");
  if (days > 0) return `منذ ${days} يوم${days > 1 ? "" : ""}`;
  if (hours > 0) return `منذ ${hours} ساعة`;
  if (mins > 0) return `منذ ${mins} دقيقة`;
  return "الآن";
}

// ── Points Helpers ──
// نظام النقاط المزدوج:
//   XP (xp)           : نقاط الخبرة — تحدد المستوى، لا تنقص أبداً
//   RP (reward_points) : نقاط المكافآت — قابلة للصرف، تُضاف مع XP وتُخصم عند الاسترداد
//   points             : legacy = XP (للتوافق مع الكود القديم)
async function incrementTeacherPoints(teacherId, delta = 1) {
  if (!window.supabase || !teacherId) return;
  try {
    const { data: current, error: err1 } = await window.supabase
      .from('teachers')
      .select('points,xp,reward_points')
      .eq('id', teacherId)
      .maybeSingle();
    if (err1) return;
    const d = Number(delta || 0);
    // XP: لا ينقص أبداً
    const newXP = (current?.xp ?? current?.points ?? 0) + d;
    // Reward Points: يُضاف مع كل نشاط ويمكن خصمه عند الاسترداد
    const newRP = (current?.reward_points ?? current?.xp ?? current?.points ?? 0) + d;
    await window.supabase.from('teachers').update({
      points: newXP,       // legacy compat
      xp: newXP,           // نقاط الخبرة
      reward_points: newRP, // نقاط المكافآت
    }).eq('id', teacherId);
  } catch (_) {
    // نتجاهل الخطأ حتى لا نؤثر على تدفق التطبيق
  }
}

// ── Build Teacher Card HTML ──
function buildTeacherCard(ad, teacher) {
  const t = teacher || ad.teachers || {};
  const name = t.name || "مدرس";
  const initial = getInitials(name);
  const avatar = t.avatar_url
    ? `<img src="${escapeHtml(t.avatar_url)}" alt="${escapeHtml(name)}" onerror="this.style.display='none'">`
    : initial;
  const contactBtns = buildContactButtons(t, ad, 'btn-sm', { compactExtra: true });
  const footerHtml = contactBtns.length ? contactBtns.join("") : '<span class="tc-open-hint">اضغط على الكارت لعرض التفاصيل</span>';
  const position = escapeHtml(ad.main_image_position || '50% 50%');
  return `
  <article class="teacher-card animate-in" data-id="${ad.id}" data-teacher="${t.id || ""}" onclick="window.location.href='teacher.html?ad=${ad.id}'" role="link" tabindex="0" onkeydown="if(event.key==='Enter') window.location.href='teacher.html?ad=${ad.id}'">
    ${ad.main_image_url ? `<div class="tc-image-link">${mediaImage(ad.main_image_url, ad.title || ad.subject, "tc-main-image").replace('<img ', `<img style="object-position:${position}" `)}</div>` : ""}
    <div class="tc-header">
      <div class="tc-avatar">${avatar}</div>
      <div class="tc-info">
        <div class="tc-name">${escapeHtml(name)}</div>
        <div class="tc-subject">📚 ${escapeHtml(ad.subject || '')}</div>
      </div>
    </div>
    <div class="tc-body">
      <div class="tc-meta">
        <span class="tc-badge badge-grade">📗 ${escapeHtml(ad.grade || '')}</span>
        <span class="tc-badge ${lessonTypeBadgeClass(ad.lesson_type)}">${lessonTypeLabel(ad.lesson_type)}</span>
      </div>
      <div class="tc-desc">${escapeHtml(ad.description || "لا يوجد وصف")}</div>
      <div class="tc-price">${formatPrice(ad.price)} <span>/ الحصة</span></div>
    </div>
    <div class="tc-footer">
      ${footerHtml}
    </div>
  </article>`;
}

function openImageViewer(url, alt = 'صورة') {
  if (!url) return;
  const overlay = document.createElement('div');
  overlay.className = 'image-viewer open';
  overlay.innerHTML = `
    <button class="image-viewer-close" type="button" aria-label="إغلاق">✕</button>
    <img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  const close = () => { overlay.remove(); document.body.style.overflow = ''; };
  overlay.querySelector('.image-viewer-close').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };
  document.addEventListener('keydown', function esc(e){ if(e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); } });
}

// ── Confirm Dialog ──
function confirmDialog(message, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-body" style="padding:28px;text-align:center">
        <div style="font-size:2.5rem;margin-bottom:12px">⚠️</div>
        <h3 style="margin-bottom:12px;font-family:'Cairo',sans-serif">${message}</h3>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
          <button class="btn btn-danger" id="confirm-yes">تأكيد</button>
          <button class="btn btn-ghost" id="confirm-no">إلغاء</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#confirm-yes").onclick = () => {
    overlay.remove();
    onConfirm();
  };
  overlay.querySelector("#confirm-no").onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

// ══════════════════════════════════════════
// إخفاء عناصر الإدارة عن غير الإداريين
// أضف data-admin-only لأي عنصر تريد إخفاءه
// ══════════════════════════════════════════
async function applyAdminVisibility() {
  const els = document.querySelectorAll('[data-admin-only]');
  if (!els.length) return;
  // إخفاء فوري حتى يتم التحقق
  els.forEach(el => el.style.display = 'none');
  try {
    const isAdm = await Auth.isAdmin();
    els.forEach(el => {
      el.style.display = isAdm ? '' : 'none';
    });
  } catch(e) {
    els.forEach(el => el.style.display = 'none');
  }
}

// تشغيل تلقائي عند تحميل الصفحة
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyAdminVisibility);
} else {
  applyAdminVisibility();
}

// ══════════════════════════════════════════════════════
// نظام الرسائل الهامة (Announcements)
// تُدار بالكامل من لوحة الإدارة: نص، نوع (بانر/عاجل)،
// مدة الظهور، عدد مرات الظهور المسموحة لكل مدرس
// ══════════════════════════════════════════════════════
const Announcements = {

  // جلب كل الرسائل السارية حاليًا (نشطة + ضمن الفترة الزمنية)
  async fetchActive() {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', nowIso)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).filter(a => !a.end_date || new Date(a.end_date) >= new Date());
    } catch (_) { return []; }
  },

  // جلب/إنشاء سجل المشاهدة الخاص بمدرس لرسالة معينة
  async _getViewRecord(annId, teacherId) {
    try {
      const { data } = await supabase
        .from('announcement_views')
        .select('*')
        .eq('announcement_id', annId)
        .eq('teacher_id', teacherId)
        .maybeSingle();
      return data || null;
    } catch (_) { return null; }
  },

  // هل يُسمح بعرض هذه الرسالة لهذا المدرس الآن؟
  async canShow(ann, teacherId) {
    if (!teacherId) return false;
    const rec = await this._getViewRecord(ann.id, teacherId);
    if (rec?.dismissed) return false; // المدرس أغلقها نهائيًا (خاص بالرسائل العاجلة)
    if (ann.max_views != null && rec && rec.view_count >= ann.max_views) return false;
    return true;
  },

  // تسجيل مشاهدة جديدة (تزيد العداد)
  async recordView(annId, teacherId) {
    if (!teacherId) return;
    try {
      const rec = await this._getViewRecord(annId, teacherId);
      if (rec) {
        await supabase.from('announcement_views')
          .update({ view_count: rec.view_count + 1, last_viewed_at: new Date().toISOString() })
          .eq('id', rec.id);
      } else {
        await supabase.from('announcement_views').insert({
          announcement_id: annId, teacher_id: teacherId, view_count: 1,
        });
      }
    } catch (_) {}
  },

  // تعليم الرسالة كمغلقة نهائيًا (لل urgent فقط، عند ضغط المدرس "فهمت")
  async dismiss(annId, teacherId) {
    if (!teacherId) return;
    try {
      const rec = await this._getViewRecord(annId, teacherId);
      if (rec) {
        await supabase.from('announcement_views').update({ dismissed: true }).eq('id', rec.id);
      } else {
        await supabase.from('announcement_views').insert({
          announcement_id: annId, teacher_id: teacherId, view_count: 1, dismissed: true,
        });
      }
    } catch (_) {}
  },

  // نقطة الدخول: تُستدعى من لوحة المدرس عند التحميل
  // تعرض أول رسالة عاجلة صالحة كـ Popup، وكل الرسائل العادية كبانرات
  async renderForTeacher(teacherId, bannerContainerId = 'ann-banner-wrap') {
    if (!teacherId) return;
    const all = await this.fetchActive();
    if (!all.length) return;

    const eligible = [];
    for (const ann of all) {
      if (await this.canShow(ann, teacherId)) eligible.push(ann);
    }
    if (!eligible.length) return;

    const banners = eligible.filter(a => a.type === 'normal');
    const urgents = eligible.filter(a => a.type === 'urgent');

    // ── البانرات العادية ──
    const box = document.getElementById(bannerContainerId);
    if (box && banners.length) {
      box.innerHTML = banners.map(a => `
        <div class="ann-banner" data-ann-id="${a.id}">
          <span class="ann-ico">📢</span>
          <div class="ann-body">
            <div class="ann-title">${escapeHtml(a.title)}</div>
            <div>${nl2br(a.message)}</div>
            ${a.link_url ? `<a href="${escapeHtml(a.link_url)}" target="_blank" class="ann-link">${escapeHtml(a.link_label || 'معرفة المزيد')} ←</a>` : ''}
          </div>
          <button class="ann-close" onclick="Announcements.closeBanner('${a.id}', this)" aria-label="إغلاق">✕</button>
        </div>`).join('');
      banners.forEach(a => this.recordView(a.id, teacherId));
    }

    // ── الرسالة العاجلة (Popup) — نعرض أول واحدة فقط لتفادي إزعاج المستخدم ──
    if (urgents.length) {
      this._showUrgentModal(urgents[0], teacherId);
      this.recordView(urgents[0].id, teacherId);
    }
  },

  closeBanner(annId, btnEl) {
    btnEl.closest('.ann-banner')?.remove();
  },

  _showUrgentModal(ann, teacherId) {
    const overlay = document.createElement('div');
    overlay.className = 'ann-modal-overlay';
    overlay.innerHTML = `
      <div class="ann-modal">
        <div class="ann-modal-head">
          <span class="ico">🚨</span>
          <h3>${escapeHtml(ann.title)}</h3>
        </div>
        <div class="ann-modal-body">${nl2br(ann.message)}</div>
        <div class="ann-modal-foot">
          ${ann.link_url ? `<a href="${escapeHtml(ann.link_url)}" target="_blank" class="btn btn-outline">${escapeHtml(ann.link_label || 'معرفة المزيد')}</a>` : ''}
          <button class="btn btn-primary" id="ann-urgent-ok">فهمت ✓</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    // ملاحظة: لا نستدعي dismiss() هنا. الغلق بـ"فهمت" يُخفي النافذة لهذه
    // الزيارة فقط؛ عدد مرات الظهور المسموحة (max_views) + view_count هو ما
    // يتحكم فعليًا في متى تختفي الرسالة نهائيًا. سابقًا كان يُستدعى dismiss()
    // هنا فيُسجَّل dismissed=true من أول ضغطة، فتختفي الرسالة العاجلة نهائيًا
    // حتى لو كانت مضبوطة لتظهر 3 مرات مثلاً.
    const close = () => {
      overlay.remove();
      document.body.style.overflow = '';
    };
    overlay.querySelector('#ann-urgent-ok').onclick = close;
  },
};

// ══════════════════════════════════════════════════════
// نظام الاستطلاعات (Surveys) — تقييم بالنجوم + أسئلة مخصصة
// يظهر للمدرس بعد مرور مدة محددة من تاريخ اشتراكه
// ══════════════════════════════════════════════════════
const Surveys = {

  async fetchActive() {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (_) { return []; }
  },

  async hasResponded(surveyId, teacherId) {
    try {
      const { data } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', surveyId)
        .eq('teacher_id', teacherId)
        .maybeSingle();
      return !!data;
    } catch (_) { return false; }
  },

  async hasDismissed(surveyId, teacherId) {
    try {
      const { data } = await supabase
        .from('survey_dismissals')
        .select('id')
        .eq('survey_id', surveyId)
        .eq('teacher_id', teacherId)
        .maybeSingle();
      return !!data;
    } catch (_) { return false; }
  },

  // نقطة الدخول: تُستدعى من لوحة المدرس. تعرض أول استطلاع مستحق
  async checkAndShow(teacher) {
    if (!teacher?.id) return;
    const subStart = teacher.subscription_start ? new Date(teacher.subscription_start) : null;
    if (!subStart) return;
    const daysSince = Math.floor((Date.now() - subStart.getTime()) / 86400000);

    const surveys = await this.fetchActive();
    for (const s of surveys) {
      if (daysSince < (s.trigger_days_after_subscription ?? 7)) continue;
      if (await this.hasResponded(s.id, teacher.id)) continue;
      if (await this.hasDismissed(s.id, teacher.id)) continue;
      this._showModal(s, teacher.id);
      return; // استطلاع واحد فقط في المرة الواحدة
    }
  },

  _showModal(survey, teacherId) {
    const questions = Array.isArray(survey.questions) ? survey.questions : [];
    let selectedStar = 0;

    const overlay = document.createElement('div');
    overlay.className = 'survey-modal-overlay';
    overlay.innerHTML = `
      <div class="survey-modal">
        <div class="survey-modal-head">
          <h3>📝 ${escapeHtml(survey.title)}</h3>
          ${survey.description ? `<p>${escapeHtml(survey.description)}</p>` : ''}
        </div>
        <div class="survey-modal-body">
          ${survey.show_star_rating ? `
            <div class="survey-stars" id="survey-stars">
              ${[1,2,3,4,5].map(n => `<button type="button" class="survey-star-btn" data-v="${n}">★</button>`).join('')}
            </div>` : ''}
          <div id="survey-questions">
            ${questions.map((q, i) => `
              <div class="survey-q" data-qid="${escapeAttr(q.id || String(i))}">
                <div class="survey-q-label">${escapeHtml(q.text || '')}</div>
                ${q.type === 'text' ? `
                  <textarea class="form-control" placeholder="اكتب إجابتك هنا..."></textarea>
                ` : `
                  <div class="survey-q-options">
                    ${(q.options || []).map(opt => `
                      <label class="survey-q-opt">
                        <input type="radio" name="survey-q-${i}" value="${escapeAttr(opt)}">
                        <span>${escapeHtml(opt)}</span>
                      </label>`).join('')}
                  </div>
                `}
              </div>`).join('')}
          </div>
        </div>
        <div class="survey-modal-foot">
          <button class="btn btn-ghost" id="survey-skip-btn">لاحقًا</button>
          <button class="btn btn-primary" id="survey-submit-btn">إرسال التقييم</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    if (survey.show_star_rating) {
      overlay.querySelectorAll('.survey-star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedStar = Number(btn.dataset.v);
          overlay.querySelectorAll('.survey-star-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.v) <= selectedStar));
        });
      });
    }
    overlay.querySelectorAll('.survey-q-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        opt.closest('.survey-q-options').querySelectorAll('.survey-q-opt').forEach(o => o.classList.remove('checked'));
        opt.classList.add('checked');
      });
    });

    const close = () => { overlay.remove(); document.body.style.overflow = ''; };

    overlay.querySelector('#survey-skip-btn').onclick = async () => {
      try {
        await supabase.from('survey_dismissals').insert({ survey_id: survey.id, teacher_id: teacherId });
      } catch (_) {}
      close();
    };

    overlay.querySelector('#survey-submit-btn').onclick = async () => {
      const btn = overlay.querySelector('#survey-submit-btn');
      btn.disabled = true; btn.textContent = 'جارٍ الإرسال...';
      try {
        const answers = [];
        overlay.querySelectorAll('.survey-q').forEach(qEl => {
          const qid = qEl.dataset.qid;
          const textarea = qEl.querySelector('textarea');
          const checked = qEl.querySelector('input[type="radio"]:checked');
          const answer = textarea ? textarea.value.trim() : (checked ? checked.value : '');
          if (answer) answers.push({ question_id: qid, answer });
        });
        await supabase.from('survey_responses').insert({
          survey_id: survey.id,
          teacher_id: teacherId,
          star_rating: survey.show_star_rating ? (selectedStar || null) : null,
          answers,
        });
        showToast('شكرًا لتقييمك! ✅', 'success');
        close();
      } catch (e) {
        btn.disabled = false; btn.textContent = 'إرسال التقييم';
        showToast('تعذّر إرسال التقييم، حاول مرة أخرى', 'danger');
      }
    };
  },
};
