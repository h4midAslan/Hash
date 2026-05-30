import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart, ThumbsDown, MessageCircle, Send, Pin, Image as ImageIcon, Film,
  Flag, X, Trash2, UserPlus, UserCheck, ChevronLeft, ChevronRight,
  BookOpen, TrendingUp, Home, Search, Users, MessageSquare, Bell,
  User, Settings, Shield, PenSquare, Sun, Moon,
} from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

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
    <img src={images[0]} alt="post" style={{ width: "100%", maxHeight: 480, objectFit: "cover", display: "block", borderRadius: 14 }} />
  );
  return (
    <div style={{ position: "relative", userSelect: "none", borderRadius: 14, overflow: "hidden" }}>
      <img src={images[idx]} alt={`post-${idx}`} style={{ width: "100%", maxHeight: 480, objectFit: "cover", display: "block" }} />
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
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 999, border: "none", background: hover ? C.accentWash : "transparent", cursor: "pointer", color: col, font: "inherit", fontSize: 13.5, fontWeight: 600, transition: "background .12s, color .12s" }}>
      {icon}
      {count != null && count > 0 && <span>{count}</span>}
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
          width: 38, height: 38, borderRadius: 12, background: ACCENT,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(30,144,255,0.40)",
          color: "#fff", fontWeight: 900, fontSize: 20,
          fontFamily: "'Archivo', sans-serif", flexShrink: 0,
        }}>#</div>
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

        {user && (
          <Link to="/profile" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 12, textDecoration: "none",
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.navHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <UserAvatar user={user} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Archivo', sans-serif" }}>{user.full_name}</div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                @{user.username || user.email?.split("@")[0]}
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

function BottomNav({ C, onCompose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const p = location.pathname;

  const items = [
    { path: "/feed", icon: <Home size={22} /> },
    { path: "/search", icon: <Search size={22} /> },
    { path: "/connections", icon: <Users size={22} /> },
    { path: "/messages", icon: <MessageSquare size={22} /> },
    { path: "/profile", icon: <User size={22} /> },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 60, background: C.barBlur,
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      borderTop: `1px solid ${C.divider}`,
      display: "flex", alignItems: "stretch",
    }}>
      {items.map((item, i) => {
        const isActive = item.path && (p === item.path || (item.path !== "/feed" && item.path !== "/profile" && p.startsWith(item.path)));
        return (
          <button key={i} onClick={() => item.compose ? onCompose() : navigate(item.path)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", background: "transparent", cursor: "pointer",
              color: isActive ? C.accent : C.muted, transition: "color .12s",
            }}>
            {item.icon}
          </button>
        );
      })}
    </div>
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

function PostItem({ post, C, user, connectedIds, pendingIds, openComments, comments, commentText, onLike, onDislike, onDelete, onConnect, onToggleComments, onCommentChange, onSubmitComment, onReport, t }) {
  const [hover, setHover] = useState(false);

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 14, padding: "18px 20px", borderBottom: `1px solid ${C.divider}`, background: hover ? C.rowHover : "transparent", transition: "background .12s" }}
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

        {post.content && (
          <p style={{ fontSize: 15, color: C.textBody, lineHeight: 1.65, margin: "0 0 10px", whiteSpace: "pre-wrap", fontFamily: "'Archivo', sans-serif" }}>
            {post.content.split(/(#[\p{L}\d_]+)/gu).map((part, i) =>
              part.startsWith("#")
                ? <span key={i} style={{ color: C.accent, fontWeight: 600 }}>{part}</span>
                : <span key={i}>{part}</span>
            )}
          </p>
        )}

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

        <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 8, marginLeft: -8 }}>
          <ActionBtn C={C} onClick={() => onToggleComments(post.id)}
            active={openComments[post.id]} activeColor={C.accent}
            icon={<MessageCircle size={18} />} count={post.comment_count}
            title="Şərhlər" />
          <ActionBtn C={C} onClick={() => onLike(post.id)}
            active={post.is_liked} activeColor="#e11d48"
            icon={<Heart size={18} fill={post.is_liked ? "#e11d48" : "none"} color={post.is_liked ? "#e11d48" : "currentColor"} />}
            count={post.like_count} title="Bəyən" />
          <ActionBtn C={C} onClick={() => onDislike(post.id)}
            active={post.is_disliked} activeColor={C.muted}
            icon={<ThumbsDown size={18} fill={post.is_disliked ? "currentColor" : "none"} />}
            count={post.show_dislikes ? post.dislike_count : undefined} title="Bəyənmə" />
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

  const composerRef = useRef(null);
  const { t } = useLang();
  const isMobile = useIsMobile(821);
  const hideRail = useIsMobile(1121);
  const dark = useDarkMode();
  const C = dark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    document.body.style.background = C.bg;
  }, [C.bg]);

  useEffect(() => {
    Promise.all([
      loadFeed(),
      loadUser(),
      loadConnections(),
      api.get("/connections/suggested").then(r => setSuggested(r.data)).catch(() => {}),
      api.get("/contest/info").then(r => { if (r.data.active) { setContestInfo(r.data); setContestRemaining(r.data.remaining_seconds); } }).catch(() => {}),
      api.get("/contest/leaderboard").then(r => setContestBoard(r.data.slice(0, 5))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (contestRemaining <= 0) return;
    const timer = setInterval(() => setContestRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(timer);
  }, [contestRemaining > 0]);

  const loadConnections = async () => {
    try {
      const [myRes, pendRes] = await Promise.all([api.get("/connections/my"), api.get("/connections/sent")]);
      setConnectedIds(new Set(myRes.data.map(c => c.user_id)));
      setPendingIds(new Set(pendRes.data.map(c => c.receiver_id)));
    } catch {}
  };

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

  const loadUser = async () => {
    try { const res = await api.get("/users/me"); setUser(res.data); } catch {}
  };

  const loadFeed = async () => {
    try {
      const res = await api.get("/posts?limit=20&offset=0");
      setPosts(res.data);
      setFeedOffset(20);
      setHasMore(res.data.length === 20);
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

  return (
    <div style={{ fontFamily: "'Archivo', system-ui, sans-serif", WebkitFontSmoothing: "antialiased", background: C.bg, color: C.text, minHeight: "100vh", transition: "background .25s, color .25s" }}>
      <div style={{ display: "flex", justifyContent: "center", maxWidth: 1290, margin: "0 auto" }}>

        {/* Left sidebar — desktop */}
        {!isMobile && (
          <LeftNav C={C} dark={dark} user={user} onCompose={focusComposer} onToggleTheme={toggleTheme} />
        )}

        {/* Center column */}
        <main style={{
          flex: isMobile ? 1 : "none", width: isMobile ? "100%" : "100%", maxWidth: isMobile ? "none" : 600, flexShrink: 0,
          borderLeft: isMobile ? "none" : `1px solid ${C.divider}`,
          borderRight: isMobile ? "none" : `1px solid ${C.divider}`,
          minHeight: "100vh",
          paddingBottom: isMobile ? 74 : 60,
        }}>

          {/* Sticky feed header */}
          <div style={{
            position: "sticky", top: 0, zIndex: 15,
            background: C.barBlur, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            borderBottom: `1px solid ${C.divider}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px" }}>
              <h1 style={{ margin: 0, fontWeight: 900, fontSize: 21, letterSpacing: "0.02em", color: C.text, fontFamily: "'Archivo', sans-serif" }}>Yeniliklər</h1>
              <Link to="/articles" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: C.border, background: "transparent", color: C.textSoft, textDecoration: "none", fontSize: 13.5, fontWeight: 700, fontFamily: "'Archivo', sans-serif" }}>
                <BookOpen size={16} /> Məqalələr
              </Link>
            </div>
            <div style={{ display: "flex", padding: "0 8px" }}>
              {[["foryou", "Sənə uyğun"], ["following", "İzlədiklərin"]].map(([id, label]) => {
                const on = feedTab === id;
                return (
                  <button key={id} onClick={() => setFeedTab(id)} style={{
                    flex: 1, padding: "12px 0", background: "none", border: "none", cursor: "pointer",
                    fontFamily: "'Archivo', sans-serif", fontSize: 14.5, fontWeight: on ? 800 : 600,
                    color: on ? C.text : C.muted, position: "relative",
                  }}>
                    {label}
                    {on && <span style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 48, height: 4, borderRadius: 4, background: C.accent }} />}
                  </button>
                );
              })}
            </div>
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

          {/* Composer */}
          <form ref={composerRef} onSubmit={handlePost} style={{ display: "flex", gap: 14, padding: "18px 20px", borderBottom: `1px solid ${C.divider}` }}>
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
                <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.muted, cursor: "pointer" }}>
                  <input type="checkbox" checked={showDislikes} onChange={e => setShowDislikes(e.target.checked)} style={{ accentColor: C.accent }} />
                  <ThumbsDown size={11} /> göstər
                </label>
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
              post={post} C={C} user={user}
              connectedIds={connectedIds} pendingIds={pendingIds}
              openComments={openComments} comments={comments} commentText={commentText}
              onLike={handleLike} onDislike={handleDislike} onDelete={handleDelete}
              onConnect={handleConnect} onToggleComments={toggleComments}
              onCommentChange={(id, val) => setCommentText({ ...commentText, [id]: val })}
              onSubmitComment={submitComment} onReport={setReportPostId}
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
          <aside style={{ width: 340, flexShrink: 0, padding: "20px 16px 40px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 0, alignSelf: "flex-start", maxHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}>

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
                        <p style={{ fontSize: 12, color: C.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.mutual_count > 0 ? `${s.mutual_count} ümumi bağlantı` : (s.major || "Hash")}</p>
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 11.5, color: C.muted }}>
              {["Haqqında", "Qaydalar", "Məxfilik", "© 2026 Hash"].map(x => (
                <span key={x} style={{ cursor: "pointer" }}>{x}</span>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav C={C} onCompose={focusComposer} />}

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
