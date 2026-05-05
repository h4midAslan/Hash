import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Users, User, LogOut, Menu, X, Shield, Settings, Bell, Heart, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import { useDarkMode } from "../hooks/useTheme";
import { useLang } from "../hooks/useLang";

function timeAgo(dateStr, t) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return t("time_now");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("time_min")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("time_hour")}`;
  return `${Math.floor(diff / 86400)} ${t("time_day")}`;
}

function NotificationDropdown({ dark, onClose }) {
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);
  const { t } = useLang();

  const NOTIF_LABELS = {
    connection_request:  { icon: UserPlus,      textKey: "notif_connection_request",  color: "text-blue-500" },
    connection_accepted: { icon: UserCheck,     textKey: "notif_connection_accepted", color: "text-green-500" },
    post_liked:          { icon: Heart,         textKey: "notif_post_liked",          color: "text-red-500" },
    post_commented:      { icon: MessageCircle, textKey: "notif_post_commented",      color: "text-indigo-500" },
  };

  useEffect(() => {
    api.get("/notifications").then(res => setNotifs(res.data)).catch(() => {});
    api.put("/notifications/read-all").catch(() => {});

    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      className={`absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden
        ${dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}
    >
      <div className={`px-4 py-3 border-b ${dark ? "border-gray-700" : "border-gray-100"} flex items-center justify-between`}>
        <span className={`font-bold text-sm ${dark ? "text-white" : "text-gray-900"}`}>{t("notif_title")}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell size={28} className="mx-auto text-gray-300 mb-2" />
            <p className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>{t("notif_empty")}</p>
          </div>
        ) : notifs.map(n => {
          const cfg = NOTIF_LABELS[n.type] || {};
          const Icon = cfg.icon || Bell;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 transition
                ${dark ? "border-gray-800 hover:bg-gray-800" : "border-gray-50 hover:bg-gray-50"}
                ${!n.is_read ? (dark ? "bg-blue-500/5" : "bg-blue-50/40") : ""}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                <Icon size={18} className={cfg.color || "text-gray-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${dark ? "text-gray-200" : "text-gray-800"}`}>
                  <span className="font-semibold">{n.from_user_name}</span>{" "}
                  {cfg.textKey ? t(cfg.textKey) : ""}
                </p>
                <p className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>{timeAgo(n.created_at, t)}</p>
              </div>
              {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
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
  const dark = useDarkMode();
  const { t } = useLang();

  useEffect(() => {
    api.get("/users/me").then(res => setCurrentUser(res.data)).catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = () => {
    api.get("/notifications/unread-count").then(res => setUnreadCount(res.data.count)).catch(() => {});
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleBellClick = () => {
    setShowNotifs(v => !v);
    setUnreadCount(0);
  };

  const links = [
    { path: "/feed", icon: Home, label: t("nav_feed") },
    { path: "/search", icon: Search, label: t("nav_search") },
    { path: "/connections", icon: Users, label: t("nav_connections") },
    { path: "/profile", icon: User, label: t("nav_profile") },
    { path: "/settings", icon: Settings, label: t("nav_settings") },
    ...(currentUser?.is_admin ? [{ path: "/admin", icon: Shield, label: t("nav_admin") }] : []),
  ];

  return (
    <nav className={`${dark ? "bg-gray-900/90 border-gray-700/50" : "bg-white/80 border-gray-200/50"} backdrop-blur-xl border-b sticky top-0 z-50 shadow-sm`}>
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/feed" className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Hash
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            const isAdmin = path === "/admin";
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? isAdmin
                      ? "bg-gradient-to-r from-red-50 to-rose-50 text-red-600 shadow-sm"
                      : dark ? "bg-blue-500/20 text-blue-400 shadow-sm"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm"
                    : isAdmin
                    ? "text-red-400 hover:bg-red-50 hover:text-red-500"
                    : dark ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
                {isActive && (
                  <span className={`absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full ${
                    isAdmin ? "bg-gradient-to-r from-red-500 to-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                  }`} />
                )}
              </Link>
            );
          })}

          <div className={`w-px h-8 ${dark ? "bg-gray-700" : "bg-gray-200"} mx-2`} />

          {/* Bell */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                dark ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && <NotificationDropdown dark={dark} onClose={() => setShowNotifs(false)} />}
          </div>

          <button
            onClick={logout}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${dark ? "text-gray-400 hover:bg-red-500/10 hover:text-red-400" : "text-gray-400 hover:bg-red-50 hover:text-red-500"} transition-all duration-200`}
          >
            <LogOut size={18} />
            <span>{t("nav_logout")}</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <div className="relative">
            <button
              onClick={handleBellClick}
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition ${dark ? "text-gray-400" : "text-gray-500"}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && <NotificationDropdown dark={dark} onClose={() => setShowNotifs(false)} />}
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`p-2 rounded-xl ${dark ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"} transition`}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden ${dark ? "bg-gray-900/95" : "bg-white/95"} backdrop-blur-xl border-t ${dark ? "border-gray-700" : "border-gray-100"} px-4 pb-4 pt-2 space-y-1`}>
          {links.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            const isAdmin = path === "/admin";
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? isAdmin ? "bg-gradient-to-r from-red-50 to-rose-50 text-red-600"
                      : dark ? "bg-blue-500/20 text-blue-400"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600"
                    : isAdmin ? "text-red-400 hover:bg-red-50"
                    : dark ? "text-gray-400 hover:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => { setMobileOpen(false); logout(); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition w-full"
          >
            <LogOut size={20} />
            <span>{t("nav_logout")}</span>
          </button>
        </div>
      )}
    </nav>
  );
}
