import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Clock, PenSquare, BookOpen, Home, FileText } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "indicə";
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} gün əvvəl`;
  return new Date(dateStr).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}

function ArticleCard({ article }) {
  const dark = useDarkMode();
  return (
    <Link
      to={`/article/${article.id}`}
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: "14px 16px",
        background: dark ? "#1f2937" : "#fff",
        border: dark ? "1px solid #374151" : "1px solid #d4d4d4",
        marginBottom: 8,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserAvatar user={{ full_name: article.author_name, profile_picture: article.author_picture }} size="xs" />
          <span style={{ fontSize: 12, fontWeight: 500, color: dark ? "#9ca3af" : "#444" }}>{article.author_name}</span>
        </div>

        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: dark ? "#f3f4f6" : "#1a1a1a", margin: 0, lineHeight: 1.4, marginBottom: 3 }}>
            {article.title}
          </h2>
          {(article.subtitle || article.preview) && (
            <p style={{
              fontSize: 13, color: dark ? "#9ca3af" : "#666", margin: 0, lineHeight: 1.5,
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {article.subtitle || article.preview}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: dark ? "#6b7280" : "#999" }}>
          <span>{timeAgo(article.created_at)}</span>
          <span>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {article.read_time} dəq</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Heart size={11} /> {article.like_count}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MessageCircle size={11} /> {article.comment_count}</span>
        </div>
      </div>

      {article.cover_image && (
        <div style={{ width: 80, height: 80, flexShrink: 0, overflow: "hidden" }}>
          <img
            src={article.cover_image}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
    </Link>
  );
}

export default function Articles() {
  const dark = useDarkMode();
  const [articles, setArticles] = useState([]);
  const [myArticles, setMyArticles] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // "all" | "mine"
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    Promise.all([
      api.get("/articles"),
      api.get("/users/me"),
    ]).then(([art, user]) => {
      setArticles(art.data);
      setMe(user.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (me && tab === "mine") {
      api.get(`/articles/user/${me.id}`).then(r => setMyArticles(r.data)).catch(() => {});
    }
  }, [tab, me]);

  const displayed = tab === "mine" ? myArticles : articles;

  const navItems = [
    { id: "all",  icon: Home,     label: "Bütün məqalələr" },
    { id: "mine", icon: FileText, label: "Mənim yazılarım" },
  ];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "12px 10px" : "20px 12px", minHeight: "100vh", background: dark ? "#111827" : undefined }}>

      {/* Top bar: tabs + new article button */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: dark ? "1px solid #374151" : "1px solid #d4d4d4" }}>
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: tab === id ? 600 : 400,
                color: tab === id ? (dark ? "#60a5fa" : "#1a4a8a") : (dark ? "#9ca3af" : "#666"),
                background: "none",
                border: "none",
                borderBottom: tab === id ? (dark ? "2px solid #60a5fa" : "2px solid #1a4a8a") : "2px solid transparent",
                marginBottom: -1,
                cursor: "pointer",
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* New article button */}
        <button
          onClick={() => navigate("/article/new")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: "#1a4a8a",
            border: "none",
            cursor: "pointer",
          }}
        >
          <PenSquare size={14} /> Yeni məqalə
        </button>
      </div>

      {/* User info strip */}
      {me && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: dark ? "#1f2937" : "#fff",
          border: dark ? "1px solid #374151" : "1px solid #d4d4d4",
          marginBottom: 16,
        }}>
          <UserAvatar user={{ full_name: me.full_name, profile_picture: me.profile_picture }} size="sm" />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: dark ? "#f3f4f6" : "#1a1a1a", margin: 0 }}>{me.full_name}</p>
            <p style={{ fontSize: 12, color: dark ? "#6b7280" : "#999", margin: 0 }}>
              {me.major} &middot; {articles.filter(a => a.author_id === me.id).length} yazı
            </p>
          </div>
        </div>
      )}

      {/* Article list */}
      {loading ? (
        <div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 96, background: dark ? "#374151" : "#e8e8e8", marginBottom: 8 }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "60px 20px", border: dark ? "1px solid #374151" : "1px solid #d4d4d4", background: dark ? "#1f2937" : "#fff",
        }}>
          <BookOpen size={36} style={{ color: dark ? "#374151" : "#ccc", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: dark ? "#9ca3af" : "#666", margin: 0 }}>
            {tab === "mine" ? "Hələ məqalən yoxdur" : "Hələ məqalə yoxdur"}
          </p>
          <p style={{ fontSize: 12, color: dark ? "#6b7280" : "#999", marginTop: 4 }}>İlk məqaləni sən yaz!</p>
        </div>
      ) : (
        <div>
          {displayed.map(a => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
