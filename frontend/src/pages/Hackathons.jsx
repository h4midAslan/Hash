import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Trophy, Calendar } from "lucide-react";
import api from "../api/client";
import { useIsMobile } from "../hooks/useIsMobile";

function HackathonCard({ item }) {
  const isMobile = useIsMobile();
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "14px 16px",
        background: "#fff",
        border: "1px solid #d4d4d4",
        marginBottom: 8,
        textDecoration: "none",
        color: "inherit",
        width: "100%",
        boxSizing: "border-box",
        minWidth: isMobile ? 0 : 280,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: 14, fontWeight: 600, color: "#1a1a1a",
          margin: "0 0 4px 0", lineHeight: 1.4,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {item.title}
        </h3>
        {item.description && (
          <p style={{
            fontSize: 12, color: "#666", margin: "0 0 8px 0",
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
          }}>
            {item.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {item.deadline ? (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#92400e" }}>
              <Calendar size={11} /> {item.deadline}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#bbb" }}>Tarix bildirilmir</span>
          )}
          <ExternalLink size={12} style={{ color: "#bbb", flexShrink: 0 }} />
        </div>
      </div>
    </a>
  );
}

export default function Hackathons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState(null);
  const isMobile = useIsMobile();

  const load = async () => {
    try {
      const [hackRes, userRes] = await Promise.all([
        api.get("/hackathons"),
        api.get("/users/me"),
      ]);
      setItems(hackRes.data);
      setMe(userRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post("/hackathons/refresh");
      setTimeout(() => { load(); setRefreshing(false); }, 4000);
    } catch {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "12px 10px" : "20px 12px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
            Hackathon & Yarışlar
          </h1>
          <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0 0" }}>
            Azərbaycanda aktual tələbə yarışları
          </p>
        </div>
        {me?.is_admin && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", fontSize: 13, fontWeight: 500,
              color: "#444", background: "#fff",
              border: "1px solid #d4d4d4", cursor: "pointer",
              opacity: refreshing ? 0.5 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Yenilə
          </button>
        )}
      </div>

      {loading ? (
        <div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 84, background: "#e8e8e8", marginBottom: 8 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "60px 20px", border: "1px solid #d4d4d4", background: "#fff",
        }}>
          <Trophy size={36} style={{ color: "#ccc", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: "#666", margin: 0 }}>Hal-hazırda aktiv yarış tapılmadı</p>
          <p style={{ fontSize: 12, color: "#999", marginTop: 4 }}>Tezliklə yenilənəcək</p>
        </div>
      ) : (
        <div>
          {items.map(item => (
            <HackathonCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
