import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, Users, Clock, UserCheck, UserMinus, UserPlus, Sparkles } from "lucide-react";
import api from "../api/client";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { useDarkMode } from "../hooks/useTheme";

const TABS = [
  { key: "my", icon: UserCheck, labelKey: "connections_yours" },
  { key: "pending", icon: Clock, labelKey: "connections_pending" },
  { key: "suggested", icon: Sparkles, label: "Tövsiyyə" },
];

function Avatar({ name, picture, size = 56 }) {
  const colors = ["#1a4a8a", "#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.38,
    }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

function SkillChips({ skills, dark }) {
  if (!skills) return null;
  let arr = [];
  try { arr = typeof skills === "string" ? JSON.parse(skills) : skills; } catch { return null; }
  if (!arr?.length) return null;
  const shown = arr.slice(0, 3);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
      {shown.map((s, i) => (
        <span key={i} style={{
          fontSize: 11, padding: "2px 8px",
          borderRadius: 99, fontWeight: 500,
          background: dark ? "rgba(37,99,235,0.18)" : "#eff6ff",
          color: dark ? "#93c5fd" : "#1d4ed8",
          border: `1px solid ${dark ? "rgba(37,99,235,0.3)" : "#bfdbfe"}`,
        }}>{s}</span>
      ))}
      {arr.length > 3 && (
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 99,
          background: dark ? "#374151" : "#f3f4f6",
          color: dark ? "#9ca3af" : "#6b7280",
        }}>+{arr.length - 3}</span>
      )}
    </div>
  );
}

function ConnectionCard({ c, onRemove, dark }) {
  return (
    <div style={{
      background: dark ? "#1e2736" : "#fff",
      border: `1px solid ${dark ? "#2d3748" : "#e5e7eb"}`,
      borderRadius: 14,
      padding: "20px 18px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      transition: "box-shadow 0.15s, transform 0.15s",
      position: "relative",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <button
        onClick={() => onRemove(c.id, c.full_name)}
        title="Bağlantını sil"
        style={{
          position: "absolute", top: 10, right: 10,
          background: "none", border: "none", cursor: "pointer",
          color: dark ? "#6b7280" : "#9ca3af",
          padding: 4, borderRadius: 6,
          display: "flex", alignItems: "center",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
        onMouseLeave={e => e.currentTarget.style.color = dark ? "#6b7280" : "#9ca3af"}
      >
        <UserMinus size={15} />
      </button>

      <Link to={`/profile/${c.user_id}`} style={{ textDecoration: "none" }}>
        <Avatar name={c.full_name} picture={c.profile_picture} size={64} />
      </Link>

      <Link to={`/profile/${c.user_id}`} style={{
        fontWeight: 700, fontSize: 14,
        color: dark ? "#f1f5f9" : "#111827",
        textDecoration: "none", marginTop: 10, display: "block",
        lineHeight: 1.3,
      }}>
        {c.full_name}
      </Link>

      {c.major && (
        <p style={{ fontSize: 12, color: dark ? "#94a3b8" : "#6b7280", margin: "4px 0 0", lineHeight: 1.4 }}>
          {c.major}
        </p>
      )}

      <SkillChips skills={c.skills} dark={dark} />
    </div>
  );
}

function PendingCard({ p, onAccept, onReject, dark }) {
  return (
    <div style={{
      background: dark ? "#1e2736" : "#fff",
      border: `1px solid ${dark ? "#2d3748" : "#e5e7eb"}`,
      borderRadius: 14,
      padding: "18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = dark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.07)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <Link to={`/profile/${p.sender_id}`} style={{ flexShrink: 0 }}>
        <Avatar name={p.sender_name} picture={p.sender_picture} size={52} />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/profile/${p.sender_id}`} style={{
          fontWeight: 700, fontSize: 14,
          color: dark ? "#f1f5f9" : "#111827",
          textDecoration: "none", display: "block",
        }}>
          {p.sender_name}
        </Link>
        {p.sender_major && (
          <p style={{ fontSize: 12, color: dark ? "#94a3b8" : "#6b7280", margin: "3px 0 0" }}>
            {p.sender_major}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onAccept(p.id)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            background: "#1a4a8a", border: "none",
            color: "#fff", fontSize: 12, fontWeight: 600,
          }}
        >
          <Check size={14} /> Qəbul et
        </button>
        <button
          onClick={() => onReject(p.id)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 12px", borderRadius: 8, cursor: "pointer",
            background: dark ? "#374151" : "#f3f4f6",
            border: `1px solid ${dark ? "#4b5563" : "#e5e7eb"}`,
            color: dark ? "#d1d5db" : "#374151",
            fontSize: 12, fontWeight: 600,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function SuggestedCard({ u, onConnect, sentIds, dark }) {
  const sent = sentIds.has(u.id);
  return (
    <div style={{
      background: dark ? "#1e2736" : "#fff",
      border: `1px solid ${dark ? "#2d3748" : "#e5e7eb"}`,
      borderRadius: 14,
      padding: "20px 18px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      transition: "box-shadow 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <Link to={`/profile/${u.id}`} style={{ textDecoration: "none" }}>
        <Avatar name={u.full_name} picture={u.profile_picture} size={64} />
      </Link>

      <Link to={`/profile/${u.id}`} style={{
        fontWeight: 700, fontSize: 14,
        color: dark ? "#f1f5f9" : "#111827",
        textDecoration: "none", marginTop: 10, display: "block",
        lineHeight: 1.3,
      }}>
        {u.full_name}
      </Link>

      {u.major && (
        <p style={{ fontSize: 12, color: dark ? "#94a3b8" : "#6b7280", margin: "4px 0 0" }}>
          {u.major}
        </p>
      )}

      {u.mutual_count > 0 && (
        <p style={{ fontSize: 11, color: dark ? "#60a5fa" : "#2563eb", marginTop: 6, fontWeight: 500 }}>
          {u.mutual_count} ortaq bağlantı
        </p>
      )}

      <button
        onClick={() => onConnect(u.id)}
        disabled={sent}
        style={{
          marginTop: 12, width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 0", borderRadius: 8, cursor: sent ? "default" : "pointer",
          background: sent ? (dark ? "#1e3a5f" : "#eff6ff") : "#1a4a8a",
          border: sent ? `1px solid ${dark ? "#2563eb" : "#bfdbfe"}` : "none",
          color: sent ? (dark ? "#93c5fd" : "#2563eb") : "#fff",
          fontSize: 13, fontWeight: 600,
          transition: "opacity 0.15s",
        }}
      >
        <UserPlus size={14} />
        {sent ? "Göndərildi" : "Əlaqə qur"}
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, dark }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: dark ? "#1e2736" : "#f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <Icon size={30} color={dark ? "#4b5563" : "#9ca3af"} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, color: dark ? "#f1f5f9" : "#111827", margin: 0 }}>{title}</p>
      {sub && <p style={{ fontSize: 13, color: dark ? "#94a3b8" : "#6b7280", marginTop: 8, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>{sub}</p>}
    </div>
  );
}

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [sentIds, setSentIds] = useState(new Set());
  const [tab, setTab] = useState("my");
  const { t } = useLang();
  const isMobile = useIsMobile();
  const dc = useDarkClasses();
  const dark = useDarkMode();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try { const r = await api.get("/connections/my"); setConnections(r.data); } catch {}
    try { const r = await api.get("/connections/pending"); setPending(r.data); } catch {}
    try { const r = await api.get("/connections/suggested"); setSuggested(r.data); } catch {}
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/connections/${id}/accept`);
      toast.success("Bağlantı qəbul edildi!");
      const r = await api.get("/connections/pending");
      setPending(r.data);
      const r2 = await api.get("/connections/my");
      setConnections(r2.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/connections/${id}/reject`);
      toast.info("İstək rədd edildi");
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const handleRemove = async (id, name) => {
    try {
      await api.delete(`/connections/${id}`);
      setConnections(prev => prev.filter(c => c.id !== id));
      toast.info(`${name} bağlantılardan silindi`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const handleConnect = async (userId) => {
    try {
      await api.post(`/connections/${userId}`);
      setSentIds(prev => new Set([...prev, userId]));
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
    gap: 14,
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "12px 10px" : "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: dc.dark ? "#f1f5f9" : "#111827", margin: 0 }}>
          {t("connections_title")}
        </h2>
        <p style={{ fontSize: 13, color: dc.dark ? "#94a3b8" : "#6b7280", marginTop: 4 }}>
          {t("connections_subtitle")}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 4,
        background: dc.dark ? "#1e2736" : "#f3f4f6",
        borderRadius: 10, padding: 4,
        marginBottom: 24, width: "fit-content",
      }}>
        {TABS.map(({ key, icon: Icon, label, labelKey }) => {
          const active = tab === key;
          const count = key === "my" ? connections.length : key === "pending" ? pending.length : suggested.length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: isMobile ? "7px 12px" : "7px 16px",
                borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: active ? (dc.dark ? "#2d3f5c" : "#fff") : "transparent",
                color: active ? (dc.dark ? "#60a5fa" : "#1a4a8a") : (dc.dark ? "#94a3b8" : "#6b7280"),
                boxShadow: active ? (dc.dark ? "none" : "0 1px 4px rgba(0,0,0,0.1)") : "none",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <Icon size={14} />
              {labelKey ? t(labelKey) : label}
              {count > 0 && (
                <span style={{
                  background: key === "pending" ? "#ef4444" : (dc.dark ? "#3b82f6" : "#1a4a8a"),
                  color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700,
                  padding: "1px 6px", minWidth: 18, textAlign: "center",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* My connections — card grid */}
      {tab === "my" && (
        connections.length === 0
          ? <EmptyState icon={Users} title={t("connections_empty")} sub={t("feed_no_connections_sub")} dark={dc.dark} />
          : <div style={gridStyle}>
              {connections.map(c => (
                <ConnectionCard key={c.id} c={c} onRemove={handleRemove} dark={dc.dark} />
              ))}
            </div>
      )}

      {/* Pending — list layout (better for action buttons) */}
      {tab === "pending" && (
        pending.length === 0
          ? <EmptyState icon={Clock} title={t("connections_pending_empty")} dark={dc.dark} />
          : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pending.map(p => (
                <PendingCard key={p.id} p={p} onAccept={handleAccept} onReject={handleReject} dark={dc.dark} />
              ))}
            </div>
      )}

      {/* Suggested */}
      {tab === "suggested" && (
        suggested.length === 0
          ? <EmptyState icon={Sparkles} title="Tövsiyyə yoxdur" sub="Daha çox bağlantı əldə etdikcə tövsiyyələr görünəcək" dark={dc.dark} />
          : <div style={gridStyle}>
              {suggested.map(u => (
                <SuggestedCard key={u.id} u={u} onConnect={handleConnect} sentIds={sentIds} dark={dc.dark} />
              ))}
            </div>
      )}
    </div>
  );
}
