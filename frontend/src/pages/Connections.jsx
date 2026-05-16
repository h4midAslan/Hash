import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, Users, Clock, UserCheck, UserMinus } from "lucide-react";
import api from "../api/client";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";

const S = {
  page: { maxWidth: 720, margin: "0 auto", padding: "20px 12px" },
  heading: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: 0 },
  subtitle: { fontSize: 13, color: "#999", marginTop: 4 },
  tabBar: { display: "flex", borderBottom: "1px solid #d4d4d4", marginBottom: 24 },
  tab: (active) => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "10px 18px",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    background: "none", border: "none",
    borderBottom: active ? "2px solid #1a4a8a" : "2px solid transparent",
    color: active ? "#1a4a8a" : "#666",
    marginBottom: -1,
  }),
  pendingDot: {
    width: 7, height: 7, borderRadius: "50%", background: "#1a4a8a", display: "inline-block",
  },
  row: {
    background: "#ffffff", border: "1px solid #d4d4d4", padding: "10px 12px",
    display: "flex", alignItems: "center", marginBottom: 6,
  },
  avatar: {
    width: 44, height: 44, background: "#1a4a8a", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 18, textDecoration: "none",
  },
  name: { fontWeight: 600, fontSize: 13, color: "#1a1a1a", textDecoration: "none", display: "block" },
  meta: { fontSize: 12, color: "#999", marginTop: 2 },
  removeBtn: {
    padding: "5px 7px", border: "1px solid #e0c0c0", background: "#fff8f8",
    color: "#c0392b", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0,
  },
  acceptBtn: {
    padding: "5px 7px", border: "1px solid #a8d5b0", background: "#f0faf2",
    color: "#27ae60", cursor: "pointer", display: "flex", alignItems: "center",
  },
  rejectBtn: {
    padding: "5px 7px", border: "1px solid #e0c0c0", background: "#fff8f8",
    color: "#c0392b", cursor: "pointer", display: "flex", alignItems: "center",
  },
  emptyWrap: { textAlign: "center", padding: "60px 0" },
  emptyIcon: {
    width: 56, height: 56, background: "#f0f0f0",
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
  },
};

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState("my");
  const { t } = useLang();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadConnections();
    loadPending();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await api.get("/connections/my");
      setConnections(res.data);
    } catch {}
  };

  const loadPending = async () => {
    try {
      const res = await api.get("/connections/pending");
      setPending(res.data);
    } catch {}
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/connections/${id}/accept`);
      toast.success("Bağlantı qəbul edildi!");
      loadPending();
      loadConnections();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/connections/${id}/reject`);
      toast.info("İstək rədd edildi");
      loadPending();
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

  return (
    <div style={{ ...S.page, padding: isMobile ? "12px 10px" : S.page.padding }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={S.heading}>{t("connections_title")}</h2>
        <p style={S.subtitle}>{t("connections_subtitle")}</p>
      </div>

      {/* Underline tabs */}
      <div style={{ ...S.tabBar, overflowX: "auto" }}>
        <button onClick={() => setTab("my")} style={S.tab(tab === "my")}>
          <UserCheck size={15} /> {t("connections_yours")} ({connections.length})
        </button>
        <button onClick={() => setTab("pending")} style={S.tab(tab === "pending")}>
          <Clock size={15} /> {t("connections_pending")} ({pending.length})
          {pending.length > 0 && <span style={S.pendingDot} />}
        </button>
      </div>

      {/* Connections list */}
      <div>
        {tab === "my" && connections.map((c) => (
          <div
            key={c.id}
            style={S.row}
            onMouseEnter={e => e.currentTarget.style.background = "#f7f9fc"}
            onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
          >
            <Link to={`/profile/${c.user_id}`} style={S.avatar}>
              {c.full_name?.charAt(0)}
            </Link>
            <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
              <Link to={`/profile/${c.user_id}`} style={S.name}>{c.full_name}</Link>
              <p style={S.meta}>{c.major}</p>
            </div>
            <button
              onClick={() => handleRemove(c.id, c.full_name)}
              style={{ ...S.removeBtn, marginLeft: 10 }}
              title="Bağlantını sil"
            >
              <UserMinus size={16} />
            </button>
          </div>
        ))}

        {tab === "pending" && pending.map((p) => (
          <div
            key={p.id}
            style={S.row}
            onMouseEnter={e => e.currentTarget.style.background = "#f7f9fc"}
            onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
          >
            <Link to={`/profile/${p.sender_id}`} style={S.avatar}>
              {p.sender_name?.charAt(0)}
            </Link>
            <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
              <Link to={`/profile/${p.sender_id}`} style={S.name}>{p.sender_name}</Link>
              <p style={S.meta}>{p.sender_major}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
              <button onClick={() => handleAccept(p.id)} style={S.acceptBtn} title={t("connections_accept")}>
                <Check size={17} />
              </button>
              <button onClick={() => handleReject(p.id)} style={S.rejectBtn} title={t("connections_reject")}>
                <X size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty states */}
      {tab === "my" && connections.length === 0 && (
        <div style={S.emptyWrap}>
          <div style={S.emptyIcon}>
            <Users size={26} color="#aaa" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{t("connections_empty")}</p>
          <p style={{ fontSize: 13, color: "#999", marginTop: 6, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
            {t("feed_no_connections_sub")}
          </p>
        </div>
      )}
      {tab === "pending" && pending.length === 0 && (
        <div style={S.emptyWrap}>
          <div style={S.emptyIcon}>
            <Clock size={26} color="#aaa" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{t("connections_pending_empty")}</p>
        </div>
      )}
    </div>
  );
}
