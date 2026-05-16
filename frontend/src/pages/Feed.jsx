import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, ThumbsDown, MessageCircle, Send, Pin, Image as ImageIcon, Film, Flag, X, ChevronDown, ChevronUp, Trash2, UserPlus, UserCheck, ChevronLeft, ChevronRight, BookOpen, TrendingUp } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";

const C = {
  border:   "1px solid #d4d4d4",
  bg:       "#ffffff",
  bgPage:   "#f2f2f2",
  text:     "#1a1a1a",
  muted:    "#666",
  faint:    "#999",
  primary:  "#1a4a8a",
  btnPrimary: { background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a" },
  btnGhost:   { background: "#fff", color: "#444", border: "1px solid #ccc" },
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
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const [suggested, setSuggested] = useState([]);
  const [suggestedPending, setSuggestedPending] = useState(new Set());
  const [newPostCount, setNewPostCount] = useState(0);
  const latestPostIdRef = useRef(null);
  const { t } = useLang();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadFeed().finally(() => setLoading(false));
    loadUser();
    loadConnections();
    api.get("/connections/suggested").then(r => setSuggested(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/posts?limit=1");
        if (res.data.length > 0 && latestPostIdRef.current !== null && res.data[0].id !== latestPostIdRef.current) {
          setNewPostCount(prev => prev + 1);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
      const res = await api.get("/posts");
      setPosts(res.data);
      if (res.data.length > 0) {
        latestPostIdRef.current = res.data[0].id;
      }
      setNewPostCount(0);
    } catch {}
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
      await api.post("/posts", { content: newPost.trim() || "", images: imageUrls, video_url: videoUrl || null, show_dislikes: showDislikes });
      setNewPost(""); setImageUrls([]); setVideoUrl(""); setShowDislikes(true);
      loadFeed();
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
    border: `1px solid ${active ? color : "#ddd"}`,
    background: active ? `${color}18` : "#fff",
    color: active ? color : "#666",
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
          <Link to="/articles" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", fontSize: 12, color: "#444", border: "1px solid #ccc", background: "#fff", textDecoration: "none" }}>
            <BookOpen size={13} /> Məqalələr
          </Link>
        </div>
      )}

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
              style={{ width: "100%", border: "none", borderBottom: "1px solid #e0e0e0", outline: "none", fontSize: 13, color: C.text, resize: "none", background: "transparent", padding: "4px 0", lineHeight: 1.6, boxSizing: "border-box" }}
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "1px solid #ebebeb" }}>
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
          {newPostCount > 0 && (
            <div
              onClick={() => { loadFeed(); window.scrollTo(0, 0); }}
              style={{ background: "#1a4a8a", color: "#fff", textAlign: "center", padding: "8px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>
              ↑ {newPostCount} yeni post var
            </div>
          )}
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
              <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 8, borderTop: "1px solid #ebebeb" }}>
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
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ebebeb" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input
                      type="text"
                      value={commentText[post.id] || ""}
                      onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && submitComment(post.id)}
                      placeholder={t("feed_comment_placeholder")}
                      style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", fontSize: 12, color: C.text, outline: "none" }}
                      onFocus={e => e.target.style.borderColor = "#1a4a8a"}
                      onBlur={e => e.target.style.borderColor = "#ccc"}
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
                        <div style={{ flex: 1, background: "#f7f7f7", border: "1px solid #e8e8e8", padding: "7px 10px" }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 3, alignItems: "center" }}>
                            <Link to={`/profile/${c.user_id}`} style={{ fontSize: 12, fontWeight: 600, color: C.text, textDecoration: "none" }}>{c.user_name}</Link>
                            <span style={{ fontSize: 10, color: C.faint }}>{formatBakuHM(c.created_at)}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#333", margin: 0 }}>{c.content}</p>
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
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", border: C.border, maxWidth: 400, width: "100%", padding: "20px 22px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Postu şikayət et</h3>
            <p style={{ fontSize: 11, color: C.muted, margin: "0 0 12px" }}>Admin yoxladıqdan sonra tədbir görüləcək</p>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Səbəb (istəyə bağlı)..."
              style={{ width: "100%", border: "1px solid #ccc", padding: "8px 10px", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }} rows={3} maxLength={300} />
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

    {/* Suggested Profiles sidebar */}
    {suggested.length > 0 && (
      <div style={{ width: 240, flexShrink: 0, position: "sticky", top: 68, display: isMobile ? "none" : "block" }}>
        <div style={{ background: "#fff", border: "1px solid #d4d4d4", padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
            Tanıya bilərsən
          </p>
          <div>
            {suggested.map(s => {
              const sent = suggestedPending.has(s.id);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                  <Link to={`/profile/${s.id}`} style={{ width: 36, height: 36, background: "#1a4a8a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, textDecoration: "none", flexShrink: 0, overflow: "hidden" }}>
                    {s.profile_picture
                      ? <img src={s.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : s.full_name?.charAt(0)
                    }
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/profile/${s.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.full_name}
                    </Link>
                    {s.mutual_count > 0
                      ? <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{s.mutual_count} ümumi bağlantı</p>
                      : <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>{s.major || "Hash istifadəçisi"}</p>
                    }
                  </div>
                  <button
                    onClick={() => !sent && handleSuggestedConnect(s.id)}
                    disabled={sent}
                    style={{ flexShrink: 0, background: sent ? "#f0f0f0" : "#f0f5ff", color: sent ? "#999" : "#1a4a8a", border: `1px solid ${sent ? "#ddd" : "#c8d8f0"}`, padding: "3px 8px", fontSize: 11, cursor: sent ? "default" : "pointer", display: "flex", alignItems: "center", gap: 3 }}
                  >
                    {sent ? <UserCheck size={12} /> : <UserPlus size={12} />}
                    {sent ? "Göndərildi" : "Əlaqə"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
