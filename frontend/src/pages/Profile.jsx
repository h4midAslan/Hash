import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "../components/Toast";
import { useDarkMode } from "../hooks/useTheme";
import {
  Edit3, Save, X, BookOpen, Award, GraduationCap, Sparkles, Plus, Trash2,
  ExternalLink, Camera, FolderGit2, Code2, Heart, ThumbsDown, MessageCircle,
  FileText, Send, Mail, Globe,
} from "lucide-react";

const GithubIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate, formatBakuHM } from "../utils/time";
import { useIsMobile } from "../hooks/useIsMobile";

const makeS = (dark) => ({
  page:        { maxWidth: 760, margin: "0 auto", padding: "20px 12px" },
  card:        { background: dark ? "#1f2937" : "#ffffff", border: dark ? "1px solid #374151" : "1px solid #d4d4d4", marginBottom: 12 },
  sectionPad:  { padding: "16px 20px" },
  label:       { display: "block", fontSize: 12, fontWeight: 600, color: dark ? "#f3f4f6" : "#1a1a1a", marginBottom: 6 },
  input:       { width: "100%", padding: "8px 10px", border: dark ? "1px solid #374151" : "1px solid #ccc", borderRadius: 2, fontSize: 14, color: dark ? "#f3f4f6" : "#1a1a1a", background: dark ? "#111827" : "#fff", outline: "none", boxSizing: "border-box" },
  textarea:    { width: "100%", padding: "8px 10px", border: dark ? "1px solid #374151" : "1px solid #ccc", borderRadius: 2, fontSize: 14, color: dark ? "#f3f4f6" : "#1a1a1a", background: dark ? "#111827" : "#fff", outline: "none", resize: "vertical", boxSizing: "border-box" },
  btnPrimary:  { background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a", padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2 },
  btnGhost:    { background: dark ? "#1f2937" : "#fff", color: dark ? "#f3f4f6" : "#333", border: dark ? "1px solid #374151" : "1px solid #ccc", padding: "7px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 2 },
  btnDanger:   { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: 4, lineHeight: 1 },
  sectionTitle:{ fontSize: 12, fontWeight: 600, color: dark ? "#9ca3af" : "#666", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 },
  chip:        { border: dark ? "1px solid #374151" : "1px solid #ccc", padding: "2px 8px", fontSize: 11, color: dark ? "#f3f4f6" : "#333", background: dark ? "#1f2937" : "#fafafa", borderRadius: 2, display: "inline-block" },
  muted:       { color: dark ? "#9ca3af" : "#666", fontSize: 13 },
  faint:       { color: dark ? "#6b7280" : "#999", fontSize: 12 },
  heading:     { color: dark ? "#f3f4f6" : "#1a1a1a", fontWeight: 700 },
});

const TABS = [
  { key: "about",   label: "Xülasə",      icon: BookOpen },
  { key: "posts",   label: "Postlar",      icon: FileText },
  { key: "projects",label: "Layihələr",    icon: FolderGit2 },
  { key: "certs",   label: "Sertifikatlar",icon: Award },
];

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const dark = useDarkMode();
  const S = makeS(dark);
  const [user, setUser]         = useState(null);
  const [isOwn, setIsOwn]       = useState(!id);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [activeTab, setActiveTab] = useState("about");
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certForm, setCertForm] = useState({ name: "", issuer: "", issue_date: "", credential_url: "", image_url: "" });
  const [certImageUploading, setCertImageUploading] = useState(false);
  const [projForm, setProjForm] = useState({ title: "", description: "", github_url: "", technologies: "" });
  const [showCertForm, setShowCertForm] = useState(false);
  const [showProjForm, setShowProjForm] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [cvParsing, setCvParsing] = useState(false);
  const [cvPreview, setCvPreview] = useState(null);
  const fileInputRef = useRef(null);
  const cvInputRef = useRef(null);

  useEffect(() => {
    loadProfile(); loadCertificates(); loadProjects(); loadUserPosts();
    if (id) {
      api.get("/connections/my")
        .then(res => setIsConnected(res.data.some(c => c.user_id === Number(id))))
        .catch(() => {});
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      if (id) {
        const [profileRes, meRes] = await Promise.all([api.get(`/users/${id}`), api.get("/users/me")]);
        setUser(profileRes.data); setForm(profileRes.data);
        setIsOwn(meRes.data.id === profileRes.data.id);
      } else {
        const res = await api.get("/users/me");
        setUser(res.data); setForm(res.data); setIsOwn(true);
      }
    } catch {}
  };

  const loadCertificates = async () => {
    try {
      const res = id ? await api.get(`/certificates/user/${id}`) : await api.get("/certificates/me");
      setCertificates(res.data);
    } catch {}
  };

  const loadProjects = async () => {
    try {
      const res = id ? await api.get(`/projects/user/${id}`) : await api.get("/projects/me");
      setProjects(res.data);
    } catch {}
  };

  const loadUserPosts = async () => {
    try {
      const userId = id || (await api.get("/users/me")).data.id;
      const res = await api.get(`/posts/user/${userId}`);
      setUserPosts(res.data);
    } catch {}
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Bu postu silmək istədiyinə əminsən?")) return;
    try { await api.delete(`/posts/${postId}`); loadUserPosts(); } catch {}
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await api.put("/users/me", { profile_picture: uploadRes.data.url });
      loadProfile();
    } catch {}
    setUploadingPic(false);
  };

  const handleCertImagePick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCertImageUploading(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setCertForm(prev => ({ ...prev, image_url: res.data.url }));
      toast.success("Şəkil yükləndi!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Şəkil yüklənmədi");
    }
    setCertImageUploading(false); e.target.value = "";
  };

  const handleAddCert = async () => {
    try {
      await api.post("/certificates", { ...certForm, issue_date: certForm.issue_date || null, credential_url: certForm.credential_url || null, image_url: certForm.image_url || null });
      setCertForm({ name: "", issuer: "", issue_date: "", credential_url: "", image_url: "" });
      setShowCertForm(false);
      await loadCertificates();
      toast.success("Sertifikat əlavə edildi!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Sertifikat əlavə edilmədi");
    }
  };

  const handleDeleteCert = async (certId) => {
    try { await api.delete(`/certificates/${certId}`); loadCertificates(); } catch {}
  };

  const handleAddProject = async () => {
    try {
      await api.post("/projects", { ...projForm, technologies: projForm.technologies || null, github_url: projForm.github_url || null });
      setProjForm({ title: "", description: "", github_url: "", technologies: "" });
      setShowProjForm(false); loadProjects();
    } catch {}
  };

  const handleDeleteProject = async (projId) => {
    try { await api.delete(`/projects/${projId}`); loadProjects(); } catch {}
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvParsing(true);
    setCvPreview(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/users/parse-cv", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setCvPreview(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "CV parse edilə bilmədi");
    }
    setCvParsing(false);
    e.target.value = "";
  };

  const applyCvPreview = async () => {
    if (!cvPreview) return;
    const p = cvPreview;
    const updated = {
      full_name:    p.full_name    || form.full_name,
      headline:     p.headline     || form.headline,
      bio:          p.bio          || form.bio,
      major:        p.major        || form.major,
      skills:       p.skills?.length ? JSON.stringify(p.skills) : form.skills,
      github_url:   p.github_url   || form.github_url,
      linkedin_url: p.linkedin_url || form.linkedin_url,
      website_url:  p.website_url  || form.website_url,
    };
    setForm(prev => ({ ...prev, ...updated }));

    try {
      await api.put("/users/me", updated);
      loadProfile();
    } catch {}

    if (p.certificates?.length) {
      for (const cert of p.certificates) {
        try {
          await api.post("/certificates", {
            name: cert.name,
            issuer: cert.issuer,
            issue_date: cert.issue_date || null,
          });
        } catch {}
      }
      loadCertificates();
    }

    if (p.projects?.length) {
      for (const proj of p.projects) {
        try {
          await api.post("/projects", {
            title: proj.title,
            description: proj.description || "",
            github_url: proj.github_url || null,
            technologies: proj.technologies || "",
          });
        } catch {}
      }
      loadProjects();
    }

    setCvPreview(null);
    setEditing(false);
    toast.success("Profil CV əsasında yeniləndi!");
  };


  const handleSave = async () => {
    try {
      await api.put("/users/me", {
        full_name:     form.full_name,
        username:      form.username      || null,
        headline:      form.headline      || null,
        major:         form.major         || null,
        course:        form.course        || null,
        bio:           form.bio           || null,
        skills:        form.skills        || null,
        github_url:    form.github_url    || null,
        linkedin_url:  form.linkedin_url  || null,
        website_url:   form.website_url   || null,
        is_open_for_team: form.is_open_for_team,
      });
      setEditing(false); loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Yadda saxlanmadı");
    }
  };

  const getCompletionPercent = () => {
    if (!user) return 0;
    const checks = [!!user.full_name, !!user.headline, !!user.major, !!user.bio, !!user.skills, !!user.profile_picture, certificates.length > 0, projects.length > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  if (!user) return (
    <div style={{ ...S.page, paddingTop: 40 }}>
      <div style={{ ...S.card, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, background: dark ? "#374151" : "#e8e8e8", border: dark ? "1px solid #374151" : "1px solid #d4d4d4" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 16, background: dark ? "#374151" : "#e8e8e8", width: 160, marginBottom: 8 }} />
            <div style={{ height: 12, background: dark ? "#374151" : "#e8e8e8", width: 120 }} />
          </div>
        </div>
        {[1, 2, 3].map(i => <div key={i} style={{ height: 60, background: dark ? "#1f2937" : "#f0f0f0", border: dark ? "1px solid #374151" : "1px solid #e0e0e0", marginBottom: 8 }} />)}
      </div>
    </div>
  );

  const completionPercent = getCompletionPercent();
  const completionBarColor = completionPercent < 50 ? "#e67e22" : completionPercent < 80 ? "#2980b9" : "#27ae60";

  return (
    <>
    <div style={{ background: dark ? "#111827" : "#f2f2f2", minHeight: "100vh" }}>
      <div style={{ ...S.page, padding: isMobile ? "12px 10px" : S.page.padding }}>

        {/* ── HEADER CARD ── */}
        <div style={S.card}>
          <div style={{ padding: isMobile ? "16px 14px 0 14px" : "20px 20px 0 20px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start", justifyContent: "space-between", gap: 16 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{ width: 80, height: 80, border: "1px solid #d4d4d4", overflow: "hidden", cursor: isOwn ? "pointer" : "default" }}
                onClick={isOwn ? () => fileInputRef.current?.click() : undefined}
              >
                <UserAvatar user={user} size="lg" className="rounded-none" />
                {isOwn && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <Camera size={22} color="#fff" />
                  </div>
                )}
              </div>
              {isOwn && <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleUploadPic} />}
              {isOwn && <input ref={cvInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleCvUpload} />}
            </div>

            {/* Name / Info */}
            <div style={{ flex: 1, minWidth: 0, textAlign: isMobile ? "center" : "left" }}>
              <h2 style={{ ...S.heading, fontSize: 18, margin: "0 0 2px 0" }}>{user.full_name}</h2>
              {user.headline && (
                <p style={{ margin: "0 0 4px 0", fontSize: 14, color: dark ? "#9ca3af" : "#444" }}>{user.headline}</p>
              )}
              <p style={{ ...S.faint, margin: "0 0 6px 0" }}>{user.email}</p>
              {user.major && (
                <p style={{ ...S.muted, margin: "0 0 6px 0" }}>
                  <GraduationCap size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, color: dark ? "#9ca3af" : "#666" }} />
                  {user.major}{user.course && ` · ${user.course}-ci kurs`}
                </p>
              )}
              {/* Social links */}
              {(user.github_url || user.linkedin_url || user.website_url) && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", marginBottom: 6 }}>
                  {user.github_url && (
                    <a href={user.github_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: dark ? "#9ca3af" : "#444", textDecoration: "none" }}>
                      <GithubIcon /> GitHub
                    </a>
                  )}
                  {user.linkedin_url && (
                    <a href={user.linkedin_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: dark ? "#60a5fa" : "#0077b5", textDecoration: "none" }}>
                      <LinkedinIcon /> LinkedIn
                    </a>
                  )}
                  {user.website_url && (
                    <a href={user.website_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: dark ? "#9ca3af" : "#444", textDecoration: "none" }}>
                      <Globe size={13} /> Website
                    </a>
                  )}
                </div>
              )}
              {user.is_open_for_team && (
                <span style={{ display: "inline-block", border: dark ? "1px solid #374151" : "1px solid #aac4e8", padding: "2px 10px", fontSize: 11, color: dark ? "#60a5fa" : "#1a4a8a", background: dark ? "#1f2937" : "#edf3fb" }}>
                  Komanda üçün açıq
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 6, alignItems: isMobile ? "stretch" : "flex-end", flexShrink: 0, width: isMobile ? "100%" : undefined, justifyContent: isMobile ? "center" : undefined }}>
              {isOwn ? (
                <>
                  <button onClick={() => setEditing(!editing)} style={{ ...S.btnGhost, flex: isMobile ? 1 : undefined }}>
                    {editing ? <><X size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Ləğv et</> : <><Edit3 size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Redaktə</>}
                  </button>
                  <button
                    onClick={() => cvInputRef.current?.click()}
                    disabled={cvParsing}
                    style={{ ...S.btnGhost, flex: isMobile ? 1 : undefined, opacity: cvParsing ? 0.6 : 1 }}
                  >
                    <FileText size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    {cvParsing ? "Oxunur..." : "CV yüklə"}
                  </button>

                  <button onClick={() => navigate("/messages")} style={{ ...S.btnGhost, flex: isMobile ? 1 : undefined }}>
                    <Mail size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Mesajlar
                  </button>
                </>
              ) : isConnected && (
                <button onClick={() => navigate(`/messages?to=${user.id}&name=${encodeURIComponent(user.full_name)}`)} style={{ ...S.btnGhost, width: isMobile ? "100%" : undefined }}>
                  <Mail size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Mesaj
                </button>
              )}
            </div>
          </div>

          {/* Completion bar */}
          {isOwn && completionPercent < 100 && (
            <div style={{ margin: isMobile ? "12px 14px 0 14px" : "16px 20px 0 20px", padding: "12px 14px", background: dark ? "#1f2937" : "#fafafa", border: dark ? "1px solid #374151" : "1px solid #e0e0e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: dark ? "#9ca3af" : "#666", fontWeight: 600 }}>Profil tamamlanması</span>
                <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700 }}>{completionPercent}%</span>
              </div>
              <div style={{ height: 4, background: dark ? "#374151" : "#e0e0e0" }}>
                <div style={{ height: 4, background: completionBarColor, width: `${completionPercent}%`, transition: "width 0.4s" }} />
              </div>
              <p style={{ fontSize: 11, color: dark ? "#6b7280" : "#999", marginTop: 6, marginBottom: 0 }}>
                {!user.headline && "başlıq, "}{!user.profile_picture && "profil şəkli, "}{!user.bio && "haqqında, "}{!user.skills && "bacarıqlar, "}
                {certificates.length === 0 && "sertifikat, "}{projects.length === 0 && "layihə "}əlavə et
              </p>
            </div>
          )}

          {/* ── TABS ── */}
          <div style={{ display: "flex", borderTop: dark ? "1px solid #374151" : "1px solid #e0e0e0", marginTop: 16 }}>
            {TABS.map(({ key, label, icon: Icon }) => {
              const count = key === "posts" ? userPosts.length : key === "projects" ? projects.length : key === "certs" ? certificates.length : null;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setEditing(false); }}
                  style={{
                    flex: 1,
                    padding: isMobile ? "10px 4px" : "12px 8px",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: activeTab === key ? 700 : 500,
                    color: activeTab === key ? (dark ? "#60a5fa" : "#1a4a8a") : (dark ? "#9ca3af" : "#888"),
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === key ? (dark ? "2px solid #60a5fa" : "2px solid #1a4a8a") : "2px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    transition: "color 0.15s",
                  }}
                >
                  <Icon size={12} />
                  {label}
                  {count !== null && count > 0 && (
                    <span style={{ fontSize: 10, background: activeTab === key ? (dark ? "#60a5fa" : "#1a4a8a") : (dark ? "#374151" : "#ccc"), color: "#fff", borderRadius: 10, padding: "0 5px", lineHeight: "16px" }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── EDIT FORM ── */}
        {editing && (
          <div style={S.card}>
            <div style={S.sectionPad}>
              <p style={{ ...S.sectionTitle, marginBottom: 16 }}>Profili redaktə et</p>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={S.label}>Ad Soyad</label>
                  <input type="text" value={form.full_name || ""} onChange={e => setForm({ ...form, full_name: e.target.value })} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Username <span style={{ color: "#999", fontWeight: 400 }}>(hashcampus.site/u/...)</span></label>
                  <div style={{ display: "flex", alignItems: "center", border: dark ? "1px solid #374151" : "1px solid #ccc", borderRadius: 2, overflow: "hidden" }}>
                    <span style={{ padding: "8px 8px 8px 10px", fontSize: 13, color: dark ? "#6b7280" : "#999", background: dark ? "#1f2937" : "#f9f9f9", borderRight: dark ? "1px solid #374151" : "1px solid #ccc", whiteSpace: "nowrap" }}>u/</span>
                    <input
                      type="text"
                      value={form.username || ""}
                      onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                      placeholder="hamid_dev"
                      style={{ ...S.input, border: "none", borderRadius: 0, flex: 1 }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Başlıq (Headline)</label>
                  <input type="text" value={form.headline || ""} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Frontend Dev · 3-cü kurs" style={S.input} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={S.label}>İxtisas</label>
                  <input type="text" value={form.major || ""} onChange={e => setForm({ ...form, major: e.target.value })} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Kurs</label>
                  <select value={form.course || ""} onChange={e => setForm({ ...form, course: parseInt(e.target.value) || null })} style={S.input}>
                    <option value="">Seçin</option>
                    {[1,2,3,4].map(c => <option key={c} value={c}>{c}-ci kurs</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Haqqında</label>
                <textarea value={form.bio || ""} onChange={e => setForm({ ...form, bio: e.target.value })} style={S.textarea} rows={3} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Bacarıqlar <span style={{ fontWeight: 400, color: "#999" }}>(vergüllə ayırın)</span></label>
                <input type="text" value={form.skills || ""} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Python, React, Design" style={S.input} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ ...S.label, marginBottom: 10 }}>Sosial linklər</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Github size={15} color="#555" style={{ flexShrink: 0 }} />
                    <input type="url" value={form.github_url || ""} onChange={e => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/username" style={{ ...S.input, flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Linkedin size={15} color="#0077b5" style={{ flexShrink: 0 }} />
                    <input type="url" value={form.linkedin_url || ""} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" style={{ ...S.input, flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Globe size={15} color="#555" style={{ flexShrink: 0 }} />
                    <input type="url" value={form.website_url || ""} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://yoursite.com" style={{ ...S.input, flex: 1 }} />
                  </div>
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: dark ? "1px solid #374151" : "1px solid #e0e0e0", background: dark ? "#1f2937" : "#fafafa", cursor: "pointer", marginBottom: 16 }}>
                <input type="checkbox" checked={form.is_open_for_team || false} onChange={e => setForm({ ...form, is_open_for_team: e.target.checked })} style={{ width: 15, height: 15 }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: dark ? "#f3f4f6" : "#1a1a1a" }}>Komanda üçün açığam</span>
                  <p style={{ fontSize: 11, color: dark ? "#6b7280" : "#999", margin: "2px 0 0 0" }}>Başqaları sizi komandaya dəvət edə bilər</p>
                </div>
              </label>

              <button onClick={handleSave} style={S.btnPrimary}>
                <Save size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Yadda saxla
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: XÜLASƏ ── */}
        {!editing && activeTab === "about" && (
          <>
            {user.bio && (
              <div style={S.card}>
                <div style={S.sectionPad}>
                  <p style={S.sectionTitle}><BookOpen size={13} color="#666" /> Haqqında</p>
                  <p style={{ ...S.muted, lineHeight: 1.6, margin: 0 }}>{user.bio}</p>
                </div>
              </div>
            )}
            {user.skills && (
              <div style={S.card}>
                <div style={S.sectionPad}>
                  <p style={S.sectionTitle}><Sparkles size={13} color="#666" /> Bacarıqlar</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {user.skills.split(",").map((s, i) => <span key={i} style={S.chip}>{s.trim()}</span>)}
                  </div>
                </div>
              </div>
            )}
            {!user.bio && !user.skills && isOwn && (
              <div style={{ ...S.card, ...S.sectionPad }}>
                <p style={{ ...S.faint, textAlign: "center", margin: 0 }}>Profili doldurmaq üçün "Redaktə" düyməsinə bas</p>
              </div>
            )}
          </>
        )}

        {/* ── TAB: POSTLAR ── */}
        {!editing && activeTab === "posts" && (
          <div style={S.card}>
            <div style={S.sectionPad}>
              <p style={S.sectionTitle}><FileText size={13} color="#666" /> Postlar <span style={{ color: "#bbb", fontSize: 11, fontWeight: 400 }}>({userPosts.length})</span></p>
              {userPosts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {userPosts.map(post => {
                    const imgs = post.images?.length
                      ? post.images
                      : post.image_url
                        ? (() => { try { const p = JSON.parse(post.image_url); return Array.isArray(p) ? p : [post.image_url]; } catch { return [post.image_url]; } })()
                        : [];
                    return (
                      <div key={post.id} style={{ border: dark ? "1px solid #374151" : "1px solid #d4d4d4", background: dark ? "#1f2937" : "#fff" }}>
                        {imgs.length > 0 && (
                          <div style={{ display: "grid", gridTemplateColumns: imgs.length > 1 ? "1fr 1fr" : "1fr", gap: 2 }}>
                            {imgs.slice(0, 4).map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt="" style={{ width: "100%", height: imgs.length === 1 ? 220 : 110, objectFit: "cover", display: "block" }} />
                              </a>
                            ))}
                          </div>
                        )}
                        {post.video_url && (
                          <video src={post.video_url} controls style={{ width: "100%", maxHeight: 220, display: "block" }} />
                        )}
                        <div style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <div style={{ flex: 1 }}>
                              {post.content && <p style={{ margin: "0 0 8px 0", fontSize: 13, color: dark ? "#f3f4f6" : "#333", whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.content}</p>}
                              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: dark ? "#9ca3af" : "#999" }}><Heart size={11} /> {post.like_count}</span>
                                {post.show_dislikes && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: dark ? "#9ca3af" : "#999" }}><ThumbsDown size={11} /> {post.dislike_count}</span>}
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: dark ? "#9ca3af" : "#999" }}><MessageCircle size={11} /> {post.comment_count}</span>
                                <span style={{ fontSize: 11, color: dark ? "#6b7280" : "#bbb" }}>{formatBakuDate(post.created_at)}</span>
                              </div>
                            </div>
                            {isOwn && <button onClick={() => handleDeletePost(post.id)} style={{ ...S.btnDanger, marginLeft: 12 }}><Trash2 size={15} /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ ...S.faint, textAlign: "center", padding: "12px 0", margin: 0 }}>{isOwn ? "Hələ post paylaşmamısan" : "Post yoxdur"}</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: LAYİHƏLƏR ── */}
        {!editing && activeTab === "projects" && (
          <div style={S.card}>
            <div style={S.sectionPad}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ ...S.sectionTitle, margin: 0 }}><FolderGit2 size={13} color="#666" /> Layihələr</p>
                {isOwn && (
                  <button onClick={() => setShowProjForm(!showProjForm)} style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 12 }}>
                    <Plus size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />Əlavə et
                  </button>
                )}
              </div>
              {isOwn && showProjForm && (
                <div style={{ border: dark ? "1px solid #374151" : "1px solid #d4d4d4", padding: 14, marginBottom: 12, background: dark ? "#1f2937" : "#fafafa" }}>
                  <input type="text" placeholder="Layihə adı" value={projForm.title} onChange={e => setProjForm({ ...projForm, title: e.target.value })} style={{ ...S.input, marginBottom: 8 }} />
                  <textarea placeholder="Qısa təsvir" value={projForm.description} onChange={e => setProjForm({ ...projForm, description: e.target.value })} rows={2} style={{ ...S.textarea, marginBottom: 8 }} />
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input type="text" placeholder="Texnologiyalar (React, Python...)" value={projForm.technologies} onChange={e => setProjForm({ ...projForm, technologies: e.target.value })} style={S.input} />
                    <input type="url" placeholder="GitHub linki" value={projForm.github_url} onChange={e => setProjForm({ ...projForm, github_url: e.target.value })} style={S.input} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddProject} disabled={!projForm.title} style={{ ...S.btnPrimary, opacity: !projForm.title ? 0.4 : 1 }}>Əlavə et</button>
                    <button onClick={() => setShowProjForm(false)} style={S.btnGhost}>Ləğv et</button>
                  </div>
                </div>
              )}
              {projects.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projects.map(proj => (
                    <div key={proj.id} style={{ border: dark ? "1px solid #374151" : "1px solid #d4d4d4", padding: "12px 14px", background: dark ? "#1f2937" : "#fff" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 600, color: dark ? "#f3f4f6" : "#1a1a1a" }}>{proj.title}</p>
                          {proj.description && <p style={{ margin: "0 0 6px 0", fontSize: 12, color: dark ? "#9ca3af" : "#666" }}>{proj.description}</p>}
                          {proj.technologies && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {proj.technologies.split(",").map((t, i) => <span key={i} style={S.chip}>{t.trim()}</span>)}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
                          {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer" style={{ color: dark ? "#9ca3af" : "#666", lineHeight: 1 }}><Code2 size={15} /></a>}
                          {isOwn && <button onClick={() => handleDeleteProject(proj.id)} style={S.btnDanger}><Trash2 size={15} /></button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ ...S.faint, textAlign: "center", padding: "12px 0", margin: 0 }}>{isOwn ? "Hələ layihə əlavə olunmayıb" : "Layihə yoxdur"}</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: SERTİFİKATLAR ── */}
        {!editing && activeTab === "certs" && (
          <div style={S.card}>
            <div style={S.sectionPad}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ ...S.sectionTitle, margin: 0 }}><Award size={13} color="#666" /> Sertifikatlar</p>
                {isOwn && (
                  <button onClick={() => setShowCertForm(!showCertForm)} style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 12 }}>
                    <Plus size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />Əlavə et
                  </button>
                )}
              </div>
              {isOwn && showCertForm && (
                <div style={{ border: dark ? "1px solid #374151" : "1px solid #d4d4d4", padding: 14, marginBottom: 12, background: dark ? "#1f2937" : "#fafafa" }}>
                  <input type="text" placeholder="Sertifikat adı" value={certForm.name} onChange={e => setCertForm({ ...certForm, name: e.target.value })} style={{ ...S.input, marginBottom: 8 }} />
                  <input type="text" placeholder="Verən təşkilat (Google, ISC2...)" value={certForm.issuer} onChange={e => setCertForm({ ...certForm, issuer: e.target.value })} style={{ ...S.input, marginBottom: 8 }} />
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input type="date" value={certForm.issue_date} onChange={e => setCertForm({ ...certForm, issue_date: e.target.value })} style={S.input} />
                    <input type="url" placeholder="Doğrulama linki" value={certForm.credential_url} onChange={e => setCertForm({ ...certForm, credential_url: e.target.value })} style={S.input} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: dark ? "#9ca3af" : "#666", display: "block", marginBottom: 4 }}>Sertifikat şəkli (istəyə bağlı)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input type="file" accept="image/*" onChange={handleCertImagePick} style={{ display: "none" }} />
                        {certImageUploading ? "Yüklənir..." : "Şəkil seç"}
                      </label>
                      {certForm.image_url && <img src={certForm.image_url} alt="cert" style={{ height: 40, border: dark ? "1px solid #374151" : "1px solid #d4d4d4", objectFit: "cover" }} />}
                      {certForm.image_url && <button onClick={() => setCertForm(prev => ({ ...prev, image_url: "" }))} style={{ ...S.btnDanger, padding: "4px 6px" }}>✕</button>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddCert} disabled={!certForm.name || !certForm.issuer} style={{ ...S.btnPrimary, opacity: (!certForm.name || !certForm.issuer) ? 0.4 : 1 }}>Əlavə et</button>
                    <button onClick={() => setShowCertForm(false)} style={S.btnGhost}>Ləğv et</button>
                  </div>
                </div>
              )}
              {certificates.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {certificates.map(cert => (
                    <div key={cert.id} style={{ border: dark ? "1px solid #374151" : "1px solid #d4d4d4", background: dark ? "#1f2937" : "#fff" }}>
                      {cert.image_url && cert.image_url.startsWith("http") && (
                        <a href={cert.image_url} target="_blank" rel="noreferrer">
                          <img src={cert.image_url} alt={cert.name} style={{ width: "100%", maxHeight: 200, objectFit: "contain", display: "block", background: dark ? "#111827" : "#f5f5f5", borderBottom: dark ? "1px solid #374151" : "1px solid #d4d4d4" }} />
                        </a>
                      )}
                      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 600, color: dark ? "#f3f4f6" : "#1a1a1a" }}>{cert.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: dark ? "#6b7280" : "#999" }}>{cert.issuer}{cert.issue_date && ` · ${cert.issue_date}`}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {cert.credential_url && <a href={cert.credential_url} target="_blank" rel="noreferrer" style={{ color: dark ? "#60a5fa" : "#1a4a8a", lineHeight: 1 }}><ExternalLink size={15} /></a>}
                          {isOwn && <button onClick={() => handleDeleteCert(cert.id)} style={S.btnDanger}><Trash2 size={15} /></button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ ...S.faint, textAlign: "center", padding: "12px 0", margin: 0 }}>{isOwn ? "Hələ sertifikat əlavə olunmayıb" : "Sertifikat yoxdur"}</p>
              )}
            </div>
          </div>
        )}


      </div>
    </div>

    {/* ── CV PREVIEW MODAL ── */}
    {cvPreview && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={() => setCvPreview(null)}>
        <div style={{ background: dark ? "#1f2937" : "#fff", border: dark ? "1px solid #374151" : "1px solid #d4d4d4", padding: 24, width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dark ? "#f3f4f6" : "#1a1a1a" }}>CV-dən çıxarılan məlumat</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: dark ? "#6b7280" : "#999" }}>Aşağıdakı məlumatlar profilinizə əlavə ediləcək</p>
            </div>
            <button onClick={() => setCvPreview(null)} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#9ca3af" : "#666", padding: 4 }}><X size={18} /></button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            {cvPreview.full_name && <div style={{ padding: "8px 12px", background: dark ? "#111827" : "#f9fafb", border: dark ? "1px solid #374151" : "1px solid #e5e7eb" }}><span style={{ color: dark ? "#9ca3af" : "#666", fontSize: 11 }}>Ad Soyad</span><br /><strong style={{ color: dark ? "#f3f4f6" : "inherit" }}>{cvPreview.full_name}</strong></div>}
            {cvPreview.headline && <div style={{ padding: "8px 12px", background: dark ? "#111827" : "#f9fafb", border: dark ? "1px solid #374151" : "1px solid #e5e7eb" }}><span style={{ color: dark ? "#9ca3af" : "#666", fontSize: 11 }}>Başlıq</span><br /><strong style={{ color: dark ? "#f3f4f6" : "inherit" }}>{cvPreview.headline}</strong></div>}
            {cvPreview.bio && <div style={{ padding: "8px 12px", background: dark ? "#111827" : "#f9fafb", border: dark ? "1px solid #374151" : "1px solid #e5e7eb", color: dark ? "#f3f4f6" : "inherit" }}><span style={{ color: dark ? "#9ca3af" : "#666", fontSize: 11 }}>Haqqında</span><br />{cvPreview.bio}</div>}
            {cvPreview.major && <div style={{ padding: "8px 12px", background: dark ? "#111827" : "#f9fafb", border: dark ? "1px solid #374151" : "1px solid #e5e7eb" }}><span style={{ color: dark ? "#9ca3af" : "#666", fontSize: 11 }}>İxtisas</span><br /><strong style={{ color: dark ? "#f3f4f6" : "inherit" }}>{cvPreview.major}</strong></div>}
            {cvPreview.skills?.length > 0 && (
              <div style={{ padding: "8px 12px", background: dark ? "#111827" : "#f9fafb", border: dark ? "1px solid #374151" : "1px solid #e5e7eb" }}>
                <span style={{ color: dark ? "#9ca3af" : "#666", fontSize: 11 }}>Bacarıqlar</span><br />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {cvPreview.skills.map((s, i) => <span key={i} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: 11, padding: "2px 8px", borderRadius: 99 }}>{s}</span>)}
                </div>
              </div>
            )}
            {(cvPreview.github_url || cvPreview.linkedin_url || cvPreview.website_url) && (
              <div style={{ padding: "8px 12px", background: dark ? "#111827" : "#f9fafb", border: dark ? "1px solid #374151" : "1px solid #e5e7eb" }}>
                <span style={{ color: dark ? "#9ca3af" : "#666", fontSize: 11 }}>Linklər</span><br />
                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                  {cvPreview.github_url && <span style={{ color: dark ? "#60a5fa" : "#1a4a8a" }}>{cvPreview.github_url}</span>}
                  {cvPreview.linkedin_url && <span style={{ color: dark ? "#60a5fa" : "#1a4a8a" }}>{cvPreview.linkedin_url}</span>}
                  {cvPreview.website_url && <span style={{ color: dark ? "#60a5fa" : "#1a4a8a" }}>{cvPreview.website_url}</span>}
                </div>
              </div>
            )}
            {cvPreview.certificates?.length > 0 && (
              <div style={{ padding: "8px 12px", background: dark ? "#111827" : "#f9fafb", border: dark ? "1px solid #374151" : "1px solid #e5e7eb", color: dark ? "#f3f4f6" : "inherit" }}>
                <span style={{ color: dark ? "#9ca3af" : "#666", fontSize: 11 }}>Sertifikatlar ({cvPreview.certificates.length})</span>
                {cvPreview.certificates.map((c, i) => <div key={i} style={{ marginTop: 4 }}><strong>{c.name}</strong> — {c.issuer}{c.issue_date ? ` (${c.issue_date})` : ""}</div>)}
              </div>
            )}
            {cvPreview.projects?.length > 0 && (
              <div style={{ padding: "8px 12px", background: dark ? "#111827" : "#f9fafb", border: dark ? "1px solid #374151" : "1px solid #e5e7eb", color: dark ? "#f3f4f6" : "inherit" }}>
                <span style={{ color: dark ? "#9ca3af" : "#666", fontSize: 11 }}>Layihələr ({cvPreview.projects.length})</span>
                {cvPreview.projects.map((p, i) => <div key={i} style={{ marginTop: 4 }}><strong>{p.title}</strong>{p.technologies ? ` — ${p.technologies}` : ""}</div>)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={applyCvPreview} style={{ ...S.btnPrimary, flex: 1 }}>
              <Send size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />Profilə tətbiq et
            </button>
            <button onClick={() => setCvPreview(null)} style={{ ...S.btnGhost }}>Ləğv et</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
