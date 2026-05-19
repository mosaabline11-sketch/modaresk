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
  CONTACT_WHATSAPP: "",
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
  const list = getAdGrades(ad);
  return list.length ? list.join("، ") : (ad.grade || "—");
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
  const KEY = 'mdrsk_sid';
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    sessionStorage.setItem(KEY, sid);
  }
  return sid;
}

async function trackEvent(eventType, payload = {}) {
  try {
    if (!window.supabase || !eventType) return;
    await window.supabase.from('analytics_events').insert({
      event_type: eventType,
      teacher_id: payload.teacher_id || null,
      ad_id:      payload.ad_id      || null,
      page:       payload.page || location.pathname.split('/').pop() || 'index.html',
      user_agent: navigator.userAgent,
      session_id: getSessionId(),   // ← الزائر الفريد
      meta:       payload.meta || {}
    });
  } catch (e) { console.warn('analytics skipped:', e.message); }
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
  const safeHref = escapeHtml(href);
  return `${safeHref}" onclick="trackEvent('${eventType}', {ad_id:'${escapeHtml(adId || '')}', teacher_id:'${escapeHtml(teacherId || '')}'});`;
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
const Auth = {
  // Store teacher session (old teacher login kept temporarily)
  setTeacherSession(teacher) {
    sessionStorage.setItem(
      "teacher_session",
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
      const s = JSON.parse(sessionStorage.getItem("teacher_session") || "null");
      if (!s) return null;
      if (Date.now() - s.ts > 8 * 60 * 60 * 1000) {
        this.clearTeacher();
        return null;
      }
      return s;
    } catch {
      return null;
    }
  },
  clearTeacher() {
    sessionStorage.removeItem("teacher_session");
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
