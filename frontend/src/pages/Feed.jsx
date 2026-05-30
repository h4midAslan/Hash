import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ThumbsDown, MessageCircle, Send, Pin, Image as ImageIcon, Film, Flag, X, ChevronDown, ChevronUp, Trash2, UserPlus, UserCheck, ChevronLeft, ChevronRight, BookOpen, TrendingUp } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

const COLORS = {
  light: {
    border:     "1px solid #d4d4d4",
    bg:         "#ffffff",
    text:       "#1a1a1a",
    muted:      "#666",
    faint:      "#999",
    primary:    "#1a4a8a",
    divider:    "#ebebeb",
    commentBg:  "#f7f7f7",
    commentBorder: "#e8e8e8",
    commentText: "#333",
    sidebarBg:  "#fff",
    btnPrimary: { background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a" },
    btnGhost:   { background: "#fff", color: "#444", border: "1px solid #ccc" },
  },
  dark: {
    border:     "1px solid #374151",
    bg:         "#1f2937",
    text:       "#f3f4f6",
    muted:      "#9ca3af",
    faint:      "#6b7280",
    primary:    "#60a5fa",
    divider:    "#374151",
    commentBg:  "#111827",
    commentBorder: "#374151",
    commentText: "#d1d5db",
    sidebarBg:  "#1f2937",
    btnPrimary: { background: "#2563eb", color: "#fff", border: "1px solid #2563eb" },
    btnGhost:   { background: "#374151", color: "#d1d5db", border: "1px solid #4b5563" },
  },
};

function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  if (images.length === 1) return <img src={images[0]} alt="post" style={{ width: "100%", maxHeight: 480, objectFit: "cover", display: "block" }} />;
  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      <img src={images[idx]} alt={`post-${idx}`} style={{ width: "100%", maxHeight: 480, objectFit: "cover", display: "block" }} />
      <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
        style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChevronLeft size={14} />
      </button>
      <button onClick={() => setIdx(i => (i + 1) % images.length)}
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChevronRight size={14} />
      </button>
      <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 11, padding: "2px 7px" }}>
        {idx + 1}/{images.length}
      </span>
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [showDislikes, setShowDislikes] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [feedOffset, setFeedOffset] = useState(0);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const [suggested, setSuggested] = useState([]);
  const [suggestedPending, setSuggestedPending] = useState(new Set());
  const [contestBoard, setContestBoard] = useState([]);
  const [contestInfo, setContestInfo] = useState(null);
  const [contestRemaining, setContestRemaining] = useState(0);
  const [showAllSuggested, setShowAllSuggested] = useState(false);
  const { t } = useLang();
  const isMobile = useIsMobile();
  const dark = useDarkMode();
  const C = dark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadFeed().finally(() => setLoading(false));
    loadUser();
    loadConnections();
    api.get("/connections/suggested").then(r => setSuggested(r.data)).catch(() => {});
    api.get("/contest/info").then(r => { if (r.data.active) { setContestInfo(r.data); setContestRemaining(r.data.remaining_seconds); } }).catch(() => {});
    api.get("/contest/leaderboard").then(r => setContestBoard(r.data.slice(0, 5))).catch(() => {});
  }, []);

  useEffect(() => {
    if (contestRemaining <= 0) return;
    const t = setInterval(() => setContestRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [contestRemaining > 0]);

  const loadConnections = async () => {
    try {
      const [myRes, pendRes] = await Promise.all([api.get("/connections/my"), api.get("/connections/sent")]);
      setConnectedIds(new Set(myRes.data.map(c => c.user_id)));
      setPendingIds(new Set(pendRes.data.map(c => c.receiver_id)));
    } catch {}
  };

  const handleConnect = async (userId) => {
    setPendingIds(prev => new Set([...prev, userId]));
    try {
      await api.post(`/connections/${userId}`);
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) {
      setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const loadUser = async () => {
    try { const res = await api.get("/users/me"); setUser(res.data); } catch {}
  };

  const loadFeed = async () => {
    try {
      const res = await api.get("/posts?limit=20&offset=0");
      setPosts(res.data);
      setFeedOffset(20);
      setHasMore(res.data.length === 20);
    } catch {}
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/posts?limit=20&offset=${feedOffset}`);
      setPosts(prev => [...prev, ...res.data]);
      setFeedOffset(prev => prev + 20);
      setHasMore(res.data.length === 20);
    } catch {}
    setLoadingMore(false);
  };

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (imageUrls.length + files.length > 10) { toast.error("Maksimum 10 şəkil əlavə edə bilərsiniz"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      const res = await api.post("/upload/multiple", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setImageUrls(prev => [...prev, ...res.data.urls]);
      setVideoUrl("");
    } catch (err) { toast.error(err.response?.data?.detail || "Şəkil yüklənmədi"); }
    setUploading(false);
    e.target.value = "";
  };

  const handleVideoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setVideoUrl(res.data.url);
      setImageUrls([]);
    } catch (err) { toast.error(err.response?.data?.detail || "Video yüklənmədi"); }
    setUploading(false);
    e.target.value = "";
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !imageUrls.length && !videoUrl) return;
    setPosting(true);
    try {
      const res = await api.post("/posts", { content: newPost.trim() || "", images: imageUrls, video_url: videoUrl || null, show_dislikes: showDislikes });
      setNewPost(""); setImageUrls([]); setVideoUrl(""); setShowDislikes(true);
      setPosts(prev => [res.data, ...prev]);
    } catch (err) { toast.error(err.response?.data?.detail || "Post yaradılmadı"); }
    setPosting(false);
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasLiked = p.is_liked;
      return { ...p, is_liked: !wasLiked, like_count: wasLiked ? p.like_count - 1 : p.like_count + 1, is_disliked: !wasLiked ? false : p.is_disliked, dislike_count: !wasLiked && p.is_disliked ? p.dislike_count - 1 : p.dislike_count };
    }));
    try { await api.post(`/posts/${postId}/like`); } catch { loadFeed(); }
  };

  const handleDislike = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasDisliked = p.is_disliked;
      return { ...p, is_disliked: !wasDisliked, dislike_count: wasDisliked ? p.dislike_count - 1 : p.dislike_count + 1, is_liked: !wasDisliked ? false : p.is_liked, like_count: !wasDisliked && p.is_liked ? p.like_count - 1 : p.like_count };
    }));
    try { await api.post(`/posts/${postId}/dislike`); } catch { loadFeed(); }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Bu postu silmək istədiyinə əminsən?")) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    try { await api.delete(`/posts/${postId}`); } catch { loadFeed(); toast.error("Post silinmədi"); }
  };

  const toggleComments = async (postId) => {
    if (openComments[postId]) { setOpenComments({ ...openComments, [postId]: false }); return; }
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: res.data });
      setOpenComments({ ...openComments, [postId]: true });
    } catch {}
  };

  const submitComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    setCommentText({ ...commentText, [postId]: "" });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    try {
      await api.post(`/posts/${postId}/comment`, { content: text });
      const res = await api.get(`/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: res.data });
    } catch { loadFeed(); }
  };

  const submitReport = async () => {
    if (!reportPostId) return;
    setReporting(true);
    try {
      await api.post(`/posts/${reportPostId}/report`, { reason: reportReason.trim() || null });
      setReportPostId(null); setReportReason("");
      toast.success("Şikayət göndərildi.");
    } catch (err) { toast.error(err.response?.data?.detail || "Şikayət göndərilmədi"); }
    setReporting(false);
  };

  const card = { background: C.bg, border: C.border, marginBottom: 10, padding: isMobile ? "12px 10px" : "16px 18px" };
  const btn = (active, color = C.primary) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px", fontSize: 12, cursor: "pointer",
    border: `1px solid ${active ? color : (dark ? "#4b5563" : "#ddd")}`,
    background: active ? `${color}28` : (dark ? "#374151" : "#fff"),
    color: active ? color : C.muted,
  });

  const handleSuggestedConnect = async (userId) => {
    setSuggestedPending(prev => new Set([...prev, userId]));
    try {
      await api.post(`/connections/${userId}`);
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) {
      setSuggestedPending(prev => { const s = new Set(prev); s.delete(userId); return s; });
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "12px 10px" : "20px 12px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 20, alignItems: "flex-start" }}>
    <div style={{ flex: 1, minWidth: 0 }}>

      {/* Header */}
      {user && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>{t("feed_title")}</h1>
            <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>{t("feed_placeholder")}</p>
          </div>
          <Link to="/articles" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", fontSize: 12, color: C.muted, border: C.border, background: C.bg, textDecoration: "none" }}>
            <BookOpen size={13} /> Məqalələr
          </Link>
        </div>
      )}

      {/* Contest banner — mobile only */}
      {isMobile && contestInfo && (() => {
        const pad = n => String(n).padStart(2, "0");
        const d = Math.floor(contestRemaining / 86400);
        const h = Math.floor((contestRemaining % 86400) / 3600);
        const m = Math.floor((contestRemaining % 3600) / 60);
        const s = contestRemaining % 60;
        const divider = <div style={{ height: 1, background: C.divider, margin: "10px 0" }} />;
        return (
          <div style={{ background: C.sidebarBg, border: C.border, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
            {/* Header */}
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted }}>Foto Müsabiqəsi</p>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.text }}>{contestInfo.title || "Hash Müsabiqəsi"}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a4a8a", lineHeight: 1 }}>{contestInfo.prize}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: C.muted }}>mükafat</p>
              </div>
            </div>

            {/* Countdown */}
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.divider}`, display: "flex", gap: 6 }}>
              {[{ v: d, l: "Gün" }, { v: h, l: "Saat" }, { v: m, l: "Dəq" }, { v: s, l: "San" }].map(({ v, l }, i) => (
                <div key={l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  {i > 0 && <span style={{ position: "absolute", fontSize: 14, fontWeight: 700, color: C.muted, marginTop: 1 }} />}
                  <span style={{ fontSize: 16, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{pad(v)}</span>
                  <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <div style={{ padding: "10px 14px" }}>
              {contestBoard.length === 0 ? (
                <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: "center", padding: "4px 0" }}>Hələ iştirakçı yoxdur. İlk sən ol.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {contestBoard.map((entry, idx) => (
                    <div key={entry.post_id}>
                      {idx > 0 && <div style={{ height: 1, background: C.divider, marginBottom: 8 }} />}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, width: 16, flexShrink: 0, textAlign: "center" }}>
                          {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `${entry.rank}`}
                        </span>
                        {entry.image_url && (
                          <img src={entry.image_url} alt="" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.author.full_name}</div>
                          <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Heart size={10} fill="#e11d48" color="#e11d48" /> {entry.like_count}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              {entry.comment_count ?? 0}
                            </span>
                            <span style={{ fontWeight: 700, color: C.primary, marginLeft: "auto" }}>{entry.score ?? entry.like_count} xal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {contestInfo?.tags && (
                <p style={{ fontSize: 10, color: C.faint, margin: "10px 0 0", letterSpacing: "0.03em" }}>
                  {contestInfo.tags.map(t => t.startsWith("#") ? t : `#${t}`).join("  ")}
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* New post form */}
      <form onSubmit={handlePost} style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flexShrink: 0 }}>
            <UserAvatar user={user} size="md" />
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder={t("feed_textarea")}
              style={{ width: "100%", border: "none", borderBottom: `1px solid ${C.divider}`, outline: "none", fontSize: 13, color: C.text, resize: "none", background: "transparent", padding: "4px 0", lineHeight: 1.6, boxSizing: "border-box" }}
              rows={3}
            />

            {imageUrls.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 8 }}>
                {imageUrls.map((url, i) => (
                  <div key={i} style={{ position: "relative", border: C.border, aspectRatio: "1", overflow: "hidden" }}>
                    <img src={url} alt={`preview-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {imageUrls.length < 10 && (
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed #bbb", aspectRatio: "1", cursor: "pointer", color: "#aaa", fontSize: 11 }}>
                    <ImageIcon size={16} />
                    <span style={{ marginTop: 4 }}>Əlavə et</span>
                    <input type="file" accept="image/*" multiple onChange={handleImagePick} disabled={uploading} style={{ display: "none" }} />
                  </label>
                )}
              </div>
            )}

            {videoUrl && (
              <div style={{ position: "relative", marginTop: 8, border: C.border }}>
                <video src={videoUrl} controls style={{ width: "100%", maxHeight: 360, display: "block" }} />
                <button type="button" onClick={() => setVideoUrl("")} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
          <div style={{ display: "flex", gap: 6 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: 12, color: C.primary, border: "1px solid #c8d8f0", background: "#f0f5ff", cursor: "pointer" }}>
              <ImageIcon size={13} /> Şəkil {imageUrls.length > 0 && <span style={{ background: "#1a4a8a", color: "#fff", fontSize: 10, padding: "1px 5px", borderRadius: 8 }}>{imageUrls.length}</span>}
              <input type="file" accept="image/*" multiple onChange={handleImagePick} disabled={uploading} style={{ display: "none" }} />
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: 12, color: C.primary, border: "1px solid #c8d8f0", background: "#f0f5ff", cursor: "pointer" }}>
              <Film size={13} /> Video
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoPick} disabled={uploading} style={{ display: "none" }} />
            </label>
            {uploading && <span style={{ fontSize: 11, color: C.faint, alignSelf: "center" }}>Yüklənir...</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: C.muted, cursor: "pointer" }}>
              <input type="checkbox" checked={showDislikes} onChange={e => setShowDislikes(e.target.checked)} style={{ accentColor: C.primary }} />
              <ThumbsDown size={11} /> göstər
            </label>
            <button type="submit" disabled={(!newPost.trim() && !imageUrls.length && !videoUrl) || posting || uploading}
              style={{ ...C.btnPrimary, display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 16px", fontSize: 12, cursor: "pointer", opacity: ((!newPost.trim() && !imageUrls.length && !videoUrl) || posting || uploading) ? 0.4 : 1 }}>
              <Send size={12} /> {posting ? "..." : t("feed_share")}
            </button>
          </div>
        </div>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...card, opacity: 0.5 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: "#e0e0e0", borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: "#e0e0e0", width: "35%", marginBottom: 6 }} />
                  <div style={{ height: 10, background: "#e8e8e8", width: "25%" }} />
                </div>
              </div>
              <div style={{ height: 11, background: "#e8e8e8", marginBottom: 5 }} />
              <div style={{ height: 11, background: "#ebebeb", width: "70%" }} />
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {!loading && (
        <div>
          {posts.map(post => (
            <div key={post.id} style={card}>
              {/* Post header */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                <Link to={`/profile/${post.author_id}`} style={{ flexShrink: 0 }}>
                  <UserAvatar user={{ full_name: post.author_name, profile_picture: post.author_picture }} size="md" />
                </Link>
                <div style={{ flex: 1, marginLeft: 10 }}>
                  <Link to={`/profile/${post.author_id}`} style={{ fontWeight: 600, fontSize: 13, color: C.text, textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.color = C.primary}
                    onMouseLeave={e => e.currentTarget.style.color = C.text}>
                    {post.author_name}
                  </Link>
                  <p style={{ fontSize: 11, color: C.faint, margin: "2px 0 0" }}>{formatBakuDate(post.created_at)} · {formatBakuHM(post.created_at)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {post.is_pinned && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#92600a", background: "#fef3c7", border: "1px solid #fde68a", padding: "2px 8px" }}>
                      <Pin size={10} /> {t("feed_pinned")}
                    </span>
                  )}
                  {user && post.author_id !== user.id && !connectedIds.has(post.author_id) && (
                    <button onClick={() => handleConnect(post.author_id)} disabled={pendingIds.has(post.author_id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: pendingIds.has(post.author_id) ? "#16a34a" : "#999" }}
                      title={pendingIds.has(post.author_id) ? "İstək göndərildi" : "Bağlantı istəyi göndər"}>
                      {pendingIds.has(post.author_id) ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    </button>
                  )}
                  {user && post.author_id === user.id && (
                    <button onClick={() => handleDelete(post.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#aaa" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
                      onMouseLeave={e => e.currentTarget.style.color = "#aaa"}
                      title="Postu sil"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>

              {/* Post content */}
              {post.content && (
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{post.content}</p>
              )}

              {(post.images?.length > 0 || post.image_url) && (
                <div style={{ border: C.border, overflow: "hidden", marginBottom: 10 }}>
                  <ImageCarousel images={post.images?.length > 0 ? post.images : [post.image_url]} />
                </div>
              )}
              {post.video_url && (
                <div style={{ border: C.border, marginBottom: 10, background: "#000" }}>
                  <video src={post.video_url} controls style={{ width: "100%", maxHeight: 460, display: "block" }} />
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 8, borderTop: `1px solid ${C.divider}` }}>
                <button onClick={() => handleLike(post.id)} style={btn(post.is_liked, "#dc2626")}>
                  <Heart size={14} fill={post.is_liked ? "currentColor" : "none"} /> {post.like_count}
                </button>
                <button onClick={() => handleDislike(post.id)} style={btn(post.is_disliked, "#1a4a8a")}>
                  <ThumbsDown size={14} fill={post.is_disliked ? "currentColor" : "none"} />
                  {post.show_dislikes && <span>{post.dislike_count}</span>}
                </button>
                <button onClick={() => toggleComments(post.id)} style={btn(openComments[post.id], "#1a4a8a")}>
                  <MessageCircle size={14} /> {post.comment_count} {openComments[post.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {user && post.author_id !== user.id && (
                  <button onClick={() => setReportPostId(post.id)}
                    style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", color: "#bbb", display: "inline-flex", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
                    onMouseLeave={e => e.currentTarget.style.color = "#bbb"}
                    title="Şikayət et"><Flag size={13} /></button>
                )}
              </div>

              {/* Comments */}
              {openComments[post.id] && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.divider}` }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input
                      type="text"
                      value={commentText[post.id] || ""}
                      onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && submitComment(post.id)}
                      placeholder={t("feed_comment_placeholder")}
                      style={{ flex: 1, padding: "6px 10px", border: C.border, fontSize: 12, color: C.text, background: C.bg, outline: "none" }}
                      onFocus={e => e.target.style.borderColor = C.primary}
                      onBlur={e => e.target.style.borderColor = dark ? "#374151" : "#ccc"}
                    />
                    <button onClick={() => submitComment(post.id)} disabled={!commentText[post.id]?.trim()}
                      style={{ ...C.btnPrimary, display: "inline-flex", alignItems: "center", padding: "6px 12px", fontSize: 12, cursor: "pointer", opacity: !commentText[post.id]?.trim() ? 0.4 : 1 }}>
                      <Send size={12} />
                    </button>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {(comments[post.id] || []).length === 0 ? (
                      <p style={{ fontSize: 12, color: C.faint, textAlign: "center", padding: "10px 0" }}>Hələ şərh yoxdur</p>
                    ) : (comments[post.id] || []).map(c => (
                      <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <Link to={`/profile/${c.user_id}`} style={{ width: 30, height: 30, background: "#1a4a8a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                          {c.user_name?.charAt(0)}
                        </Link>
                        <div style={{ flex: 1, background: C.commentBg, border: `1px solid ${C.commentBorder}`, padding: "7px 10px" }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 3, alignItems: "center" }}>
                            <Link to={`/profile/${c.user_id}`} style={{ fontSize: 12, fontWeight: 600, color: C.text, textDecoration: "none" }}>{c.user_name}</Link>
                            <span style={{ fontSize: 10, color: C.faint }}>{formatBakuHM(c.created_at)}</span>
                          </div>
                          <p style={{ fontSize: 12, color: C.commentText, margin: 0 }}>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && posts.length > 0 && (
        <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
          {hasMore ? (
            <button onClick={loadMore} disabled={loadingMore}
              style={{ ...C.btnGhost, fontSize: 13, padding: "8px 24px", cursor: loadingMore ? "default" : "pointer", opacity: loadingMore ? 0.5 : 1 }}>
              {loadingMore ? "Yüklənir..." : "Daha çox yüklə"}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: C.muted }}>Bütün postlar yükləndi</span>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
          <TrendingUp size={36} style={{ color: "#bbb", marginBottom: 12 }} />
          <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: "0 0 6px" }}>{t("feed_empty")}</p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{t("feed_empty_sub")}</p>
        </div>
      )}

      {/* Report modal */}
      {reportPostId && (
        <div onClick={() => !reporting && setReportPostId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bg, border: C.border, maxWidth: 400, width: "100%", padding: "20px 22px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Postu şikayət et</h3>
            <p style={{ fontSize: 11, color: C.muted, margin: "0 0 12px" }}>Admin yoxladıqdan sonra tədbir görüləcək</p>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Səbəb (istəyə bağlı)..."
              style={{ width: "100%", border: C.border, background: C.commentBg, color: C.text, padding: "8px 10px", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }} rows={3} maxLength={300} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => { setReportPostId(null); setReportReason(""); }} disabled={reporting}
                style={{ ...C.btnGhost, display: "inline-flex", padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Ləğv et</button>
              <button onClick={submitReport} disabled={reporting}
                style={{ background: "#dc2626", color: "#fff", border: "1px solid #dc2626", display: "inline-flex", padding: "6px 16px", fontSize: 12, cursor: "pointer", opacity: reporting ? 0.5 : 1 }}>
                {reporting ? "Göndərilir..." : "Şikayət göndər"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Sidebar */}
    {(suggested.length > 0 || contestInfo) && !isMobile && (
      <div style={{ width: 240, flexShrink: 0, position: "sticky", top: 68, display: "flex", flexDirection: "column", gap: 10, maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}>

        {/* Tanıya bilərsən */}
        {suggested.length > 0 && (
          <div style={{ background: C.sidebarBg, border: C.border, padding: "12px 14px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Tanıya bilərsən</p>
            <div>
              {(showAllSuggested ? suggested : suggested.slice(0, 2)).map(s => {
                const sent = suggestedPending.has(s.id);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Link to={`/profile/${s.id}`} style={{ width: 32, height: 32, background: "#1a4a8a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, textDecoration: "none", flexShrink: 0, overflow: "hidden", borderRadius: "50%" }}>
                      {s.profile_picture ? <img src={s.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : s.full_name?.charAt(0)}
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/profile/${s.id}`} style={{ fontSize: 12, fontWeight: 600, color: C.text, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.full_name}</Link>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.mutual_count > 0 ? `${s.mutual_count} ümumi` : (s.major || "Hash")}</p>
                    </div>
                    <button onClick={() => !sent && handleSuggestedConnect(s.id)} disabled={sent}
                      style={{ flexShrink: 0, background: sent ? (dark ? "#374151" : "#f0f0f0") : (dark ? "#1e3a5f" : "#f0f5ff"), color: sent ? C.faint : C.primary, border: `1px solid ${sent ? (dark ? "#4b5563" : "#ddd") : (dark ? "#2563eb" : "#c8d8f0")}`, padding: "3px 7px", fontSize: 11, cursor: sent ? "default" : "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      {sent ? <UserCheck size={11} /> : <UserPlus size={11} />}
                      {sent ? "Göndərildi" : "Əlaqə"}
                    </button>
                  </div>
                );
              })}
            </div>
            {suggested.length > 2 && (
              <button onClick={() => setShowAllSuggested(v => !v)}
                style={{ width: "100%", marginTop: 4, background: "none", border: "none", color: C.primary, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left", padding: 0 }}>
                {showAllSuggested ? "Azalt ▲" : `Ətraflı (${suggested.length - 2} daha) ▼`}
              </button>
            )}
          </div>
        )}

        {/* Contest widget */}
        {contestInfo && (() => {
          const pad = n => String(n).padStart(2, "0");
          const d = Math.floor(contestRemaining / 86400);
          const h = Math.floor((contestRemaining % 86400) / 3600);
          const m = Math.floor((contestRemaining % 3600) / 60);
          const s = contestRemaining % 60;
          return (
            <div style={{ background: C.sidebarBg, border: C.border, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#1a4a8a", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>🏆 {contestInfo.prize} Müsabiqə</p>
              </div>

              {/* Countdown */}
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {[{ v: d, l: "gün" }, { v: h, l: "saat" }, { v: m, l: "dəq" }, { v: s, l: "san" }].map(({ v, l }) => (
                  <div key={l} style={{ flex: 1, textAlign: "center", background: dark ? "#0f172a" : "#f0f5ff", borderRadius: 6, padding: "4px 2px" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1a4a8a", fontVariantNumeric: "tabular-nums" }}>{pad(v)}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Leaderboard */}
              {contestBoard.length === 0 ? (
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Hələ iştirakçı yoxdur. İlk sən ol! 📸</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {contestBoard.map(entry => (
                    <div key={entry.post_id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, flexShrink: 0, width: 18, textAlign: "center" }}>
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `${entry.rank}.`}
                      </span>
                      {entry.image_url && (
                        <img src={entry.image_url} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.author.full_name}</div>
                        <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                          <span style={{ color: "#e11d48", display: "flex", alignItems: "center", gap: 2 }}><Heart size={10} fill="#e11d48" /> {entry.like_count}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}>💬 {entry.comment_count ?? 0}</span>
                          <span style={{ color: "#7c3aed", fontWeight: 700 }}>= {entry.score ?? entry.like_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {contestInfo?.tags && (
                <p style={{ fontSize: 10, color: C.muted, margin: "8px 0 0" }}>
                  {contestInfo.tags.map(t => t.startsWith("#") ? t : `#${t}`).join(" ")}
                </p>
              )}
            </div>
          );
        })()}

      </div>
    )}
    </div>
  );
}
