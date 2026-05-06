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

  // ── Admin Credentials ──
  // غيّر هذه البيانات قبل النشر!
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD_HASH: "117359aea30411a81daffb675ed2ba8d2b6a2f395b5296ad188ee64e273977fa", // كلمة مرور الإدارة مشفرة SHA-256

  // ── App Settings ──
  APP_NAME: "مدرسك",
  APP_TAGLINE: "ابحث عن مدرسك المثالي",
  DEFAULT_ADS_LIMIT: 3,
};


// ── مدرسك shared data helpers ──
const GRADE_OPTIONS = [
  "المرحلة الابتدائية كاملة", "أول ابتدائي", "ثاني ابتدائي", "ثالث ابتدائي", "رابع ابتدائي", "خامس ابتدائي", "سادس ابتدائي",
  "المرحلة الإعدادية كاملة", "أول إعدادي", "ثاني إعدادي", "ثالث إعدادي",
  "المرحلة الثانوية كاملة", "أول ثانوي", "ثاني ثانوي", "ثالث ثانوي"
];
const DEFAULT_SUBJECTS = ["رياضيات", "لغة عربية", "لغة إنجليزية", "علوم", "دراسات اجتماعية", "فيزياء", "كيمياء", "أحياء", "تاريخ", "جغرافيا", "فرنسي", "حاسب آلي", "أخرى"];
let SUBJECTS_CACHE = [...DEFAULT_SUBJECTS];

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[ch]));
}
function nl2br(str = "") { return escapeHtml(str).replace(/\n/g, "<br>"); }

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
  const keepEmpty = el.querySelector('option[value=""]') ? '<option value="">اختر الصف أو المرحلة</option>' : '';
  el.innerHTML = keepEmpty + `
    <optgroup label="الابتدائي">
      <option>المرحلة الابتدائية كاملة</option><option>أول ابتدائي</option><option>ثاني ابتدائي</option><option>ثالث ابتدائي</option><option>رابع ابتدائي</option><option>خامس ابتدائي</option><option>سادس ابتدائي</option>
    </optgroup>
    <optgroup label="الإعدادي">
      <option>المرحلة الإعدادية كاملة</option><option>أول إعدادي</option><option>ثاني إعدادي</option><option>ثالث إعدادي</option>
    </optgroup>
    <optgroup label="الثانوي">
      <option>المرحلة الثانوية كاملة</option><option>أول ثانوي</option><option>ثاني ثانوي</option><option>ثالث ثانوي</option>
    </optgroup>`;
  if (selected) el.value = selected;
}
function populateAllSubjectAndGradeSelects() {
  ['ad-subject','ea-subject','filter-subject','hero-subject'].forEach(id => populateSubjectSelect(id, document.getElementById(id)?.value || ''));
  ['ad-grade','ea-grade','filter-grade','hero-grade'].forEach(id => populateGradeSelect(id, document.getElementById(id)?.value || ''));
}
function parseExtraContacts(text = "") {
  return String(text || '').split(/\n|،/).map(x => x.trim()).filter(Boolean);
}
function buildContactButtons(teacher = {}, ad = {}, size = 'btn-sm') {
  const btns = [];
  if (teacher.whatsapp) btns.push(`<a href="https://wa.me/${String(teacher.whatsapp).replace(/[^0-9]/g,'')}" target="_blank" class="btn btn-whatsapp ${size}">واتساب</a>`);
  if (teacher.facebook) btns.push(`<a href="${escapeHtml(teacher.facebook)}" target="_blank" class="btn btn-facebook ${size}">فيسبوك</a>`);
  if (teacher.phone) btns.push(`<a href="tel:${escapeHtml(teacher.phone)}" class="btn btn-ghost ${size}">📞 اتصال</a>`);
  parseExtraContacts(teacher.contact_methods).forEach(c => btns.push(`<span class="btn btn-ghost ${size}">${escapeHtml(c)}</span>`));
  parseExtraContacts(ad.extra_contact).forEach(c => btns.push(`<span class="btn btn-ghost ${size}">${escapeHtml(c)}</span>`));
  return btns;
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
      { auth: { persistSession: false } }
    );
    return true;
  } catch (e) {
    console.error("❌ Supabase init error:", e.message);
    return false;
  }
})();

// ── Auth Helpers ──
const Auth = {
  // Store teacher session
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
      // Session expires after 8 hours
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

  // Admin session
  setAdminSession() {
    sessionStorage.setItem("admin_session", JSON.stringify({ ts: Date.now() }));
  },
  getAdminSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem("admin_session") || "null");
      if (!s) return null;
      if (Date.now() - s.ts > 4 * 60 * 60 * 1000) {
        this.clearAdmin();
        return null;
      }
      return s;
    } catch {
      return null;
    }
  },
  clearAdmin() {
    sessionStorage.removeItem("admin_session");
  },

  isTeacher() {
    return !!this.getTeacherSession();
  },
  isAdmin() {
    return !!this.getAdminSession();
  },

  requireTeacher() {
    if (!this.isTeacher()) {
      window.location.href = "login.html?role=teacher";
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!this.isAdmin()) {
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
  const contactBtns = buildContactButtons(t, ad, 'btn-sm');
  return `
  <div class="teacher-card animate-in" data-id="${ad.id}" data-teacher="${t.id || ""}">
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
      ${contactBtns.join("")}
      <a href="teacher.html?ad=${ad.id}" class="btn btn-outline btn-sm">🔍 تفاصيل الإعلان</a>
    </div>
  </div>`;
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
