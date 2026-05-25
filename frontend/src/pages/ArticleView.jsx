import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Clock, Edit3, Trash2, Send, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

export default function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const dark = useDarkMode();
  const [article, setArticle] = useState(null);
  const [me, setMe] = useState(null);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    api.get(`/articles/${id}`).then(r => setArticle(r.data)).catch(() => navigate("/feed"));
    api.get("/users/me").then(r => setMe(r.data)).catch(() => {});
  }, [id]);

  const handleLike = async () => {
    setArticle(prev => ({ ...prev, is_liked: !prev.is_liked, like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1 }));
    try { await api.post(`/articles/${id}/like`); } catch { api.get(`/articles/${id}`).then(r => setArticle(r.data)); }
  };

  const toggleComments = async () => {
    if (!showComments) {
      const res = await api.get(`/articles/${id}/comments`);
      setComments(res.data);
    }
    setShowComments(!showComments);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    await api.post(`/articles/${id}/comment`, { content: commentText.trim() });
    setCommentText("");
    const res = await api.get(`/articles/${id}/comments`);
    setComments(res.data);
    setArticle(prev => ({ ...prev, comment_count: prev.comment_count + 1 }));
  };

  const handleDelete = async () => {
    if (!confirm("Bu məqaləni silmək istəyirsən?")) return;
    await api.delete(`/articles/${id}`);
    navigate("/feed");
  };

  if (!article) return (
    <div style={{ maxWidth: isMobile ? "100%" : 680, margin: "0 auto", padding: isMobile ? "12px 10px" : "32px 16px", background: dark ? "#111827" : undefined, minHeight: "100vh" }}>
      {[240, 40, 24, 16, 16, 16, 16].map((h, i) => (
        <div key={i} style={{ height: h, background: dark ? "#374151" : "#e8e8e8", marginBottom: 12 }} />
      ))}
    </div>
  );

  const isOwn = me?.id === article.author_id;

  return (
    <div style={{ minHeight: "100vh", background: dark ? "#111827" : "#f2f2f2" }}>
      <div style={{ maxWidth: isMobile ? "100%" : 720, margin: "0 auto", padding: isMobile ? "12px 10px" : "20px 12px" }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            marginBottom: 14, padding: "6px 10px",
            fontSize: 13, color: dark ? "#9ca3af" : "#666",
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} /> Geri
        </button>

        {/* Article card */}
        <div style={{ background: dark ? "#1f2937" : "#fff", border: dark ? "1px solid #374151" : "1px solid #d4d4d4", overflow: "hidden" }}>

          {article.cover_image && (
            <img src={article.cover_image} alt="cover" style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }} />
          )}

          <div style={{ padding: isMobile ? "16px 14px" : "28px 32px" }}>
            <h1 style={{
              fontSize: 30, fontWeight: 700, color: dark ? "#f3f4f6" : "#1a1a1a", margin: "0 0 10px 0", lineHeight: 1.3,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}>
              {article.title}
            </h1>
            {article.subtitle && (
              <p style={{
                fontSize: 18, color: dark ? "#9ca3af" : "#666", margin: "0 0 20px 0",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}>
                {article.subtitle}
              </p>
            )}

            {/* Author row */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 0", borderTop: dark ? "1px solid #374151" : "1px solid #d4d4d4", borderBottom: dark ? "1px solid #374151" : "1px solid #d4d4d4",
              marginBottom: 28,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link to={`/profile/${article.author_id}`}>
                  <UserAvatar user={{ full_name: article.author_name, profile_picture: article.author_picture }} size="md" />
                </Link>
                <div>
                  <Link to={`/profile/${article.author_id}`} style={{ fontSize: 13, fontWeight: 600, color: dark ? "#f3f4f6" : "#1a1a1a", textDecoration: "none" }}>
                    {article.author_name}
                  </Link>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: dark ? "#6b7280" : "#999", marginTop: 2 }}>
                    <span>{formatBakuDate(article.created_at)}</span>
                    <span>·</span>
                    <Clock size={12} />
                    <span>{article.read_time} dəq oxuma</span>
                  </div>
                </div>
              </div>
              {isOwn && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => navigate(`/article/${id}/edit`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", fontSize: 13,
                      color: "#1a4a8a", background: "none",
                      border: "1px solid #1a4a8a", cursor: "pointer",
                    }}
                  >
                    <Edit3 size={14} /> Redaktə
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", fontSize: 13,
                      color: "#b91c1c", background: "none",
                      border: "1px solid #b91c1c", cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} /> Sil
                  </button>
                </div>
              )}
            </div>

            {/* Article body */}
            <div
              className="article-content prose prose-lg max-w-none"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                color: dark ? "#f3f4f6" : "#1f2937",
                marginBottom: 32,
                lineHeight: 1.8,
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Reaction bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16, borderTop: dark ? "1px solid #374151" : "1px solid #d4d4d4" }}>
              <button
                onClick={handleLike}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", fontSize: 13, cursor: "pointer",
                  color: article.is_liked ? "#f87171" : (dark ? "#9ca3af" : "#666"),
                  background: article.is_liked ? (dark ? "#2a0a0a" : "#fef2f2") : "none",
                  border: "1px solid " + (article.is_liked ? (dark ? "#7f1d1d" : "#fca5a5") : (dark ? "#374151" : "#d4d4d4")),
                }}
              >
                <Heart size={16} fill={article.is_liked ? "currentColor" : "none"} /> {article.like_count}
              </button>
              <button
                onClick={toggleComments}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", fontSize: 13, cursor: "pointer",
                  color: showComments ? (dark ? "#60a5fa" : "#1a4a8a") : (dark ? "#9ca3af" : "#666"),
                  background: showComments ? (dark ? "#1e3a5f" : "#eff6ff") : "none",
                  border: "1px solid " + (showComments ? (dark ? "#374151" : "#93c5fd") : (dark ? "#374151" : "#d4d4d4")),
                }}
              >
                <MessageCircle size={16} /> {article.comment_count}
                {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* Comments section */}
            {showComments && (
              <div style={{ marginTop: 24 }}>
                {/* Comment input */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitComment()}
                    placeholder="Şərh yaz..."
                    style={{
                      flex: 1, padding: "8px 12px", fontSize: 13,
                      border: dark ? "1px solid #374151" : "1px solid #d4d4d4", background: dark ? "#111827" : "#fff",
                      color: dark ? "#f3f4f6" : "#1a1a1a", outline: "none",
                    }}
                  />
                  <button
                    onClick={submitComment}
                    disabled={!commentText.trim()}
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "8px 14px",
                      background: "#1a4a8a", color: "#fff",
                      border: "none", cursor: "pointer",
                      opacity: !commentText.trim() ? 0.4 : 1,
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>

                {/* Comment list */}
                {comments.length === 0 ? (
                  <p style={{ fontSize: 13, color: dark ? "#6b7280" : "#999", textAlign: "center", padding: "16px 0" }}>Hələ şərh yoxdur</p>
                ) : comments.map(c => (
                  <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <Link
                      to={`/profile/${c.user_id}`}
                      style={{
                        width: 32, height: 32, flexShrink: 0,
                        background: dark ? "#374151" : "#1a4a8a", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, textDecoration: "none",
                      }}
                    >
                      {c.user_name?.charAt(0)}
                    </Link>
                    <div style={{
                      flex: 1, padding: "10px 14px",
                      background: dark ? "#111827" : "#f8f8f8", border: dark ? "1px solid #374151" : "1px solid #d4d4d4",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Link to={`/profile/${c.user_id}`} style={{ fontSize: 13, fontWeight: 600, color: dark ? "#f3f4f6" : "#1a1a1a", textDecoration: "none" }}>
                          {c.user_name}
                        </Link>
                        <span style={{ fontSize: 12, color: dark ? "#6b7280" : "#999" }}>{formatBakuHM(c.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: dark ? "#9ca3af" : "#444", margin: 0 }}>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
