/* =============================================
   مدرسك - Config & Utilities
   =============================================
   ⚠️  قم بتعديل القيم أدناه بيانات مشروعك
   ============================================= */

const CONFIG = {
  // ── Supabase ──
  SUPABASE_URL: "https://iazevtsralvjfsojrknt.supabase.co/rest/v1/",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhemV2dHNyYWx2amZzb2pya250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzE3NDMsImV4cCI6MjA5MzY0Nzc0M30.1Y4Yt11SZ7niqWdDojHKZqrIoO0h76RgknnuG6V8hLQ",

  // ── Admin Credentials ──
  // غيّر هذه البيانات قبل النشر!
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "Admin@Mudarrisak2024", // ← غيّر هذا!

  // ── App Settings ──
  APP_NAME: "مدرسك",
  APP_TAGLINE: "ابحث عن مدرسك المثالي",
  DEFAULT_ADS_LIMIT: 3,
};

// ── Initialize Supabase ──
let supabase;
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
              يرجى فتح ملف <code>js/config.js</code> وإدخال بيانات Supabase الصحيحة
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
    supabase = window.supabase.createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY,
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
  return `${Number(price).toLocaleString("ar-SA")} ريال`;
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
    ? `<img src="${t.avatar_url}" alt="${name}" onerror="this.style.display='none'">`
    : initial;

  const whatsapp = t.whatsapp || ad.whatsapp || "";
  const facebook = t.facebook || ad.facebook || "";

  const contactBtns = [];
  if (whatsapp)
    contactBtns.push(`<a href="https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}" target="_blank" class="btn btn-whatsapp btn-sm">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      واتساب
    </a>`);
  if (facebook)
    contactBtns.push(`<a href="${facebook}" target="_blank" class="btn btn-facebook btn-sm">
      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      فيسبوك
    </a>`);

  return `
  <div class="teacher-card animate-in" data-id="${ad.id}" data-teacher="${t.id || ""}">
    <div class="tc-header">
      <div class="tc-avatar">${avatar}</div>
      <div class="tc-info">
        <div class="tc-name">${name}</div>
        <div class="tc-subject">📚 ${ad.subject}</div>
      </div>
    </div>
    <div class="tc-body">
      <div class="tc-meta">
        <span class="tc-badge badge-grade">📗 ${ad.grade}</span>
        <span class="tc-badge ${lessonTypeBadgeClass(ad.lesson_type)}">${lessonTypeLabel(ad.lesson_type)}</span>
      </div>
      <div class="tc-desc">${ad.description || "لا يوجد وصف"}</div>
      <div class="tc-price">${formatPrice(ad.price)} <span>/ الساعة</span></div>
    </div>
    <div class="tc-footer">
      ${contactBtns.join("")}
      <a href="teacher.html?id=${t.id || ""}&ad=${ad.id}" class="btn btn-outline btn-sm">
        🔍 التفاصيل
      </a>
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
