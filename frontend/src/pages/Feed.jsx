import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, ThumbsDown, MessageCircle, Send, Pin, TrendingUp, Image as ImageIcon, Film, Flag, X, ChevronDown, ChevronUp, Trash2, UserPlus, UserCheck, ChevronLeft, ChevronRight, BookOpen, Users } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";

function ImageCarousel({ images, dark }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  if (images.length === 1) return (
    <img src={images[0]} alt="post" className="w-full max-h-[500px] object-cover" />
  );
  return (
    <div className="relative select-none">
      <img src={images[idx]} alt={`post-${idx}`} className="w-full max-h-[500px] object-cover" />
      <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition">
        <ChevronLeft size={16} />
      </button>
      <button onClick={() => setIdx(i => (i + 1) % images.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition">
        <ChevronRight size={16} />
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />
        ))}
      </div>
      <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
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
  const [aiLoading, setAiLoading] = useState(false);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const d = useDarkClasses();
  const { t } = useLang();

  useEffect(() => {
    loadFeed().finally(() => setLoading(false));
    loadUser();
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const [myRes, pendRes] = await Promise.all([
        api.get("/connections/my"),
        api.get("/connections/sent"),
      ]);
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
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch (err) {}
  };

  const loadFeed = async () => {
    try {
      const res = await api.get("/posts");
      setPosts(res.data);
    } catch (err) {}
  };

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (imageUrls.length + files.length > 10) {
      toast.error("Maksimum 10 şəkil əlavə edə bilərsiniz");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      const res = await api.post("/upload/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageUrls(prev => [...prev, ...res.data.urls]);
      setVideoUrl("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Şəkil yüklənmədi");
    }
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
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVideoUrl(res.data.url);
      setImageUrls([]);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Video yüklənmədi");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !imageUrls.length && !videoUrl) return;
    setPosting(true);
    try {
      await api.post("/posts", {
        content: newPost.trim() || "",
        images: imageUrls,
        video_url: videoUrl || null,
        show_dislikes: showDislikes,
      });
      setNewPost("");
      setImageUrls([]);
      setVideoUrl("");
      setShowDislikes(true);
      loadFeed();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Post yaradılmadı");
    }
    setPosting(false);
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasLiked = p.is_liked;
      return {
        ...p,
        is_liked: !wasLiked,
        like_count: wasLiked ? p.like_count - 1 : p.like_count + 1,
        is_disliked: !wasLiked ? false : p.is_disliked,
        dislike_count: !wasLiked && p.is_disliked ? p.dislike_count - 1 : p.dislike_count,
      };
    }));
    try { await api.post(`/posts/${postId}/like`); } catch (err) { loadFeed(); }
  };

  const handleDislike = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasDisliked = p.is_disliked;
      return {
        ...p,
        is_disliked: !wasDisliked,
        dislike_count: wasDisliked ? p.dislike_count - 1 : p.dislike_count + 1,
        is_liked: !wasDisliked ? false : p.is_liked,
        like_count: !wasDisliked && p.is_liked ? p.like_count - 1 : p.like_count,
      };
    }));
    try { await api.post(`/posts/${postId}/dislike`); } catch (err) { loadFeed(); }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Bu postu silmək istədiyinə əminsən?")) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    try { await api.delete(`/posts/${postId}`); } catch (err) { loadFeed(); toast.error(err.response?.data?.detail || "Post silinmədi"); }
  };

  const toggleComments = async (postId) => {
    if (openComments[postId]) { setOpenComments({ ...openComments, [postId]: false }); return; }
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: res.data });
      setOpenComments({ ...openComments, [postId]: true });
    } catch (err) {}
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
    } catch (err) { loadFeed(); }
  };

  const handleAiEnhance = async () => {
    if (!newPost.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post("/posts/ai-enhance", { text: newPost });
      setNewPost(res.data.text);
    } catch (err) {
      toast.error(err.response?.data?.detail || "AI xəta verdi");
    }
    setAiLoading(false);
  };

  const submitReport = async () => {
    if (!reportPostId) return;
    setReporting(true);
    try {
      await api.post(`/posts/${reportPostId}/report`, { reason: reportReason.trim() || null });
      setReportPostId(null);
      setReportReason("");
      toast.success("Şikayət göndərildi. Admin yoxlayacaq.");
    } catch (err) { toast.error(err.response?.data?.detail || "Şikayət göndərilmədi"); }
    setReporting(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex gap-5">

      {/* ── LEFT: Profile Sidebar ── */}
      {user && (
        <aside className="w-60 shrink-0 hidden lg:block">
          <div className="sticky top-20 rounded-2xl overflow-hidden"
            style={{
              background: d.dark
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.85)",
              border: d.dark
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.08)",
              backdropFilter: "blur(16px)",
              boxShadow: d.dark
                ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)"
                : "0 4px 24px rgba(0,0,0,0.08)",
            }}>

            {/* Cover */}
            <div className="relative">
              <div className="h-14"
                style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }} />
              <div className="absolute -bottom-6 left-4"
                style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}>
                <UserAvatar
                  user={{ full_name: user.full_name, profile_picture: user.profile_picture }}
                  size="lg"
                />
              </div>
            </div>

            {/* Info */}
            <div className="pt-9 px-4 pb-4">
              <Link to={`/profile/${user.id}`}>
                <h3 className="font-bold text-sm leading-tight transition"
                  style={{ color: d.dark ? "#f1f5f9" : "#0f172a" }}>
                  {user.full_name}
                </h3>
              </Link>

              {user.headline && (
                <p className="text-xs mt-1 leading-snug"
                  style={{ color: d.dark ? "#94a3b8" : "#475569" }}>
                  {user.headline}
                </p>
              )}

              {(user.faculty || user.major) && (
                <p className="text-xs mt-1"
                  style={{ color: d.dark ? "#64748b" : "#94a3b8" }}>
                  {[user.major, user.faculty].filter(Boolean).join(" · ")}
                </p>
              )}

              {user.course && (
                <p className="text-xs mt-0.5"
                  style={{ color: d.dark ? "#64748b" : "#94a3b8" }}>
                  {user.course}-ci kurs · MAA
                </p>
              )}

              {user.is_open_for_team && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-500">Komanda üçün açıq</span>
                </div>
              )}

              <div className="my-3"
                style={{ height: 1, background: d.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />

              {/* Stats */}
              <div className="space-y-2 mb-3">
                <Link to="/connections" className="flex items-center justify-between group">
                  <span className="text-xs transition group-hover:text-blue-400"
                    style={{ color: d.dark ? "#94a3b8" : "#64748b" }}>Bağlantılar</span>
                  <span className="text-xs font-bold text-blue-500">{connectedIds.size}</span>
                </Link>
                <Link to={`/profile/${user.id}`} className="flex items-center justify-between group">
                  <span className="text-xs transition group-hover:text-blue-400"
                    style={{ color: d.dark ? "#94a3b8" : "#64748b" }}>Profilim</span>
                  <span className="text-xs font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition">Bax →</span>
                </Link>
              </div>

              <div className="my-3"
                style={{ height: 1, background: d.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />

              {/* Skills */}
              {user.skills && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider"
                    style={{ color: d.dark ? "#475569" : "#94a3b8" }}>Bacarıqlar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.split(",").slice(0, 5).map(s => s.trim()).filter(Boolean).map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: d.dark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                          border: "1px solid rgba(99,102,241,0.25)",
                          color: d.dark ? "#a5b4fc" : "#6366f1",
                        }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="space-y-0.5">
                {[
                  { to: "/articles",    icon: BookOpen,      label: "Məqalələr" },
                  { to: "/connections", icon: Users,         label: "Şəbəkəm" },
                  { to: "/messages",    icon: MessageCircle, label: "Mesajlar" },
                ].map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ color: d.dark ? "#64748b" : "#94a3b8" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = d.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
                      e.currentTarget.style.color = d.dark ? "#e2e8f0" : "#1e293b";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = d.dark ? "#64748b" : "#94a3b8";
                    }}>
                    <Icon size={13} />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Social links */}
              {(user.github_url || user.linkedin_url) && (
                <>
                  <div className="my-3"
                    style={{ height: 1, background: d.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
                  <div className="flex gap-2">
                    {user.github_url && (
                      <a href={user.github_url} target="_blank" rel="noreferrer"
                        className="text-xs px-2.5 py-1 rounded-lg font-medium transition"
                        style={{
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: d.dark ? "#94a3b8" : "#64748b",
                        }}>
                        GitHub
                      </a>
                    )}
                    {user.linkedin_url && (
                      <a href={user.linkedin_url} target="_blank" rel="noreferrer"
                        className="text-xs px-2.5 py-1 rounded-lg font-medium transition"
                        style={{
                          border: "1px solid rgba(99,102,241,0.25)",
                          color: d.dark ? "#a5b4fc" : "#6366f1",
                        }}>
                        LinkedIn
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      )}

      <div className="flex-1 min-w-0">
      {user && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${d.heading}`}>
              {t("feed_title")}
            </h1>
            <p className={d.textFaint + " text-sm mt-1"}>{t("feed_placeholder")}</p>
          </div>
          <div className="flex items-center gap-2">
          <Link
            to="/articles"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition
              ${d.dark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <BookOpen size={16} />
            Məqalələr
          </Link>
          </div>
        </div>
      )}

      {/* Yeni post */}
      <form onSubmit={handlePost} className={`${d.card} rounded-2xl shadow-sm p-5 mb-8 hover:shadow-md transition-shadow duration-300`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0">
            <UserAvatar user={user} size="md" />
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={t("feed_textarea")}
              className={`w-full p-3 border-0 resize-none focus:outline-none ${d.textSecondary} ${d.dark ? "placeholder-gray-500 bg-transparent" : "placeholder-gray-300"} text-[15px] leading-relaxed`}
              rows={3}
            />
            {imageUrls.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className={`relative rounded-xl overflow-hidden border ${d.border} aspect-square`}>
                    <img src={url} alt={`preview-${i}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {imageUrls.length < 10 && (
                  <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${d.dark ? "border-gray-600 text-gray-500 hover:border-blue-500" : "border-gray-200 text-gray-300 hover:border-blue-400"} aspect-square cursor-pointer transition`}>
                    <ImageIcon size={20} />
                    <span className="text-xs mt-1">Əlavə et</span>
                    <input type="file" accept="image/*" multiple onChange={handleImagePick} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
            )}
            {videoUrl && (
              <div className={`relative mt-2 rounded-xl overflow-hidden border ${d.border}`}>
                <video src={videoUrl} controls className="w-full max-h-96" />
                <button type="button" onClick={() => setVideoUrl("")} className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition"><X size={16} /></button>
              </div>
            )}
          </div>
        </div>

        <div className={`flex items-center justify-between mt-3 pt-4 border-t ${d.borderLight}`}>
          <div className="flex items-center gap-1">
            <label className="flex items-center gap-2 text-sm text-blue-600 font-medium cursor-pointer hover:bg-blue-50/10 px-3 py-2 rounded-xl transition">
              <ImageIcon size={16} /> Şəkil {imageUrls.length > 0 && <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">{imageUrls.length}</span>}
              <input type="file" accept="image/*" multiple onChange={handleImagePick} disabled={uploading} className="hidden" />
            </label>
            <label className="flex items-center gap-2 text-sm text-blue-600 font-medium cursor-pointer hover:bg-blue-50/10 px-3 py-2 rounded-xl transition">
              <Film size={16} /> Video
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoPick} disabled={uploading} className="hidden" />
            </label>
            {uploading && <span className={`text-xs ${d.textFaint} ml-2`}>Yüklənir...</span>}
          </div>
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 cursor-pointer text-xs ${d.textMuted}`}>
              <input type="checkbox" checked={showDislikes} onChange={(e) => setShowDislikes(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
              <ThumbsDown size={14} /> göstər
            </label>
            <button type="submit" disabled={(!newPost.trim() && !imageUrls.length && !videoUrl) || posting || uploading} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none text-sm">
              <Send size={15} /> {posting ? "..." : t("feed_share")}
            </button>
          </div>
        </div>
      </form>

      {/* Skeleton loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${d.card} rounded-2xl shadow-sm p-5 animate-pulse`}>
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full ${d.dark ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className="ml-3.5 flex-1">
                  <div className={`h-4 ${d.dark ? "bg-gray-700" : "bg-gray-200"} rounded w-32 mb-2`} />
                  <div className={`h-3 ${d.dark ? "bg-gray-700" : "bg-gray-200"} rounded w-24`} />
                </div>
              </div>
              <div className={`h-4 ${d.dark ? "bg-gray-700" : "bg-gray-200"} rounded w-full mb-2`} />
              <div className={`h-4 ${d.dark ? "bg-gray-700" : "bg-gray-200"} rounded w-3/4 mb-4`} />
              <div className={`flex gap-4 pt-3 border-t ${d.borderLight}`}>
                <div className={`h-8 ${d.dark ? "bg-gray-700" : "bg-gray-200"} rounded-xl w-16`} />
                <div className={`h-8 ${d.dark ? "bg-gray-700" : "bg-gray-200"} rounded-xl w-16`} />
                <div className={`h-8 ${d.dark ? "bg-gray-700" : "bg-gray-200"} rounded-xl w-16`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Postlar */}
      {!loading && <div className="space-y-4">
        {posts.map((post, index) => (
          <div key={post.id} className={`${d.card} rounded-2xl shadow-sm p-5 hover:shadow-md transition-all duration-300 group`}>
            <div className="flex items-center mb-4">
              <Link to={`/profile/${post.author_id}`} className="shrink-0">
                <UserAvatar user={{ full_name: post.author_name, profile_picture: post.author_picture }} size="md" />
              </Link>
              <div className="ml-3.5 flex-1">
                <Link to={`/profile/${post.author_id}`} className={`font-semibold ${d.text} text-[15px] hover:text-blue-600 transition`}>{post.author_name}</Link>
                <p className={`text-xs ${d.textFaint} mt-0.5`}>{formatBakuDate(post.created_at)} · {formatBakuHM(post.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {post.is_pinned && (
                  <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 text-xs px-3.5 py-1.5 rounded-full font-semibold border border-amber-100">
                    <Pin size={12} /> {t("feed_pinned")}
                  </span>
                )}
                {user && post.author_id !== user.id && !connectedIds.has(post.author_id) && (
                  <button
                    onClick={() => handleConnect(post.author_id)}
                    disabled={pendingIds.has(post.author_id)}
                    title={pendingIds.has(post.author_id) ? "İstək göndərildi" : "Bağlantı istəyi göndər"}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      pendingIds.has(post.author_id)
                        ? d.dark ? "text-green-400 bg-green-500/10" : "text-green-600 bg-green-50"
                        : d.dark ? "text-gray-500 hover:text-blue-400 hover:bg-blue-500/10" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {pendingIds.has(post.author_id) ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  </button>
                )}
                {user && post.author_id === user.id && (
                  <button onClick={() => handleDelete(post.id)} className={`${d.textFaint} hover:text-red-500 transition p-1`} title="Postu sil"><Trash2 size={16} /></button>
                )}
              </div>
            </div>

            {post.content && <p className={`${d.textSecondary} leading-relaxed mb-4 text-[15px] whitespace-pre-wrap`}>{post.content}</p>}
            {(post.images?.length > 0 || post.image_url) && (
              <div className={`mb-4 rounded-xl overflow-hidden border ${d.border}`}>
                <ImageCarousel images={post.images?.length > 0 ? post.images : [post.image_url]} dark={d.dark} />
              </div>
            )}
            {post.video_url && <div className={`mb-4 rounded-xl overflow-hidden border ${d.border} bg-black`}><video src={post.video_url} controls className="w-full max-h-[500px]" /></div>}

            <div className={`flex items-center gap-1 pt-3 border-t ${d.borderLight}`}>
              <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${post.is_liked ? "text-red-500 bg-red-500/10" : `${d.textFaint} hover:text-red-500 hover:bg-red-500/10`}`}>
                <Heart size={18} fill={post.is_liked ? "currentColor" : "none"} className={post.is_liked ? "scale-110" : ""} />
                <span>{post.like_count}</span>
              </button>
              <button onClick={() => handleDislike(post.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${post.is_disliked ? "text-blue-500 bg-blue-500/10" : `${d.textFaint} hover:text-blue-500 hover:bg-blue-500/10`}`}>
                <ThumbsDown size={18} fill={post.is_disliked ? "currentColor" : "none"} className={post.is_disliked ? "scale-110" : ""} />
                {post.show_dislikes && <span>{post.dislike_count}</span>}
              </button>
              <button onClick={() => toggleComments(post.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${openComments[post.id] ? "text-blue-500 bg-blue-500/10" : `${d.textFaint} hover:text-blue-500 hover:bg-blue-500/10`}`}>
                <MessageCircle size={18} /> <span>{post.comment_count}</span>
                {openComments[post.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {user && post.author_id !== user.id && (
                <button onClick={() => setReportPostId(post.id)} className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${d.textFaint} hover:text-red-500 hover:bg-red-500/10 transition`} title="Şikayət et"><Flag size={14} /></button>
              )}
            </div>

            {/* Comments */}
            {openComments[post.id] && (
              <div className={`mt-4 pt-4 border-t ${d.border}`}>
                <div className="flex gap-3 mb-4">
                  <input type="text" value={commentText[post.id] || ""} onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)} placeholder={t("feed_comment_placeholder")}
                    className={`flex-1 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition ${d.input}`} />
                  <button onClick={() => submitComment(post.id)} disabled={!commentText[post.id]?.trim()} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-30"><Send size={14} /></button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(comments[post.id] || []).length === 0 ? (
                    <p className={`${d.textFaint} text-sm text-center py-3`}>Hələ şərh yoxdur</p>
                  ) : (
                    (comments[post.id] || []).map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Link to={`/profile/${c.user_id}`} className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0">{c.user_name?.charAt(0)}</Link>
                        <div className={`flex-1 ${d.dark ? "bg-gray-700/50" : "bg-gray-50"} rounded-xl px-4 py-3`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Link to={`/profile/${c.user_id}`} className={`text-sm font-semibold ${d.text} hover:text-blue-600 transition`}>{c.user_name}</Link>
                            <span className={`text-xs ${d.textFaint}`}>{formatBakuHM(c.created_at)}</span>
                          </div>
                          <p className={`text-sm ${d.textSecondary}`}>{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>}

      {/* Report modal */}
      {reportPostId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => !reporting && setReportPostId(null)}>
          <div className={`${d.card} rounded-2xl p-6 max-w-md w-full shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center"><Flag size={18} className="text-red-500" /></div>
              <div>
                <h3 className={`font-bold ${d.text}`}>Postu şikayət et</h3>
                <p className={`text-xs ${d.textFaint}`}>Admin yoxladıqdan sonra tədbir görüləcək</p>
              </div>
            </div>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Səbəb (istəyə bağlı)..." className={`w-full p-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 ${d.input}`} rows={3} maxLength={300} />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => { setReportPostId(null); setReportReason(""); }} disabled={reporting} className={`px-4 py-2 text-sm font-medium ${d.textMuted} hover:opacity-80 rounded-xl transition`}>Ləğv et</button>
              <button onClick={submitReport} disabled={reporting} className="px-5 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition disabled:opacity-50">{reporting ? "Göndərilir..." : "Şikayət göndər"}</button>
            </div>
          </div>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-20">
          <div className={`w-20 h-20 ${d.dark ? "bg-blue-500/10" : "bg-gradient-to-br from-blue-50 to-indigo-50"} rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm`}>
            <TrendingUp size={32} className="text-blue-400" />
          </div>
          <p className={`${d.text} font-semibold text-lg`}>{t("feed_empty")}</p>
          <p className={`${d.textFaint} text-sm mt-2 max-w-xs mx-auto`}>{t("feed_empty_sub")}</p>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
