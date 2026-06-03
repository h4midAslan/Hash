import { useState, useEffect, useRef, useCallback } from "react";

// ── Module-level cache — komponent unmount olsa da data qalır ──────────────
// Səhifələr arası keçiddə feed-i yenidən yükləmir (60s TTL)
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000; // 60 saniyə
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart, ThumbsDown, MessageCircle, Send, Pin, Image as ImageIcon, Film,
  Flag, X, Trash2, UserPlus, UserCheck, ChevronLeft, ChevronRight,
  BookOpen, TrendingUp, Home, Search, Users, MessageSquare, Bell,
  User, Settings, Shield, PenSquare, Sun, Moon, Repeat2,
} from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import FeedbackModal from "../components/FeedbackButton";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

const FACULTY_AZ = {
  "Mechatronics and robotics": "Mexatronika və robototexnika",
  "Mechatronics and robotics engineering": "Mexatronika və robototexnika mühəndisliyi",
  "Computer Science": "Kompüter elmləri",
  "Computer Engineering": "Kompüter mühəndisliyi",
  "Software Engineering": "Proqram mühəndisliyi",
  "Information Technology": "İnformasiya texnologiyaları",
  "Information Security": "İnformasiya təhlükəsizliyi",
  "Cybersecurity": "Kibertəhlükəsizlik",
  "Electrical Engineering": "Elektrik mühəndisliyi",
  "Electronics and Telecommunications": "Elektronika və telekommunikasiya",
  "Automation and Control": "Avtomatlaşdırma və idarəetmə",
  "Artificial Intelligence": "Süni intellekt",
  "Data Science": "Məlumat elmi",
  "Mathematics": "Riyaziyyat",
  "Physics": "Fizika",
  "Economics": "İqtisadiyyat",
  "Finance": "Maliyyə",
  "Management": "İdarəetmə",
  "Business Administration": "Biznesin idarə edilməsi",
  "Law": "Hüquq",
  "Architecture": "Memarlıq",
  "Civil Engineering": "İnşaat mühəndisliyi",
  "Environmental Engineering": "Ətraf mühit mühəndisliyi",
  "Chemical Engineering": "Kimya mühəndisliyi",
  "Biotechnology": "Biotexnologiya",
  "Medicine": "Tibb",
  "Psychology": "Psixologiya",
  "Journalism": "Jurnalistika",
  "Translation": "Tərcüme",
  "Philology": "Filologiya",
  "International Relations": "Beynəlxalq münasibətlər",
  "Political Science": "Politologiya",
};

const toAz = (str) => {
  if (!str) return str;
  return FACULTY_AZ[str] ?? FACULTY_AZ[str.trim()] ?? str;
};

const ACCENT = "#1E90FF";

const COLORS = {
  light: {
    border: "1px solid #e4e9f1",
    borderColor: "#e4e9f1",
    bg: "#ffffff",
    surface: "#f5f7fb",
    text: "#071428",
    textBody: "#16243c",
    textSoft: "#3a4861",
    muted: "#69768d",
    faint: "#a0aab8",
    primary: ACCENT,
    accent: ACCENT,
    accentGlow: "rgba(30,144,255,0.28)",
    accentWash: "rgba(30,144,255,0.10)",
    accentMuted: "rgba(30,144,255,0.35)",
    divider: "#edf1f6",
    commentBg: "#f5f7fb",
    commentBorder: "1px solid #e4e9f1",
    commentText: "#16243c",
    sidebarBg: "#f5f7fb",
    rowHover: "#f8fafd",
    barBlur: "rgba(255,255,255,0.88)",
    navActive: "rgba(30,144,255,0.10)",
    navHover: "#f3f6fb",
    btnPrimary: { background: ACCENT, color: "#fff", border: `1px solid ${ACCENT}` },
    btnGhost: { background: "#f5f7fb", color: "#3a4861", border: "1px solid #e4e9f1" },
  },
  dark: {
    border: "1px solid #1a2b49",
    borderColor: "#1a2b49",
    bg: "#050f1f",
    surface: "#0a1c39",
    text: "#ffffff",
    textBody: "#e6edf7",
    textSoft: "#c4d0e0",
    muted: "#7d8ba3",
    faint: "#54627a",
    primary: ACCENT,
    accent: ACCENT,
    accentGlow: "rgba(30,144,255,0.40)",
    accentWash: "rgba(30,144,255,0.14)",
    accentMuted: "rgba(30,144,255,0.35)",
    divider: "rgba(255,255,255,0.07)",
    commentBg: "#071428",
    commentBorder: "1px solid #1a2b49",
    commentText: "#c4d0e0",
    sidebarBg: "#0a1c39",
    rowHover: "rgba(255,255,255,0.025)",
    barBlur: "rgba(5,15,31,0.88)",
    navActive: "rgba(30,144,255,0.16)",
    navHover: "rgba(255,255,255,0.05)",
    btnPrimary: { background: ACCENT, color: "#fff", border: `1px solid ${ACCENT}` },
    btnGhost: { background: "transparent", color: "#c4d0e0", border: "1px solid #1a2b49" },
  },
};

function HashMark({ size = 32 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block" }}>
      <g fill="#ffffff">
        <rect x="32" y="10" width="11" height="80" />
        <rect x="57" y="10" width="11" height="80" />
        <rect x="10" y="32" width="80" height="11" />
        <rect x="10" y="57" width="80" height="11" />
      </g>
      <g fill="#00CFFF">
        <circle cx="37" cy="37" r="7" />
        <circle cx="63" cy="37" r="7" />
        <circle cx="37" cy="63" r="7" />
        <circle cx="63" cy="63" r="7" />
      </g>
    </svg>
  );
}

function useFonts() {
  useEffect(() => {
    if (document.getElementById("hash-fonts")) return;
    const link = document.createElement("link");
    link.id = "hash-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,800&family=JetBrains+Mono:wght@500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  if (images.length === 1) return (
    <div style={{ width: "100%", height: 400, borderRadius: 14, overflow: "hidden" }}>
      <img src={images[0]} alt="post" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
  return (
    <div style={{ position: "relative", userSelect: "none", borderRadius: 14, overflow: "hidden", height: 400 }}>
      <img src={images[idx]} alt={`post-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
        style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
        <ChevronLeft size={16} />
      </button>
      <button onClick={() => setIdx(i => (i + 1) % images.length)}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
        <ChevronRight size={16} />
      </button>
      <span style={{ position: "absolute", bottom: 10, right: 12, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
        {idx + 1}/{images.length}
      </span>
    </div>
  );
}

function ActionBtn({ C, onClick, active, activeColor, icon, count, title }) {
  const [hover, setHover] = useState(false);
  const col = active ? activeColor : hover ? C.accent : C.muted;
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 999, border: "none", background: hover ? C.accentWash : "transparent", cursor: "pointer", color: col, font: "inherit", fontSize: 14, fontWeight: 600, transition: "background .12s, color .12s", WebkitTapHighlightColor: "transparent" }}>
      {icon}
      {count != null && count > 0 && <span style={{ fontSize: 13, fontWeight: 700 }}>{count}</span>}
    </button>
  );
}

function NavItem({ C, to, icon, label, active }) {
  const [hover, setHover] = useState(false);
  return (
    <Link to={to}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", borderRadius: 12,
        background: active ? C.navActive : hover ? C.navHover : "transparent",
        color: active ? C.text : C.textSoft,
        textDecoration: "none", fontFamily: "'Archivo', sans-serif",
        fontWeight: active ? 800 : 600, fontSize: 15.5, transition: "background .12s",
      }}>
      <span style={{ color: active ? C.accent : "currentColor", flexShrink: 0 }}>{icon}</span>
      {label}
    </Link>
  );
}

function LeftNav({ C, dark, user, onCompose, onToggleTheme }) {
  const location = useLocation();
  const p = location.pathname;

  const navItems = [
    { to: "/feed", icon: <Home size={21} />, label: "Yeniliklər" },
    { to: "/search", icon: <Search size={21} />, label: "Axtar" },
    { to: "/connections", icon: <Users size={21} />, label: "Bağlantılar" },
    { to: "/messages", icon: <MessageSquare size={21} />, label: "Mesajlar" },
    { to: "/articles", icon: <BookOpen size={21} />, label: "Məqalələr" },
    { to: "/profile", icon: <User size={21} />, label: "Profil" },
    { to: "/settings", icon: <Settings size={21} />, label: "Parametrlər" },
    ...(user?.is_admin ? [{ to: "/admin", icon: <Shield size={21} />, label: "Admin" }] : []),
  ];

  const [themeHover, setThemeHover] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div style={{
      width: 256, flexShrink: 0, position: "sticky", top: 0,
      alignSelf: "flex-start", height: "100vh",
      display: "flex", flexDirection: "column", padding: "0 10px",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 6px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, background: "#071428",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)", flexShrink: 0,
        }}><HashMark size={24} /></div>
        <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: "0.04em", color: C.text, fontFamily: "'Archivo', sans-serif" }}>HASH</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, marginTop: 4 }}>
        {navItems.map(item => {
          const active = p === item.to || (item.to !== "/feed" && item.to !== "/profile" && p.startsWith(item.to));
          return <NavItem key={item.to} C={C} to={item.to} icon={item.icon} label={item.label} active={active} />;
        })}
      </nav>

      {/* Paylaş */}
      <div style={{ padding: "14px 2px 10px" }}>
        <button onClick={onCompose} style={{
          width: "100%", padding: "13px 0", borderRadius: 99,
          background: ACCENT, color: "#fff", border: "none",
          fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 15,
          cursor: "pointer", letterSpacing: "0.02em",
          boxShadow: "0 4px 16px rgba(30,144,255,0.35)",
        }}>
          Paylaş
        </button>
      </div>

      {/* Bottom: theme + profile */}
      <div style={{ borderTop: `1px solid ${C.divider}`, padding: "10px 0 18px", display: "flex", flexDirection: "column", gap: 2 }}>
        <button
          onMouseEnter={() => setThemeHover(true)} onMouseLeave={() => setThemeHover(false)}
          onClick={onToggleTheme}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 12,
            background: themeHover ? C.navHover : "transparent",
            border: "none", color: C.textSoft, cursor: "pointer",
            fontFamily: "'Archivo', sans-serif", fontSize: 14.5, fontWeight: 600,
            width: "100%", textAlign: "left", transition: "background .12s",
          }}>
          {dark ? <Sun size={19} /> : <Moon size={19} />}
          {dark ? "Açıq tema" : "Qaranlıq tema"}
        </button>

        <button
          onClick={() => setFeedbackOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 12,
            background: "transparent", border: "none",
            color: C.muted, cursor: "pointer",
            fontFamily: "'Archivo', sans-serif", fontSize: 14.5, fontWeight: 600,
            width: "100%", textAlign: "left", transition: "background .12s, color .12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.navHover; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}
        >
          <MessageSquare size={19} />
          Rəy və Təklif
        </button>

      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

function BottomNav({ C, user, onCompose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const p = location.pathname;

  const primary = [
    { path: "/feed",          icon: <Home size={24} /> },
    { path: "/search",        icon: <Search size={24} /> },
    { path: "/messages",      icon: <MessageSquare size={24} /> },
    { path: "/notifications", icon: <Bell size={24} /> },
  ];

  const secondary = [
    { path: "/profile",     icon: <User size={20} />,       label: "Profil" },
    { path: "/radar",       icon: <TrendingUp size={20} />, label: "Radar" },
    { path: "/connections", icon: <Users size={20} />,      label: "Bağlantılar" },
    { path: "/articles",    icon: <BookOpen size={20} />,   label: "Məqalələr" },
    ...(user?.is_admin ? [{ path: "/admin", icon: <Shield size={20} />, label: "Admin" }] : []),
  ];

  const moreActive = secondary.some(s => p === s.path || p.startsWith(s.path + "/"));

  return (
    <>
      {/* More drawer */}
      {moreOpen && (
        <div onClick={() => setMoreOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: "absolute", bottom: 66, left: 16, right: 16, background: C.bg, border: `1px solid ${C.divider}`, borderRadius: 18, padding: "8px 0", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}>
            {secondary.map(item => {
              const active = p === item.path || p.startsWith(item.path + "/");
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setMoreOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", background: "none", border: "none", cursor: "pointer", color: active ? C.accent : C.text, fontSize: 15, fontWeight: 700, fontFamily: "'Archivo', sans-serif", WebkitTapHighlightColor: "transparent" }}>
                  <span style={{ color: active ? C.accent : C.muted }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        height: 62, background: C.barBlur,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderTop: `1px solid ${C.divider}`,
        display: "flex", alignItems: "stretch",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {primary.map((item, i) => {
          const isActive = p === item.path || (item.path !== "/feed" && p.startsWith(item.path));
          return (
            <button key={i} onClick={() => navigate(item.path)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer", color: isActive ? C.accent : C.muted, transition: "color .12s", WebkitTapHighlightColor: "transparent" }}>
              {item.icon}
            </button>
          );
        })}
        {/* More button */}
        <button onClick={() => setMoreOpen(v => !v)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", color: moreActive || moreOpen ? C.accent : C.muted, transition: "color .12s", WebkitTapHighlightColor: "transparent" }}>
          <div style={{ display: "flex", gap: 3 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
          </div>
        </button>
      </div>
    </>
  );
}

function Panel({ C, children }) {
  return (
    <div style={{ background: C.sidebarBg, border: C.border, borderRadius: 18, overflow: "hidden" }}>
      {children}
    </div>
  );
}

function PanelHead({ C, children }) {
  return (
    <div style={{ padding: "16px 18px 12px", fontWeight: 900, fontSize: 17, letterSpacing: "0.01em", color: C.text, fontFamily: "'Archivo', sans-serif" }}>
      {children}
    </div>
  );
}

function OriginalPostPreview({ orig, C }) {
  if (!orig) return null;
  const images = orig.images?.length ? orig.images : orig.image_url ? [orig.image_url] : [];
  return (
    <div style={{ border: `1px solid ${C.divider}`, borderRadius: 12, padding: "10px 14px", marginTop: 10, marginBottom: 2, background: C.sidebarBg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Link to={`/profile/${orig.author_id}`} style={{ textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1E90FF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {orig.author_picture
              ? <img src={orig.author_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{orig.author_name?.charAt(0)}</span>}
          </div>
        </Link>
        <Link to={`/profile/${orig.author_id}`} style={{ fontSize: 13, fontWeight: 700, color: C.text, textDecoration: "none", fontFamily: "'Archivo', sans-serif" }}>{orig.author_name}</Link>
        {orig.created_at && <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace" }}>{orig.created_at.slice(0, 10)}</span>}
      </div>
      {orig.content && <p style={{ margin: 0, fontSize: 13, color: C.textSoft, lineHeight: 1.55, fontFamily: "'Archivo', sans-serif", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{orig.content.length > 280 ? orig.content.slice(0, 280) + "..." : orig.content}</p>}
      {images.length > 0 && <img src={images[0]} alt="" style={{ marginTop: 8, width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }} />}
      {orig.video_url && <video src={orig.video_url} style={{ marginTop: 8, width: "100%", maxHeight: 180, borderRadius: 8 }} controls />}
    </div>
  );
}

function PostItem({ post, C, dark, user, connectedIds, pendingIds, openComments, comments, commentText, onLike, onDislike, onDelete, onConnect, onToggleComments, onCommentChange, onSubmitComment, onReport, onRepost, t }) {
  const [hover, setHover] = useState(false);

  const isMobileView = window.innerWidth < 640;
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={isMobileView ? {
        display: "flex", gap: 12,
        margin: "8px 10px", padding: "14px 14px 10px",
        background: dark ? (hover ? "#0d2248" : "#0a1c39") : (hover ? "#f8faff" : "#ffffff"),
        borderRadius: 18,
        border: `1px solid ${C.divider}`,
        boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 1px 6px rgba(7,20,40,0.06)",
        transition: "background .12s, box-shadow .12s",
      } : {
        display: "flex", gap: 12, padding: "14px 16px",
        borderBottom: `1px solid ${C.divider}`,
        background: hover ? C.rowHover : "transparent", transition: "background .12s",
      }}
    >
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <Link to={`/profile/${post.author_id}`}>
          <UserAvatar user={{ full_name: post.author_name, profile_picture: post.author_picture }} size="md" />
        </Link>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {post.is_pinned && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, background: C.accentWash, padding: "3px 9px", borderRadius: 6, fontFamily: "'JetBrains Mono', monospace" }}>
              <Pin size={10} /> {t("feed_pinned") || "Sabitlənmiş"}
            </span>
          </div>
        )}

        <header style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, marginBottom: 4 }}>
          <Link to={`/profile/${post.author_id}`}
            style={{ fontWeight: 800, fontSize: 15, color: C.text, textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 1, minWidth: 0, fontFamily: "'Archivo', sans-serif" }}>
            {post.author_name}
          </Link>
          <span style={{ color: C.muted, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>·</span>
          <span style={{ color: C.muted, fontSize: 13.5, whiteSpace: "nowrap", flexShrink: 0 }}>{formatBakuDate(post.created_at)}</span>
          <div style={{ flex: 1 }} />
          {user && post.author_id !== user.id && !connectedIds.has(post.author_id) && (
            <button onClick={() => onConnect(post.author_id)} disabled={pendingIds.has(post.author_id)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: pendingIds.has(post.author_id) ? "#16a34a" : C.muted, display: "flex" }}
              title={pendingIds.has(post.author_id) ? "İstək göndərildi" : "Bağlantı istəyi göndər"}>
              {pendingIds.has(post.author_id) ? <UserCheck size={15} /> : <UserPlus size={15} />}
            </button>
          )}
          {user && post.author_id === user.id && (
            <button onClick={() => onDelete(post.id)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.muted, display: "flex" }}
              onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
              title="Postu sil">
              <Trash2 size={14} />
            </button>
          )}
        </header>

        {post.repost_of_id && !post.content && !post.image_url && !post.images?.length && (
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "flex", alignItems: "center", gap: 5, fontFamily: "'Archivo', sans-serif" }}>
            <Repeat2 size={13} /> repost etdi
          </div>
        )}
        {post.content && (
          <p style={{ fontSize: 15, color: C.textBody, lineHeight: 1.65, margin: "0 0 10px", whiteSpace: "pre-wrap", fontFamily: "'Archivo', sans-serif" }}>
            {post.content.split(/(#[\p{L}\d_]+)/gu).map((part, i) =>
              part.startsWith("#")
                ? <span key={i} style={{ color: C.accent, fontWeight: 600 }}>{part}</span>
                : <span key={i}>{part}</span>
            )}
          </p>
        )}
        {post.repost_of && <OriginalPostPreview orig={post.repost_of} C={C} />}

        {(post.images?.length > 0 || post.image_url) && (
          <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 10, border: C.border }}>
            <ImageCarousel images={post.images?.length > 0 ? post.images : [post.image_url]} />
          </div>
        )}
        {post.video_url && (
          <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 10, background: "#000", border: C.border }}>
            <video src={post.video_url} controls style={{ width: "100%", maxHeight: 460, display: "block" }} />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 10, marginLeft: -10, maxWidth: 380 }}>
          <ActionBtn C={C} onClick={() => onToggleComments(post.id)}
            active={openComments[post.id]} activeColor={C.accent}
            icon={<MessageCircle size={20} />} count={post.comment_count}
            title="Şərhlər" />
          <ActionBtn C={C} onClick={() => onLike(post.id)}
            active={post.is_liked} activeColor="#e11d48"
            icon={<Heart size={20} fill={post.is_liked ? "#e11d48" : "none"} color={post.is_liked ? "#e11d48" : "currentColor"} />}
            count={post.like_count} title="Bəyən" />
          <ActionBtn C={C} onClick={() => onDislike(post.id)}
            active={post.is_disliked} activeColor={C.muted}
            icon={<ThumbsDown size={20} fill={post.is_disliked ? "currentColor" : "none"} />}
            count={post.show_dislikes ? post.dislike_count : undefined} title="Bəyənmə" />
          <ActionBtn C={C} onClick={() => onRepost(post)}
            active={false} activeColor={C.accent}
            icon={<Repeat2 size={20} />}
            count={post.repost_count || undefined} title="Repost" />
          <div style={{ flex: 1 }} />
          {user && post.author_id !== user.id && (
            <button onClick={() => onReport(post.id)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "7px 8px", color: C.muted, display: "flex", borderRadius: 999 }}
              onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
              title="Şikayət et">
              <Flag size={16} />
            </button>
          )}
        </div>

        {openComments[post.id] && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.divider}` }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={commentText[post.id] || ""}
                onChange={e => onCommentChange(post.id, e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSubmitComment(post.id)}
                placeholder={t("feed_comment_placeholder") || "Şərh yaz..."}
                style={{ flex: 1, padding: "8px 12px", border: C.border, borderRadius: 10, fontSize: 13, color: C.text, background: C.bg, outline: "none", fontFamily: "'Archivo', sans-serif" }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.borderColor}
              />
              <button onClick={() => onSubmitComment(post.id)} disabled={!commentText[post.id]?.trim()}
                style={{ ...C.btnPrimary, borderRadius: 10, display: "inline-flex", alignItems: "center", padding: "8px 14px", fontSize: 13, cursor: "pointer", opacity: !commentText[post.id]?.trim() ? 0.4 : 1 }}>
                <Send size={13} />
              </button>
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {(comments[post.id] || []).length === 0 ? (
                <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "12px 0", fontFamily: "'Archivo', sans-serif" }}>Hələ şərh yoxdur</p>
              ) : (comments[post.id] || []).map(c => (
                <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <Link to={`/profile/${c.user_id}`} style={{ width: 32, height: 32, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none", flexShrink: 0, borderRadius: "50%" }}>
                    {c.user_name?.charAt(0)}
                  </Link>
                  <div style={{ flex: 1, background: C.commentBg, border: C.commentBorder, borderRadius: 12, padding: "8px 12px" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 3, alignItems: "center" }}>
                      <Link to={`/profile/${c.user_id}`} style={{ fontSize: 13, fontWeight: 700, color: C.text, textDecoration: "none", fontFamily: "'Archivo', sans-serif" }}>{c.user_name}</Link>
                      <span style={{ fontSize: 11, color: C.muted }}>{formatBakuHM(c.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.commentText, margin: 0 }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Feed() {
  useFonts();

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [showDislikes, setShowDislikes] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [feedOffset, setFeedOffset] = useState(0);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const [suggested, setSuggested] = useState([]);
  const [suggestedPending, setSuggestedPending] = useState(new Set());
  const [contestBoard, setContestBoard] = useState([]);
  const [contestInfo, setContestInfo] = useState(null);
  const [contestRemaining, setContestRemaining] = useState(0);
  const [showAllSuggested, setShowAllSuggested] = useState(false);
  const [composerFocus, setComposerFocus] = useState(false);
  const [feedTab, setFeedTab] = useState("foryou");
  const [mobileComposer, setMobileComposer] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [repostTarget, setRepostTarget] = useState(null);
  const [repostText, setRepostText] = useState("");
  const [reposting, setReposting] = useState(false);

  const composerRef = useRef(null);
  const touchStartX = useRef(null);
  const { t } = useLang();
  const isMobile = useIsMobile(821);
  const hideRail = useIsMobile(1121);
  const dark = useDarkMode();
  const C = dark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    document.body.style.background = C.bg;
  }, [C.bg]);

  // Cached data-nı state-ə yüklə
  const _applyCache = useCallback((d) => {
    if (!d) return;
    setPosts(d.posts || []);
    setFeedOffset((d.posts || []).length);
    setHasMore((d.posts || []).length === 20);
    if (d.user) setUser(d.user);
    if (d.connected_ids) setConnectedIds(new Set(d.connected_ids));
    if (d.pending_ids) setPendingIds(new Set(d.pending_ids));
    if (d.suggested) setSuggested(d.suggested);
    if (d.contest?.active) {
      setContestInfo(d.contest);
      setContestRemaining(d.contest.remaining_seconds);
    }
    if (d.leaderboard?.length) setContestBoard(d.leaderboard.slice(0, 5));
  }, []);

  useEffect(() => {
    // Cache mövcuddursa — dərhal göstər, loading yoxdur
    const now = Date.now();
    if (_cache && now - _cacheTs < CACHE_TTL) {
      _applyCache(_cache);
      setLoading(false);
      // Arxa planda yenilə (stale-while-revalidate)
      api.get("/posts/feed-init").then(r => {
        _cache = r.data; _cacheTs = Date.now();
        _applyCache(r.data);
      }).catch(() => {});
      return;
    }
    // İlk yükləmə
    api.get("/posts/feed-init")
      .then(r => {
        _cache = r.data; _cacheTs = Date.now();
        _applyCache(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [_applyCache]);

  useEffect(() => {
    if (contestRemaining <= 0) return;
    const timer = setInterval(() => setContestRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(timer);
  }, [contestRemaining > 0]);

  const handleConnect = async (userId) => {
    setPendingIds(prev => new Set([...prev, userId]));
    try {
      await api.post(`/connections/${userId}`);
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) {
      setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  // Post create/delete sonrası cache-i sıfırlayıb yenilə
  const loadFeed = async () => {
    try {
      const res = await api.get("/posts/feed-init");
      _cache = res.data; _cacheTs = Date.now();
      _applyCache(res.data);
    } catch {}
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/posts?limit=20&offset=${feedOffset}`);
      setPosts(prev => [...prev, ...res.data]);
      setFeedOffset(prev => prev + 20);
      setHasMore(res.data.length === 20);
    } catch {}
    setLoadingMore(false);
  };

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (imageUrls.length + files.length > 10) { toast.error("Maksimum 10 şəkil əlavə edə bilərsiniz"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      const res = await api.post("/upload/multiple", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setImageUrls(prev => [...prev, ...res.data.urls]);
      setVideoUrl("");
    } catch (err) { toast.error(err.response?.data?.detail || "Şəkil yüklənmədi"); }
    setUploading(false);
    e.target.value = "";
  };

  const handleVideoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setVideoUrl(res.data.url);
      setImageUrls([]);
    } catch (err) { toast.error(err.response?.data?.detail || "Video yüklənmədi"); }
    setUploading(false);
    e.target.value = "";
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !imageUrls.length && !videoUrl) return;
    setPosting(true);
    try {
      const res = await api.post("/posts", { content: newPost.trim() || "", images: imageUrls, video_url: videoUrl || null, show_dislikes: showDislikes });
      setNewPost(""); setImageUrls([]); setVideoUrl(""); setShowDislikes(true);
      setPosts(prev => [res.data, ...prev]);
      _cache = null; // cache-i sıfırla ki növbəti açılışda yeni post görünsün
    } catch (err) { toast.error(err.response?.data?.detail || "Post yaradılmadı"); }
    setPosting(false);
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasLiked = p.is_liked;
      return { ...p, is_liked: !wasLiked, like_count: wasLiked ? p.like_count - 1 : p.like_count + 1, is_disliked: !wasLiked ? false : p.is_disliked, dislike_count: !wasLiked && p.is_disliked ? p.dislike_count - 1 : p.dislike_count };
    }));
    try { await api.post(`/posts/${postId}/like`); } catch { loadFeed(); }
  };

  const handleDislike = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasDisliked = p.is_disliked;
      return { ...p, is_disliked: !wasDisliked, dislike_count: wasDisliked ? p.dislike_count - 1 : p.dislike_count + 1, is_liked: !wasDisliked ? false : p.is_liked, like_count: !wasDisliked && p.is_liked ? p.like_count - 1 : p.like_count };
    }));
    try { await api.post(`/posts/${postId}/dislike`); } catch { loadFeed(); }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Bu postu silmək istədiyinə əminsən?")) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    _cache = null;
    try { await api.delete(`/posts/${postId}`); } catch { loadFeed(); toast.error("Post silinmədi"); }
  };

  const toggleComments = async (postId) => {
    if (openComments[postId]) { setOpenComments({ ...openComments, [postId]: false }); return; }
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: res.data });
      setOpenComments({ ...openComments, [postId]: true });
    } catch {}
  };

  const submitComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    setCommentText({ ...commentText, [postId]: "" });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    try {
      await api.post(`/posts/${postId}/comment`, { content: text });
      const res = await api.get(`/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: res.data });
    } catch { loadFeed(); }
  };

  const handleRepost = async (withText) => {
    if (!repostTarget) return;
    setReposting(true);
    try {
      const res = await api.post("/posts", {
        content: withText ? repostText.trim() || null : null,
        repost_of_id: repostTarget.id,
      });
      setPosts(prev => [res.data, ...prev]);
      _cache = null;
      setRepostTarget(null);
      setRepostText("");
      toast.success("Repost edildi!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Repost alınmadı");
    }
    setReposting(false);
  };

  const submitReport = async () => {
    if (!reportPostId) return;
    setReporting(true);
    try {
      await api.post(`/posts/${reportPostId}/report`, { reason: reportReason.trim() || null });
      setReportPostId(null); setReportReason("");
      toast.success("Şikayət göndərildi.");
    } catch (err) { toast.error(err.response?.data?.detail || "Şikayət göndərilmədi"); }
    setReporting(false);
  };

  const handleSuggestedConnect = async (userId) => {
    setSuggestedPending(prev => new Set([...prev, userId]));
    try {
      await api.post(`/connections/${userId}`);
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) {
      setSuggestedPending(prev => { const s = new Set(prev); s.delete(userId); return s; });
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const focusComposer = () => {
    const ta = composerRef.current?.querySelector("textarea");
    if (ta) { ta.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const toggleTheme = () => {
    const next = !dark;
    localStorage.setItem("dark_mode", String(next));
    window.dispatchEvent(new Event("dark_mode_change"));
  };

  const pad = n => String(n).padStart(2, "0");
  const cntD = Math.floor(contestRemaining / 86400);
  const cntH = Math.floor((contestRemaining % 86400) / 3600);
  const cntM = Math.floor((contestRemaining % 3600) / 60);
  const cntS = contestRemaining % 60;

  const showRightRail = !hideRail;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 55 && touchStartX.current < 44) setDrawerOpen(true);
    if (dx < -55) setDrawerOpen(false);
    touchStartX.current = null;
  };

  return (
    <div
      style={{ fontFamily: "'Archivo', system-ui, sans-serif", WebkitFontSmoothing: "antialiased", background: C.bg, color: C.text, height: "100vh", overflow: "hidden", transition: "background .25s, color .25s" }}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      {/* Repost Modal */}
      {repostTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setRepostTarget(null); setRepostText(""); } }}>
          <div style={{ background: C.sidebarBg, border: `1px solid ${C.divider}`, borderRadius: 18, padding: 20, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: C.text, fontFamily: "'Archivo', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                <Repeat2 size={18} color="#1E90FF" /> Repost et
              </span>
              <button onClick={() => { setRepostTarget(null); setRepostText(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Original preview */}
            <OriginalPostPreview orig={{
              id: repostTarget.id,
              content: repostTarget.content,
              image_url: repostTarget.image_url,
              images: repostTarget.images || [],
              video_url: repostTarget.video_url,
              created_at: repostTarget.created_at,
              author_name: repostTarget.author_name,
              author_id: repostTarget.author_id,
              author_picture: repostTarget.author_picture,
            }} C={C} />

            {/* Comment textarea */}
            <textarea
              value={repostText}
              onChange={e => setRepostText(e.target.value)}
              placeholder="Öz fikrini əlavə et... (istəyə bağlı)"
              rows={3}
              style={{ width: "100%", marginTop: 12, padding: "10px 12px", border: `1px solid ${C.divider}`, borderRadius: 10, fontSize: 14, color: C.text, background: C.bg, fontFamily: "'Archivo', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button
                onClick={() => handleRepost(false)}
                disabled={reposting}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${C.divider}`, background: "transparent", color: C.text, fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                <Repeat2 size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                Sürətli repost
              </button>
              <button
                onClick={() => handleRepost(true)}
                disabled={reposting}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#1E90FF", color: "#fff", fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {reposting ? "..." : "Fikirlərlə repost"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <>
          {/* Overlay */}
          <div onClick={() => setDrawerOpen(false)} style={{
            position: "fixed", inset: 0, zIndex: 250,
            background: "rgba(0,0,0,0.45)",
            opacity: drawerOpen ? 1 : 0,
            pointerEvents: drawerOpen ? "auto" : "none",
            transition: "opacity 0.28s",
          }} />
          {/* Drawer panel */}
          <div style={{
            position: "fixed", top: 0, left: 0, height: "100vh", width: 290, zIndex: 300,
            background: C.bg, overflowY: "auto",
            transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
            display: "flex", flexDirection: "column",
            boxShadow: drawerOpen ? "4px 0 32px rgba(0,0,0,0.35)" : "none",
          }}>
            {/* User info */}
            <div style={{ padding: "52px 20px 16px" }}>
              <Link to="/profile" onClick={() => setDrawerOpen(false)}>
                <UserAvatar user={user} size="lg" />
              </Link>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: C.text, fontFamily: "'Archivo', sans-serif" }}>{user?.full_name || "—"}</div>
                <div style={{ fontSize: 14, color: C.muted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>@{user?.username || user?.email?.split("@")[0] || "—"}</div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                <Link to="/connections" onClick={() => setDrawerOpen(false)} style={{ textDecoration: "none" }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{user?.connections_count ?? "—"}</span>
                  <span style={{ fontSize: 13, color: C.muted, marginLeft: 4 }}>Bağlantı</span>
                </Link>
              </div>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: "4px 0" }}>
              {[
                { to: "/feed", icon: <Home size={22} />, label: "Yeniliklər" },
                { to: "/profile", icon: <User size={22} />, label: "Profil" },
                { to: "/connections", icon: <Users size={22} />, label: "Bağlantılar" },
                { to: "/messages", icon: <MessageSquare size={22} />, label: "Mesajlar" },
                { to: "/articles", icon: <BookOpen size={22} />, label: "Məqalələr" },
                { to: "/search", icon: <Search size={22} />, label: "Axtar" },
                ...(user?.is_admin ? [{ to: "/admin", icon: <Shield size={22} />, label: "Admin" }] : []),
              ].map(item => (
                <Link key={item.to} to={item.to} onClick={() => setDrawerOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 20px", textDecoration: "none", color: C.text, fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 17 }}
                  onMouseEnter={e => e.currentTarget.style.background = C.navHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ color: C.textSoft }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Bottom: settings + theme */}
            <div style={{ borderTop: `1px solid ${C.divider}`, padding: "8px 0 28px" }}>
              <Link to="/settings" onClick={() => setDrawerOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 20px", textDecoration: "none", color: C.text, fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 17 }}
                onMouseEnter={e => e.currentTarget.style.background = C.navHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ color: C.textSoft }}><Settings size={22} /></span>
                Parametrlər
              </Link>
              <button onClick={() => { toggleTheme(); setDrawerOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 20px", background: "none", border: "none", color: C.text, fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 17, width: "100%", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = C.navHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ color: C.textSoft }}>{dark ? <Sun size={22} /> : <Moon size={22} />}</span>
                {dark ? "Açıq tema" : "Qaranlıq tema"}
              </button>
              <button onClick={() => { setFeedbackOpen(true); setDrawerOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 20px", background: "none", border: "none", color: C.text, fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 17, width: "100%", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = C.navHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ color: C.textSoft }}><MessageSquare size={22} /></span>
                Rəy və Təklif
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "center", maxWidth: 1290, margin: "0 auto", width: "100%", height: "100vh", overflow: "hidden" }}>

        {/* Left sidebar — desktop */}
        {!isMobile && (
          <LeftNav C={C} dark={dark} user={user} onCompose={focusComposer} onToggleTheme={toggleTheme} />
        )}

        {/* Center column */}
        <main style={{
          flex: isMobile ? 1 : "none", width: isMobile ? "100%" : "100%", maxWidth: isMobile ? "none" : 600, flexShrink: 0,
          borderLeft: isMobile ? "none" : `1px solid ${C.divider}`,
          borderRight: isMobile ? "none" : `1px solid ${C.divider}`,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          paddingBottom: isMobile ? 74 : 60,
        }}>

          {/* Sticky feed header */}
          <div style={{
            position: "sticky", top: 0, zIndex: 15,
            background: C.barBlur, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            borderBottom: `1px solid ${C.divider}`,
          }}>
            {isMobile ? (
              /* Mobile header — Twitter/X style */
              <>
                {/* Mobile header — Hash style */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 10px" }}>
                  <button onClick={() => setDrawerOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "#071428", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <HashMark size={20} />
                    </div>
                    <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "0.04em", color: C.text, fontFamily: "'Archivo', sans-serif" }}>HASH</span>
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => setMobileComposer(true)} style={{ background: C.navHover, border: "none", borderRadius: 10, padding: "7px 10px", cursor: "pointer", color: C.textSoft, display: "flex", alignItems: "center" }}>
                      <PenSquare size={19} />
                    </button>
                    <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                      <UserAvatar user={user} size="sm" />
                    </button>
                  </div>
                </div>
                {/* Underline tabs */}
                <div style={{ display: "flex", borderBottom: `1px solid ${C.divider}` }}>
                  {[["foryou", "Sənə uyğun"], ["following", "İzlədiklərin"]].map(([tabId, label]) => {
                    const on = feedTab === tabId;
                    return (
                      <button key={tabId} onClick={() => setFeedTab(tabId)} style={{
                        flex: 1, padding: "13px 0 12px", border: "none", cursor: "pointer",
                        background: "transparent",
                        borderBottom: on ? `2px solid ${C.accent}` : "2px solid transparent",
                        fontFamily: "'Archivo', sans-serif", fontSize: 15, fontWeight: on ? 800 : 500,
                        color: on ? C.text : C.muted, transition: "color .15s, border-color .15s",
                        WebkitTapHighlightColor: "transparent",
                      }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Desktop header */
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px" }}>
                  <h1 style={{ margin: 0, fontWeight: 900, fontSize: 21, letterSpacing: "0.02em", color: C.text, fontFamily: "'Archivo', sans-serif" }}>Yeniliklər</h1>
                  <Link to="/articles" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: C.border, background: "transparent", color: C.textSoft, textDecoration: "none", fontSize: 13.5, fontWeight: 700, fontFamily: "'Archivo', sans-serif" }}>
                    <BookOpen size={16} /> Məqalələr
                  </Link>
                </div>
                <div style={{ padding: "6px 16px 12px" }}>
                  <div style={{ display: "flex", background: C.surface, borderRadius: 12, padding: 3, gap: 2 }}>
                    {[["foryou", "Sənə uyğun"], ["following", "İzlədiklərin"]].map(([tabId, label]) => {
                      const on = feedTab === tabId;
                      return (
                        <button key={tabId} onClick={() => setFeedTab(tabId)} style={{
                          flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                          background: on ? C.bg : "transparent",
                          boxShadow: on ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                          fontFamily: "'Archivo', sans-serif", fontSize: 14, fontWeight: on ? 800 : 600,
                          color: on ? C.accent : C.muted, transition: "all .15s",
                        }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Contest banner — mobile */}
          {isMobile && contestInfo && (
            <div style={{ borderBottom: `1px solid ${C.divider}` }}>
              <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>■ Foto Müsabiqəsi</p>
                  <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 800, color: C.text }}>{contestInfo.title || "Hash Müsabiqəsi"}</p>
                </div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.accent }}>{contestInfo.prize}</p>
              </div>
              <div style={{ display: "flex", gap: 8, padding: "0 20px 14px" }}>
                {[{ v: cntD, l: "Gün" }, { v: cntH, l: "Saat" }, { v: cntM, l: "Dəq" }, { v: cntS, l: "San" }].map(({ v, l }) => (
                  <div key={l} style={{ flex: 1, textAlign: "center", background: C.accentWash, borderRadius: 10, padding: "6px 4px" }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: C.accent, fontVariantNumeric: "tabular-nums" }}>{pad(v)}</div>
                    <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Composer — hidden on mobile (use FAB) */}
          <form ref={composerRef} onSubmit={handlePost} style={{ display: isMobile ? "none" : "flex", gap: 14, padding: "18px 20px", borderBottom: `1px solid ${C.divider}` }}>
            <div style={{ flexShrink: 0, paddingTop: 4 }}>
              <UserAvatar user={user} size="md" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                onFocus={() => setComposerFocus(true)}
                onBlur={() => setComposerFocus(false)}
                placeholder={t("feed_textarea") || "Nə düşünürsən?"}
                rows={composerFocus || newPost ? 3 : 1}
                style={{ width: "100%", border: "none", outline: "none", resize: "none", background: "transparent", color: C.text, fontFamily: "'Archivo', sans-serif", fontSize: 18, lineHeight: 1.5, padding: "4px 0", boxSizing: "border-box", fontWeight: 500 }}
              />
              <div style={{ height: 2, background: composerFocus ? C.accent : C.divider, transition: "background .2s", marginBottom: 10 }} />

              {imageUrls.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
                  {imageUrls.map((url, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1", border: C.border }}>
                      <img src={url} alt={`preview-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                        style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {imageUrls.length < 10 && (
                    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px dashed ${C.borderColor}`, borderRadius: 10, aspectRatio: "1", cursor: "pointer", color: C.muted, fontSize: 11, gap: 4 }}>
                      <ImageIcon size={16} /> Əlavə et
                      <input type="file" accept="image/*" multiple onChange={handleImagePick} disabled={uploading} style={{ display: "none" }} />
                    </label>
                  )}
                </div>
              )}

              {videoUrl && (
                <div style={{ position: "relative", marginBottom: 10, borderRadius: 14, overflow: "hidden", border: C.border }}>
                  <video src={videoUrl} controls style={{ width: "100%", maxHeight: 360, display: "block" }} />
                  <button type="button" onClick={() => setVideoUrl("")}
                    style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                    <X size={13} />
                  </button>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", color: C.accent, fontFamily: "'Archivo', sans-serif", fontSize: 14, fontWeight: 700 }}>
                  <ImageIcon size={18} /> Şəkil
                  {imageUrls.length > 0 && <span style={{ background: C.accent, color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 8 }}>{imageUrls.length}</span>}
                  <input type="file" accept="image/*" multiple onChange={handleImagePick} disabled={uploading} style={{ display: "none" }} />
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", color: C.accent, fontFamily: "'Archivo', sans-serif", fontSize: 14, fontWeight: 700 }}>
                  <Film size={18} /> Video
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoPick} disabled={uploading} style={{ display: "none" }} />
                </label>
                {uploading && <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>Yüklənir...</span>}
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => setShowDislikes(v => !v)}
                  title={showDislikes ? "Dislike düyməsi aktiv — klikləyib söndür" : "Dislike düyməsini aktiv et"}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 11.5, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
                    background: showDislikes ? "rgba(30,144,255,0.12)" : "transparent",
                    color: showDislikes ? C.accent : C.muted,
                    transition: "background .15s, color .15s",
                  }}
                >
                  <span style={{
                    width: 28, height: 16, borderRadius: 8, border: `1.5px solid ${showDislikes ? C.accent : C.muted}`,
                    background: showDislikes ? C.accent : "transparent",
                    display: "inline-flex", alignItems: "center",
                    padding: "0 2px", transition: "background .15s",
                    flexShrink: 0,
                  }}>
                    <span style={{
                      width: 11, height: 11, borderRadius: "50%",
                      background: showDislikes ? "#fff" : C.muted,
                      transform: showDislikes ? "translateX(12px)" : "translateX(0)",
                      transition: "transform .15s, background .15s",
                    }} />
                  </span>
                  <ThumbsDown size={11} />
                  {showDislikes ? "Dislike aktiv" : "Dislike"}
                </button>
                <button type="submit" disabled={(!newPost.trim() && !imageUrls.length && !videoUrl) || posting || uploading}
                  style={{ padding: "9px 22px", borderRadius: 11, border: "none", background: (newPost.trim() || imageUrls.length || videoUrl) ? C.accent : C.accentMuted, color: "#fff", fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 15, cursor: (!newPost.trim() && !imageUrls.length && !videoUrl) || posting || uploading ? "default" : "pointer", boxShadow: (newPost.trim() || imageUrls.length || videoUrl) ? `0 4px 16px ${C.accentGlow}` : "none", transition: "background .15s", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Send size={14} /> {posting ? "..." : t("feed_share") || "Paylaş"}
                </button>
              </div>
            </div>
          </form>

          {/* Skeleton */}
          {loading && [1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "18px 20px", borderBottom: `1px solid ${C.divider}`, opacity: 0.5 }}>
              <div style={{ width: 46, height: 46, background: C.surface, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 13, background: C.surface, width: "30%", marginBottom: 10, borderRadius: 6 }} />
                <div style={{ height: 11, background: C.surface, marginBottom: 6, borderRadius: 6 }} />
                <div style={{ height: 11, background: C.surface, width: "65%", borderRadius: 6 }} />
              </div>
            </div>
          ))}

          {/* Posts */}
          {!loading && posts.map(post => (
            <PostItem
              key={post.id}
              post={post} C={C} dark={dark} user={user}
              connectedIds={connectedIds} pendingIds={pendingIds}
              openComments={openComments} comments={comments} commentText={commentText}
              onLike={handleLike} onDislike={handleDislike} onDelete={handleDelete}
              onConnect={handleConnect} onToggleComments={toggleComments}
              onCommentChange={(id, val) => setCommentText({ ...commentText, [id]: val })}
              onSubmitComment={submitComment} onReport={setReportPostId}
              onRepost={setRepostTarget}
              t={t}
            />
          ))}

          {/* Load more */}
          {!loading && posts.length > 0 && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              {hasMore ? (
                <button onClick={loadMore} disabled={loadingMore}
                  style={{ ...C.btnGhost, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, padding: "10px 28px", cursor: loadingMore ? "default" : "pointer", opacity: loadingMore ? 0.5 : 1, borderRadius: 11, fontFamily: "'Archivo', sans-serif", fontWeight: 700 }}>
                  {loadingMore ? "Yüklənir..." : "Daha çox yüklə"}
                </button>
              ) : (
                <span style={{ fontSize: 12.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>— daha çox yoxdur —</span>
              )}
            </div>
          )}

          {/* Empty */}
          {!loading && posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <TrendingUp size={40} style={{ color: C.borderColor, marginBottom: 16 }} />
              <p style={{ fontWeight: 900, fontSize: 18, color: C.text, margin: "0 0 8px", fontFamily: "'Archivo', sans-serif" }}>{t("feed_empty") || "Hələ post yoxdur"}</p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{t("feed_empty_sub") || "Birincin ol!"}</p>
            </div>
          )}
        </main>

        {/* Right rail — desktop */}
        {showRightRail && (
          <aside style={{ width: 340, minWidth: 260, flexShrink: 1, padding: "20px 16px 40px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 0, alignSelf: "flex-start", maxHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Axtar..."
                onClick={() => window.location.href = "/search"}
                readOnly
                style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 12, border: C.border, background: C.surface, color: C.text, fontFamily: "'Archivo', sans-serif", fontSize: 14, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
              />
            </div>

            {suggested.length > 0 && (
              <Panel C={C}>
                <PanelHead C={C}>Tanıya bilərsən</PanelHead>
                {(showAllSuggested ? suggested : suggested.slice(0, 3)).map(s => {
                  const sent = suggestedPending.has(s.id);
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderTop: `1px solid ${C.divider}` }}>
                      <Link to={`/profile/${s.id}`} style={{ width: 42, height: 42, borderRadius: "50%", background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, textDecoration: "none", flexShrink: 0, overflow: "hidden" }}>
                        {s.profile_picture ? <img src={s.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : s.full_name?.charAt(0)}
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/profile/${s.id}`} style={{ fontSize: 14, fontWeight: 800, color: C.text, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Archivo', sans-serif" }}>{s.full_name}</Link>
                        {(() => {
                          const raw = s.mutual_count > 0 ? null : (s.headline || s.major || s.faculty || "Hash Campus");
                          const label = s.mutual_count > 0 ? `${s.mutual_count} ümumi bağlantı` : toAz(raw);
                          return (
                            <p title={label} style={{ fontSize: 12, color: C.muted, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.35 }}>{label}</p>
                          );
                        })()}
                      </div>
                      <button onClick={() => !sent && handleSuggestedConnect(s.id)} disabled={sent}
                        style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 999, background: sent ? "transparent" : C.accent, color: sent ? C.textSoft : "#fff", border: sent ? C.border : "none", fontSize: 13, fontWeight: 800, cursor: sent ? "default" : "pointer" }}>
                        {sent ? "Göndərildi" : "Əlaqə"}
                      </button>
                    </div>
                  );
                })}
                {suggested.length > 3 && (
                  <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.divider}` }}>
                    <button onClick={() => setShowAllSuggested(v => !v)}
                      style={{ background: "none", border: "none", color: C.accent, fontSize: 13.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                      {showAllSuggested ? "Azalt ▲" : `Daha çoxunu göstər → (${suggested.length - 3})`}
                    </button>
                  </div>
                )}
              </Panel>
            )}

            {contestInfo && (
              <Panel C={C}>
                <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>■ Foto Müsabiqəsi</p>
                    <p style={{ margin: "3px 0 0", fontSize: 15, fontWeight: 900, color: C.text, fontFamily: "'Archivo', sans-serif" }}>{contestInfo.title || "Hash Müsabiqəsi"}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{contestInfo.prize}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: C.muted }}>mükafat</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, padding: "12px 18px", borderBottom: `1px solid ${C.divider}` }}>
                  {[{ v: cntD, l: "Gün" }, { v: cntH, l: "Saat" }, { v: cntM, l: "Dəq" }, { v: cntS, l: "San" }].map(({ v, l }) => (
                    <div key={l} style={{ flex: 1, textAlign: "center", background: C.accentWash, borderRadius: 10, padding: "6px 4px" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: C.accent, fontVariantNumeric: "tabular-nums" }}>{pad(v)}</div>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px 18px" }}>
                  {contestBoard.length === 0 ? (
                    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Hələ iştirakçı yoxdur. İlk sən ol! 📸</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {contestBoard.map(entry => (
                        <div key={entry.post_id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: "center" }}>
                            {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `${entry.rank}.`}
                          </span>
                          {entry.image_url && (
                            <img src={entry.image_url} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: C.border }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.author.full_name}</div>
                            <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                              <span style={{ color: "#e11d48", display: "flex", alignItems: "center", gap: 2 }}><Heart size={10} fill="#e11d48" color="#e11d48" /> {entry.like_count}</span>
                              <span>💬 {entry.comment_count ?? 0}</span>
                              <span style={{ color: C.accent, fontWeight: 800, marginLeft: "auto" }}>{entry.score ?? entry.like_count} xal</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {contestInfo?.tags && (
                    <p style={{ fontSize: 10, color: C.muted, margin: "10px 0 0", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
                      {contestInfo.tags.map(tag => tag.startsWith("#") ? tag : `#${tag}`).join("  ")}
                    </p>
                  )}
                </div>
              </Panel>
            )}

          </aside>
        )}
      </div>


      {/* Mobile composer modal */}
      {isMobile && mobileComposer && (
        <div onClick={() => { if (!newPost.trim() && !imageUrls.length && !videoUrl) setMobileComposer(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bg, borderRadius: "20px 20px 0 0", padding: "16px 16px 32px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button onClick={() => { setMobileComposer(false); setNewPost(""); setImageUrls([]); setVideoUrl(""); }}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "4px 8px", fontFamily: "'Archivo', sans-serif" }}>
                Ləğv et
              </button>
              <button type="button" onClick={async () => { await handlePost({ preventDefault: () => {} }); setMobileComposer(false); }}
                disabled={(!newPost.trim() && !imageUrls.length && !videoUrl) || posting || uploading}
                style={{ padding: "9px 22px", borderRadius: 99, border: "none", background: (newPost.trim() || imageUrls.length || videoUrl) ? C.accent : C.accentMuted, color: "#fff", fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: (newPost.trim() || imageUrls.length || videoUrl) ? `0 4px 14px ${C.accentGlow}` : "none" }}>
                {posting ? "..." : "Paylaş"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <UserAvatar user={user} size="md" />
              <div style={{ flex: 1 }}>
                <textarea
                  autoFocus
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Nə düşünürsən?"
                  rows={4}
                  style={{ width: "100%", border: "none", outline: "none", resize: "none", background: "transparent", color: C.text, fontFamily: "'Archivo', sans-serif", fontSize: 18, lineHeight: 1.55, padding: "4px 0", boxSizing: "border-box", fontWeight: 500 }}
                />
                {imageUrls.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
                    {imageUrls.map((url, i) => (
                      <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1" }}>
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button type="button" onClick={() => setImageUrls(p => p.filter((_, j) => j !== i))}
                          style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${C.divider}`, marginTop: 12, paddingTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Archivo', sans-serif" }}>
                <ImageIcon size={20} />
                {imageUrls.length > 0 && <span style={{ background: C.accent, color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 8 }}>{imageUrls.length}</span>}
                <input type="file" accept="image/*" multiple onChange={handleImagePick} disabled={uploading} style={{ display: "none" }} />
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Archivo', sans-serif" }}>
                <Film size={20} />
                <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoPick} disabled={uploading} style={{ display: "none" }} />
              </label>
              {uploading && <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>Yüklənir...</span>}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav is rendered globally in App.jsx */}

      {/* Report modal */}
      {reportPostId && (
        <div onClick={() => !reporting && setReportPostId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bg, border: C.border, borderRadius: 18, maxWidth: 400, width: "100%", padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: C.text, margin: "0 0 6px", fontFamily: "'Archivo', sans-serif" }}>Postu şikayət et</h3>
            <p style={{ fontSize: 12.5, color: C.muted, margin: "0 0 14px" }}>Admin yoxladıqdan sonra tədbir görüləcək</p>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Səbəb (istəyə bağlı)..."
              style={{ width: "100%", border: C.border, borderRadius: 10, background: C.sidebarBg, color: C.text, padding: "10px 12px", fontSize: 13, resize: "none", outline: "none", boxSizing: "border-box" }} rows={3} maxLength={300} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={() => { setReportPostId(null); setReportReason(""); }} disabled={reporting}
                style={{ ...C.btnGhost, borderRadius: 11, display: "inline-flex", padding: "9px 18px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>Ləğv et</button>
              <button onClick={submitReport} disabled={reporting}
                style={{ background: "#dc2626", color: "#fff", border: "1px solid #dc2626", borderRadius: 11, display: "inline-flex", padding: "9px 20px", fontSize: 13, cursor: "pointer", opacity: reporting ? 0.5 : 1, fontWeight: 800 }}>
                {reporting ? "Göndərilir..." : "Şikayət göndər"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
