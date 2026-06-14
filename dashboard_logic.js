/* ══════════════════════════════════════════════════
   dashboard_logic.js — مدرسك v8
   منطق لوحة المدرس المُعاد تصميمها
══════════════════════════════════════════════════ */

/* ══ CONSTANTS ══ */
const GM_LEVELS = [
  {name:'مبتدئ',        icon:'🌱', min:0,     max:500,   color:'#6B7280', track:'#E5E7EB'},
  {name:'صاعد',         icon:'🚀', min:500,   max:2000,  color:'#2563EB', track:'#DBEAFE'},
  {name:'متقدم',        icon:'⭐', min:2000,  max:5000,  color:'#0EA672', track:'#A7F3D0'},
  {name:'خبير',         icon:'🏅', min:5000,  max:10000, color:'#F59E0B', track:'#FEF3C7'},
  {name:'أسطورة مدرسك', icon:'👑', min:10000, max:99999, color:'#7C3AED', track:'#EDE9FE'},
];

const ACH_DEFS = [
  {id:'first_ad',  icon:'🚀', title:'الانطلاقة',   desc:'نشرت أول إعلان',             pts:10,  color:'#20C997'},
  {id:'first_wa',  icon:'💬', title:'أول تواصل',   desc:'أول ضغطة واتساب',            pts:20,  color:'#2563EB'},
  {id:'100_views', icon:'👁', title:'مئة عين',     desc:'100 مشاهدة إجمالية',         pts:30,  color:'#0EA672'},
  {id:'500_views', icon:'🏆', title:'نصف الألف',   desc:'500 مشاهدة',                 pts:75,  color:'#EF4444'},
  {id:'img_ad',    icon:'📸', title:'إعلان بصورة', desc:'أضفت صورة لإعلانك',          pts:15,  color:'#0EA5E9'},
  {id:'desc_ad',   icon:'✍', title:'وصف متكامل',  desc:'وصف أكثر من 100 حرف',        pts:10,  color:'#8B5CF6'},
  {id:'10_wa',     icon:'🎯', title:'10 تواصل',    desc:'10 ضغطات واتساب',            pts:40,  color:'#20C997'},
  {id:'lv_2',      icon:'🚀', title:'مستوى صاعد',  desc:'الوصول إلى 500 XP',          pts:50,  color:'#2563EB'},
  {id:'lv_3',      icon:'⭐', title:'مستوى متقدم', desc:'الوصول إلى 2000 XP',         pts:100, color:'#0EA672'},
  {id:'lv_4',      icon:'🏅', title:'مستوى خبير',  desc:'الوصول إلى 5000 XP',         pts:200, color:'#F59E0B'},
];

const CH_DEFS = [
  {id:'daily_views',   icon:'👁', title:'20 مشاهدة اليوم',     metric:'ad_card_view',   target:20, reward:10, period:'daily'},
  {id:'weekly_wa',     icon:'💬', title:'3 تواصل هذا الأسبوع', metric:'whatsapp_click', target:3,  reward:25, period:'weekly'},
  {id:'daily_details', icon:'🔍', title:'5 فتح تفاصيل اليوم',  metric:'ad_detail_view', target:5,  reward:8,  period:'daily'},
  {id:'streak_7',      icon:'🔥', title:'7 أيام نشاط متواصل',  metric:'streak',         target:7,  reward:50, period:'streak'},
];

const PERIOD_LBL = {daily:'يومي', weekly:'أسبوعي', streak:'متواصل'};
const PERIOD_CLR = {daily:'#2563EB', weekly:'#0EA672', streak:'#F59E0B'};
const CHART_FONT = "'Tajawal','Cairo',sans-serif";

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
  // Load home stats async
  setTimeout(loadHomeStats, 600);
  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-wrap')) closeNotifDropdown();
    if (!e.target.closest('.more-menu-wrap')) closeMoreMenu();
  });
});

/* ══════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════ */
async function loadNotifDropdown() {
  try {
    const { data } = await supabase.from('notifications').select('*')
      .or('target.eq.teachers,target.eq.all')
      .order('created_at', {ascending: false}).limit(20);
    notifData = data || [];
    const unread = notifData.length;
    const badge = document.getElementById('notif-count');
    if (unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.classList.add('show'); }
    renderNotifList();
  } catch(_) {}
}

function renderNotifList() {
  const list = document.getElementById('notif-dd-list');
  if (!notifData.length) { list.innerHTML = '<div class="notif-empty">لا توجد إشعارات</div>'; return; }
  list.innerHTML = notifData.map(n => {
    const date = new Date(n.created_at).toLocaleDateString('ar-EG', {month:'short', day:'numeric'});
    return `<div class="notif-item">
      ${n.title ? `<div class="notif-item-title">${escapeHtml(n.title)}</div>` : ''}
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

function markAllRead() {
  document.getElementById('notif-count').classList.remove('show');
  closeNotifDropdown();
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
  setEl('lv-icon', cur.icon);
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
  setEl('lv-prog-pct', pct + '% للمستوى التالي');
}

function updateCircularGoal(todayPts) {
  const max = 100, pct = Math.min(todayPts / max, 1), circ = 150.8;
  const arc = document.getElementById('circ-arc');
  if (arc) {
    arc.setAttribute('stroke-dashoffset', (circ * (1 - pct)).toFixed(1));
    arc.setAttribute('stroke', todayPts >= max ? '#F59E0B' : '#20C997');
  }
  const el = document.getElementById('circ-today'); if (el) el.textContent = Math.min(todayPts, max);
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
  const fields = [
    {key:'avatar_url', label:'الصورة', icon:'📷'}, {key:'name', label:'الاسم', icon:'👤'},
    {key:'bio', label:'النبذة', icon:'✍️'}, {key:'whatsapp', label:'واتساب', icon:'💬'},
    {key:'phone', label:'الهاتف', icon:'📞'}, {key:'contact_methods', label:'تواصل', icon:'🔗'},
  ];
  const filled = fields.filter(f => !!(teacher[f.key]));
  const pct = Math.round((filled.length / fields.length) * 100);
  const missing = fields.filter(f => !(teacher[f.key]));
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
    msgEl.innerHTML = `ناقص: ${missing.map(f => `<span style="background:#FEF3C7;color:#92400E;border-radius:50px;padding:2px 8px;margin-left:3px;font-size:.7rem;font-weight:600">${f.icon} ${f.label}</span>`).join('')}
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
    const { data, error } = await supabase.from('ads').select('*')
      .eq('teacher_id', teacher.id).order('created_at', {ascending: false});
    if (error) throw error;
    teacherAds = data || [];
  } catch (err) {
    showToast('تعذّر تحميل الإعلانات: ' + (err?.message || ''), 'danger');
    teacherAds = [];
  }
  renderAds(); updateAdsStats(); updateLimitDisplay();
  document.getElementById('ads-loading').style.display = 'none';
  document.getElementById('home-active-ads').textContent = teacherAds.filter(a => a.status === 'active').length;
  const gscAds = document.getElementById('gsc-ads'); if (gscAds) gscAds.textContent = teacherAds.filter(a => a.status === 'active').length;
}

function updateAdsStats() {
  document.getElementById('stat-active').textContent = teacherAds.filter(a => a.status === 'active').length;
  document.getElementById('stat-pending').textContent = teacherAds.filter(a => a.status === 'pending').length;
  document.getElementById('stat-rejected').textContent = teacherAds.filter(a => a.status === 'rejected').length;
}

function updateLimitDisplay() {
  const limit = getTeacherFeatures(teacher).ads_limit;
  const used = teacherAds.length;
  const addBtn = document.getElementById('add-ad-btn');
  if (!addBtn) return;
  if (!isSubscriptionActive(teacher)) { addBtn.disabled = true; addBtn.textContent = '🚫 منتهي'; }
  else if (used >= limit) { addBtn.disabled = true; addBtn.textContent = `🚫 الحد (${limit})`; }
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
            ${teacher.is_early_adopter ? '<span style="background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;border-radius:50px;padding:2px 7px;font-size:.57rem;font-weight:700;margin-right:4px">🥇 أوائل</span>' : ''}
          </div>
          <div class="ad-card-meta">
            <span class="tc-badge badge-grade">📗 ${gradeDisplay(ad)}</span>
            <span class="tc-badge ${lessonTypeBadgeClass(ad.lesson_type)}">${lessonTypeLabel(ad.lesson_type)}</span>
            <span class="tc-badge ${statusBadgeClass(ad.status)}">${statusLabel(ad.status)}</span>
          </div>
        </div>
        <div class="ad-card-actions">
          <a href="teacher.html?ad=${ad.id}${ad.status !== 'active' ? '&preview=1' : ''}" target="_blank" class="btn btn-ghost btn-sm" title="معاينة">👁</a>
          ${(!getTeacherFeatures(teacher).unlimited_edits && Number(ad.edit_count || 0) >= 3)
            ? '<button class="btn btn-ghost btn-sm" disabled title="وصلت للحد">🔒</button>'
            : `<button class="btn btn-ghost btn-sm" onclick="openEditAdModal('${ad.id}')" title="تعديل">✏️</button>`}
          <button class="btn btn-danger btn-sm" onclick="deleteAd('${ad.id}')">🗑</button>
        </div>
      </div>
      <div class="ad-card-body">
        <div class="ad-price">💰 ${formatPrice(ad.price)} / الحصة</div>
        ${ad.main_image_url ? `<div class="media-preview"><img src="${escapeHtml(ad.main_image_url)}" style="object-position:${escapeHtml(ad.main_image_position || '50% 50%')}"></div>` : ''}
        ${!getTeacherFeatures(teacher).unlimited_edits ? `<div style="font-size:.76rem;color:var(--text-muted);margin-top:5px">✏️ تعديلات: ${Number(ad.edit_count || 0)} / 3</div>` : ''}
        ${ad.description ? `<div style="font-size:.81rem;color:var(--text-secondary);margin-top:5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escapeHtml(ad.description)}</div>` : ''}
        ${ad.status === 'pending' ? '<div class="alert alert-info mt-8" style="padding:6px 10px;font-size:.76rem">⏳ قيد مراجعة الإدارة</div>' : ''}
        ${ad.status === 'rejected' ? '<div class="alert alert-danger mt-8" style="padding:6px 10px;font-size:.76rem">❌ مرفوض من الإدارة</div>' : ''}
      </div>
    </div>`).join('');
}

/* ══════════════════════════════════════
   AD CRUD
══════════════════════════════════════ */
function openAddAdModal() {
  if (!isSubscriptionActive(teacher)) { showToast('اشتراكك منتهي. جدّد أولاً', 'danger'); return; }
  if (teacherAds.length >= getTeacherFeatures(teacher).ads_limit) { showToast('وصلت للحد الأقصى من الإعلانات', 'warning'); return; }
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
}

async function openEditAdModal(adId) {
  if (!isSubscriptionActive(teacher)) { showToast('اشتراكك منتهي', 'danger'); return; }
  const ad = teacherAds.find(a => a.id === adId);
  if (!ad) return;
  const f = getTeacherFeatures(teacher);
  if (!f.unlimited_edits && Number(ad?.edit_count || 0) >= 3) {
    showToast('وصلت للحد الأقصى: 3 تعديلات. راسل الإدارة للترقية.', 'warning', 6500); return;
  }
  document.getElementById('modal-title').textContent = '✏️ تعديل الإعلان';
  document.getElementById('ad-submit-btn').textContent = 'حفظ التعديلات';
  document.getElementById('ad-id').value = adId;
  document.getElementById('ad-title').value = ad.title || '';
  populateSubjectSelect('ad-subject', ad.subject || '');
  renderGradeCheckboxes('ad-grades-box', getAdGrades(ad));
  document.getElementById('ad-subject').value = ad.subject || '';
  document.getElementById('ad-price').value = ad.price || '';
  document.getElementById('ad-lesson-type').value = ad.lesson_type || '';
  document.getElementById('ad-description').value = ad.description || '';
  document.getElementById('ad-extra-contact').value = ad.extra_contact || '';
  document.getElementById('ad-main-image-position').value = ad.main_image_position || '50% 50%';
  document.getElementById('ad-main-image').value = '';
  document.getElementById('ad-gallery-images').value = '';
  document.getElementById('ad-current-main-image').innerHTML = ad.main_image_url ? `<img src="${escapeHtml(ad.main_image_url)}">` : '';
  initMainImagePositionEditor(ad.main_image_url || '', ad.main_image_position || '50% 50%');
  document.getElementById('ad-current-gallery').innerHTML = normalizeList(ad.gallery_images).map(u => `<img src="${escapeHtml(u)}">`).join('');
  document.getElementById('modal-error').style.display = 'none';
  openModal('ad-modal');
}

function quickEditFirstAd() {
  const ad = teacherAds.find(a => a.status === 'active') || teacherAds[0];
  if (!ad) { showToast('لا توجد إعلانات للتعديل', 'warning'); return; }
  switchTab('ads'); openEditAdModal(ad.id);
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
      const { count: lc } = await supabase.from('ads').select('*', {count:'exact', head:true}).eq('teacher_id', teacher.id);
      if ((lc || 0) >= getTeacherFeatures(teacher).ads_limit) throw new Error('وصلت للحد الأقصى');
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
      description: document.getElementById('ad-description').value.trim(),
      extra_contact: document.getElementById('ad-extra-contact').value.trim(),
      main_image_url: uploadedMain || currentAd?.main_image_url || null,
      main_image_position: document.getElementById('ad-main-image-position').value || '50% 50%',
      gallery_images: [...oldGallery, ...uploadedGallery], video_links: [],
      status: isEdit ? undefined : 'pending',
      edit_count: isEdit ? Number(currentAd?.edit_count || 0) + (getTeacherFeatures(teacher).unlimited_edits ? 0 : 1) : 0,
    };
    if (isEdit) { delete payload.status; delete payload.teacher_id; }
    let error;
    if (isEdit) {
      const r = await supabase.from('ads').update({...payload, updated_at: new Date().toISOString()}).eq('id', adId).eq('teacher_id', teacher.id);
      error = r.error;
    } else {
      const r = await supabase.from('ads').insert(payload); error = r.error;
    }
    if (error) throw error;
    if (!isEdit) {
      let bonus = 5;
      if ((payload.description || '').trim().length >= 100) bonus += 5;
      if (payload.main_image_url) bonus += 3;
      bonus += (payload.gallery_images?.length || 0);
      try { await incrementTeacherPoints(teacher.id, bonus); } catch(_) {}
    }
    closeModal('ad-modal');
    showToast(isEdit ? 'تم تعديل الإعلان ✅' : 'تم الإضافة وهو قيد المراجعة ⏳', 'success');
    await loadAds();
  } catch (err) {
    const msg = String(err?.message || '');
    let friendly = msg;
    if (/row[- ]level security|violates.*security policy/i.test(msg)) friendly = 'تعذر الحفظ بسبب قيود الأمان. شغّل ملف fix_rls.sql.';
    const errEl = document.getElementById('modal-error');
    if (errEl) { errEl.textContent = friendly; errEl.style.display = 'block'; }
  } finally {
    btn.disabled = false; btn.textContent = isEdit ? 'حفظ التعديلات' : 'نشر الإعلان';
  }
}

async function deleteAd(adId) {
  confirmDialog('هل أنت متأكد من حذف هذا الإعلان؟', async () => {
    const { error } = await supabase.from('ads').delete().eq('id', adId).eq('teacher_id', teacher.id);
    if (error) { showToast('حدث خطأ عند الحذف', 'danger'); return; }
    showToast('تم حذف الإعلان', 'success'); await loadAds();
  });
}

/* ══════════════════════════════════════
   PROFILE
══════════════════════════════════════ */
async function saveProfile(e) {
  e.preventDefault();
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
    const { error } = await supabase.from('teachers').update(updates).eq('id', teacher.id);
    if (error) throw error;
    Object.assign(teacher, updates);
    renderAvatarPreview(updates.avatar_url || '');
    Auth.setTeacherSession({...teacher, name: updates.name});
    document.getElementById('teacher-name-display').textContent = updates.name;
    document.getElementById('nav-teacher-name').textContent = updates.name;
    renderProfileCompletion();
    showToast('تم حفظ التغييرات ✅', 'success');
  } catch (err) { showToast(err.message || 'حدث خطأ', 'danger'); }
  finally { btn.disabled = false; btn.textContent = '💾 حفظ التغييرات'; }
}

/* ══════════════════════════════════════
   FEATURES
══════════════════════════════════════ */
function renderFeatures() {
  const box = document.getElementById('features-content'); if (!box) return;
  const f = getTeacherFeatures(teacher);
  box.innerHTML = `
    ${subscriptionBannerHtml(teacher)}
    <div style="background:linear-gradient(135deg,#0D1B4B,#1E3A8A);color:white;border-radius:13px;padding:14px 18px;margin-bottom:14px;display:flex;gap:11px;align-items:flex-start">
      <span style="font-size:1.3rem;flex-shrink:0">ℹ️</span>
      <div>
        <div style="font-family:Cairo,sans-serif;font-weight:800;margin-bottom:5px">نظام النقاط المزدوج</div>
        <div style="font-size:.78rem;color:rgba(255,255,255,.8);line-height:1.7">⭐ <strong>نقاط الخبرة (XP):</strong> تتراكم ولا تنقص أبداً — تحدد مستواك<br>🎁 <strong>نقاط المكافآت:</strong> يمكن صرفها على جوائز دون التأثير على XP</div>
      </div>
    </div>
    <div class="plan-grid">
      ${Object.values(PLAN_DEFINITIONS).map(plan => `
        <div class="plan-card ${plan.key === f.plan.key ? 'current' : ''}">
          <div class="plan-head ${plan.color === 'green' ? 'plan-green' : plan.color === 'blue' ? 'plan-blue' : 'plan-purple'}">${plan.key === f.plan.key ? '✅ ' : ''}${escapeHtml(plan.name)}</div>
          <div class="plan-body">
            <div class="plan-price">${plan.price}<small style="font-size:.68rem;color:var(--text-muted);font-weight:700;font-family:Tajawal"> ج</small></div>
            <ul class="clean-list">${plan.features.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          </div>
        </div>`).join('')}
    </div>
    <div class="profile-card" style="margin:13px 0">
      <h3 style="margin-bottom:11px;font-family:Cairo,sans-serif;font-weight:700;font-size:.95rem">المميزات الحالية</h3>
      <div style="display:grid;gap:7px">
        <div style="padding:8px 11px;background:var(--bg-soft);border-radius:8px;font-size:.84rem">✅ إعلانات: ${f.ads_limit}</div>
        <div style="padding:8px 11px;background:var(--bg-soft);border-radius:8px;font-size:.84rem">${f.unlimited_edits ? '✅ تعديل غير محدود' : '✅ 3 تعديلات لكل إعلان'}</div>
        <div style="padding:8px 11px;background:var(--bg-soft);border-radius:8px;font-size:.84rem">${f.basic_stats ? '✅ إحصائيات بسيطة' : '🔒 إحصائيات بسيطة'}</div>
        <div style="padding:8px 11px;background:var(--bg-soft);border-radius:8px;font-size:.84rem">${f.advanced_stats ? '✅ إحصائيات متقدمة' : '🔒 إحصائيات متقدمة'}</div>
        ${f.custom_features ? `<div style="padding:8px 11px;background:var(--success-bg);border-radius:8px;font-size:.84rem">🎁 ${escapeHtml(f.custom_features)}</div>` : ''}
      </div>
      <div class="alert alert-info mt-16" style="font-size:.82rem">للترقية أو إضافة مميزات: <a href="#" data-admin-contact data-message="أريد ترقية باقتي في مدرسك" style="color:var(--primary);font-weight:700">تواصل مع الإدارة</a></div>
    </div>
    <div class="profile-card">
      <h3 style="margin-bottom:11px;font-family:Cairo,sans-serif;font-weight:700;font-size:.95rem">💰 الإضافات المتاحة</h3>
      <div class="addon-grid2">${ADDON_DEFINITIONS.map(a => `
        <div class="addon-card2"><div class="ai">${a.icon}</div><h4>${escapeHtml(a.name)}</h4><div class="ap">${a.price}<span style="font-size:.66rem;color:var(--text-muted);font-weight:700;font-family:Tajawal"> ج</span></div><p>${escapeHtml(a.desc)}</p></div>`).join('')}
      </div>
    </div>`;
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
    document.getElementById('home-conv').textContent = convRate + '%';
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
    document.getElementById('tw-streak').textContent = calcStreak(gamEvents);
  } catch (e) {
    const el = document.getElementById('home-chart-loading');
    if (el) el.textContent = 'تعذّر تحميل البيانات';
  }
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
    const cnt = t => gamEvents.filter(e => e.event_type === t).length;
    const totalViews = cnt('ad_card_view'), totalDetails = cnt('ad_detail_view');
    const totalWa = cnt('whatsapp_click'), totalFb = cnt('facebook_click'), totalPhone = cnt('phone_click');
    const totalContacts = totalWa + totalFb + totalPhone;
    const convRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : '0.0';
    document.getElementById('gsc-views').textContent = totalViews.toLocaleString('ar-EG');
    document.getElementById('gsc-details').textContent = totalDetails.toLocaleString('ar-EG');
    document.getElementById('gsc-wa').textContent = totalWa.toLocaleString('ar-EG');
    document.getElementById('gsc-conv-rate').textContent = convRate + '%';
    // Home KPIs sync
    document.getElementById('home-views').textContent = totalViews.toLocaleString('ar-EG');
    document.getElementById('home-contacts').textContent = totalContacts.toLocaleString('ar-EG');
    document.getElementById('home-conv').textContent = convRate + '%';
    const today = new Date().toISOString().slice(0, 10);
    const todayEv = gamEvents.filter(e => (e.created_at||'').slice(0,10) === today);
    const todayPts = Math.min(
      todayEv.filter(e=>e.event_type==='ad_card_view').length
      +todayEv.filter(e=>e.event_type==='ad_detail_view').length*2
      +todayEv.filter(e=>e.event_type==='whatsapp_click').length*4
      +todayEv.filter(e=>e.event_type==='facebook_click').length*3
      +todayEv.filter(e=>e.event_type==='phone_click').length*5, 100);
    updateCircularGoal(todayPts);
    document.getElementById('tw-streak').textContent = calcStreak(gamEvents);
    const xp = teacher.xp || teacher.points || 0;
    const rp = teacher.reward_points != null ? teacher.reward_points : xp;
    updateHeroGamification(xp, rp);
    const cur = GM_LEVELS.find(l=>xp>=l.min&&xp<l.max)||GM_LEVELS[GM_LEVELS.length-1];
    const next = GM_LEVELS.find(l=>l.min>xp);
    document.getElementById('gam-insight-title').textContent = cur.icon + ' مستواك: ' + cur.name + ' — ' + xp.toLocaleString('ar-EG') + ' XP';
    document.getElementById('gam-insight-sub').textContent = next
      ? 'تحتاج ' + (next.min-xp).toLocaleString('ar-EG') + ' XP للوصول لـ "' + next.name + ' ' + next.icon + '"'
      : '🎉 وصلت لأعلى مستوى! 👑';
    if (!f.basic_stats && !f.advanced_stats) {
      gamLock.style.display = '';
      gamLock.innerHTML = '<div class="alert alert-info" style="margin-bottom:13px">🔒 الإحصائيات التفصيلية متاحة في باقة 3 شهور فأعلى — <a href="#" data-admin-contact data-message="أريد ترقية باقتي" class="btn btn-primary btn-sm" style="margin-right:8px">تواصل مع الإدارة</a></div>';
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
    gamLock.innerHTML = '<div class="alert alert-danger">❌ تعذّر تحميل الإحصائيات: ' + escapeHtml(err.message) + '</div>';
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
      <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:9px;padding:11px;text-align:center"><div>💬</div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.2rem;color:#059669">${wa}</div><div style="font-size:.66rem;color:#065F46">واتساب</div></div>
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:9px;padding:11px;text-align:center"><div>👥</div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.2rem;color:#2563EB">${fb}</div><div style="font-size:.66rem;color:#1D4ED8">فيسبوك</div></div>
      <div style="background:#F5F3FF;border:1px solid #C4B5FD;border-radius:9px;padding:11px;text-align:center"><div>📊</div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.2rem;color:#7C3AED">${total}</div><div style="font-size:.66rem;color:#6D28D9">إجمالي</div></div>
      <div style="background:${Number(rate)>=5?'#FFF7ED':'#F8FAFC'};border:1px solid ${Number(rate)>=5?'#FED7AA':'#E2E8F0'};border-radius:9px;padding:11px;text-align:center"><div>📈</div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.2rem;color:${Number(rate)>=5?'#EA580C':'#94A3B8'}">${rate}%</div><div style="font-size:.66rem;color:${Number(rate)>=5?'#9A3412':'#64748B'}">معدل التحويل</div></div>
    </div>
    <div style="background:#F8FAFC;border-radius:8px;padding:8px 11px;font-size:.73rem;color:#64748B">
      💡 ${Number(rate)>=5?'✅ أداء جيد — إعلاناتك تحول الزوار لتواصل':'📌 أضف صورة ووصفاً تفصيلياً لتحسين معدل التحويل'}
    </div>`;
}

/* ══ Per-Ad Stats ══ */
function buildPerAdStats(events, isAdvanced) {
  const box = document.getElementById('perad-content'); if (!box) return;
  if (!teacherAds.length) { box.innerHTML='<div class="empty-state" style="padding:28px"><div class="empty-icon">📋</div><div class="empty-title">لا توجد إعلانات</div></div>'; return; }
  const cnt = (t, adId) => events.filter(e => e.event_type===t && String(e.ad_id)===String(adId)).length;
  box.innerHTML = teacherAds.map(ad => {
    const views=cnt('ad_card_view',ad.id), details=cnt('ad_detail_view',ad.id), wa=cnt('whatsapp_click',ad.id);
    const rate = views > 0 ? Math.round((wa/views)*100) : 0;
    return `<div class="perad-card">
      <div style="font-family:Cairo,sans-serif;font-weight:700;font-size:.88rem;margin-bottom:7px;display:flex;align-items:center;gap:7px">
        ${escapeHtml(ad.title||ad.subject)}<span class="tc-badge ${statusBadgeClass(ad.status)}">${statusLabel(ad.status)}</span>
      </div>
      <div class="perad-row"><span>المشاهدات</span><strong>${views}</strong></div>
      <div class="perad-row"><span>فتح التفاصيل</span><strong>${details}</strong></div>
      <div class="perad-row"><span>تواصل واتساب</span><strong>${wa}</strong></div>
      ${isAdvanced ? `<div class="perad-row"><span>معدل التحويل</span><strong>${rate}%</strong></div>` : ''}
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
  const earnedPts = ACH_DEFS.filter(a => checkMap[a.id]).reduce((s,a) => s+a.pts, 0);
  document.getElementById('ach-summary').innerHTML = `
    <div style="background:linear-gradient(135deg,#0D1B4B,#2563EB);border-radius:10px;padding:10px 14px;color:white;display:flex;align-items:center;gap:9px"><span>🏆</span><div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.15rem">${unlocked}/${ACH_DEFS.length}</div><div style="opacity:.7;font-size:.66rem">إنجاز مكتمل</div></div></div>
    <div style="background:linear-gradient(135deg,#0EA672,#20C997);border-radius:10px;padding:10px 14px;color:white;display:flex;align-items:center;gap:9px"><span>⭐</span><div><div style="font-family:Cairo,sans-serif;font-weight:900;font-size:1.15rem">${earnedPts}</div><div style="opacity:.7;font-size:.66rem">نقطة مكتسبة</div></div></div>`;
  document.getElementById('ach-grid').innerHTML = ACH_DEFS.map(a => {
    const done = !!checkMap[a.id], pg = progMap[a.id];
    const progHtml = !done && pg ? `<div class="ach-prog-bar"><div class="ach-prog-fill" style="background:${a.color};width:${Math.min((pg.v/pg.t)*100,100)}%"></div></div><div style="font-size:.62rem;color:#94A3B8">${pg.v}/${pg.t}</div>` : '';
    return `<div class="ach-card ${done?'':'locked'}" style="border-color:${done?a.color+'40':'#E2E8F0'};box-shadow:${done?`0 4px 13px ${a.color}18`:'none'}">
      ${done ? '<div class="ach-check">✓</div>' : ''}
      <div class="ach-ico" style="background:${done?a.color+'18':'#F1F5F9'};filter:${done?'none':'grayscale(1)'}">
        ${done ? a.icon : '🔒'}
      </div>
      <div class="ach-title" style="color:${done?'#0F172A':'#94A3B8'}">${a.title}</div>
      <div class="ach-desc">${a.desc}</div>
      ${progHtml}
      <div class="ach-pts" style="background:${done?a.color+'14':'#F1F5F9'}">
        <span style="font-size:.57rem">⭐</span><span style="font-size:.66rem;font-weight:700;color:${done?a.color:'#94A3B8'}">+${a.pts}</span>
      </div>
    </div>`;
  }).join('');
}

/* ══ Challenges ══ */
function buildChallenges(events) {
  const today = new Date().toISOString().slice(0,10);
  const weekAgo = new Date(Date.now()-7*86400000).toISOString();
  document.getElementById('ch-grid').innerHTML = CH_DEFS.map(ch => {
    let prog = 0;
    if (ch.metric==='streak') prog = calcStreak(events);
    else if (ch.period==='daily') prog = events.filter(e=>e.event_type===ch.metric&&(e.created_at||'').startsWith(today)).length;
    else if (ch.period==='weekly') prog = events.filter(e=>e.event_type===ch.metric&&e.created_at>=weekAgo).length;
    const pct=Math.min((prog/ch.target)*100,100), done=pct>=100, cc=PERIOD_CLR[ch.period]||'#2563EB';
    return `<div class="ch-card ${done?'done':''}">
      ${done ? '<div class="ch-done-lbl">✅ مكتمل!</div>' : ''}
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
        <div class="ch-ico" style="background:${cc}18">${ch.icon}</div>
        <span class="ch-type-tag" style="background:${cc}14;color:${cc}">${PERIOD_LBL[ch.period]}</span>
      </div>
      <div class="ch-title">${ch.title}</div>
      <div class="ch-reward"><span>🎁</span><span style="font-size:.69rem;font-weight:700;color:#B45309">+${ch.reward} نقطة</span></div>
      <div class="ch-bar-t"><div class="ch-bar-f" style="background:${done?'#20C997':`linear-gradient(90deg,${cc},${cc}cc)`};width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-top:4px">
        <span style="color:#64748B">${prog}/${ch.target}</span>
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
      <div class="lpath-ico" style="background:${(done||isCur)?lv.color+'20':'#F8FAFC'};border-color:${isCur?lv.color:done?lv.color+'70':'#E2E8F0'}">${lv.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-weight:${isCur?700:500};color:${isCur?lv.color:done?'#334155':'#94A3B8'};font-size:.78rem">${lv.name}</span>
          <span style="font-size:.58rem;color:#94A3B8">${lv.min.toLocaleString('ar-EG')}–${lv.max>=99999?'∞':lv.max.toLocaleString('ar-EG')}</span>
        </div>
        <div class="lpath-bar" style="background:${lv.track}">
          <div class="lpath-bar-fill" style="background:${lv.color};width:${pct}%"></div>
        </div>
      </div>
      ${done ? '<span style="font-size:.82rem">✅</span>' : ''}
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
      document.getElementById('tw-rank').textContent = '#' + myRank;
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
          <div style="font-size:.64rem;font-weight:600;color:${lv.color}">${lv.icon} ${lv.name}</div>
        </div>
        <div style="text-align:center;flex-shrink:0">
          <div style="font-family:'Cairo',sans-serif;font-weight:900;font-size:.92rem;color:${isMe?'#2563EB':'#0F172A'}">${((t.xp||t.points)||0).toLocaleString('ar-EG')}</div>
          <div style="font-size:.58rem;color:#94A3B8">XP</div>
        </div>
      </div>`;
    }).join('') + `<div style="margin-top:11px;background:linear-gradient(90deg,#EFF6FF,#E6FDF5);border:1px solid #BFDBFE;border-radius:9px;padding:9px 13px;text-align:center;font-size:.8rem;color:#0D1B4B;font-weight:600">
      🌟 ${myRank ? `ترتيبك #${myRank} من ${list.length} مدرس` : 'سجّل تفاعلات لتظهر في لوحة الشرف!'}
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
          ${ev.image_url ? `<img src="${escapeHtml(ev.image_url)}" style="width:100%;max-height:170px;object-fit:cover">` : ''}
          <div style="padding:13px">
            <div style="font-family:Cairo,sans-serif;font-weight:800;margin-bottom:4px">${escapeHtml(ev.title)}</div>
            <div style="color:var(--text-secondary);font-size:.86rem">${escapeHtml(ev.description||'')}</div>
            ${ev.reward ? `<div class="alert alert-success mt-8" style="padding:6px 10px">🎁 ${escapeHtml(ev.reward)}</div>` : ''}
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
          <div style="font-family:Cairo,sans-serif;font-weight:900;color:${achieved?'var(--success)':'var(--text-muted)'}">${tier.points_required}</div>
          <div style="font-size:.64rem;color:var(--text-muted)">نقطة</div>
          ${achieved ? '<div style="color:var(--success);font-size:.7rem;font-weight:700">✅ أهّلت</div>' : ''}
        </div>
      </div>`;
    }).join('') + '</div>';
  } catch(_) { rwBox.innerHTML = '<div class="empty-text" style="padding:18px">تعذّر تحميل المكافآت</div>'; }
}

/* ══════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════ */
function switchTab(tab, clickedBtn) {
  statsLoaded = statsLoaded && tab !== 'stats' ? statsLoaded : (tab === 'stats' ? false : statsLoaded);
  const allTabs = ['home','ads','stats','leaderboard','profile','features','events'];
  allTabs.forEach(name => {
    const pane = document.getElementById('tab-' + name);
    if (pane) pane.classList.toggle('active', name === tab);
  });
  document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
  const mainTabMap = {home:'tab-btn-home', ads:'tab-btn-ads', stats:'tab-btn-stats', leaderboard:'tab-btn-leaderboard'};
  if (mainTabMap[tab]) document.getElementById(mainTabMap[tab])?.classList.add('active');
  if (clickedBtn) clickedBtn.classList.add('active');
  if (tab === 'stats') { statsLoaded = false; loadTeacherStats(); }
  else if (tab === 'leaderboard') loadLeaderboard();
  else if (tab === 'events') loadTeacherEvents();
  else if (tab === 'features') renderFeatures();
  closeMoreMenu();
}

function switchGTab(id, btn) {
  document.querySelectorAll('.gpane').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.gtab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function toggleCollapsible(hdEl) {
  hdEl.classList.toggle('open');
  const body = hdEl.nextElementSibling;
  if (body) body.classList.toggle('open');
}

/* ══ PROFILE HELPERS ══ */
function renderAvatarPreview(url = '') {
  const box = document.getElementById('p-avatar-preview'); if (!box) return;
  box.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="صورة">` : '<span>لا توجد صورة</span>';
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
function closeAdModal() { closeModal('ad-modal'); }
function logout() { Auth.clearTeacher(); window.location.href = 'index.html'; }

document.addEventListener('DOMContentLoaded', () => {
  const adModal = document.getElementById('ad-modal');
  if (adModal) adModal.addEventListener('click', e => { if (e.target === e.currentTarget) closeAdModal(); });
});

function openTeacherProfile() {
  const activeAd = teacherAds.find(a => a.status === 'active');
  const anyAd = teacherAds[0];
  if (activeAd) window.open('teacher.html?ad=' + activeAd.id, '_blank');
  else if (anyAd) window.open('teacher.html?ad=' + anyAd.id + '&preview=1', '_blank');
  else window.open('teacher.html?id=' + teacher.id, '_blank');
}
