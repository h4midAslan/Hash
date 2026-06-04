/* PublicCV.jsx — Hash Campus public CV page
   Pure inline styles + a single injected <style> block for print, animations, hover. */

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/* ----------------------------------------------------------------------------
   STYLE BLOCK — print media, scroll animations, hover states only
---------------------------------------------------------------------------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: #f1f5f9; font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }

.cv-shell { max-width: 820px; margin: 84px auto 0; padding: 0 16px 56px; }
.cv-paper {
  background: #fff; border-radius: 16px; overflow: hidden;
  box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 12px 40px -12px rgba(15,23,42,.18);
}

/* TOP BAR */
.cv-topbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(255,255,255,.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
}
.cv-topbar-inner {
  max-width: 852px; margin: 0 auto; height: 56px; padding: 0 18px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; position: relative;
}
.cv-brand { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
.cv-topbar-name {
  position: absolute; left: 50%; transform: translateX(-50%);
  font-size: 14.5px; font-weight: 700; color: #0f172a;
  opacity: 0; transition: opacity .3s ease; pointer-events: none;
  white-space: nowrap; max-width: 40%; overflow: hidden; text-overflow: ellipsis;
}
.cv-topbar-name.show { opacity: 1; }
.btn {
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
  font-family: inherit; font-size: 13px; font-weight: 600; white-space: nowrap;
  padding: 7px 13px; border-radius: 8px; border: 1px solid transparent;
  transition: background .18s ease, box-shadow .18s ease, transform .12s ease;
}
.btn:active { transform: translateY(1px); }
.btn-ghost { background: transparent; color: #334155; border-color: #e2e8f0; }
.btn-ghost:hover { background: #f1f5f9; }
.btn-navy { background: #1a4a8a; color: #fff; }
.btn-navy:hover { background: #163d72; box-shadow: 0 4px 14px rgba(26,74,138,.34); }

/* HEADER */
.cv-header {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #0c2340 0%, #1a4a8a 55%, #1d5fa8 100%);
  padding: 40px 44px;
}
.cv-header-glow {
  position: absolute; top: -120px; right: -80px; width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(30,144,255,.32), transparent 68%);
  pointer-events: none;
}
.cv-header-top { position: relative; display: flex; align-items: center; gap: 22px; }
.cv-avatar {
  width: 96px; height: 96px; border-radius: 50%; flex-shrink: 0;
  border: 3px solid rgba(255,255,255,.35); box-shadow: 0 4px 20px rgba(0,0,0,.35);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.cv-avatar img { width: 100%; height: 100%; object-fit: cover; }
.cv-avatar span { color: #fff; font-size: 40px; font-weight: 800; }
.cv-name { margin: 0; color: #fff; font-size: 30px; font-weight: 800; letter-spacing: -.02em; line-height: 1.1; }
.cv-headline { margin: 6px 0 0; color: rgba(255,255,255,.88); font-size: 15.5px; font-weight: 500; }
.cv-faculty { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-top: 9px; color: rgba(255,255,255,.65); font-size: 13px; }
.gpa-pill { background: rgba(255,255,255,.12); color: rgba(255,255,255,.9); font-size: 11.5px; font-weight: 600; padding: 2px 9px; border-radius: 20px; }
.cv-header-links { position: relative; display: flex; flex-wrap: wrap; gap: 20px; margin-top: 22px; }
.hlink { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,.82); font-size: 12.5px; text-decoration: none; transition: color .15s ease; }
.hlink:hover { color: #fff; }
.open-badge {
  position: absolute; top: 18px; right: 18px; z-index: 2;
  display: inline-flex; align-items: center; gap: 7px;
  background: rgba(34,197,94,.18); border: 1px solid rgba(34,197,94,.45);
  color: #86efac; font-size: 11.5px; font-weight: 700; padding: 5px 11px; border-radius: 20px;
}
.pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 0 rgba(34,197,94,.6); animation: pulse 2s infinite; }
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,.55); }
  70% { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}

/* BODY */
.cv-body { display: grid; grid-template-columns: 32% 68%; }
.cv-left { background: #f8fafc; border-right: 1px solid #e2e8f0; padding: 28px 20px; }
.cv-right { padding: 28px 32px; background: #fff; }
.block { margin-bottom: 28px; }
.block:last-child { margin-bottom: 0; }

/* skills */
.skill-wrap { display: flex; flex-wrap: wrap; gap: 5px; }
.skill-tag {
  background: #fff; color: #374151; border: 1px solid #d1d5db; border-radius: 5px;
  padding: 3px 9px; font-size: 11px; font-weight: 500; cursor: default;
  transition: border-color .12s, color .12s;
}
.skill-tag:hover { border-color: #6b7280; color: #111827; }
.more-btn { margin-top: 9px; background: none; border: none; color: #6b7280; font-family: inherit; font-size: 11.5px; font-weight: 600; cursor: pointer; padding: 0; display: block; }
.more-btn:hover { color: #1a4a8a; text-decoration: underline; }

/* contact */
.contact-row { display: flex; align-items: center; gap: 9px; color: #374151; font-size: 12.5px; text-decoration: none; transition: color .15s ease; }
.contact-row:hover { color: #1a4a8a; }
.contact-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* bio */
.bio { margin: 0; font-size: 13px; line-height: 1.75; color: #334155; }

/* timeline */
.timeline { position: relative; padding-left: 4px; }
.timeline::before { content: ''; position: absolute; left: 3px; top: 8px; bottom: 8px; width: 2px; background: #e2e8f0; }
.tl-entry { position: relative; padding-left: 0; margin-bottom: 20px; }
.tl-entry:last-child { margin-bottom: 0; }
.tl-dot { position: absolute; left: -1px; top: 12px; width: 8px; height: 8px; border-radius: 50%; background: #1a4a8a; z-index: 1; }
.tl-head { display: flex; gap: 12px; padding-left: 18px; }
.tl-comp-badge { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.now-pill { display: inline-block; margin-left: 8px; vertical-align: middle; background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px; }

/* projects */
.proj-list { display: flex; flex-direction: column; gap: 12px; }
.proj-card {
  display: block; background: #fff; border: 1px solid #e8ecf1; border-radius: 10px;
  padding: 13px 16px; box-shadow: 0 1px 2px rgba(0,0,0,.04); text-decoration: none;
  transition: border-color .16s ease, box-shadow .16s ease;
}
.proj-card:hover { border-color: #c7d2e0; box-shadow: 0 4px 14px rgba(0,0,0,.08); }
.proj-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 3px; }
.proj-title { font-size: 13.5px; font-weight: 700; color: #0f172a; }
.proj-date { font-size: 11px; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }
.proj-desc { font-size: 12.5px; color: #64748b; line-height: 1.55; margin: 4px 0 6px; }
.proj-stack { font-size: 11px; color: #64748b; font-family: 'JetBrains Mono', 'Fira Code', monospace; letter-spacing: 0.01em; }

/* certificates */
.cert-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-left: 3px solid #1E90FF; border-radius: 2px; padding: 2px 0 2px 12px; }
.verify-link { color: #1E90FF; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.verify-link:hover { text-decoration: underline; }

/* footer */
.cv-footer { border-top: 1px solid #e2e8f0; background: #f8fafc; margin-top: 40px; }
.cv-footer-inner { max-width: 820px; margin: 0 auto; padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

/* scroll reveal */
.reveal { opacity: 0; transform: translateY(14px); transition: opacity .35s ease-out, transform .35s ease-out; }
.reveal.in { opacity: 1; transform: translateY(0); }

/* section title */
.sec-title {
  display: flex; align-items: center; gap: 7px;
  margin-bottom: 12px; padding-bottom: 7px;
  border-bottom: 1px solid #f1f5f9;
}
.sec-title span {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.14em; color: #1E90FF;
}

/* responsive */
@media (max-width: 640px) {
  .cv-shell { margin-top: 72px; padding: 0 0 40px; }
  .cv-paper { border-radius: 0; }
  .cv-header { padding: 30px 22px; }
  .cv-header-top { flex-direction: column; align-items: flex-start; gap: 16px; }
  .cv-name { font-size: 25px; }
  .cv-body { grid-template-columns: 1fr; }
  .cv-left { border-right: none; border-bottom: 1px solid #e2e8f0; }
  .cv-right { padding: 24px 22px; }
  .proj-list { gap: 8px; }
  .cv-topbar-name { display: none; }
  .btn span { display: none; }
  .btn { padding: 8px; }
}

/* PRINT */
@media print {
  @page { size: A4 portrait; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { background: #fff !important; margin: 0 !important; }
  .cv-topbar, .cv-footer { display: none !important; }
  .cv-shell { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
  .cv-paper { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
  .cv-left { background: #f8fafc !important; border-right: 1px solid #e2e8f0 !important; }
  .cv-header { background: linear-gradient(135deg,#0c2340 0%,#1a4a8a 55%,#1d5fa8 100%) !important; }
  .cv-header-glow { display: none !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
  .tl-entry, .proj-card, .cert-row, .block { page-break-inside: avoid; }
  a { text-decoration: none !important; }
}
`;

/* ----------------------------------------------------------------------------
   ICONS — inline SVG
---------------------------------------------------------------------------- */
const Icon = ({ d, size = 14, stroke = 'currentColor', fill = 'none', sw = 2, children, style }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block', ...style }}>{children || <path d={d} />}</svg>;

const IconGradCap = (p) => <Icon {...p}><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5" /></Icon>;
const IconBriefcase = (p) => <Icon {...p}><rect x="2.5" y="7" width="19" height="13" rx="2" /><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" /></Icon>;
const IconFolder = (p) => <Icon {...p}><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h7A1.5 1.5 0 0 1 19 9v8.5A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5z" /><circle cx="11" cy="13" r="1.6" /><path d="M11 11.4V9.5M11 14.6v1.9M12.4 13h2M7.6 13h1.8" /></Icon>;
const IconAward = (p) => <Icon {...p}><circle cx="12" cy="9" r="5" /><path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5" /></Icon>;
const IconMail = (p) => <Icon {...p}><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M3 6.5l9 6 9-6" /></Icon>;
const IconPhone = (p) => <Icon {...p}><path d="M5 3.5h3l1.5 4.5-2 1.5a12 12 0 0 0 5 5l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.7 2 2 0 0 1 5 3.5z" /></Icon>;
const IconGithub = (p) => <Icon {...p} fill="currentColor" stroke="none"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" /></Icon>;
const IconLinkedin = (p) => <Icon {...p} fill="currentColor" stroke="none"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.57h.05c.53-1 1.83-2.05 3.76-2.05 4.02 0 4.76 2.65 4.76 6.09V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-3.96z" /></Icon>;
const IconGlobe = (p) => <Icon {...p}><circle cx="12" cy="12" r="9.2" /><path d="M2.8 12h18.4M12 2.8c2.5 2.6 2.5 15.8 0 18.4M12 2.8c-2.5 2.6-2.5 15.8 0 18.4" /></Icon>;
const IconExternal = (p) => <Icon {...p}><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8.5A1.5 1.5 0 0 1 5.5 7H11" /></Icon>;
const IconShare = (p) => <Icon {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 6.5" /></Icon>;
const IconDownload = (p) => <Icon {...p}><path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" /></Icon>;

/* ----------------------------------------------------------------------------
   TRANSLATIONS
---------------------------------------------------------------------------- */
const TRANSLATIONS = {
  az: {
    skills: 'Bacarıqlar', education: 'Təhsil', languages: 'Dillər',
    contact: 'Əlaqə', about: 'Haqqında', experience: 'İş təcrübəsi',
    projects: 'Layihələr', certificates: 'Sertifikatlar',
    openToTeam: 'Komandaya açıqdır', share: 'Paylaş', copied: 'Kopyalandı',
    downloadPdf: 'PDF Yüklə', preparing: 'Hazırlanır...',
    verify: 'Yoxla →', present: 'İndi', joinUs: 'Sən də qoşul →',
    madeOn: 'Bu profil Hash Campus-da yaradılıb',
    showMore: (n) => `+ ${n} daha`, showLess: '− Daha az',
    courseLabel: (n) => `${n}-ci kurs`,
    months: ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'],
  },
  en: {
    skills: 'Skills', education: 'Education', languages: 'Languages',
    contact: 'Contact', about: 'About', experience: 'Work Experience',
    projects: 'Projects', certificates: 'Certificates',
    openToTeam: 'Open to team', share: 'Share', copied: 'Copied',
    downloadPdf: 'Download PDF', preparing: 'Preparing...',
    verify: 'Verify →', present: 'Present', joinUs: 'Join us →',
    madeOn: 'This profile was created on Hash Campus',
    showMore: (n) => `+ ${n} more`, showLess: '− Show less',
    courseLabel: (n) => `Year ${n}`,
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
};

/* ----------------------------------------------------------------------------
   HELPERS
---------------------------------------------------------------------------- */
function fmtDate(raw, months) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
function dateRange(start, end, isCurrent, t) {
  const a = fmtDate(start, t.months);
  const b = isCurrent ? t.present : fmtDate(end, t.months);
  if (!a && !b) return '';
  return `${a} — ${b}`;
}

const AVATAR_PALETTE = ['#1a4a8a', '#1E90FF', '#2563eb', '#0ea5e9', '#7c3aed', '#0891b2', '#4f46e5', '#0d9488'];
function colorFromString(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function ghUser(url) {
  if (!url) return '';
  const m = url.replace(/\/+$/, '').match(/github\.com\/([^/?#]+)/i);
  return m ? '@' + m[1] : url;
}

function langBadge(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('ana dili') || l.includes('native')) return { bg: '#dcfce7', fg: '#15803d' };
  if (l.includes('c1') || l.includes('c2')) return { bg: '#dbeafe', fg: '#1d4ed8' };
  if (l.includes('b1') || l.includes('b2')) return { bg: '#fef9c3', fg: '#854d0e' };
  return { bg: '#f3f4f6', fg: '#6b7280' };
}

function asList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch (e) {}
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

/* IntersectionObserver-driven reveal */
function Reveal({ children, className = '', as: Tag = 'section', style, ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${seen ? 'in' : ''} ${className}`} style={style} {...rest}>{children}</Tag>;
}

const SectionTitle = ({ icon, children }) => (
  <div className="sec-title">
    {icon}
    <span>{children}</span>
  </div>
);

/* ----------------------------------------------------------------------------
   NOT FOUND
---------------------------------------------------------------------------- */
function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <img src="/logo.png" alt="Hash Campus" width="64" height="64" style={{ borderRadius: 16 }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Profil tapılmadı</div>
      <a href="https://hashcampus.site" style={{ color: '#1a4a8a', fontWeight: 700, textDecoration: 'none' }}>← hashcampus.site</a>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------------------------------- */
function CVPage({ profile }) {
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [lang, setLang] = useState('az');
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    // Use browser print-to-PDF — far more reliable than html2pdf canvas approach.
    // Print CSS already hides topbar/footer and sets A4 margins.
    window.print();
  };

  const skills = asList(profile.skills);
  const languages = asList(profile.languages);
  const experiences = profile.experiences || [];
  const projects = profile.projects || [];
  const certificates = profile.certificates || [];
  const initial = (profile.full_name || '?').trim().charAt(0).toUpperCase();
  const avatarColor = colorFromString(profile.full_name);

  const facultyLine = [profile.faculty, profile.major, profile.course ? t.courseLabel(profile.course) : null]
    .filter(Boolean).join(' · ');

  const visibleSkills = skillsOpen ? skills : skills.slice(0, 10);

  const contacts = [
    profile.show_email && profile.email ? { icon: <IconMail size={14} stroke="#1a4a8a" />, label: profile.email, href: `mailto:${profile.email}` } : null,
    profile.phone ? { icon: <IconPhone size={14} stroke="#1a4a8a" />, label: profile.phone, href: `tel:${profile.phone}` } : null,
    profile.github_url ? { icon: <IconGithub size={14} style={{ color: '#1a4a8a' }} />, label: ghUser(profile.github_url), href: profile.github_url } : null,
    profile.linkedin_url ? { icon: <IconLinkedin size={14} style={{ color: '#1a4a8a' }} />, label: 'LinkedIn', href: profile.linkedin_url } : null,
    profile.website_url ? { icon: <IconGlobe size={14} stroke="#1a4a8a" />, label: profile.website_url.replace(/^https?:\/\//, ''), href: profile.website_url } : null,
  ].filter(Boolean);

  const headerLinks = [
    profile.show_email && profile.email ? { icon: <IconMail size={12} />, label: profile.email, href: `mailto:${profile.email}` } : null,
    profile.github_url ? { icon: <IconGithub size={12} />, label: ghUser(profile.github_url).replace('@', ''), href: profile.github_url } : null,
    profile.linkedin_url ? { icon: <IconLinkedin size={12} />, label: 'LinkedIn', href: profile.linkedin_url } : null,
    profile.website_url ? { icon: <IconGlobe size={12} />, label: profile.website_url.replace(/^https?:\/\//, ''), href: profile.website_url } : null,
  ].filter(Boolean);

  return (
    <div>
      <style>{CSS}</style>

      {/* TOP ACTION BAR */}
      <div className="cv-topbar">
        <div className="cv-topbar-inner">
          <a className="cv-brand" href="https://hashcampus.site" target="_blank" rel="noopener noreferrer">
            <img src="/logo.png" alt="Hash Campus" height="28" style={{ height: 28, width: 28, borderRadius: 7, display: 'block' }} />
            <span style={{ color: '#1a4a8a', fontSize: 14, fontWeight: 700 }}>Hash Campus</span>
          </a>
          <div className={`cv-topbar-name ${scrolled ? 'show' : ''}`}>{profile.full_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Language toggle */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
              {['az', 'en'].map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{
                  background: lang === l ? '#fff' : 'transparent',
                  border: 'none', borderRadius: 6, padding: '4px 10px',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  color: lang === l ? '#1a4a8a' : '#64748b',
                  boxShadow: lang === l ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                  transition: 'all .15s ease',
                }}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={handleShare}>
              {copied ? <IconCheck size={15} stroke="#16a34a" /> : <IconShare size={15} />}
              <span style={{ color: copied ? '#16a34a' : undefined }}>{copied ? t.copied : t.share}</span>
            </button>
            <button className="btn btn-navy" onClick={handleDownloadPDF}>
              <IconDownload size={15} stroke="#fff" />
              <span>{t.downloadPdf}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PAPER */}
      <main className="cv-shell">
        <article className="cv-paper">

          {/* HEADER */}
          <header className="cv-header">
            <div className="cv-header-glow" />
            {profile.is_open_for_team && (
              <div className="open-badge">
                <span className="pulse-dot" />
                {t.openToTeam}
              </div>
            )}
            <div className="cv-header-top">
              <div className="cv-avatar" style={{ background: profile.profile_picture ? 'transparent' : avatarColor }}>
                {profile.profile_picture
                  ? <img src={profile.profile_picture} alt={profile.full_name} />
                  : <span>{initial}</span>}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 className="cv-name">{profile.full_name}</h1>
                {profile.headline && <p className="cv-headline">{profile.headline}</p>}
                {facultyLine && (
                  <div className="cv-faculty">
                    <IconGradCap size={14} stroke="rgba(255,255,255,0.7)" />
                    <span>{facultyLine}</span>
                    {profile.gpa != null && <span className="gpa-pill">GPA: {profile.gpa}</span>}
                  </div>
                )}
              </div>
            </div>
            {headerLinks.length > 0 && (
              <div className="cv-header-links">
                {headerLinks.map((l, i) => (
                  <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className="hlink">
                    {l.icon}<span>{l.label}</span>
                  </a>
                ))}
              </div>
            )}
          </header>

          {/* BODY */}
          <div className="cv-body">

            {/* LEFT */}
            <aside className="cv-left">
              {skills.length > 0 && (
                <Reveal className="block">
                  <SectionTitle>{t.skills}</SectionTitle>
                  <div className="skill-wrap">
                    {visibleSkills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                  </div>
                  {skills.length > 10 && (
                    <button className="more-btn" onClick={() => setSkillsOpen((v) => !v)}>
                      {skillsOpen ? t.showLess : t.showMore(skills.length - 10)}
                    </button>
                  )}
                </Reveal>
              )}

              {(profile.university || profile.faculty || profile.major) && (
                <Reveal className="block">
                  <SectionTitle>{t.education}</SectionTitle>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                    {profile.university || profile.faculty}
                  </div>
                  {profile.university && profile.faculty && (
                    <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>{profile.faculty}</div>
                  )}
                  {profile.major && <div style={{ fontSize: 12.5, color: '#475569', marginTop: 1 }}>{profile.major}</div>}
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {[
                      profile.edu_start_year
                        ? `${profile.edu_start_year} – ${profile.edu_end_year || '...'}`
                        : null,
                      profile.course ? t.courseLabel(profile.course) : null,
                      profile.gpa != null ? `GPA ${profile.gpa}` : null,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </Reveal>
              )}

              {languages.length > 0 && (
                <Reveal className="block">
                  <SectionTitle>{t.languages}</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {languages.map((lg, i) => {
                      const b = langBadge(lg.level);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{lg.lang}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: b.bg, color: b.fg, whiteSpace: 'nowrap' }}>{lg.level}</span>
                        </div>
                      );
                    })}
                  </div>
                </Reveal>
              )}

              {contacts.length > 0 && (
                <Reveal className="block">
                  <SectionTitle>{t.contact}</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {contacts.map((c, i) => (
                      <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className="contact-row">
                        {c.icon}<span>{c.label}</span>
                      </a>
                    ))}
                  </div>
                </Reveal>
              )}
            </aside>

            {/* RIGHT */}
            <div className="cv-right">
              {profile.bio && (
                <Reveal className="block">
                  <SectionTitle>{t.about}</SectionTitle>
                  <p className="bio">{profile.bio}</p>
                </Reveal>
              )}

              {experiences.length > 0 && (
                <Reveal className="block">
                  <SectionTitle icon={<IconBriefcase size={13} stroke="#1a4a8a" />}>{t.experience}</SectionTitle>
                  <div className="timeline">
                    {experiences.map((ex, i) => (
                      <div className="tl-entry" key={i}>
                        <span className="tl-dot" />
                        <div className="tl-head">
                          <div className="tl-comp-badge" style={{ background: colorFromString(ex.company) }}>
                            {(ex.company || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                {ex.role}
                                {ex.is_current && <span className="now-pill">{t.present}</span>}
                              </div>
                              <span style={{ fontSize: 11.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>{dateRange(ex.start_date, ex.end_date, ex.is_current, t)}</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E90FF', marginTop: 1 }}>{ex.company}</div>
                            {ex.description && <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.65, margin: '5px 0 0' }}>{ex.description}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              )}

              {projects.length > 0 && (
                <Reveal className="block">
                  <SectionTitle icon={<IconFolder size={13} stroke="#1E90FF" />}>{t.projects}</SectionTitle>
                  <div className="proj-list">
                    {projects.map((proj, i) => {
                      const techs = asList(proj.technologies);
                      return (
                        <a key={i} className="proj-card" href={proj.github_url || undefined} target={proj.github_url ? '_blank' : undefined} rel="noopener noreferrer">
                          <div className="proj-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <IconFolder size={12} stroke="#1E90FF" />
                              <span className="proj-title">{proj.title}</span>
                              {proj.github_url && <IconExternal size={11} stroke="#94a3b8" />}
                            </div>
                            {proj.github_url && (
                              <span className="proj-date">GitHub ↗</span>
                            )}
                          </div>
                          {techs.length > 0 && (
                            <div className="proj-stack">{techs.join(' · ')}</div>
                          )}
                          {proj.description && <p className="proj-desc">{proj.description}</p>}
                        </a>
                      );
                    })}
                  </div>
                </Reveal>
              )}

              {certificates.length > 0 && (
                <Reveal className="block">
                  <SectionTitle icon={<IconAward size={13} stroke="#1a4a8a" />}>{t.certificates}</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {certificates.map((c, i) => (
                      <div className="cert-row" key={i}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <IconAward size={14} stroke="#1E90FF" />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{c.name}</span>
                              {c.issue_date && <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDate(c.issue_date, t.months)}</span>}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>{c.issuer}</div>
                          </div>
                        </div>
                        {c.credential_url && (
                          <a href={c.credential_url} target="_blank" rel="noopener noreferrer" className="verify-link">{t.verify}</a>
                        )}
                      </div>
                    ))}
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </article>
      </main>

      {/* FOOTER */}
      <footer className="cv-footer">
        <div className="cv-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="" height="22" style={{ height: 22, width: 22, borderRadius: 6 }} />
            <span style={{ color: '#9ca3af', fontSize: 11.5 }}>{t.madeOn} · hashcampus.site</span>
          </div>
          <a href="/register" style={{ color: '#1a4a8a', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>{t.joinUs}</a>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   EXPORT — fetches data then renders
---------------------------------------------------------------------------- */
export default function PublicCV() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    axios.get(`${API}/public/u/${username}`)
      .then(r => setProfile(r.data))
      .catch(() => setNotFound(true));
  }, [username]);

  if (notFound) return <NotFound />;
  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a4a8a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return <CVPage profile={profile} />;
}
