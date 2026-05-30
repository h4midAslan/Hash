import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "./components/Toast";
import FeedbackButton from "./components/FeedbackButton";
import InstallPrompt from "./components/InstallPrompt";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useIsMobile } from "./hooks/useIsMobile";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import api from "./api/client";
import UserAvatar from "./components/UserAvatar";
import {
  Home, Search, Users, MessageSquare, BookOpen, User, Settings, Shield,
  PenSquare, Sun, Moon,
} from "lucide-react";

const Feed = lazy(() => import("./pages/Feed"));
const Profile = lazy(() => import("./pages/Profile"));
const Search_ = lazy(() => import("./pages/Search"));
const Connections = lazy(() => import("./pages/Connections"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings_ = lazy(() => import("./pages/Settings"));
const Messages = lazy(() => import("./pages/Messages"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleEditor = lazy(() => import("./pages/ArticleEditor"));
const ArticleView = lazy(() => import("./pages/ArticleView"));

const ACCENT = "#1E90FF";

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

const NAV_COLORS = {
  dark: {
    bg: "#050f1f", text: "#ffffff", textSoft: "#c4d0e0", muted: "#7d8ba3",
    divider: "rgba(255,255,255,0.07)", barBlur: "rgba(5,15,31,0.88)",
    navActive: "rgba(30,144,255,0.16)", navHover: "rgba(255,255,255,0.05)",
    accent: ACCENT,
  },
  light: {
    bg: "#ffffff", text: "#071428", textSoft: "#3a4861", muted: "#69768d",
    divider: "#edf1f6", barBlur: "rgba(255,255,255,0.88)",
    navActive: "rgba(30,144,255,0.10)", navHover: "#f3f6fb",
    accent: ACCENT,
  },
};

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("dark_mode") === "true";
    document.documentElement.classList.toggle("dark", saved);
    return saved;
  });

  useEffect(() => {
    const handler = () => {
      const isDark = localStorage.getItem("dark_mode") === "true";
      document.documentElement.classList.toggle("dark", isDark);
      setDark(isDark);
    };
    window.addEventListener("dark_mode_change", handler);
    return () => window.removeEventListener("dark_mode_change", handler);
  }, []);

  return dark;
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

function LeftNav({ C, dark, user, onToggleTheme }) {
  const location = useLocation();
  const p = location.pathname;
  const [themeHover, setThemeHover] = useState(false);

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

      {/* Nav items */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, marginTop: 4 }}>
        {navItems.map(item => {
          const active = p === item.to ||
            (item.to !== "/feed" && item.to !== "/profile" && p.startsWith(item.to));
          return <NavItem key={item.to} C={C} to={item.to} icon={item.icon} label={item.label} active={active} />;
        })}
      </nav>

      {/* Compose shortcut */}
      <div style={{ padding: "14px 2px 10px" }}>
        <Link to="/feed" style={{
          display: "block", width: "100%", padding: "13px 0", borderRadius: 99,
          background: ACCENT, color: "#fff", border: "none",
          fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 15,
          cursor: "pointer", letterSpacing: "0.02em", textDecoration: "none",
          boxShadow: "0 4px 16px rgba(30,144,255,0.35)",
          textAlign: "center",
        }}>
          Paylaş
        </Link>
      </div>

      {/* Theme + mini-profile */}
      <div style={{ borderTop: `1px solid ${C.divider}`, padding: "10px 0 18px", display: "flex", flexDirection: "column", gap: 2 }}>
        <button
          onMouseEnter={() => setThemeHover(true)} onMouseLeave={() => setThemeHover(false)}
          onClick={onToggleTheme}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12,
            background: themeHover ? C.navHover : "transparent", border: "none", color: C.textSoft,
            cursor: "pointer", fontFamily: "'Archivo', sans-serif", fontSize: 14.5, fontWeight: 600,
            width: "100%", textAlign: "left", transition: "background .12s",
          }}>
          {dark ? <Sun size={19} /> : <Moon size={19} />}
          {dark ? "Açıq tema" : "Qaranlıq tema"}
        </button>

        {user && (
          <Link to="/profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = C.navHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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

function BottomNav({ C }) {
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
      borderTop: `1px solid ${C.divider}`, display: "flex", alignItems: "stretch",
    }}>
      {items.map((item, i) => {
        const isActive = p === item.path || (item.path !== "/feed" && item.path !== "/profile" && p.startsWith(item.path));
        return (
          <button key={i} onClick={() => navigate(item.path)}
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

function AppShell({ children, adminCheck }) {
  const token = localStorage.getItem("token");
  const dark = useDarkMode();
  const isMobile = useIsMobile(821);
  const [user, setUser] = useState(null);
  const [allowed, setAllowed] = useState(adminCheck ? null : true);
  usePushNotifications();
  useFonts();

  const C = dark ? NAV_COLORS.dark : NAV_COLORS.light;

  useEffect(() => {
    if (!token) return;
    api.get("/users/me").then(r => {
      setUser(r.data);
      if (adminCheck) setAllowed(r.data.is_admin);
    }).catch(() => { if (adminCheck) setAllowed(false); });
  }, [token]);

  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.margin = "0";
    document.body.style.padding = "0";
  }, [C.bg]);

  if (!token) return <Navigate to="/login" />;

  if (adminCheck && allowed === null) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg }}>
      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (adminCheck && !allowed) return <Navigate to="/feed" />;

  const toggleTheme = () => {
    const next = !dark;
    localStorage.setItem("dark_mode", String(next));
    window.dispatchEvent(new Event("dark_mode_change"));
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", fontFamily: "'Archivo', system-ui, sans-serif", WebkitFontSmoothing: "antialiased" }}>
      {!isMobile && <LeftNav C={C} dark={dark} user={user} onToggleTheme={toggleTheme} />}
      <div style={{ flex: 1, minWidth: 0, minHeight: "100vh", paddingBottom: isMobile ? 64 : 0, borderLeft: isMobile ? "none" : `1px solid ${C.divider}` }}>
        <Suspense fallback={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(30,144,255,0.2)", borderTopColor: "#1E90FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        }>
          {children}
        </Suspense>
        <FeedbackButton />
      </div>
      {isMobile && <BottomNav C={C} />}
    </div>
  );
}

function FeedRoute({ children }) {
  const token = localStorage.getItem("token");
  usePushNotifications();
  if (!token) return <Navigate to="/login" />;
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
}

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/feed" element={<FeedRoute><Feed /></FeedRoute>} />
        <Route path="/profile" element={<AppShell><Profile /></AppShell>} />
        <Route path="/profile/:id" element={<AppShell><Profile /></AppShell>} />
        <Route path="/search" element={<AppShell><Search_ /></AppShell>} />
        <Route path="/connections" element={<AppShell><Connections /></AppShell>} />
        <Route path="/messages" element={<AppShell><Messages /></AppShell>} />
        <Route path="/articles" element={<AppShell><Articles /></AppShell>} />
        <Route path="/article/new" element={<AppShell><ArticleEditor /></AppShell>} />
        <Route path="/article/:id/edit" element={<AppShell><ArticleEditor /></AppShell>} />
        <Route path="/article/:id" element={<AppShell><ArticleView /></AppShell>} />
        <Route path="/settings" element={<AppShell><Settings_ /></AppShell>} />
        <Route path="/admin" element={<AppShell adminCheck><Admin /></AppShell>} />
        <Route path="*" element={<Navigate to="/feed" />} />
      </Routes>
    </BrowserRouter>
  );
}
