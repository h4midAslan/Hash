import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, Menu, X, Heart, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import { useLang } from "../hooks/useLang";
import { useDarkMode } from "../hooks/useTheme";

const ACCENT = "#1E90FF";

function timeAgo(dateStr, t) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return t("time_now");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("time_min")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("time_hour")}`;
  return `${Math.floor(diff / 86400)} ${t("time_day")}`;
}

function NotificationDropdown({ onClose, dark }) {
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);
  const { t } = useLang();

  const bg = dark ? "#0a1c39" : "#ffffff";
  const border = dark ? "1px solid #1a2b49" : "1px solid #e4e9f1";
  const textColor = dark ? "#ffffff" : "#071428";
  const mutedColor = dark ? "#7d8ba3" : "#69768d";
  const unreadBg = dark ? "rgba(30,144,255,0.10)" : "rgba(30,144,255,0.06)";
  const divider = dark ? "rgba(255,255,255,0.07)" : "#edf1f6";

  const NOTIF_LABELS = {
    connection_request:  { icon: UserPlus,      textKey: "notif_connection_request" },
    connection_accepted: { icon: UserCheck,     textKey: "notif_connection_accepted" },
    post_liked:          { icon: Heart,         textKey: "notif_post_liked" },
    post_commented:      { icon: MessageCircle, textKey: "notif_post_commented" },
  };

  useEffect(() => {
    api.get("/notifications").then(res => setNotifs(res.data)).catch(() => {});
    api.put("/notifications/read-all").catch(() => {});
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{
      position: "absolute", right: 0, top: "calc(100% + 8px)",
      width: 300, background: bg, border, borderRadius: 16,
      boxShadow: dark ? "0 16px 48px rgba(0,0,0,0.5)" : "0 8px 32px rgba(7,20,40,0.12)",
      zIndex: 50, overflow: "hidden",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 900, fontSize: 15, color: textColor, fontFamily: "'Archivo', sans-serif", letterSpacing: "0.02em" }}>{t("notif_title")}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: mutedColor, lineHeight: 1, padding: 4 }}><X size={15} /></button>
      </div>
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {notifs.length === 0 ? (
          <div style={{ padding: "28px 16px", textAlign: "center", color: mutedColor, fontSize: 13, fontFamily: "'Archivo', sans-serif" }}>{t("notif_empty")}</div>
        ) : notifs.map(n => {
          const cfg = NOTIF_LABELS[n.type] || {};
          const Icon = cfg.icon || Bell;
          return (
            <div key={n.id} style={{ display: "flex", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${divider}`, background: n.is_read ? "transparent" : unreadBg }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `rgba(30,144,255,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={14} style={{ color: ACCENT }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: textColor, margin: 0, lineHeight: 1.5, fontFamily: "'Archivo', sans-serif" }}>
                  <strong>{n.from_user_name}</strong>{" "}{cfg.textKey ? t(cfg.textKey) : ""}
                </p>
                <p style={{ fontSize: 11, color: mutedColor, margin: "3px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>{timeAgo(n.created_at, t)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavLink({ path, label, admin, isActive, onClick }) {
  const [hover, setHover] = useState(false);
  const activeColor = admin ? "#f87171" : ACCENT;
  const col = isActive ? activeColor : hover ? "#ffffff" : "rgba(255,255,255,0.65)";
  return (
    <Link
      to={path}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", padding: "0 14px",
        height: "100%", fontSize: 14, fontWeight: isActive ? 800 : 600,
        color: col, textDecoration: "none", position: "relative",
        fontFamily: "'Archivo', sans-serif", letterSpacing: "0.01em",
        transition: "color .15s", whiteSpace: "nowrap",
      }}
    >
      {label}
      {isActive && (
        <span style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: 32, height: 3, borderRadius: 3, background: activeColor,
        }} />
      )}
    </Link>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const { t } = useLang();
  const dark = useDarkMode();

  const bg = dark ? "rgba(5,15,31,0.92)" : "rgba(255,255,255,0.92)";
  const border = dark ? "rgba(255,255,255,0.07)" : "#e4e9f1";
  const mutedColor = dark ? "rgba(255,255,255,0.55)" : "#69768d";

  useEffect(() => {
    if (document.getElementById("hash-fonts")) return;
    const link = document.createElement("link");
    link.id = "hash-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,800&family=JetBrains+Mono:wght@500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    api.get("/users/me").then(res => setCurrentUser(res.data)).catch(() => {});
    fetchUnread();
    const sendHeartbeat = () => api.post("/users/me/heartbeat", { page: window.location.pathname }).catch(() => {});
    sendHeartbeat();
    const interval = setInterval(() => { fetchUnread(); sendHeartbeat(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = () => {
    api.get("/notifications/unread-count").then(res => setUnreadCount(res.data.count)).catch(() => {});
  };

  const logout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const links = [
    { path: "/feed",        label: t("nav_feed") },
    { path: "/search",      label: t("nav_search") },
    { path: "/connections", label: t("nav_connections") },
    { path: "/messages",    label: t("nav_messages") },
    { path: "/profile",     label: t("nav_profile") },
    { path: "/settings",    label: t("nav_settings") },
    ...(currentUser?.is_admin ? [{ path: "/admin", label: t("nav_admin"), admin: true }] : []),
  ];

  const iconBtn = (onClick, children, badge) => (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer", padding: "0 10px",
      height: "100%", color: mutedColor, display: "flex", alignItems: "center",
      position: "relative", transition: "color .15s",
    }}
      onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
      onMouseLeave={e => e.currentTarget.style.color = mutedColor}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: "absolute", top: 10, right: 4, minWidth: 16, height: 16,
          background: ACCENT, color: "#fff", fontSize: 10, fontWeight: 800,
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 3px", boxShadow: `0 0 0 2px ${dark ? "#050f1f" : "#fff"}`,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{badge > 9 ? "9+" : badge}</span>
      )}
    </button>
  );

  return (
    <nav style={{
      background: bg,
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${border}`,
      position: "sticky", top: 0, zIndex: 100,
      fontFamily: "'Archivo', sans-serif",
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 60 }}>

        {/* Logo */}
        <Link to="/feed" style={{ textDecoration: "none", marginRight: 16, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: ACCENT,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: 22, lineHeight: 1,
            boxShadow: `0 4px 14px rgba(30,144,255,0.40)`,
            fontFamily: "'Archivo', sans-serif",
          }}>#</div>
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: "0.06em", color: dark ? "#ffffff" : "#071428" }}>HASH</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ flex: 1, alignItems: "center", height: "100%" }}>
          {links.map(({ path, label, admin }) => (
            <NavLink key={path} path={path} label={label} admin={admin} isActive={location.pathname === path} />
          ))}
        </div>

        {/* Right side — desktop */}
        <div className="hidden md:flex" style={{ alignItems: "center", height: "100%", marginLeft: "auto", gap: 2 }}>
          {/* Instagram */}
          <a href="https://www.instagram.com/hashcampus_official/" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", padding: "0 10px", height: "100%", color: mutedColor, textDecoration: "none", transition: "color .15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#e1306c"}
            onMouseLeave={e => e.currentTarget.style.color = mutedColor}
            title="Instagram">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
          </a>

          {/* Notifications */}
          <div style={{ position: "relative", height: "100%", display: "flex" }}>
            {iconBtn(() => { setShowNotifs(v => !v); setUnreadCount(0); }, <Bell size={18} />, unreadCount)}
            {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} dark={dark} />}
          </div>

          {/* Logout */}
          <button onClick={logout} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 10, border: `1px solid ${border}`, background: "transparent",
            cursor: "pointer", color: mutedColor, fontSize: 13.5, fontWeight: 700,
            fontFamily: "inherit", transition: "color .15s, border-color .15s", marginLeft: 4,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.color = mutedColor; e.currentTarget.style.borderColor = border; }}>
            <LogOut size={15} /> {t("nav_logout")}
          </button>
        </div>

        {/* Mobile right */}
        <div className="md:hidden" style={{ display: "flex", alignItems: "center", height: "100%", marginLeft: "auto", gap: 2 }}>
          <div style={{ position: "relative", height: "100%", display: "flex" }}>
            {iconBtn(() => { setShowNotifs(v => !v); setUnreadCount(0); }, <Bell size={19} />, unreadCount)}
            {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} dark={dark} />}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "0 8px",
            height: "100%", color: dark ? "rgba(255,255,255,0.7)" : "#444", display: "flex", alignItems: "center",
          }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{
          background: dark ? "#050f1f" : "#ffffff",
          borderTop: `1px solid ${border}`,
          padding: "8px 0 12px",
        }}>
          {links.map(({ path, label, admin }) => {
            const isActive = location.pathname === path;
            const activeColor = admin ? "#f87171" : ACCENT;
            return (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)} style={{
                display: "flex", alignItems: "center", padding: "12px 20px",
                fontSize: 15, fontWeight: isActive ? 800 : 600,
                color: isActive ? activeColor : (dark ? "rgba(255,255,255,0.75)" : "#3a4861"),
                background: isActive ? (dark ? "rgba(30,144,255,0.10)" : "rgba(30,144,255,0.06)") : "transparent",
                textDecoration: "none",
                borderLeft: `3px solid ${isActive ? activeColor : "transparent"}`,
                fontFamily: "'Archivo', sans-serif", transition: "background .15s",
              }}>
                {label}
              </Link>
            );
          })}
          <a href="https://www.instagram.com/hashcampus_official/" target="_blank" rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", fontSize: 15, color: dark ? "rgba(255,255,255,0.55)" : "#69768d", textDecoration: "none", borderLeft: "3px solid transparent", fontFamily: "'Archivo', sans-serif" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
            Instagram
          </a>
          <button onClick={() => { setMobileOpen(false); logout(); }} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
            padding: "12px 20px", fontSize: 15, color: "#f87171", background: "none",
            border: "none", cursor: "pointer", borderLeft: "3px solid transparent",
            fontFamily: "'Archivo', sans-serif", fontWeight: 600,
          }}>
            <LogOut size={15} /> {t("nav_logout")}
          </button>
        </div>
      )}
    </nav>
  );
}
