import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, X, Users, Clock, UserPlus, Sparkles, MoreVertical, ExternalLink, UserMinus } from "lucide-react";
import api from "../api/client";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

const ACCENT = "#1E90FF";

// ── Typo & localization corrections ─────────────────────────────────────────
const MAJOR_FIXES = {
  "Managment": "Menecment",
  "Management": "Menecment",
  "Business & Managment": "Biznes və Menecment",
  "Business & Management": "Biznes və Menecment",
  "Business Administration": "Biznesin İdarə Edilməsi",
  "Computer Science": "Kompüter Elmləri",
  "Computer Engineering": "Kompüter Mühəndisliyi",
  "Software Engineering": "Proqram Mühəndisliyi",
  "Information Technology": "İnformasiya Texnologiyaları",
  "Information Security": "İnformasiya Təhlükəsizliyi",
  "Cybersecurity": "Kibertəhlükəsizlik",
  "Mechatronics and robotics": "Mexatronika və Robototexnika",
  "Mechatronics and robotics engineering": "Mexatronika və Robototexnika Mühəndisliyi",
  "Electrical Engineering": "Elektrik Mühəndisliyi",
  "Artificial Intelligence": "Süni İntellekt",
  "Data Science": "Məlumat Elmi",
  "Finance": "Maliyyə",
  "Economics": "İqtisadiyyat",
  "International Relations": "Beynəlxalq Münasibətlər",
  "Law": "Hüquq",
  "Architecture": "Memarlıq",
  "Civil Engineering": "İnşaat Mühəndisliyi",
};

const normalizeMajor = (str) => {
  if (!str) return str;
  const exact = MAJOR_FIXES[str.trim()];
  if (exact) return exact;
  // partial replacement for typos inside longer strings
  return str.replace(/\bManagment\b/gi, "Menecment").replace(/\bManagement\b/gi, "Menecment");
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

function useColors(dark) {
  return {
    bg:         dark ? "#050f1f" : "#f0f4fa",
    surface:    dark ? "#0a1c39" : "#ffffff",
    surface2:   dark ? "#0d2248" : "#f8faff",
    border:     dark ? "rgba(255,255,255,0.07)" : "#e4e9f1",
    text:       dark ? "#ffffff" : "#071428",
    textSoft:   dark ? "#c8d4e8" : "#3a4861",
    muted:      dark ? "#7d8ba3" : "#69768d",
    accent:     ACCENT,
    accentWash: dark ? "rgba(30,144,255,0.12)" : "rgba(30,144,255,0.07)",
    danger:     "#f87171",
    success:    "#34d399",
    menuBg:     dark ? "#0d2248" : "#ffffff",
    menuShadow: dark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.12)",
  };
}

const TABS = [
  { key: "my",        Icon: Users,    labelKey: "connections_yours" },
  { key: "pending",   Icon: Clock,    labelKey: "connections_pending" },
  { key: "suggested", Icon: Sparkles, label:    "Tövsiyyə" },
];

function Avatar({ name, picture, size = 56 }) {
  const [err, setErr] = useState(false);
  const colors = ["#1a4a8a", "#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (picture && !err) {
    return (
      <img
        src={picture} alt={name}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid rgba(30,144,255,0.25)` }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 800, fontSize: size * 0.38,
      fontFamily: "'Archivo', sans-serif", border: `2px solid rgba(30,144,255,0.25)`,
    }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

function SkillChips({ skills, C }) {
  if (!skills) return null;
  let arr = [];
  try { arr = typeof skills === "string" ? JSON.parse(skills) : skills; } catch { return null; }
  if (!arr?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, justifyContent: "center" }}>
      {arr.slice(0, 3).map((s, i) => (
        <span key={i} style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
          background: C.accentWash, color: ACCENT,
          border: `1px solid rgba(30,144,255,0.18)`,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{s}</span>
      ))}
      {arr.length > 3 && (
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 99,
          background: C.surface2, color: C.muted, border: `1px solid ${C.border}`,
          fontFamily: "'JetBrains Mono', monospace",
        }}>+{arr.length - 3}</span>
      )}
    </div>
  );
}

// ── Three-dots dropdown menu ─────────────────────────────────────────────────
function CardMenu({ userId, connectionId, name, onRemove, C }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "absolute", top: 10, right: 10 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        title="Seçimlər"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.muted, padding: 4, borderRadius: 6,
          display: "flex", alignItems: "center",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = C.textSoft; e.currentTarget.style.background = C.accentWash; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "none"; }}
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: C.menuBg, borderRadius: 10,
          border: `1px solid ${C.border}`,
          boxShadow: C.menuShadow,
          zIndex: 50, minWidth: 170, overflow: "hidden",
        }}>
          <Link
            to={`/profile/${userId}`}
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "10px 14px", fontSize: 13, fontWeight: 600,
              color: C.textSoft, textDecoration: "none",
              fontFamily: "'Archivo', sans-serif",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentWash}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <ExternalLink size={13} /> Profili gör
          </Link>
          <button
            onClick={() => { setOpen(false); onRemove(connectionId, name); }}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "10px 14px", width: "100%",
              fontSize: 13, fontWeight: 600,
              background: "none", border: "none", cursor: "pointer",
              color: C.danger, textAlign: "left",
              fontFamily: "'Archivo', sans-serif",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <UserMinus size={13} /> Bağlantını kəs
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectionCard({ c, onRemove, C }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hover ? "rgba(30,144,255,0.25)" : C.border}`,
        borderRadius: 18, padding: "22px 18px 18px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", position: "relative",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        boxShadow: hover ? "0 8px 32px rgba(30,144,255,0.10)" : "none",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        fontFamily: "'Archivo', sans-serif",
      }}
    >
      <CardMenu userId={c.user_id} connectionId={c.id} name={c.full_name} onRemove={onRemove} C={C} />

      <Link to={`/profile/${c.user_id}`} style={{ textDecoration: "none" }}>
        <Avatar name={c.full_name} picture={c.profile_picture} size={62} />
      </Link>

      <Link to={`/profile/${c.user_id}`} style={{
        fontWeight: 800, fontSize: 14, color: C.text,
        textDecoration: "none", marginTop: 10, display: "block",
        lineHeight: 1.3, fontFamily: "'Archivo', sans-serif", transition: "color 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.color = ACCENT}
        onMouseLeave={e => e.currentTarget.style.color = C.text}
      >
        {c.full_name}
      </Link>

      {c.major && (
        <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0", lineHeight: 1.4, fontFamily: "'Archivo', sans-serif" }}>
          {normalizeMajor(c.major)}
        </p>
      )}

      <SkillChips skills={c.skills} C={C} />
    </div>
  );
}

function PendingCard({ p, onAccept, onReject, C }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hover ? "rgba(30,144,255,0.25)" : C.border}`,
        borderRadius: 16, padding: "16px 18px",
        display: "flex", alignItems: "center", gap: 14,
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hover ? "0 4px 20px rgba(30,144,255,0.08)" : "none",
        fontFamily: "'Archivo', sans-serif",
      }}
    >
      <Link to={`/profile/${p.sender_id}`} style={{ flexShrink: 0 }}>
        <Avatar name={p.sender_name} picture={p.sender_picture} size={50} />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/profile/${p.sender_id}`} style={{
          fontWeight: 800, fontSize: 14, color: C.text,
          textDecoration: "none", display: "block", fontFamily: "'Archivo', sans-serif",
        }}>
          {p.sender_name}
        </Link>
        {p.sender_major && (
          <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0", fontFamily: "'Archivo', sans-serif" }}>
            {normalizeMajor(p.sender_major)}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onAccept(p.id)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", borderRadius: 10, cursor: "pointer",
            background: ACCENT, border: "none", color: "#fff",
            fontSize: 12, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
            boxShadow: "0 4px 14px rgba(30,144,255,0.35)", transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <Check size={13} /> Qəbul et
        </button>
        <button
          onClick={() => onReject(p.id)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 12px", borderRadius: 10, cursor: "pointer",
            background: "transparent", border: `1px solid ${C.border}`,
            color: C.muted, fontSize: 12, fontWeight: 600,
            fontFamily: "'Archivo', sans-serif", transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#f87171"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function SuggestedCard({ u, onConnect, sentIds, C }) {
  const [hover, setHover] = useState(false);
  const sent = sentIds.has(u.id);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hover ? "rgba(30,144,255,0.25)" : C.border}`,
        borderRadius: 18, padding: "22px 18px 18px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        boxShadow: hover ? "0 8px 32px rgba(30,144,255,0.10)" : "none",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        fontFamily: "'Archivo', sans-serif",
      }}
    >
      <Link to={`/profile/${u.id}`} style={{ textDecoration: "none" }}>
        <Avatar name={u.full_name} picture={u.profile_picture} size={62} />
      </Link>

      <Link to={`/profile/${u.id}`} style={{
        fontWeight: 800, fontSize: 14, color: C.text,
        textDecoration: "none", marginTop: 10, display: "block",
        lineHeight: 1.3, fontFamily: "'Archivo', sans-serif", transition: "color 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.color = ACCENT}
        onMouseLeave={e => e.currentTarget.style.color = C.text}
      >
        {u.full_name}
      </Link>

      {u.major && (
        <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0", fontFamily: "'Archivo', sans-serif" }}>
          {normalizeMajor(u.major)}
        </p>
      )}

      {u.mutual_count > 0 && (
        <p style={{ fontSize: 11, color: ACCENT, marginTop: 6, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          {u.mutual_count} ortaq bağlantı
        </p>
      )}

      <button
        onClick={() => !sent && onConnect(u.id)}
        disabled={sent}
        style={{
          marginTop: 12, width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "9px 0", borderRadius: 10,
          cursor: sent ? "default" : "pointer",
          background: sent ? C.accentWash : ACCENT,
          border: sent ? `1px solid rgba(30,144,255,0.25)` : "none",
          color: sent ? ACCENT : "#fff",
          fontSize: 13, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
          boxShadow: sent ? "none" : "0 4px 14px rgba(30,144,255,0.30)",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => { if (!sent) e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        <UserPlus size={13} />
        {sent ? "Göndərildi" : "Əlaqə qur"}
      </button>
    </div>
  );
}

function EmptyState({ Icon, title, sub, C }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 20px", fontFamily: "'Archivo', sans-serif" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%", background: C.accentWash,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 18px", border: `1px solid rgba(30,144,255,0.18)`,
      }}>
        <Icon size={28} color={ACCENT} />
      </div>
      <p style={{ fontWeight: 800, fontSize: 16, color: C.text, margin: 0, fontFamily: "'Archivo', sans-serif" }}>{title}</p>
      {sub && (
        <p style={{ fontSize: 13, color: C.muted, marginTop: 8, maxWidth: 300, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          {sub}
        </p>
      )}
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
  const dark = useDarkMode();
  const C = useColors(dark);
  useFonts();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try { const r = await api.get("/connections/my"); setConnections(r.data); } catch {}
    try { const r = await api.get("/connections/pending"); setPending(r.data); } catch {}
    try { const r = await api.get("/connections/suggested"); setSuggested(r.data); } catch {}
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/connections/${id}/accept`);
      toast.success("Bağlantı qəbul edildi!");
      const r = await api.get("/connections/pending"); setPending(r.data);
      const r2 = await api.get("/connections/my"); setConnections(r2.data);
    } catch (err) { toast.error(err.response?.data?.detail || "Xəta baş verdi"); }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/connections/${id}/reject`);
      toast.info("İstək rədd edildi");
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err) { toast.error(err.response?.data?.detail || "Xəta baş verdi"); }
  };

  const handleRemove = async (id, name) => {
    try {
      await api.delete(`/connections/${id}`);
      setConnections(prev => prev.filter(c => c.id !== id));
      toast.info(`${name} bağlantılardan silindi`);
    } catch (err) { toast.error(err.response?.data?.detail || "Xəta baş verdi"); }
  };

  const handleConnect = async (userId) => {
    try {
      await api.post(`/connections/${userId}`);
      setSentIds(prev => new Set([...prev, userId]));
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) { toast.error(err.response?.data?.detail || "Xəta baş verdi"); }
  };

  const counts = { my: connections.length, pending: pending.length, suggested: suggested.length };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
    gap: 14,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Archivo', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "20px 12px" : "32px 20px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
              color: ACCENT, fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
            }}>ŞƏBƏKƏ</span>
          </div>
          <h1 style={{
            fontSize: isMobile ? 22 : 26, fontWeight: 900,
            color: C.text, margin: 0, letterSpacing: "-0.02em",
            fontFamily: "'Archivo', sans-serif",
          }}>
            {t("connections_title")}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 5, lineHeight: 1.5 }}>
            {t("connections_subtitle")}
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 2,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 4, marginBottom: 24, width: "fit-content",
        }}>
          {TABS.map(({ key, Icon, label, labelKey }) => {
            const active = tab === key;
            const count = counts[key];
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: isMobile ? "7px 12px" : "8px 18px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: active ? 800 : 600,
                  background: active ? ACCENT : "transparent",
                  color: active ? "#fff" : C.textSoft,
                  boxShadow: active ? "0 4px 14px rgba(30,144,255,0.30)" : "none",
                  transition: "all 0.15s",
                  fontFamily: "'Archivo', sans-serif",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textSoft; }}
              >
                <Icon size={13} />
                {labelKey ? t(labelKey) : label}
                {count > 0 && (
                  <span style={{
                    background: active ? "rgba(255,255,255,0.25)" : (key === "pending" ? "#f87171" : C.accentWash),
                    color: active ? "#fff" : (key === "pending" ? "#fff" : ACCENT),
                    borderRadius: 99, fontSize: 10, fontWeight: 700,
                    padding: "1px 6px", minWidth: 18, textAlign: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* My connections */}
        {tab === "my" && (
          connections.length === 0
            ? <EmptyState Icon={Users} title={t("connections_empty")} sub={t("feed_no_connections_sub")} C={C} />
            : <div style={gridStyle}>
                {connections.map(c => (
                  <ConnectionCard key={c.id} c={c} onRemove={handleRemove} C={C} />
                ))}
              </div>
        )}

        {/* Pending */}
        {tab === "pending" && (
          pending.length === 0
            ? <EmptyState Icon={Clock} title={t("connections_pending_empty")} C={C} />
            : <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 620 }}>
                {pending.map(p => (
                  <PendingCard key={p.id} p={p} onAccept={handleAccept} onReject={handleReject} C={C} />
                ))}
              </div>
        )}

        {/* Suggested */}
        {tab === "suggested" && (
          suggested.length === 0
            ? <EmptyState Icon={Sparkles} title="Tövsiyyə yoxdur" sub="Daha çox bağlantı əldə etdikcə tövsiyyələr görünəcək" C={C} />
            : <div style={gridStyle}>
                {suggested.map(u => (
                  <SuggestedCard key={u.id} u={u} onConnect={handleConnect} sentIds={sentIds} C={C} />
                ))}
              </div>
        )}

      </div>
    </div>
  );
}
