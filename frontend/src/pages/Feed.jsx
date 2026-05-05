import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ThumbsDown, MessageCircle, Send, Pin, TrendingUp, Image as ImageIcon, Film, Flag, X, ChevronDown, ChevronUp, Trash2, FileText } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
  const d = useDarkClasses();
  const { t } = useLang();

  useEffect(() => {
    loadFeed().finally(() => setLoading(false));
    loadUser();
  }, []);

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

  const handleMediaPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.resource_type === "video") {
        setVideoUrl(res.data.url);
        setImageUrl("");
      } else {
        setImageUrl(res.data.url);
        setVideoUrl("");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Fayl yüklənmədi");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !imageUrl && !videoUrl) return;
    setPosting(true);
    try {
      await api.post("/posts", {
        content: newPost.trim() || "",
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        show_dislikes: showDislikes,
      });
      setNewPost("");
      setImageUrl("");
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
    <div className="max-w-2xl mx-auto py-8 px-4">
      {user && (
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${d.heading}`}>
            {t("feed_title")}
          </h1>
          <p className={d.textFaint + " text-sm mt-1"}>{t("feed_placeholder")}</p>
          {/* <Link to="/article/new" className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 transition">
            <FileText size={16} /> Məqalə yaz
          </Link> */}
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
            {imageUrl && (
              <div className={`relative mt-2 rounded-xl overflow-hidden border ${d.border}`}>
                <img src={imageUrl} alt="preview" className="w-full max-h-96 object-cover" />
                <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition"><X size={16} /></button>
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
              <ImageIcon size={16} /> Şəkil
              <input type="file" accept="image/*" onChange={handleMediaPick} disabled={uploading} className="hidden" />
            </label>
            <label className="flex items-center gap-2 text-sm text-blue-600 font-medium cursor-pointer hover:bg-blue-50/10 px-3 py-2 rounded-xl transition">
              <Film size={16} /> Video
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleMediaPick} disabled={uploading} className="hidden" />
            </label>
            {uploading && <span className={`text-xs ${d.textFaint} ml-2`}>Yüklənir...</span>}
          </div>
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 cursor-pointer text-xs ${d.textMuted}`}>
              <input type="checkbox" checked={showDislikes} onChange={(e) => setShowDislikes(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
              <ThumbsDown size={14} /> göstər
            </label>
            <button type="submit" disabled={(!newPost.trim() && !imageUrl && !videoUrl) || posting || uploading} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none text-sm">
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
                {user && post.author_id === user.id && (
                  <button onClick={() => handleDelete(post.id)} className={`${d.textFaint} hover:text-red-500 transition p-1`} title="Postu sil"><Trash2 size={16} /></button>
                )}
              </div>
            </div>

            {post.content && <p className={`${d.textSecondary} leading-relaxed mb-4 text-[15px] whitespace-pre-wrap`}>{post.content}</p>}
            {post.image_url && <div className={`mb-4 rounded-xl overflow-hidden border ${d.border}`}><img src={post.image_url} alt="post" className="w-full max-h-[500px] object-cover" /></div>}
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
  );
}
