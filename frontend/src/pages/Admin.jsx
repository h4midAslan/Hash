import { useState, useEffect } from "react";
import {
  BarChart3, Users, FileText, MessageCircle, Link2, UserCheck,
  Shield, ShieldOff, Ban, CheckCircle, Trash2, Pin, PinOff,
  Search, Heart, Activity, TrendingUp, Calendar, Mail, GraduationCap,
  RefreshCw, ChevronRight, Eye, LogIn, LogOut, UserPlus, Image, Send, Clock, Globe, Flag
} from "lucide-react";
import api from "../api/client";
import { formatBakuDate, formatBakuTime, formatBakuHM } from "../utils/time";
import { toast } from "../components/Toast";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

export default function Admin() {
  const isMobile = useIsMobile();
  const dark = useDarkMode();
  const C = {
    primary: "#1a4a8a",
    text: dark ? "#f3f4f6" : "#1a1a1a",
    muted: dark ? "#9ca3af" : "#666",
    faint: dark ? "#6b7280" : "#999",
    border: dark ? "#374151" : "#d4d4d4",
    bg: dark ? "#111827" : "#f2f2f2",
    white: dark ? "#1f2937" : "#ffffff",
    danger: dark ? "#f87171" : "#dc2626",
    success: dark ? "#34d399" : "#16a34a",
  };
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [logAction, setLogAction] = useState("");
  const [logEmail, setLogEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "posts") loadPosts();
    if (tab === "logs") loadLogs();
    if (tab === "reports") loadReports();
    if (tab === "online") loadOnline();
  }, [tab]);

  const loadOnline = async () => {
    try {
      const res = await api.get("/admin/online");
      setOnlineUsers(res.data);
    } catch (err) {}
  };

  const loadStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {}
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", { params: { q: userSearch } });
      setUsers(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/posts", { params: { q: postSearch } });
      setPosts(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports");
      setReports(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const dismissReports = async (postId) => {
    try {
      await api.post(`/admin/reports/dismiss/${postId}`);
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const deleteReportedPost = async (postId) => {
    if (!confirm("Bu postu silmək istəyirsinizmi? Şikayətlər də silinəcək.")) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      loadReports();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (logAction) params.action = logAction;
      if (logEmail) params.email = logEmail;
      const res = await api.get("/admin/logs", { params });
      setLogs(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const toggleActive = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      loadUsers();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const toggleAdmin = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-admin`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const deleteUser = async (userId, name) => {
    if (!confirm(`"${name}" istifadəçisini silmək istəyirsinizmi?\n\nBu əməliyyat geri qaytarıla bilməz. İstifadəçinin bütün postları, mesajları və bağlantıları da silinəcək.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      loadUsers();
      loadStats();
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const togglePin = async (postId) => {
    try {
      await api.patch(`/admin/posts/${postId}/pin`);
      loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const deletePost = async (postId) => {
    if (!confirm("Bu postu silmək istəyirsinizmi?")) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      loadPosts();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const tabs = [
    { id: "dashboard", icon: BarChart3, label: "Panel" },
    { id: "online", icon: Globe, label: "Onlayn" },
    { id: "users", icon: Users, label: "İstifadəçilər" },
    { id: "posts", icon: FileText, label: "Postlar" },
    { id: "reports", icon: Flag, label: "Şikayətlər" },
    { id: "logs", icon: Activity, label: "Loglar" },
  ];

  const banCount = users.filter(u => !u.is_active).length;
  const adminCount = users.filter(u => u.is_admin).length;

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${C.border}`,
    background: C.white,
    color: C.text,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const flatBtnStyle = (bg, color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 10px",
    background: bg,
    color: color,
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: C.bg }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "12px 8px" : "20px 12px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Admin Panel</h1>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, marginTop: 2 }}>Hash platformasını idarə et</p>
            </div>
          </div>
          <button
            onClick={() => {
              loadStats();
              if (tab === "users") loadUsers();
              if (tab === "posts") loadPosts();
              if (tab === "logs") loadLogs();
              if (tab === "reports") loadReports();
            }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", background: C.white,
              border: `1px solid ${C.border}`, cursor: "pointer",
              fontSize: 13, color: C.muted, fontWeight: 500,
            }}
          >
            <RefreshCw size={14} />
            Yenilə
          </button>
        </div>

        {/* Tabs — classic underline style */}
        <div style={{ display: "flex", borderBottom: `2px solid ${C.border}`, marginBottom: 24, overflowX: "auto", whiteSpace: "nowrap" }}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px",
                background: "none",
                border: "none",
                borderBottom: tab === id ? `2px solid ${C.primary}` : "2px solid transparent",
                marginBottom: -2,
                color: tab === id ? C.primary : C.muted,
                fontWeight: tab === id ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ═══════ DASHBOARD ═══════ */}
        {tab === "dashboard" && (
          <div>
            {stats && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                {[
                  { icon: Users, label: "Ümumi istifadəçi", value: stats.total_users },
                  { icon: UserCheck, label: "Aktiv istifadəçi", value: stats.active_users, subtitle: stats.total_users > 0 ? `${Math.round((stats.active_users / stats.total_users) * 100)}% aktiv` : null },
                  { icon: FileText, label: "Ümumi post", value: stats.total_posts },
                  { icon: Link2, label: "Bağlantı istəyi", value: stats.total_connections },
                  { icon: CheckCircle, label: "Qəbul edilmiş", value: stats.accepted_connections, subtitle: stats.total_connections > 0 ? `${Math.round((stats.accepted_connections / stats.total_connections) * 100)}% qəbul` : null },
                  { icon: MessageCircle, label: "Ümumi mesaj", value: stats.total_messages },
                ].map((card, i) => (
                  <div key={i} style={{ flex: "1 1 calc(33% - 8px)", minWidth: isMobile ? "calc(45% - 6px)" : "calc(33% - 8px)" }}>
                    <StatCard icon={card.icon} label={card.label} value={card.value} subtitle={card.subtitle} dark={dark} />
                  </div>
                ))}
              </div>
            )}

            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div style={{ background: C.white, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Platform xülasəsi</h3>
                    <Activity size={16} color={C.muted} />
                  </div>
                  <OverviewRow label="Orta post/istifadəçi" value={stats.total_users > 0 ? (stats.total_posts / stats.total_users).toFixed(1) : "0"} dark={dark} />
                  <OverviewRow label="Orta mesaj/istifadəçi" value={stats.total_users > 0 ? (stats.total_messages / stats.total_users).toFixed(1) : "0"} dark={dark} />
                  <OverviewRow label="Orta bağlantı/istifadəçi" value={stats.total_users > 0 ? (stats.accepted_connections / stats.total_users).toFixed(1) : "0"} dark={dark} />
                  <OverviewRow label="Bloklanmış istifadəçi" value={stats.total_users - stats.active_users} highlight={stats.total_users - stats.active_users > 0} dark={dark} />
                </div>

                <div style={{ background: C.white, border: `1px solid ${C.border}`, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Sürətli əməliyyatlar</h3>
                    <TrendingUp size={16} color={C.faint} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <QuickAction icon={Users} label="İstifadəçiləri idarə et" count={stats.total_users} onClick={() => setTab("users")} dark={dark} />
                    <QuickAction icon={FileText} label="Postları idarə et" count={stats.total_posts} onClick={() => setTab("posts")} dark={dark} />
                    <QuickAction icon={Ban} label="Bloklanmış hesablar" count={stats.total_users - stats.active_users} onClick={() => setTab("users")} warning={stats.total_users - stats.active_users > 0} dark={dark} />
                  </div>
                </div>
              </div>
            )}

            {!stats && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <div style={{
                  width: 28, height: 28, border: `3px solid ${C.border}`,
                  borderTopColor: C.primary, borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              </div>
            )}
          </div>
        )}

        {/* ═══════ ONLINE ═══════ */}
        {tab === "online" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Hal-hazırda onlayn</h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>Son 3 dəqiqə ərzində aktiv olan istifadəçilər</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: dark ? "#052e16" : "#f0faf0", border: dark ? "1px solid #374151" : "1px solid #b6e2b6",
                  padding: "5px 12px", fontSize: 13, fontWeight: 700, color: dark ? "#34d399" : "#166534",
                }}>
                  <span style={{
                    width: 8, height: 8, background: "#16a34a", borderRadius: "50%",
                    display: "inline-block",
                  }} />
                  {onlineUsers.length} onlayn
                </div>
                <button
                  onClick={loadOnline}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", background: C.white,
                    border: `1px solid ${C.border}`, cursor: "pointer",
                    fontSize: 12, color: C.muted,
                  }}
                >
                  <RefreshCw size={13} /> Yenilə
                </button>
              </div>
            </div>

            {onlineUsers.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 0",
                background: C.white, border: `1px solid ${C.border}`,
              }}>
                <Globe size={32} color={C.faint} style={{ display: "block", margin: "0 auto 10px" }} />
                <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>Hal-hazırda onlayn istifadəçi yoxdur</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {onlineUsers.map((u, idx) => {
                  const pageLabels = {
                    "/feed": "Feed-ə baxır",
                    "/search": "Axtarış edir",
                    "/connections": "Bağlantılara baxır",
                    "/settings": "Parametrlərə baxır",
                    "/messages": "Mesajlara baxır",
                    "/admin": "Admin paneldədir",
                  };
                  const pageLabel = u.last_page
                    ? (pageLabels[u.last_page] || (u.last_page.startsWith("/profile") ? "Profilə baxır" : u.last_page))
                    : "Naviqasiya edir";
                  const seenSec = u.last_seen ? Math.floor((Date.now() - new Date(u.last_seen)) / 1000) : null;
                  const seenLabel = seenSec === null ? "" : seenSec < 60 ? `${seenSec}s əvvəl` : `${Math.floor(seenSec / 60)}dəq əvvəl`;

                  return (
                    <div
                      key={u.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px",
                        background: idx % 2 === 0 ? C.white : (dark ? "#161d2a" : "#f9f9f9"),
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: 38, height: 38, background: C.primary,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 16,
                        }}>
                          {u.full_name?.charAt(0)}
                        </div>
                        <span style={{
                          position: "absolute", bottom: -2, right: -2,
                          width: 11, height: 11, background: "#16a34a",
                          border: "2px solid #fff", borderRadius: "50%", display: "block",
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: C.text }}>{u.full_name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: dark ? "#60a5fa" : C.primary,
                          background: dark ? "#1f2937" : "#eef3fa", padding: "3px 8px",
                          border: `1px solid ${dark ? "#374151" : "#c5d5ea"}`,
                        }}>{pageLabel}</span>
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: C.faint }}>{seenLabel}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════ USERS ═══════ */}
        {tab === "users" && (
          <div>
            {/* Search + meta */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <form
                onSubmit={(e) => { e.preventDefault(); loadUsers(); }}
                style={{ flex: 1, minWidth: 200, position: "relative" }}
              >
                <Search size={15} color={C.faint} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Ad ilə axtar..."
                  style={{ ...inputStyle, paddingLeft: 32 }}
                />
              </form>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", background: C.white, border: `1px solid ${C.border}`,
                  fontSize: 12, fontWeight: 600, color: C.muted,
                }}>
                  <Users size={13} /> {users.length} istifadəçi
                </span>
                {adminCount > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", background: C.primary,
                    fontSize: 12, fontWeight: 600, color: "#fff",
                  }}>
                    <Shield size={13} /> {adminCount} admin
                  </span>
                )}
                {banCount > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", background: "#fff5f5", border: "1px solid #fca5a5",
                    fontSize: 12, fontWeight: 600, color: C.danger,
                  }}>
                    <Ban size={13} /> {banCount} blok
                  </span>
                )}
              </div>
            </div>

            {/* User Table */}
            <div style={{ overflowX: "auto" }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, minWidth: 600 }}>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "3fr 2fr 1.5fr 1.5fr 1.5fr",
                padding: "8px 16px", background: dark ? "#111827" : "#f5f5f5",
                borderBottom: `1px solid ${C.border}`,
                fontSize: 11, fontWeight: 700, color: C.muted,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                <div>İstifadəçi</div>
                <div>İxtisas</div>
                <div>Status</div>
                <div>Qeydiyyat</div>
                <div style={{ textAlign: "right" }}>Əməliyyat</div>
              </div>

              {loading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
                  <div style={{
                    width: 24, height: 24, border: `3px solid ${C.border}`,
                    borderTopColor: C.primary, borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                </div>
              )}

              {!loading && users.map((user, index) => (
                <div key={user.id}>
                  <div
                    style={{
                      display: "grid", gridTemplateColumns: "3fr 2fr 1.5fr 1.5fr 1.5fr",
                      padding: "10px 16px", alignItems: "center",
                      background: index % 2 === 0 ? C.white : (dark ? "#161d2a" : "#f9f9f9"),
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {/* User info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, flexShrink: 0,
                        background: !user.is_active ? "#9ca3af" : user.is_admin ? C.primary : "#2563eb",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: 14,
                      }}>
                        {user.full_name?.charAt(0)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user.full_name}
                          </p>
                          {user.is_admin && (
                            <span style={{
                              background: C.primary, color: "#fff",
                              fontSize: 9, padding: "1px 5px", fontWeight: 700,
                            }}>ADMIN</span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                      </div>
                    </div>

                    {/* Major */}
                    <div>
                      {user.major
                        ? <span style={{ fontSize: 12, color: C.text }}>{user.major}</span>
                        : <span style={{ fontSize: 12, color: C.faint }}>—</span>
                      }
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, padding: "3px 8px", fontWeight: 600,
                        background: !user.is_verified ? "#fffbeb" : user.is_active ? "#f0faf0" : "#fff5f5",
                        color: !user.is_verified ? "#92400e" : user.is_active ? C.success : C.danger,
                        border: `1px solid ${!user.is_verified ? "#fcd34d" : user.is_active ? "#b6e2b6" : "#fca5a5"}`,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: !user.is_verified ? "#f59e0b" : user.is_active ? C.success : C.danger, display: "inline-block",
                        }} />
                        {!user.is_verified ? "Təsdiqlənməyib" : user.is_active ? "Aktiv" : "Bloklanıb"}
                      </span>
                    </div>

                    {/* Date */}
                    <div>
                      <span style={{ fontSize: 11, color: C.muted }}>{formatBakuDate(user.created_at)}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                        style={{ ...flatBtnStyle("#f5f5f5", C.muted), padding: "5px 8px" }}
                        title="Bax"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => toggleActive(user.id)}
                        style={{
                          ...flatBtnStyle(
                            user.is_active ? "#fff7ed" : "#f0faf0",
                            user.is_active ? "#c2410c" : C.success
                          ),
                          padding: "5px 8px",
                          border: `1px solid ${user.is_active ? "#fed7aa" : "#b6e2b6"}`,
                        }}
                        title={user.is_active ? "Blokla" : "Aktiv et"}
                      >
                        {user.is_active ? <Ban size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <button
                        onClick={() => toggleAdmin(user.id)}
                        style={{
                          ...flatBtnStyle(
                            user.is_admin ? "#f0f4ff" : "#eef3fa",
                            user.is_admin ? "#4338ca" : C.primary
                          ),
                          padding: "5px 8px",
                          border: `1px solid ${user.is_admin ? "#c7d2fe" : "#c5d5ea"}`,
                        }}
                        title={user.is_admin ? "Admin çıxar" : "Admin et"}
                      >
                        {user.is_admin ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id, user.full_name)}
                        style={{ ...flatBtnStyle("#fff5f5", C.danger), padding: "5px 8px", border: "1px solid #fca5a5" }}
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {selectedUser?.id === user.id && (
                    <div style={{
                      padding: "14px 16px",
                      background: dark ? "#111827" : "#f5f7fa",
                      borderBottom: `1px solid ${C.border}`,
                      borderTop: `1px solid ${C.border}`,
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16 }}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.faint }}>Email</p>
                          <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                            <Mail size={12} color={C.muted} /> {user.email}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.faint }}>İxtisas</p>
                          <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                            <GraduationCap size={12} color={C.muted} /> {user.major || "—"}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.faint }}>Kurs</p>
                          <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 600 }}>
                            {user.course ? `${user.course}-ci kurs` : "—"}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.faint }}>Qeydiyyat tarixi</p>
                          <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                            <Calendar size={12} color={C.muted} /> {formatBakuDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                        <span style={{
                          fontSize: 11, padding: "3px 8px", fontWeight: 600,
                          background: user.is_open_for_team ? (dark ? "#052e16" : "#f0faf0") : (dark ? "#1f2937" : "#f5f5f5"),
                          color: user.is_open_for_team ? C.success : C.muted,
                          border: `1px solid ${user.is_open_for_team ? (dark ? "#374151" : "#b6e2b6") : C.border}`,
                        }}>
                          {user.is_open_for_team ? "Komanda üçün açıq" : "Komanda üçün bağlı"}
                        </span>
                        <span style={{
                          fontSize: 11, padding: "3px 8px", fontWeight: 600,
                          background: user.is_admin ? C.primary : (dark ? "#1f2937" : "#f5f5f5"),
                          color: user.is_admin ? "#fff" : C.muted,
                        }}>
                          {user.is_admin ? "Admin" : "Normal istifadəçi"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!loading && users.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <Users size={28} color={C.faint} style={{ display: "block", margin: "0 auto 10px" }} />
                  <p style={{ margin: 0, color: C.muted, fontWeight: 600, fontSize: 14 }}>İstifadəçi tapılmadı</p>
                  <p style={{ margin: "4px 0 0", color: C.faint, fontSize: 12 }}>Axtarış sorğunuzu dəyişin</p>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* ═══════ POSTS ═══════ */}
        {tab === "posts" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <form
                onSubmit={(e) => { e.preventDefault(); loadPosts(); }}
                style={{ flex: 1, minWidth: 200, position: "relative" }}
              >
                <Search size={15} color={C.faint} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder="Post içəriğində axtar..."
                  style={{ ...inputStyle, paddingLeft: 32 }}
                />
              </form>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", background: C.white, border: `1px solid ${C.border}`,
                fontSize: 12, fontWeight: 600, color: C.muted,
              }}>
                <FileText size={13} /> {posts.length} post
              </span>
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <div style={{
                  width: 24, height: 24, border: `3px solid ${C.border}`,
                  borderTopColor: C.primary, borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!loading && posts.map((post, idx) => (
                <div
                  key={post.id}
                  style={{ background: C.white, border: `1px solid ${C.border}` }}
                >
                  {/* Post header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderBottom: `1px solid #ebebeb`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, background: C.primary,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {post.author_name?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: C.text }}>{post.author_name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted, marginTop: 1 }}>
                          <span>{formatBakuDate(post.created_at)}</span>
                          <span>·</span>
                          <span>{formatBakuHM(post.created_at)}</span>
                          <span>·</span>
                          <span>ID: {post.id}</span>
                        </div>
                      </div>
                    </div>
                    {post.is_pinned && (
                      <span style={{
                        fontSize: 10, padding: "2px 8px", fontWeight: 700,
                        background: "#fffbeb", color: "#92400e",
                        border: "1px solid #fde68a", textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        Sabit
                      </span>
                    )}
                  </div>

                  {/* Post content */}
                  {post.content && (
                    <div style={{ padding: "10px 16px" }}>
                      <p style={{ margin: 0, color: C.text, fontSize: 13, lineHeight: 1.6 }}>
                        {post.content.length > 300 ? post.content.slice(0, 300) + "..." : post.content}
                      </p>
                    </div>
                  )}

                  {/* Post footer */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 16px", background: dark ? "#111827" : "#f9f9f9", borderTop: `1px solid ${C.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.muted }}>
                        <Heart size={13} color="#dc2626" />
                        {post.like_count} bəyəni
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.muted }}>
                        <MessageCircle size={13} color="#2563eb" />
                        {post.comment_count} şərh
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => togglePin(post.id)}
                        style={{
                          ...flatBtnStyle(
                            post.is_pinned ? "#fffbeb" : "#f5f5f5",
                            post.is_pinned ? "#92400e" : C.muted
                          ),
                          border: `1px solid ${post.is_pinned ? "#fde68a" : C.border}`,
                        }}
                      >
                        {post.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
                        {post.is_pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        style={{ ...flatBtnStyle(C.danger, "#fff"), border: "none" }}
                      >
                        <Trash2 size={12} />
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!loading && posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <FileText size={32} color={C.faint} style={{ display: "block", margin: "0 auto 10px" }} />
                <p style={{ margin: 0, color: C.text, fontWeight: 600, fontSize: 15 }}>Post tapılmadı</p>
                <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>Axtarış sorğunuzu dəyişin</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════ REPORTS ═══════ */}
        {tab === "reports" && (
          <div>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                <div style={{
                  width: 24, height: 24, border: `3px solid #fca5a5`,
                  borderTopColor: C.danger, borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              </div>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <CheckCircle size={32} color={C.success} style={{ display: "block", margin: "0 auto 10px" }} />
                <p style={{ margin: 0, color: C.text, fontWeight: 600, fontSize: 15 }}>Açıq şikayət yoxdur</p>
                <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>Hər şey səliqəlidir</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reports.map((r) => (
                  <div
                    key={r.post_id}
                    style={{ background: C.white, border: `1px solid #fca5a5` }}
                  >
                    {/* Report header */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 16px", background: dark ? "#1f1010" : "#fff5f5", borderBottom: dark ? "1px solid #374151" : "1px solid #fca5a5",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, background: C.danger,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Flag size={13} color="#fff" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.danger }}>{r.report_count} şikayət</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#b91c1c" }}>
                            Son: {formatBakuDate(r.latest_reported_at)} · {formatBakuHM(r.latest_reported_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Report body */}
                    <div style={{ padding: "12px 16px" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 11, color: C.faint }}>Müəllif</p>
                      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: C.text }}>{r.author_name}</p>

                      {r.post_content && (
                        <p style={{ margin: "0 0 10px", color: C.text, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {r.post_content.length > 300 ? r.post_content.slice(0, 300) + "..." : r.post_content}
                        </p>
                      )}

                      {r.post_image_url && (
                        <div style={{ marginBottom: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                          <img src={r.post_image_url} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
                        </div>
                      )}

                      {r.post_video_url && (
                        <div style={{ marginBottom: 10, border: `1px solid ${C.border}`, background: "#000" }}>
                          <video src={r.post_video_url} controls style={{ width: "100%", maxHeight: 240, display: "block" }} />
                        </div>
                      )}

                      {r.reasons.length > 0 && (
                        <div style={{
                          marginTop: 10, background: dark ? "#111827" : "#f9f9f9",
                          border: `1px solid ${C.border}`, padding: "10px 14px",
                        }}>
                          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.muted }}>Səbəblər:</p>
                          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                            {r.reasons.map((reason, i) => (
                              <li key={i} style={{ fontSize: 13, color: C.text, padding: "2px 0" }}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Report actions */}
                    <div style={{
                      display: "flex", gap: 8, justifyContent: "flex-end",
                      padding: "10px 16px", background: dark ? "#111827" : "#f9f9f9", borderTop: `1px solid ${C.border}`,
                    }}>
                      <button
                        onClick={() => dismissReports(r.post_id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 14px", background: C.white,
                          border: `1px solid ${C.border}`, cursor: "pointer",
                          fontSize: 13, fontWeight: 500, color: C.text,

                        }}
                      >
                        <CheckCircle size={14} />
                        Rədd et
                      </button>
                      <button
                        onClick={() => deleteReportedPost(r.post_id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 14px", background: C.danger,
                          border: "none", cursor: "pointer",
                          fontSize: 13, fontWeight: 600, color: "#fff",
                        }}
                      >
                        <Trash2 size={14} />
                        Postu sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ LOGS ═══════ */}
        {tab === "logs" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <select
                value={logAction}
                onChange={(e) => setLogAction(e.target.value)}
                style={{ ...inputStyle, width: isMobile ? "100%" : "auto", padding: "7px 10px" }}
              >
                <option value="">Bütün əməliyyatlar</option>
                <option value="login_success">Uğurlu giriş</option>
                <option value="login_failed">Uğursuz giriş</option>
                <option value="register">Qeydiyyat</option>
              </select>
              <form
                onSubmit={(e) => { e.preventDefault(); loadLogs(); }}
                style={{ flex: 1, minWidth: 180, display: "flex", gap: 8 }}
              >
                <div style={{ flex: 1, position: "relative" }}>
                  <Search size={14} color={C.faint} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={logEmail}
                    onChange={(e) => setLogEmail(e.target.value)}
                    placeholder="Email ilə axtar..."
                    style={{ ...inputStyle, paddingLeft: 28 }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: "7px 16px", background: C.primary, color: "#fff",
                    border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}
                >
                  Filtrələ
                </button>
              </form>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", background: C.white, border: `1px solid ${C.border}`,
                fontSize: 12, fontWeight: 600, color: C.muted,
              }}>
                <Activity size={13} /> {logs.length} log
              </span>
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <div style={{
                  width: 24, height: 24, border: `3px solid ${C.border}`,
                  borderTopColor: C.primary, borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              </div>
            )}

            {/* Logs table */}
            {!loading && (
              <div style={{ overflowX: "auto" }}>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, minWidth: 600 }}>
                {/* Table header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 1.5fr 2fr 1.5fr 2fr",
                  padding: "8px 16px", background: dark ? "#111827" : "#f5f5f5",
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  <div>İstifadəçi</div>
                  <div>Əməliyyat</div>
                  <div>Vaxt</div>
                  <div>IP</div>
                  <div>Ətraflı</div>
                </div>

                {logs.map((log, i) => (
                  <LogRow key={log.id} log={log} isLast={i === logs.length - 1} isEven={i % 2 === 0} dark={dark} />
                ))}

                {logs.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <Activity size={28} color={C.faint} style={{ display: "block", margin: "0 auto 10px" }} />
                    <p style={{ margin: 0, color: C.muted, fontWeight: 600, fontSize: 14 }}>Log qeydi yoxdur</p>
                    <p style={{ margin: "4px 0 0", color: C.faint, fontSize: 12 }}>Filtri dəyişin və ya yenilə</p>
                  </div>
                )}
              </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}


/* ─── Log Row ─── */
const actionMeta = {
  login_success: { label: "Uğurlu giriş", icon: LogIn, color: "#16a34a", bg: "#f0faf0", border: "#b6e2b6" },
  login_failed: { label: "Uğursuz giriş", icon: Ban, color: "#dc2626", bg: "#fff5f5", border: "#fca5a5" },
  register: { label: "Qeydiyyat", icon: UserPlus, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  profile_picture_update: { label: "Profil şəkli", icon: Image, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  message_send: { label: "Mesaj", icon: Send, color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

function LogRow({ log, isLast, isEven, dark }) {
  const meta = actionMeta[log.action] || {
    label: log.action, icon: Activity,
    color: dark ? "#9ca3af" : "#666", bg: dark ? "#1f2937" : "#f5f5f5", border: dark ? "#374151" : "#d4d4d4",
  };
  const Icon = meta.icon;
  const date = formatBakuDate(log.created_at);
  const time = formatBakuTime(log.created_at);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 1.5fr 2fr 1.5fr 2fr",
      padding: "9px 16px", alignItems: "center",
      background: isEven ? (dark ? "#1f2937" : "#ffffff") : (dark ? "#161d2a" : "#f9f9f9"),
      borderBottom: isLast ? "none" : (dark ? "1px solid #374151" : "1px solid #ebebeb"),
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: dark ? "#f3f4f6" : "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {log.full_name || "—"}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: dark ? "#9ca3af" : "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {log.email || "—"}
        </p>
      </div>
      <div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, padding: "3px 7px", fontWeight: 600,
          background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
        }}>
          <Icon size={11} />
          {meta.label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: dark ? "#9ca3af" : "#666" }}>
        <Clock size={12} color={dark ? "#6b7280" : "#999"} />
        <span style={{ fontWeight: 600, color: dark ? "#f3f4f6" : "#1a1a1a" }}>{date}</span>
        <span style={{ color: dark ? "#6b7280" : "#999" }}>{time}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: dark ? "#9ca3af" : "#666", fontFamily: "monospace" }}>
        <Globe size={11} color={dark ? "#6b7280" : "#999"} />
        {log.ip_address || "—"}
      </div>
      <div style={{ fontSize: 11, color: dark ? "#6b7280" : "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        title={log.user_agent || log.details || ""}>
        {log.details || (log.user_agent ? log.user_agent.split(" ")[0] : "—")}
      </div>
    </div>
  );
}


/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, subtitle, dark }) {
  return (
    <div style={{
      background: dark ? "#1f2937" : "#ffffff",
      border: dark ? "1px solid #374151" : "1px solid #d4d4d4",
      padding: "14px 18px",
      height: "100%",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, background: "#1a4a8a",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color="#fff" />
        </div>
        {subtitle && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: dark ? "#60a5fa" : "#1a4a8a",
            background: dark ? "#1f2937" : "#eef3fa", padding: "2px 7px", border: dark ? "1px solid #374151" : "1px solid #c5d5ea",
          }}>{subtitle}</span>
        )}
      </div>
      <p style={{ margin: "0 0 2px", fontSize: 28, fontWeight: 700, color: dark ? "#f3f4f6" : "#1a1a1a", lineHeight: 1 }}>{value}</p>
      <p style={{ margin: 0, fontSize: 12, color: dark ? "#9ca3af" : "#666" }}>{label}</p>
    </div>
  );
}


/* ─── Overview Row ─── */
function OverviewRow({ label, value, highlight, dark }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0", borderBottom: dark ? "1px solid #374151" : "1px solid #ebebeb",
    }}>
      <span style={{ fontSize: 13, color: dark ? "#9ca3af" : "#666" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: highlight ? (dark ? "#f87171" : "#dc2626") : (dark ? "#f3f4f6" : "#1a1a1a") }}>{value}</span>
    </div>
  );
}


/* ─── Quick Action ─── */
function QuickAction({ icon: Icon, label, count, onClick, warning, dark }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", cursor: "pointer", textAlign: "left",
        background: warning ? (dark ? "#1f1010" : "#fff5f5") : (dark ? "#111827" : "#f5f5f5"),
        border: `1px solid ${warning ? (dark ? "#374151" : "#fca5a5") : (dark ? "#374151" : "#d4d4d4")}`,
      }}
    >
      <div style={{
        width: 32, height: 32,
        background: warning ? (dark ? "#2a1010" : "#fee2e2") : (dark ? "#1f2937" : "#ffffff"),
        border: `1px solid ${warning ? (dark ? "#374151" : "#fca5a5") : (dark ? "#374151" : "#d4d4d4")}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: warning ? (dark ? "#f87171" : "#dc2626") : (dark ? "#9ca3af" : "#666"), flexShrink: 0,
      }}>
        <Icon size={15} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: warning ? (dark ? "#f87171" : "#991b1b") : (dark ? "#f3f4f6" : "#1a1a1a") }}>{label}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: warning ? (dark ? "#f87171" : "#dc2626") : (dark ? "#f3f4f6" : "#1a1a1a") }}>{count}</span>
        <ChevronRight size={14} color={dark ? "#6b7280" : "#999"} />
      </div>
    </button>
  );
}
