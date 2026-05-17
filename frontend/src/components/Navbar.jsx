import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, Menu, X, Heart, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import { useLang } from "../hooks/useLang";

function timeAgo(dateStr, t) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return t("time_now");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("time_min")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("time_hour")}`;
  return `${Math.floor(diff / 86400)} ${t("time_day")}`;
}

function NotificationDropdown({ onClose }) {
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);
  const { t } = useLang();

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
    <div ref={ref} style={{ position: "absolute", right: 0, top: "100%", width: 280, background: "#fff", border: "1px solid #ccc", boxShadow: "0 2px 6px rgba(0,0,0,0.12)", zIndex: 50 }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #ddd", background: "#f7f7f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "#222" }}>{t("notif_title")}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", lineHeight: 1 }}><X size={14} /></button>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {notifs.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "#888", fontSize: 13 }}>{t("notif_empty")}</div>
        ) : notifs.map(n => {
          const cfg = NOTIF_LABELS[n.type] || {};
          const Icon = cfg.icon || Bell;
          return (
            <div key={n.id} style={{ display: "flex", gap: 10, padding: "9px 12px", borderBottom: "1px solid #f0f0f0", background: n.is_read ? "#fff" : "#eef3fb" }}>
              <Icon size={14} style={{ color: "#555", marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: "#222", margin: 0 }}>
                  <strong>{n.from_user_name}</strong>{" "}{cfg.textKey ? t(cfg.textKey) : ""}
                </p>
                <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>{timeAgo(n.created_at, t)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

  const linkStyle = (path, admin) => {
    const isActive = location.pathname === path;
    return {
      display: "inline-block",
      padding: "0 14px",
      lineHeight: "46px",
      fontSize: 13,
      fontWeight: isActive ? 700 : 400,
      color: admin ? (isActive ? "#b91c1c" : "#9a3232") : (isActive ? "#1a4a8a" : "#444"),
      borderBottom: isActive ? `2px solid ${admin ? "#b91c1c" : "#1a4a8a"}` : "2px solid transparent",
      textDecoration: "none",
      whiteSpace: "nowrap",
    };
  };

  return (
    <nav style={{ background: "#fff", borderBottom: "1px solid #c8c8c8", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 48 }}>
        {/* Logo */}
        <Link to="/feed" style={{ fontWeight: 800, fontSize: 15, color: "#1a2a3a", textDecoration: "none", marginRight: 20, letterSpacing: "-0.3px", flexShrink: 0 }}>
          Hash
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ flex: 1, alignItems: "center" }}>
          {links.map(({ path, label, admin }) => (
            <Link key={path} to={path} style={linkStyle(path, admin)}>{label}</Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowNotifs(v => !v); setUnreadCount(0); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 10px", lineHeight: "46px", color: "#555", display: "flex", alignItems: "center", gap: 4, position: "relative" }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 8, right: 4, background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
          </div>
          <button
            onClick={logout}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 10px", lineHeight: "46px", fontSize: 13, color: "#666", display: "flex", alignItems: "center", gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
            onMouseLeave={e => e.currentTarget.style.color = "#666"}
          >
            <LogOut size={14} /> {t("nav_logout")}
          </button>
        </div>

        {/* Mobile right */}
        <div className="md:hidden" style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowNotifs(v => !v); setUnreadCount(0); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 8px", lineHeight: "46px", color: "#555", position: "relative" }}>
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 8, right: 2, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 6px", lineHeight: "46px", color: "#555" }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "8px 0" }}>
          {links.map(({ path, label, admin }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                style={{ display: "block", padding: "10px 20px", fontSize: 13, color: admin ? "#b91c1c" : (isActive ? "#1a4a8a" : "#444"), fontWeight: isActive ? 700 : 400, background: isActive ? "#f0f5ff" : "transparent", textDecoration: "none", borderLeft: isActive ? `3px solid ${admin ? "#b91c1c" : "#1a4a8a"}` : "3px solid transparent" }}
              >
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => { setMobileOpen(false); logout(); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 20px", fontSize: 13, color: "#888", background: "none", border: "none", cursor: "pointer", borderLeft: "3px solid transparent" }}
          >
            {t("nav_logout")}
          </button>
        </div>
      )}
    </nav>
  );
}
