import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "../components/Toast";
import { Edit3, Save, X, BookOpen, Award, GraduationCap, Sparkles, Plus, Trash2, ExternalLink, Camera, FolderGit2, Code2, Heart, ThumbsDown, MessageCircle, FileText, Send, Mail, Inbox } from "lucide-react";
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { useDarkClasses } from "../hooks/useDarkClasses";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000";

export default function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isOwn, setIsOwn] = useState(!id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certForm, setCertForm] = useState({ name: "", issuer: "", issue_date: "", credential_url: "" });
  const [projForm, setProjForm] = useState({ title: "", description: "", github_url: "", technologies: "" });
  const [showCertForm, setShowCertForm] = useState(false);
  const [showProjForm, setShowProjForm] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [showQuickMsg, setShowQuickMsg] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState("");
  const [inbox, setInbox] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const fileInputRef = useRef(null);
  const d = useDarkClasses();

  useEffect(() => {
    loadProfile();
    loadCertificates();
    loadProjects();
    loadUserPosts();
    loadTemplates();
  }, [id]);

  const loadProfile = async () => {
    try {
      if (id) {
        const [profileRes, meRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get("/users/me"),
        ]);
        setUser(profileRes.data);
        setForm(profileRes.data);
        setIsOwn(meRes.data.id === profileRes.data.id);
      } else {
        const res = await api.get("/users/me");
        setUser(res.data);
        setForm(res.data);
        setIsOwn(true);
      }
    } catch (err) {}
  };

  const loadCertificates = async () => {
    try {
      const res = id ? await api.get(`/certificates/user/${id}`) : await api.get("/certificates/me");
      setCertificates(res.data);
    } catch (err) {}
  };

  const loadProjects = async () => {
    try {
      const res = id ? await api.get(`/projects/user/${id}`) : await api.get("/projects/me");
      setProjects(res.data);
    } catch (err) {}
  };

  const loadUserPosts = async () => {
    try {
      const userId = id || (await api.get("/users/me")).data.id;
      const res = await api.get(`/posts/user/${userId}`);
      setUserPosts(res.data);
    } catch (err) {}
  };

  const loadTemplates = async () => {
    try {
      const res = await api.get("/messages/templates");
      setTemplates(res.data);
    } catch (err) {}
  };

  const loadInbox = async () => {
    try {
      const res = await api.get("/messages/inbox");
      setInbox(res.data);
      setShowInbox(true);
    } catch (err) {}
  };

  const sendQuickMessage = async (index) => {
    if (!user) return;
    setSendingMsg(true);
    try {
      await api.post(`/messages/${user.id}`, { template_index: index });
      setMsgSent(templates[index]);
      setTimeout(() => { setMsgSent(""); setShowQuickMsg(false); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Mesaj göndərilmədi");
    }
    setSendingMsg(false);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Bu postu silmək istədiyinə əminsən?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      loadUserPosts();
    } catch (err) {}
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await api.put("/users/me", { profile_picture: uploadRes.data.url });
      loadProfile();
    } catch (err) {}
    setUploadingPic(false);
  };

  const handleAddCert = async () => {
    try {
      await api.post("/certificates", {
        ...certForm,
        issue_date: certForm.issue_date || null,
        credential_url: certForm.credential_url || null,
      });
      setCertForm({ name: "", issuer: "", issue_date: "", credential_url: "" });
      setShowCertForm(false);
      loadCertificates();
    } catch (err) {}
  };

  const handleDeleteCert = async (id) => {
    try {
      await api.delete(`/certificates/${id}`);
      loadCertificates();
    } catch (err) {}
  };

  const handleAddProject = async () => {
    try {
      await api.post("/projects", {
        ...projForm,
        technologies: projForm.technologies || null,
        github_url: projForm.github_url || null,
      });
      setProjForm({ title: "", description: "", github_url: "", technologies: "" });
      setShowProjForm(false);
      loadProjects();
    } catch (err) {}
  };

  const handleDeleteProject = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      loadProjects();
    } catch (err) {}
  };

  const handleSave = async () => {
    try {
      await api.put("/users/me", {
        full_name: form.full_name,
        major: form.major,
        course: form.course,
        bio: form.bio,
        skills: form.skills,
        is_open_for_team: form.is_open_for_team,
      });
      setEditing(false);
      loadProfile();
    } catch (err) {}
  };

  const getCompletionPercent = () => {
    if (!user) return 0;
    const checks = [
      !!user.full_name,
      !!user.major,
      !!user.course,
      !!user.bio,
      !!user.skills,
      !!user.profile_picture,
      certificates.length > 0,
      projects.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-pulse">
      <div className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-3xl h-36`} />
      <div className={`${d.dark ? "bg-gray-800" : "bg-white"} rounded-b-3xl px-6 pb-8`}>
        <div className="flex items-end justify-between -mt-12 mb-5">
          <div className={`w-24 h-24 rounded-2xl ${d.dark ? "bg-gray-700" : "bg-gray-200"} border-4 ${d.dark ? "border-gray-800" : "border-white"}`} />
          <div className={`h-10 w-24 rounded-xl ${d.dark ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>
        <div className={`h-6 w-48 rounded ${d.dark ? "bg-gray-700" : "bg-gray-200"} mb-2`} />
        <div className={`h-4 w-32 rounded ${d.dark ? "bg-gray-700" : "bg-gray-200"} mb-6`} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-20 rounded-xl ${d.dark ? "bg-gray-700" : "bg-gray-100"}`} />
          ))}
        </div>
      </div>
    </div>
  );

  const completionPercent = getCompletionPercent();
  const completionColor = completionPercent < 50 ? "from-amber-400 to-orange-500" : completionPercent < 80 ? "from-blue-400 to-blue-600" : "from-green-400 to-emerald-500";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Cover */}
      <div className="relative">
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-t-3xl h-36 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTAgMjR2LTJIMTJ2Mkg2djJIMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        </div>
      </div>

      {/* Profile Card */}
      <div className={`${d.dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} rounded-b-3xl border border-t-0 shadow-sm px-6 pb-8 relative`}>
        <div className="flex items-end justify-between -mt-12 mb-5">
          {/* Avatar with upload */}
          <div className="relative group">
            <div className="border-4 border-white shadow-xl shadow-blue-200 ring-4 ring-blue-50 rounded-2xl overflow-hidden">
              <UserAvatar user={user} size="lg" className="rounded-none" />
            </div>
            {isOwn && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPic}
                  className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera size={24} className="text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUploadPic} />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOwn && (
              <button
                onClick={() => setEditing(!editing)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  editing
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 hover:shadow-md hover:shadow-blue-100 border border-blue-100"
                }`}
              >
                {editing ? <><X size={16} /> Ləğv et</> : <><Edit3 size={16} /> Redaktə</>}
              </button>
            )}
          </div>
        </div>

        <h2 className={`text-2xl font-bold ${d.heading}`}>{user.full_name}</h2>
        <p className={`${d.textFaint} text-sm mt-1`}>{user.email}</p>

        {user.is_open_for_team && (
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 text-xs px-4 py-1.5 rounded-full mt-3 font-semibold border border-green-100">
            <Award size={13} /> Komanda üçün açıq
          </span>
        )}

        {isOwn && completionPercent < 100 && (
          <div className={`mt-4 ${d.dark ? "bg-gray-700/50" : "bg-gray-50"} p-4 rounded-xl border ${d.border}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-semibold ${d.textMuted}`}>Profil tamamlanması</p>
              <p className={`text-xs font-bold ${d.textSecondary}`}>{completionPercent}%</p>
            </div>
            <div className={`w-full ${d.dark ? "bg-gray-600" : "bg-gray-200"} rounded-full h-2`}>
              <div
                className={`bg-gradient-to-r ${completionColor} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className={`text-xs ${d.textFaint} mt-2`}>
              {!user.profile_picture && "Profil şəkli, "}
              {!user.bio && "haqqında, "}
              {!user.skills && "bacarıqlar, "}
              {certificates.length === 0 && "sertifikat, "}
              {projects.length === 0 && "layihə "}
              əlavə et
            </p>
          </div>
        )}

        {editing ? (
          <div className="space-y-5 mt-8">
            <div>
              <label className={`block text-sm font-semibold ${d.textSecondary} mb-2`}>Ad Soyad</label>
              <input
                type="text"
                value={form.full_name || ""}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold ${d.textSecondary} mb-2`}>İxtisas</label>
                <input
                  type="text"
                  value={form.major || ""}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${d.textSecondary} mb-2`}>Kurs</label>
                <select
                  value={form.course || ""}
                  onChange={(e) => setForm({ ...form, course: parseInt(e.target.value) || null })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
                >
                  <option value="">Seçin</option>
                  <option value="1">1-ci kurs</option>
                  <option value="2">2-ci kurs</option>
                  <option value="3">3-cü kurs</option>
                  <option value="4">4-cü kurs</option>
                </select>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-semibold ${d.textSecondary} mb-2`}>Haqqında</label>
              <textarea
                value={form.bio || ""}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${d.inputAlt}`}
                rows={3}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${d.textSecondary} mb-2`}>Bacarıqlar</label>
              <input
                type="text"
                value={form.skills || ""}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="Python, React, Design"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
              />
            </div>
            <label className={`flex items-center gap-3 cursor-pointer ${d.dark ? "bg-gray-700/50 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"} p-4 rounded-xl transition`}>
              <input
                type="checkbox"
                checked={form.is_open_for_team || false}
                onChange={(e) => setForm({ ...form, is_open_for_team: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded-lg border-gray-300"
              />
              <div>
                <span className={`text-sm font-medium ${d.textSecondary}`}>Komanda üçün açığam</span>
                <p className={`text-xs ${d.textFaint} mt-0.5`}>Başqaları sizi komandaya dəvət edə bilər</p>
              </div>
            </label>
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 flex items-center gap-2"
            >
              <Save size={18} /> Yadda saxla
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {user.major && (
              <div className="flex items-center gap-3 ${d.surface} p-4 rounded-xl border ${d.border}">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <GraduationCap size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">İxtisas</p>
                  <p className={`${d.text} font-semibold`}>{user.major} {user.course && `· ${user.course}-ci kurs`}</p>
                </div>
              </div>
            )}

            {user.bio && (
              <div className="${d.surface} p-5 rounded-xl border ${d.border}">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-gray-400" />
                  <p className="text-sm text-gray-400 font-medium">Haqqında</p>
                </div>
                <p className={`${d.textSecondary} leading-relaxed`}>{user.bio}</p>
              </div>
            )}

            {user.skills && (
              <div className="${d.surface} p-5 rounded-xl border ${d.border}">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-gray-400" />
                  <p className="text-sm text-gray-400 font-medium">Bacarıqlar</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.skills.split(",").map((s, i) => (
                    <span key={i} className={`px-4 py-2 rounded-xl text-sm font-semibold border ${d.dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-blue-100"}`}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sertifikatlar */}
            <div className="${d.surface} p-5 rounded-xl border ${d.border}">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-gray-400" />
                  <p className="text-sm text-gray-400 font-medium">Sertifikatlar</p>
                </div>
                {isOwn && (
                  <button onClick={() => setShowCertForm(!showCertForm)} className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-700 transition">
                    <Plus size={16} /> Əlavə et
                  </button>
                )}
              </div>

              {isOwn && showCertForm && (
                <div className={`${d.dark ? "bg-gray-700" : "bg-white"} p-4 rounded-xl border ${d.dark ? "border-blue-500/20" : "border-blue-100"} mb-4 space-y-3`}>
                  <input type="text" placeholder="Sertifikat adı" value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${d.inputAlt}`} />
                  <input type="text" placeholder="Verən təşkilat (məsələn: Google, ISC2)" value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${d.inputAlt}`} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={certForm.issue_date} onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${d.inputAlt}`} />
                    <input type="url" placeholder="Doğrulama linki" value={certForm.credential_url} onChange={(e) => setCertForm({ ...certForm, credential_url: e.target.value })} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${d.inputAlt}`} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddCert} disabled={!certForm.name || !certForm.issuer} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40">Əlavə et</button>
                    <button onClick={() => setShowCertForm(false)} className={`${d.dark ? "bg-gray-600 text-gray-300 hover:bg-gray-500" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} px-5 py-2 rounded-xl text-sm font-medium transition`}>Ləğv et</button>
                  </div>
                </div>
              )}

              {certificates.length > 0 ? (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert.id} className={`flex items-center justify-between ${d.dark ? "bg-gray-700/50" : "bg-white"} p-4 rounded-xl border ${d.border}`}>
                      <div className="flex-1">
                        <p className={`${d.text} font-semibold text-sm`}>{cert.name}</p>
                        <p className={`${d.textFaint} text-xs mt-0.5`}>{cert.issuer}{cert.issue_date && ` · ${cert.issue_date}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cert.credential_url && (
                          <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition"><ExternalLink size={16} /></a>
                        )}
                        {isOwn && (
                          <button onClick={() => handleDeleteCert(cert.id)} className="text-red-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-sm text-center py-4">{isOwn ? "Hələ sertifikat əlavə olunmayıb" : "Sertifikat yoxdur"}</p>
              )}
            </div>

            {/* Postlar */}
            <div className="${d.surface} p-5 rounded-xl border ${d.border}">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-gray-400" />
                <p className="text-sm text-gray-400 font-medium">Postlar</p>
                <span className="text-xs text-gray-300 ml-1">({userPosts.length})</span>
              </div>

              {userPosts.length > 0 ? (
                <div className="space-y-3">
                  {userPosts.map((post) => (
                    <div key={post.id} className={`${d.dark ? "bg-gray-700/50" : "bg-white"} p-4 rounded-xl border ${d.border}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {post.content && (
                            <p className={`${d.textSecondary} text-sm whitespace-pre-wrap line-clamp-3`}>{post.content}</p>
                          )}
                          {!post.content && post.image_url && (
                            <p className={`${d.textFaint} text-sm italic`}>Şəkil post</p>
                          )}
                          {!post.content && post.video_url && (
                            <p className={`${d.textFaint} text-sm italic`}>Video post</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Heart size={12} /> {post.like_count}
                            </span>
                            {post.show_dislikes && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <ThumbsDown size={12} /> {post.dislike_count}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MessageCircle size={12} /> {post.comment_count}
                            </span>
                            <span className="text-xs text-gray-300">{formatBakuDate(post.created_at)}</span>
                          </div>
                        </div>
                        {isOwn && (
                          <button onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-500 transition ml-3">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-sm text-center py-4">{isOwn ? "Hələ post paylaşmamısan" : "Post yoxdur"}</p>
              )}
            </div>

            {/* Layihələr */}
            <div className="${d.surface} p-5 rounded-xl border ${d.border}">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderGit2 size={16} className="text-gray-400" />
                  <p className="text-sm text-gray-400 font-medium">Layihələr</p>
                </div>
                {isOwn && (
                  <button onClick={() => setShowProjForm(!showProjForm)} className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-700 transition">
                    <Plus size={16} /> Əlavə et
                  </button>
                )}
              </div>

              {isOwn && showProjForm && (
                <div className={`${d.dark ? "bg-gray-700" : "bg-white"} p-4 rounded-xl border ${d.dark ? "border-blue-500/20" : "border-blue-100"} mb-4 space-y-3`}>
                  <input type="text" placeholder="Layihə adı" value={projForm.title} onChange={(e) => setProjForm({ ...projForm, title: e.target.value })} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${d.inputAlt}`} />
                  <textarea placeholder="Qısa təsvir" value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} rows={2} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${d.inputAlt} resize-none`} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Texnologiyalar (React, Python...)" value={projForm.technologies} onChange={(e) => setProjForm({ ...projForm, technologies: e.target.value })} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${d.inputAlt}`} />
                    <input type="url" placeholder="GitHub linki" value={projForm.github_url} onChange={(e) => setProjForm({ ...projForm, github_url: e.target.value })} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${d.inputAlt}`} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddProject} disabled={!projForm.title} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40">Əlavə et</button>
                    <button onClick={() => setShowProjForm(false)} className={`${d.dark ? "bg-gray-600 text-gray-300 hover:bg-gray-500" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} px-5 py-2 rounded-xl text-sm font-medium transition`}>Ləğv et</button>
                  </div>
                </div>
              )}

              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((proj) => (
                    <div key={proj.id} className={`${d.dark ? "bg-gray-700/50" : "bg-white"} p-4 rounded-xl border ${d.border}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`${d.text} font-semibold text-sm`}>{proj.title}</p>
                          {proj.description && <p className={`${d.textMuted} text-xs mt-1`}>{proj.description}</p>}
                          {proj.technologies && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {proj.technologies.split(",").map((t, i) => (
                                <span key={i} className={`${d.dark ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-600"} px-2.5 py-1 rounded-lg text-xs font-medium`}>{t.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {proj.github_url && (
                            <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition"><Code2 size={16} /></a>
                          )}
                          {isOwn && (
                            <button onClick={() => handleDeleteProject(proj.id)} className="text-red-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-sm text-center py-4">{isOwn ? "Hələ layihə əlavə olunmayıb" : "Layihə yoxdur"}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Message Modal */}
      {showQuickMsg && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => !sendingMsg && setShowQuickMsg(false)}>
          <div className={`${d.dark ? "bg-gray-800" : "bg-white"} rounded-2xl p-6 max-w-md w-full shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 ${d.dark ? "bg-blue-500/10" : "bg-blue-50"} rounded-xl flex items-center justify-center`}>
                <Send size={18} className="text-blue-500" />
              </div>
              <div>
                <h3 className={`font-bold ${d.heading}`}>{user?.full_name}-a mesaj</h3>
                <p className={`text-xs ${d.textFaint}`}>Şablon seçin və göndərin</p>
              </div>
              <button onClick={() => setShowQuickMsg(false)} className="ml-auto text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            {msgSent ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send size={24} className="text-green-500" />
                </div>
                <p className="font-semibold text-green-600">Göndərildi!</p>
                <p className="text-sm text-gray-400 mt-1">"{msgSent}"</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {templates.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => sendQuickMessage(i)}
                    disabled={sendingMsg}
                    className={`w-full text-left px-4 py-3 rounded-xl border ${d.dark ? "border-gray-600 hover:border-blue-500/30 hover:bg-blue-500/10 text-gray-300" : "border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-700"} text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-between group`}
                  >
                    <span>{msg}</span>
                    <Send size={14} className="text-gray-300 group-hover:text-blue-500 transition" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inbox Modal */}
      {showInbox && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setShowInbox(false)}>
          <div className={`${d.dark ? "bg-gray-800" : "bg-white"} rounded-2xl p-6 max-w-md w-full shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 ${d.dark ? "bg-green-500/10" : "bg-green-50"} rounded-xl flex items-center justify-center`}>
                <Inbox size={18} className="text-green-500" />
              </div>
              <div>
                <h3 className={`font-bold ${d.heading}`}>Gələn mesajlar</h3>
                <p className={`text-xs ${d.textFaint}`}>{inbox.length} mesaj</p>
              </div>
              <button onClick={() => setShowInbox(false)} className="ml-auto text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {inbox.length === 0 ? (
                <p className={`${d.textFaint} text-sm text-center py-8`}>Hələ mesaj yoxdur</p>
              ) : (
                inbox.map((m) => (
                  <div key={m.id} className={`flex gap-3 p-3 rounded-xl border ${d.border} ${d.dark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} transition`}>
                    <Link to={`/profile/${m.sender_id}`} onClick={() => setShowInbox(false)} className="shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                        {m.sender_name?.charAt(0)}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${m.sender_id}`} onClick={() => setShowInbox(false)} className={`text-sm font-semibold ${d.text} hover:text-blue-600 transition truncate`}>{m.sender_name}</Link>
                        <span className={`text-xs ${d.textFaint} shrink-0`}>{formatBakuHM(m.created_at)}</span>
                      </div>
                      <p className={`text-sm ${d.textMuted} mt-0.5`}>{m.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
