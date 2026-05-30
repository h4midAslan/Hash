import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "../components/Toast";
import { useDarkMode } from "../hooks/useTheme";
import {
  Edit3, Save, X, BookOpen, Award, GraduationCap, Sparkles, Plus, Trash2,
  ExternalLink, Camera, FolderGit2, Code2, Heart, ThumbsDown, MessageCircle,
  FileText, Send, Mail, Globe, Settings, UserPlus, UserCheck,
} from "lucide-react";

const GithubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

import api from "../api/client";
import UserAvatar from "../components/UserAvatar";
import { formatBakuDate } from "../utils/time";
import { useIsMobile } from "../hooks/useIsMobile";

const ACCENT = "#1E90FF";

function useColors(dark) {
  return dark ? {
    bg: "#050f1f", surface: "#0a1c39", border: "1px solid #1a2b49", borderColor: "#1a2b49",
    text: "#ffffff", textBody: "#e6edf7", textSoft: "#c4d0e0", muted: "#7d8ba3", faint: "#54627a",
    accent: ACCENT, accentWash: "rgba(30,144,255,0.12)", accentGlow: "rgba(30,144,255,0.4)",
    divider: "rgba(255,255,255,0.07)", inputBg: "#071428",
    bannerBg: "linear-gradient(135deg, #071428 0%, #0a1c39 50%, #071e3d 100%)",
    btnPrimary: { background: ACCENT, color: "#fff", border: `1px solid ${ACCENT}` },
    btnGhost: { background: "transparent", color: "#c4d0e0", border: "1px solid #1a2b49" },
    btnDanger: { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: 4, lineHeight: 1 },
  } : {
    bg: "#ffffff", surface: "#f5f7fb", border: "1px solid #e4e9f1", borderColor: "#e4e9f1",
    text: "#071428", textBody: "#16243c", textSoft: "#3a4861", muted: "#69768d", faint: "#a0aab8",
    accent: ACCENT, accentWash: "rgba(30,144,255,0.08)", accentGlow: "rgba(30,144,255,0.28)",
    divider: "#edf1f6", inputBg: "#ffffff",
    bannerBg: "linear-gradient(135deg, #e8f0fe 0%, #dbeafe 50%, #eff6ff 100%)",
    btnPrimary: { background: ACCENT, color: "#fff", border: `1px solid ${ACCENT}` },
    btnGhost: { background: "#f5f7fb", color: "#3a4861", border: "1px solid #e4e9f1" },
    btnDanger: { background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: 4, lineHeight: 1 },
  };
}

const TABS = [
  { key: "about",    label: "Xülasə",       icon: BookOpen },
  { key: "posts",    label: "Postlar",       icon: FileText },
  { key: "projects", label: "Layihələr",     icon: FolderGit2 },
  { key: "certs",    label: "Sertifikatlar", icon: Award },
];

function SectionHead({ C, icon: Icon, children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>
        <span style={{ width: 6, height: 6, background: ACCENT, display: "inline-block" }} />
        <Icon size={12} /> {children}
      </span>
      {action}
    </div>
  );
}

function Chip({ C, children }) {
  return (
    <span style={{ padding: "4px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: C.accentWash, color: ACCENT, border: `1px solid rgba(30,144,255,0.2)`, fontFamily: "'JetBrains Mono', monospace" }}>
      {children}
    </span>
  );
}

function InputField({ C, label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSoft, marginBottom: 6, fontFamily: "'Archivo', sans-serif", letterSpacing: "0.02em" }}>
        {label} {hint && <span style={{ color: C.muted, fontWeight: 400 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = (C) => ({
  width: "100%", padding: "10px 14px", border: C.border, borderRadius: 11,
  fontSize: 14, color: C.text, background: C.inputBg, outline: "none",
  boxSizing: "border-box", fontFamily: "'Archivo', sans-serif",
  transition: "border-color .15s",
});

const textareaStyle = (C) => ({
  ...inputStyle(C), resize: "vertical",
});

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const dark = useDarkMode();
  const C = useColors(dark);

  const [user, setUser]               = useState(null);
  const [isOwn, setIsOwn]             = useState(!id);
  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({});
  const [activeTab, setActiveTab]     = useState("about");
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects]       = useState([]);
  const [certForm, setCertForm]       = useState({ name: "", issuer: "", issue_date: "", credential_url: "", image_url: "" });
  const [certImageUploading, setCertImageUploading] = useState(false);
  const [projForm, setProjForm]       = useState({ title: "", description: "", github_url: "", technologies: "" });
  const [showCertForm, setShowCertForm] = useState(false);
  const [showProjForm, setShowProjForm] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [avatarZoom, setAvatarZoom] = useState(false);
  const [userPosts, setUserPosts]     = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(null);
  const [connModal, setConnModal] = useState(false);
  const [connList, setConnList] = useState([]);
  const [connListLoading, setConnListLoading] = useState(false);
  const [myConnectedIds, setMyConnectedIds] = useState(new Set());
  const [myPendingIds, setMyPendingIds] = useState(new Set());
  const [myUserId, setMyUserId] = useState(null);
  const [cvParsing, setCvParsing]     = useState(false);
  const [cvPreview, setCvPreview]     = useState(null);
  const fileInputRef = useRef(null);
  const cvInputRef   = useRef(null);

  useEffect(() => {
    loadProfile(); loadCertificates(); loadProjects(); loadUserPosts();
    const targetId = id ? Number(id) : null;

    Promise.all([
      api.get("/users/me"),
      api.get("/connections/my"),
      api.get("/connections/sent"),
    ]).then(([meRes, myRes, sentRes]) => {
      setMyUserId(meRes.data.id);
      setMyConnectedIds(new Set(myRes.data.map(c => c.user_id)));
      setMyPendingIds(new Set(sentRes.data.map(c => c.receiver_id)));
      if (targetId) setIsConnected(myRes.data.some(c => c.user_id === targetId));
    }).catch(() => {});

    if (targetId) {
      api.get(`/connections/count/${targetId}`)
        .then(res => setConnectionCount(res.data.count))
        .catch(() => {});
    } else {
      api.get("/users/me")
        .then(res => api.get(`/connections/count/${res.data.id}`))
        .then(res => setConnectionCount(res.data.count))
        .catch(() => {});
    }
  }, [id]);

  const handleQuickConnect = async (userId) => {
    setMyPendingIds(prev => new Set([...prev, userId]));
    try {
      await api.post(`/connections/${userId}`);
      toast.success("Bağlantı istəyi göndərildi!");
    } catch {
      setMyPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    }
  };

  const openConnModal = async () => {
    setConnModal(true);
    if (connList.length > 0) return;
    setConnListLoading(true);
    try {
      const targetId = id || (await api.get("/users/me")).data.id;
      const res = await api.get(`/connections/list/${targetId}`);
      setConnList(res.data);
    } catch {}
    setConnListLoading(false);
  };

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
    e.target.value = "";
  };


  const handleCertImagePick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCertImageUploading(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setCertForm(prev => ({ ...prev, image_url: res.data.url }));
      toast.success("Şəkil yükləndi!");
    } catch (err) { toast.error(err.response?.data?.detail || "Şəkil yüklənmədi"); }
    setCertImageUploading(false); e.target.value = "";
  };

  const handleAddCert = async () => {
    try {
      await api.post("/certificates", { ...certForm, issue_date: certForm.issue_date || null, credential_url: certForm.credential_url || null, image_url: certForm.image_url || null });
      setCertForm({ name: "", issuer: "", issue_date: "", credential_url: "", image_url: "" });
      setShowCertForm(false);
      await loadCertificates();
      toast.success("Sertifikat əlavə edildi!");
    } catch (err) { toast.error(err.response?.data?.detail || "Sertifikat əlavə edilmədi"); }
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
    const file = e.target.files?.[0]; if (!file) return;
    setCvParsing(true); setCvPreview(null);
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await api.post("/users/parse-cv", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setCvPreview(res.data);
    } catch (err) { toast.error(err.response?.data?.detail || "CV parse edilə bilmədi"); }
    setCvParsing(false); e.target.value = "";
  };

  const applyCvPreview = async () => {
    if (!cvPreview) return;
    const p = cvPreview;
    const updated = {
      full_name: p.full_name || form.full_name, headline: p.headline || form.headline,
      bio: p.bio || form.bio, major: p.major || form.major,
      skills: p.skills?.length ? JSON.stringify(p.skills) : form.skills,
      github_url: p.github_url || form.github_url,
      linkedin_url: p.linkedin_url || form.linkedin_url,
      website_url: p.website_url || form.website_url,
    };
    setForm(prev => ({ ...prev, ...updated }));
    try { await api.put("/users/me", updated); loadProfile(); } catch {}
    if (p.certificates?.length) {
      for (const cert of p.certificates) {
        try { await api.post("/certificates", { name: cert.name, issuer: cert.issuer, issue_date: cert.issue_date || null }); } catch {}
      }
      loadCertificates();
    }
    if (p.projects?.length) {
      for (const proj of p.projects) {
        try { await api.post("/projects", { title: proj.title, description: proj.description || "", github_url: proj.github_url || null, technologies: proj.technologies || "" }); } catch {}
      }
      loadProjects();
    }
    setCvPreview(null); setEditing(false);
    toast.success("Profil CV əsasında yeniləndi!");
  };

  const handleSave = async () => {
    try {
      await api.put("/users/me", {
        full_name: form.full_name, username: form.username || null,
        headline: form.headline || null, major: form.major || null,
        course: form.course || null, bio: form.bio || null,
        skills: form.skills || null, github_url: form.github_url || null,
        linkedin_url: form.linkedin_url || null, website_url: form.website_url || null,
        is_open_for_team: form.is_open_for_team,
      });
      setEditing(false); loadProfile();
    } catch (err) { toast.error(err.response?.data?.detail || "Yadda saxlanmadı"); }
  };

  const getCompletionPercent = () => {
    if (!user) return 0;
    const checks = [!!user.full_name, !!user.headline, !!user.major, !!user.bio, !!user.skills, !!user.profile_picture, certificates.length > 0, projects.length > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  // ── Loading skeleton ──
  if (!user) return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: isMobile ? "12px" : "24px 16px", background: C.bg, minHeight: "100vh" }}>
      <div style={{ background: C.surface, border: C.border, borderRadius: 20, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: 100, background: C.accentWash }} />
        <div style={{ padding: "0 24px 24px", marginTop: -36 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.surface, border: `3px solid ${C.bg}` }} />
          <div style={{ height: 16, background: C.surface, width: 180, marginTop: 14, borderRadius: 8 }} />
          <div style={{ height: 12, background: C.surface, width: 130, marginTop: 8, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );

  const completionPercent = getCompletionPercent();

  const btnPrimary = (extra) => ({ ...C.btnPrimary, display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", borderRadius: 11, fontFamily: "'Archivo', sans-serif", ...extra });
  const btnGhost = (extra) => ({ ...C.btnGhost, display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", borderRadius: 11, fontFamily: "'Archivo', sans-serif", ...extra });

  return (
    <>
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Archivo', sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: isMobile ? "12px" : "24px 16px" }}>

        {/* ── HEADER CARD ── */}
        <div style={{ background: C.surface, border: C.border, borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
          {/* Banner */}
          <div style={{ height: isMobile ? 80 : 110, background: C.bannerBg, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg, rgba(30,144,255,0.04) 0 20px, transparent 20px 40px)" }} />
          </div>

          <div style={{ padding: isMobile ? "0 16px 20px" : "0 28px 24px", marginTop: isMobile ? -36 : -44 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
                onClick={() => { if (isOwn) fileInputRef.current?.click(); else if (user.profile_picture) setAvatarZoom(true); }}>
                <div style={{ width: isMobile ? 72 : 84, height: isMobile ? 72 : 84, borderRadius: "50%", border: `4px solid ${C.bg}`, overflow: "hidden", background: C.surface }}
                  onClick={isOwn ? undefined : (user.profile_picture ? () => setAvatarZoom(true) : undefined)}>
                  <UserAvatar user={user} size="lg" />
                </div>
                {isOwn && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .15s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <Camera size={20} color="#fff" />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 4 }}>
                {isOwn ? (
                  <>
                    <button onClick={() => setEditing(!editing)} style={btnGhost()}>
                      {editing ? <><X size={14} />Ləğv et</> : <><Edit3 size={14} />Redaktə</>}
                    </button>
                    <button onClick={() => cvInputRef.current?.click()} disabled={cvParsing} style={btnGhost({ opacity: cvParsing ? 0.6 : 1 })}>
                      <FileText size={14} />{cvParsing ? "Oxunur..." : "CV yüklə"}
                    </button>
                    <button onClick={() => navigate("/messages")} style={btnGhost()}>
                      <Mail size={14} />Mesajlar
                    </button>
                    <button onClick={() => navigate("/settings")} style={btnGhost()}>
                      <Settings size={14} />Parametrlər
                    </button>
                  </>
                ) : isConnected ? (
                  <button onClick={() => navigate(`/messages?to=${user.id}&name=${encodeURIComponent(user.full_name)}`)} style={btnPrimary()}>
                    <Mail size={14} />Mesaj göndər
                  </button>
                ) : myPendingIds.has(user.id) ? (
                  <button disabled style={btnGhost({ opacity: 0.6, cursor: "default" })}>
                    <UserCheck size={14} />İstək göndərildi
                  </button>
                ) : (
                  <button onClick={() => handleQuickConnect(user.id)} style={btnPrimary()}>
                    <UserPlus size={14} />Bağlan
                  </button>
                )}
              </div>
            </div>

            {isOwn && <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleUploadPic} />}
            {isOwn && <input ref={cvInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleCvUpload} />}

            {/* Name / Info */}
            <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? 20 : 24, fontWeight: 900, color: C.text, letterSpacing: "0.02em" }}>{user.full_name}</h2>
            {user.headline && <p style={{ margin: "0 0 6px", fontSize: 14.5, color: C.textSoft, fontWeight: 600 }}>{user.headline}</p>}
            {isOwn && <p style={{ margin: "0 0 8px", fontSize: 13, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>{user.email}</p>}
            {connectionCount !== null && (
              <button
                onClick={openConnModal}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: ACCENT, fontFamily: "'Archivo', sans-serif" }}>
                  {connectionCount >= 500 ? "500+" : connectionCount}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.muted, fontFamily: "'Archivo', sans-serif" }}>
                  &nbsp;bağlantı
                </span>
              </button>
            )}

            {user.major && (
              <p style={{ margin: "0 0 10px", fontSize: 13.5, color: C.textSoft, display: "flex", alignItems: "center", gap: 6 }}>
                <GraduationCap size={14} style={{ color: C.muted }} />
                {user.major}{user.course && ` · ${user.course}-ci kurs`}
              </p>
            )}

            {(user.github_url || user.linkedin_url || user.website_url) && (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                {user.github_url && (
                  <a href={user.github_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.muted, textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.color = C.text}
                    onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                    <GithubIcon /> GitHub
                  </a>
                )}
                {user.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#0077b5", textDecoration: "none" }}>
                    <LinkedinIcon /> LinkedIn
                  </a>
                )}
                {user.website_url && (
                  <a href={user.website_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.muted, textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.color = C.text}
                    onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                    <Globe size={14} /> Website
                  </a>
                )}
              </div>
            )}

            {user.is_open_for_team && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#22c55e", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.3)", padding: "3px 10px", borderRadius: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                Komanda üçün açıq
              </span>
            )}
          </div>

          {/* Completion bar */}
          {isOwn && completionPercent < 100 && (
            <div style={{ margin: "0 28px 20px", padding: "12px 16px", background: C.bg, border: C.border, borderRadius: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>Profil tamamlanması</span>
                <span style={{ fontSize: 12, color: ACCENT, fontWeight: 900, fontFamily: "'Archivo', sans-serif" }}>{completionPercent}%</span>
              </div>
              <div style={{ height: 5, background: C.surface, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: completionPercent < 50 ? "#f59e0b" : completionPercent < 80 ? ACCENT : "#22c55e", width: `${completionPercent}%`, transition: "width 0.4s", borderRadius: 4 }} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", borderTop: `1px solid ${C.divider}` }}>
            {TABS.map(({ key, label, icon: Icon }) => {
              const count = key === "posts" ? userPosts.length : key === "projects" ? projects.length : key === "certs" ? certificates.length : null;
              const on = activeTab === key;
              return (
                <button key={key} onClick={() => { setActiveTab(key); setEditing(false); }} style={{
                  flex: 1, padding: isMobile ? "11px 4px" : "13px 8px",
                  fontSize: isMobile ? 12 : 13.5, fontWeight: on ? 800 : 600,
                  color: on ? ACCENT : C.muted,
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: on ? `3px solid ${ACCENT}` : "3px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  fontFamily: "'Archivo', sans-serif", transition: "color .15s",
                }}>
                  <Icon size={13} /> {label}
                  {count !== null && count > 0 && (
                    <span style={{ fontSize: 10.5, background: on ? ACCENT : C.surface, color: on ? "#fff" : C.muted, border: on ? "none" : C.border, borderRadius: 9, padding: "0 6px", lineHeight: "18px", fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── EDIT FORM ── */}
        {editing && (
          <div style={{ background: C.surface, border: C.border, borderRadius: 20, padding: isMobile ? "16px" : "24px 28px", marginBottom: 14 }}>
            <SectionHead C={C} icon={Edit3}>Profili redaktə et</SectionHead>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <InputField C={C} label="Ad Soyad">
                  <input type="text" value={form.full_name || ""} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inputStyle(C)} />
                </InputField>
                <InputField C={C} label="Username" hint="(hashcampus.site/u/...)">
                  <div style={{ display: "flex", alignItems: "center", border: C.border, borderRadius: 11, overflow: "hidden" }}>
                    <span style={{ padding: "10px 12px", fontSize: 13.5, color: C.muted, background: C.bg, borderRight: C.border, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>u/</span>
                    <input type="text" value={form.username || ""} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder="hamid_dev" style={{ ...inputStyle(C), border: "none", borderRadius: 0, flex: 1 }} />
                  </div>
                </InputField>
              </div>

              <InputField C={C} label="Başlıq (Headline)">
                <input type="text" value={form.headline || ""} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Frontend Dev · 3-cü kurs" style={inputStyle(C)} />
              </InputField>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <InputField C={C} label="İxtisas">
                  <input type="text" value={form.major || ""} onChange={e => setForm({ ...form, major: e.target.value })} style={inputStyle(C)} />
                </InputField>
                <InputField C={C} label="Kurs">
                  <select value={form.course || ""} onChange={e => setForm({ ...form, course: parseInt(e.target.value) || null })} style={{ ...inputStyle(C), appearance: "auto" }}>
                    <option value="">Seçin</option>
                    {[1,2,3,4].map(c => <option key={c} value={c}>{c}-ci kurs</option>)}
                  </select>
                </InputField>
              </div>

              <InputField C={C} label="Haqqında">
                <textarea value={form.bio || ""} onChange={e => setForm({ ...form, bio: e.target.value })} style={textareaStyle(C)} rows={3} />
              </InputField>

              <InputField C={C} label="Bacarıqlar" hint="(vergüllə ayırın)">
                <input type="text" value={form.skills || ""} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Python, React, Design" style={inputStyle(C)} />
              </InputField>

              <InputField C={C} label="Sosial linklər">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: <GithubIcon />, field: "github_url", placeholder: "https://github.com/username" },
                    { icon: <LinkedinIcon />, field: "linkedin_url", placeholder: "https://linkedin.com/in/username" },
                    { icon: <Globe size={14} />, field: "website_url", placeholder: "https://yoursite.com" },
                  ].map(({ icon, field, placeholder }) => (
                    <div key={field} style={{ display: "flex", alignItems: "center", gap: 10, border: C.border, borderRadius: 11, padding: "0 14px" }}>
                      <span style={{ color: C.muted, flexShrink: 0, display: "flex" }}>{icon}</span>
                      <input type="url" value={form[field] || ""} onChange={e => setForm({ ...form, [field]: e.target.value })} placeholder={placeholder} style={{ ...inputStyle(C), border: "none", borderRadius: 0, padding: "10px 0", flex: 1 }} />
                    </div>
                  ))}
                </div>
              </InputField>

              <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: C.border, borderRadius: 12, background: C.bg, cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_open_for_team || false} onChange={e => setForm({ ...form, is_open_for_team: e.target.checked })} style={{ width: 16, height: 16, accentColor: ACCENT }} />
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Komanda üçün açığam</span>
                  <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Başqaları sizi komandaya dəvət edə bilər</p>
                </div>
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSave} style={btnPrimary()}><Save size={14} />Yadda saxla</button>
                <button onClick={() => setEditing(false)} style={btnGhost()}>Ləğv et</button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: XÜLASƏ ── */}
        {!editing && activeTab === "about" && (
          <>
            {user.bio && (
              <div style={{ background: C.surface, border: C.border, borderRadius: 20, padding: "20px 24px", marginBottom: 14 }}>
                <SectionHead C={C} icon={BookOpen}>Haqqında</SectionHead>
                <p style={{ fontSize: 14.5, color: C.textBody, lineHeight: 1.7, margin: 0 }}>{user.bio}</p>
              </div>
            )}
            {user.skills && (
              <div style={{ background: C.surface, border: C.border, borderRadius: 20, padding: "20px 24px", marginBottom: 14 }}>
                <SectionHead C={C} icon={Sparkles}>Bacarıqlar</SectionHead>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {user.skills.split(",").map((s, i) => <Chip key={i} C={C}>{s.trim()}</Chip>)}
                </div>
              </div>
            )}
            {!user.bio && !user.skills && isOwn && (
              <div style={{ background: C.surface, border: C.border, borderRadius: 20, padding: "40px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Profili doldurmaq üçün "Redaktə" düyməsinə bas</p>
              </div>
            )}
          </>
        )}

        {/* ── TAB: POSTLAR ── */}
        {!editing && activeTab === "posts" && (
          <div style={{ background: C.surface, border: C.border, borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: "20px 24px 14px" }}>
              <SectionHead C={C} icon={FileText}>Postlar <span style={{ color: C.muted, fontWeight: 400 }}>({userPosts.length})</span></SectionHead>
            </div>
            {userPosts.length > 0 ? (
              <div>
                {userPosts.map(post => {
                  const imgs = post.images?.length ? post.images : post.image_url
                    ? (() => { try { const p = JSON.parse(post.image_url); return Array.isArray(p) ? p : [post.image_url]; } catch { return [post.image_url]; } })()
                    : [];
                  return (
                    <div key={post.id} style={{ borderTop: `1px solid ${C.divider}` }}>
                      {imgs.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: imgs.length > 1 ? "1fr 1fr" : "1fr", gap: 2 }}>
                          {imgs.slice(0, 4).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt="" style={{ width: "100%", height: imgs.length === 1 ? 220 : 110, objectFit: "cover", display: "block" }} />
                            </a>
                          ))}
                        </div>
                      )}
                      {post.video_url && <video src={post.video_url} controls style={{ width: "100%", maxHeight: 220, display: "block" }} />}
                      <div style={{ padding: "12px 24px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <div style={{ flex: 1 }}>
                            {post.content && <p style={{ margin: "0 0 8px", fontSize: 14, color: C.textBody, whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.content}</p>}
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: C.muted }}><Heart size={12} /> {post.like_count}</span>
                              {post.show_dislikes && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: C.muted }}><ThumbsDown size={12} /> {post.dislike_count}</span>}
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: C.muted }}><MessageCircle size={12} /> {post.comment_count}</span>
                              <span style={{ fontSize: 12, color: C.faint, fontFamily: "'JetBrains Mono', monospace" }}>{formatBakuDate(post.created_at)}</span>
                            </div>
                          </div>
                          {isOwn && <button onClick={() => handleDeletePost(post.id)} style={C.btnDanger}><Trash2 size={15} /></button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 13.5, color: C.muted, textAlign: "center", padding: "40px 0", margin: 0 }}>{isOwn ? "Hələ post paylaşmamısan" : "Post yoxdur"}</p>
            )}
          </div>
        )}

        {/* ── TAB: LAYİHƏLƏR ── */}
        {!editing && activeTab === "projects" && (
          <div style={{ background: C.surface, border: C.border, borderRadius: 20, padding: "20px 24px", marginBottom: 14 }}>
            <SectionHead C={C} icon={FolderGit2} action={isOwn && (
              <button onClick={() => setShowProjForm(!showProjForm)} style={btnGhost({ padding: "6px 14px", fontSize: 13 })}>
                <Plus size={13} />Əlavə et
              </button>
            )}>Layihələr</SectionHead>

            {isOwn && showProjForm && (
              <div style={{ border: C.border, borderRadius: 14, padding: 16, marginBottom: 14, background: C.bg }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input type="text" placeholder="Layihə adı" value={projForm.title} onChange={e => setProjForm({ ...projForm, title: e.target.value })} style={inputStyle(C)} />
                  <textarea placeholder="Qısa təsvir" value={projForm.description} onChange={e => setProjForm({ ...projForm, description: e.target.value })} rows={2} style={textareaStyle(C)} />
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                    <input type="text" placeholder="Texnologiyalar (React, Python...)" value={projForm.technologies} onChange={e => setProjForm({ ...projForm, technologies: e.target.value })} style={inputStyle(C)} />
                    <input type="url" placeholder="GitHub linki" value={projForm.github_url} onChange={e => setProjForm({ ...projForm, github_url: e.target.value })} style={inputStyle(C)} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddProject} disabled={!projForm.title} style={btnPrimary({ opacity: !projForm.title ? 0.4 : 1 })}>Əlavə et</button>
                    <button onClick={() => setShowProjForm(false)} style={btnGhost()}>Ləğv et</button>
                  </div>
                </div>
              </div>
            )}

            {projects.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.map(proj => (
                  <div key={proj.id} style={{ border: C.border, borderRadius: 14, padding: "14px 18px", background: C.bg }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800, color: C.text }}>{proj.title}</p>
                        {proj.description && <p style={{ margin: "0 0 8px", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>{proj.description}</p>}
                        {proj.technologies && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {proj.technologies.split(",").map((t, i) => <Chip key={i} C={C}>{t.trim()}</Chip>)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 14 }}>
                        {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer" style={{ color: C.muted, lineHeight: 1 }} onMouseEnter={e => e.currentTarget.style.color = ACCENT} onMouseLeave={e => e.currentTarget.style.color = C.muted}><Code2 size={16} /></a>}
                        {isOwn && <button onClick={() => handleDeleteProject(proj.id)} style={C.btnDanger}><Trash2 size={15} /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13.5, color: C.muted, textAlign: "center", padding: "28px 0", margin: 0 }}>{isOwn ? "Hələ layihə əlavə olunmayıb" : "Layihə yoxdur"}</p>
            )}
          </div>
        )}

        {/* ── TAB: SERTİFİKATLAR ── */}
        {!editing && activeTab === "certs" && (
          <div style={{ background: C.surface, border: C.border, borderRadius: 20, padding: "20px 24px", marginBottom: 14 }}>
            <SectionHead C={C} icon={Award} action={isOwn && (
              <button onClick={() => setShowCertForm(!showCertForm)} style={btnGhost({ padding: "6px 14px", fontSize: 13 })}>
                <Plus size={13} />Əlavə et
              </button>
            )}>Sertifikatlar</SectionHead>

            {isOwn && showCertForm && (
              <div style={{ border: C.border, borderRadius: 14, padding: 16, marginBottom: 14, background: C.bg }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input type="text" placeholder="Sertifikat adı" value={certForm.name} onChange={e => setCertForm({ ...certForm, name: e.target.value })} style={inputStyle(C)} />
                  <input type="text" placeholder="Verən təşkilat (Google, ISC2...)" value={certForm.issuer} onChange={e => setCertForm({ ...certForm, issuer: e.target.value })} style={inputStyle(C)} />
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                    <input type="date" value={certForm.issue_date} onChange={e => setCertForm({ ...certForm, issue_date: e.target.value })} style={inputStyle(C)} />
                    <input type="url" placeholder="Doğrulama linki" value={certForm.credential_url} onChange={e => setCertForm({ ...certForm, credential_url: e.target.value })} style={inputStyle(C)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Sertifikat şəkli (istəyə bağlı)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label style={btnGhost({ padding: "7px 14px", fontSize: 13, cursor: "pointer" })}>
                        <input type="file" accept="image/*" onChange={handleCertImagePick} style={{ display: "none" }} />
                        {certImageUploading ? "Yüklənir..." : "Şəkil seç"}
                      </label>
                      {certForm.image_url && <img src={certForm.image_url} alt="cert" style={{ height: 44, borderRadius: 8, border: C.border, objectFit: "cover" }} />}
                      {certForm.image_url && <button onClick={() => setCertForm(prev => ({ ...prev, image_url: "" }))} style={C.btnDanger}><X size={14} /></button>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddCert} disabled={!certForm.name || !certForm.issuer} style={btnPrimary({ opacity: (!certForm.name || !certForm.issuer) ? 0.4 : 1 })}>Əlavə et</button>
                    <button onClick={() => setShowCertForm(false)} style={btnGhost()}>Ləğv et</button>
                  </div>
                </div>
              </div>
            )}

            {certificates.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {certificates.map(cert => (
                  <div key={cert.id} style={{ border: C.border, borderRadius: 14, overflow: "hidden", background: C.bg }}>
                    {cert.image_url?.startsWith("http") && (
                      <a href={cert.image_url} target="_blank" rel="noreferrer">
                        <img src={cert.image_url} alt={cert.name} style={{ width: "100%", maxHeight: 200, objectFit: "contain", display: "block", background: dark ? "#071428" : "#f5f7fb", borderBottom: C.border }} />
                      </a>
                    )}
                    <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 3px", fontSize: 14.5, fontWeight: 800, color: C.text }}>{cert.name}</p>
                        <p style={{ margin: 0, fontSize: 12.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>{cert.issuer}{cert.issue_date && ` · ${cert.issue_date}`}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {cert.credential_url && <a href={cert.credential_url} target="_blank" rel="noreferrer" style={{ color: ACCENT, lineHeight: 1 }}><ExternalLink size={16} /></a>}
                        {isOwn && <button onClick={() => handleDeleteCert(cert.id)} style={C.btnDanger}><Trash2 size={15} /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13.5, color: C.muted, textAlign: "center", padding: "28px 0", margin: 0 }}>{isOwn ? "Hələ sertifikat əlavə olunmayıb" : "Sertifikat yoxdur"}</p>
            )}
          </div>
        )}

      </div>
    </div>

    {/* ── CV PREVIEW MODAL ── */}
    {cvPreview && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setCvPreview(null)}>
        <div style={{ background: dark ? "#0a1c39" : "#fff", border: C.border, borderRadius: 20, padding: 24, width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: C.text }}>CV-dən çıxarılan məlumat</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Aşağıdakı məlumatlar profilinizə əlavə ediləcək</p>
            </div>
            <button onClick={() => setCvPreview(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}><X size={18} /></button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Ad Soyad", value: cvPreview.full_name },
              { label: "Başlıq", value: cvPreview.headline },
              { label: "Haqqında", value: cvPreview.bio },
              { label: "İxtisas", value: cvPreview.major },
            ].filter(x => x.value).map(({ label, value }) => (
              <div key={label} style={{ padding: "10px 14px", background: C.bg, border: C.border, borderRadius: 12 }}>
                <span style={{ fontSize: 10.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, color: C.text, fontWeight: 600 }}>{value}</p>
              </div>
            ))}
            {cvPreview.skills?.length > 0 && (
              <div style={{ padding: "10px 14px", background: C.bg, border: C.border, borderRadius: 12 }}>
                <span style={{ fontSize: 10.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>Bacarıqlar</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {cvPreview.skills.map((s, i) => <Chip key={i} C={C}>{s}</Chip>)}
                </div>
              </div>
            )}
            {(cvPreview.github_url || cvPreview.linkedin_url || cvPreview.website_url) && (
              <div style={{ padding: "10px 14px", background: C.bg, border: C.border, borderRadius: 12 }}>
                <span style={{ fontSize: 10.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>Linklər</span>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                  {[cvPreview.github_url, cvPreview.linkedin_url, cvPreview.website_url].filter(Boolean).map((url, i) => (
                    <span key={i} style={{ fontSize: 13, color: ACCENT }}>{url}</span>
                  ))}
                </div>
              </div>
            )}
            {cvPreview.certificates?.length > 0 && (
              <div style={{ padding: "10px 14px", background: C.bg, border: C.border, borderRadius: 12 }}>
                <span style={{ fontSize: 10.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>Sertifikatlar ({cvPreview.certificates.length})</span>
                {cvPreview.certificates.map((c, i) => <p key={i} style={{ margin: "6px 0 0", fontSize: 13.5, color: C.text }}><strong>{c.name}</strong> — {c.issuer}{c.issue_date ? ` (${c.issue_date})` : ""}</p>)}
              </div>
            )}
            {cvPreview.projects?.length > 0 && (
              <div style={{ padding: "10px 14px", background: C.bg, border: C.border, borderRadius: 12 }}>
                <span style={{ fontSize: 10.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>Layihələr ({cvPreview.projects.length})</span>
                {cvPreview.projects.map((p, i) => <p key={i} style={{ margin: "6px 0 0", fontSize: 13.5, color: C.text }}><strong>{p.title}</strong>{p.technologies ? ` — ${p.technologies}` : ""}</p>)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={applyCvPreview} style={btnPrimary({ flex: 1, justifyContent: "center" })}><Send size={14} />Profilə tətbiq et</button>
            <button onClick={() => setCvPreview(null)} style={btnGhost()}>Ləğv et</button>
          </div>
        </div>
      </div>
    )}
    {/* Connections modal */}
    {connModal && (
      <div onClick={() => setConnModal(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 18, width: "100%", maxWidth: 440, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", border: C.border }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.divider}` }}>
            <span style={{ fontWeight: 900, fontSize: 16, color: C.text, fontFamily: "'Archivo', sans-serif" }}>
              Bağlantılar {connectionCount !== null && <span style={{ color: C.muted, fontWeight: 600, fontSize: 14 }}>({connectionCount >= 500 ? "500+" : connectionCount})</span>}
            </span>
            <button onClick={() => setConnModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 4, borderRadius: 8 }}>
              <X size={20} />
            </button>
          </div>
          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {connListLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                <div style={{ width: 28, height: 28, border: "3px solid rgba(30,144,255,0.2)", borderTopColor: ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : connList.length === 0 ? (
              <p style={{ textAlign: "center", color: C.muted, padding: "32px 20px", fontSize: 14 }}>Hələ bağlantı yoxdur</p>
            ) : connList.map(c => {
              const isMe = c.user_id === myUserId;
              const connected = myConnectedIds.has(c.user_id);
              const pending = myPendingIds.has(c.user_id);
              return (
                <div key={c.user_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${C.divider}` }}
                  onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Link to={`/profile/${c.user_id}`} onClick={() => setConnModal(false)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textDecoration: "none" }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: ACCENT }}>
                      {c.profile_picture
                        ? <img src={c.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 17, fontFamily: "'Archivo', sans-serif" }}>{c.full_name?.charAt(0)}</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14.5, color: C.text, fontFamily: "'Archivo', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.full_name}</div>
                      {(c.headline || c.major) && (
                        <div style={{ fontSize: 12.5, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{c.headline || c.major}</div>
                      )}
                    </div>
                  </Link>
                  {!isMe && (
                    <button
                      onClick={() => !connected && !pending && handleQuickConnect(c.user_id)}
                      disabled={connected || pending}
                      title={connected ? "Bağlıdır" : pending ? "Gözlənilir" : "Bağlantı istəyi göndər"}
                      style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", border: connected || pending ? C.border : `1.5px solid ${ACCENT}`, background: connected ? C.surface : pending ? C.surface : "transparent", color: connected ? C.muted : pending ? C.muted : ACCENT, display: "flex", alignItems: "center", justifyContent: "center", cursor: connected || pending ? "default" : "pointer", transition: "all .15s" }}>
                      {connected ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
    {/* Avatar zoom lightbox */}
    {avatarZoom && user.profile_picture && (
      <div onClick={() => setAvatarZoom(false)}
        style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
        <img src={user.profile_picture} alt={user.full_name}
          style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 16, objectFit: "contain", boxShadow: "0 8px 48px rgba(0,0,0,0.6)" }} />
        <button onClick={() => setAvatarZoom(false)}
          style={{ position: "fixed", top: 18, right: 18, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
          <X size={20} />
        </button>
      </div>
    )}
    </>
  );
}
