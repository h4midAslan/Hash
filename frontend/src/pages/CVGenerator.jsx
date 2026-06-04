/**
 * CVGenerator — Multi-Template CV/Resume Generator
 *
 * activeTemplate: 'tech' | 'corporate' | 'creative'
 *
 * Template sub-components are loaded incrementally as specs are finalized.
 * This file contains only the foundational switching architecture.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ── Template type enum ────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    key: "tech",
    label: "Tech",
    sublabel: "Mühəndis / Developer",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    key: "corporate",
    label: "Korporativ",
    sublabel: "ATS-Friendly",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    key: "creative",
    label: "Kreativ",
    sublabel: "Startup / Dizayn",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
];

const ACCENT = "#1E90FF";

// ── Placeholder sub-components (replaced incrementally) ──────────────────────
function TechTemplate({ data }) {
  return (
    <div style={styles.placeholder}>
      <div style={styles.placeholderIcon}>⚡</div>
      <p style={styles.placeholderTitle}>Tech Template</p>
      <p style={styles.placeholderSub}>Spesifikasiya hazırlanır...</p>
    </div>
  );
}

function CorporateTemplate({ data }) {
  return (
    <div style={styles.placeholder}>
      <div style={styles.placeholderIcon}>📄</div>
      <p style={styles.placeholderTitle}>Corporate Template</p>
      <p style={styles.placeholderSub}>Spesifikasiya hazırlanır...</p>
    </div>
  );
}

function CreativeTemplate({ data }) {
  return (
    <div style={styles.placeholder}>
      <div style={styles.placeholderIcon}>🎨</div>
      <p style={styles.placeholderTitle}>Creative Template</p>
      <p style={styles.placeholderSub}>Spesifikasiya hazırlanır...</p>
    </div>
  );
}

// ── Template switcher top bar ─────────────────────────────────────────────────
function TemplateSwitcher({ active, onChange }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={styles.switcherWrap}>
      <div style={styles.switcherLeft}>
        <div style={styles.switcherIcon}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div>
          <p style={styles.switcherHeading}>CV Şablonu</p>
          <p style={styles.switcherSub}>Görünüş seç</p>
        </div>
      </div>

      <div style={styles.tabGroup}>
        {TEMPLATES.map((tpl) => {
          const isActive = active === tpl.key;
          const isHov = hovered === tpl.key;
          return (
            <button
              key={tpl.key}
              onClick={() => onChange(tpl.key)}
              onMouseEnter={() => setHovered(tpl.key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...styles.tabBtn,
                background: isActive
                  ? "rgba(30,144,255,0.15)"
                  : isHov
                  ? "rgba(255,255,255,0.05)"
                  : "transparent",
                border: isActive
                  ? `1px solid rgba(30,144,255,0.45)`
                  : "1px solid transparent",
                color: isActive ? ACCENT : isHov ? "#e2e8f0" : "#94a3b8",
              }}
            >
              <span style={{ color: isActive ? ACCENT : isHov ? "#cbd5e1" : "#64748b" }}>
                {tpl.icon}
              </span>
              <span>
                <span style={styles.tabLabel}>{tpl.label}</span>
                <span style={styles.tabSub}>{tpl.sublabel}</span>
              </span>
              {isActive && <span style={styles.tabActiveDot} />}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => window.print()}
        style={styles.downloadBtn}
        onMouseEnter={e => e.currentTarget.style.background = "#1668c4"}
        onMouseLeave={e => e.currentTarget.style.background = ACCENT}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
          <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
        </svg>
        PDF
      </button>
    </div>
  );
}

// ── CVPreviewContainer — core conditional pipeline ────────────────────────────
function CVPreviewContainer({ profileData }) {
  // activeTemplate: 'tech' | 'corporate' | 'creative'
  const [activeTemplate, setActiveTemplate] = useState("tech");

  return (
    <div style={styles.container}>
      <TemplateSwitcher active={activeTemplate} onChange={setActiveTemplate} />

      <div style={styles.preview}>
        {activeTemplate === "tech"      && <TechTemplate      data={profileData} />}
        {activeTemplate === "corporate" && <CorporateTemplate data={profileData} />}
        {activeTemplate === "creative"  && <CreativeTemplate  data={profileData} />}
      </div>
    </div>
  );
}

// ── Page wrapper — fetches profile, then renders ──────────────────────────────
export default function CVGenerator() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.background = "#060f1e";
    document.body.style.margin = "0";
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    api.get("/users/me")
      .then(r => setProfile(r.data))
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={styles.loadWrap}>
      <div style={styles.spinner} />
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          .cv-no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
      <CVPreviewContainer profileData={profile} />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#060f1e",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "32px 20px 60px",
    WebkitFontSmoothing: "antialiased",
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
  },
  switcherWrap: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, flexWrap: "wrap",
    background: "#0a1c39",
    border: "1px solid #1a2b49",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 24,
  },
  switcherLeft: {
    display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
  },
  switcherIcon: {
    width: 34, height: 34, borderRadius: 9,
    background: "rgba(30,144,255,0.12)",
    border: "1px solid rgba(30,144,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  switcherHeading: {
    margin: 0, fontSize: 13.5, fontWeight: 700, color: "#f1f5f9",
  },
  switcherSub: {
    margin: 0, fontSize: 11, color: "#64748b", marginTop: 1,
  },
  tabGroup: {
    display: "flex", gap: 6, flex: 1, justifyContent: "center",
    flexWrap: "wrap",
  },
  tabBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 14px", borderRadius: 9,
    cursor: "pointer", fontFamily: "inherit",
    transition: "background .15s, border-color .15s, color .15s",
    position: "relative",
    WebkitTapHighlightColor: "transparent",
  },
  tabLabel: {
    display: "block", fontSize: 13, fontWeight: 700, lineHeight: 1.2,
  },
  tabSub: {
    display: "block", fontSize: 10.5, fontWeight: 500, opacity: 0.7, marginTop: 1,
  },
  tabActiveDot: {
    position: "absolute", top: 6, right: 6,
    width: 5, height: 5, borderRadius: "50%",
    background: ACCENT,
  },
  downloadBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 16px", borderRadius: 9, border: "none",
    background: ACCENT, color: "#fff",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", flexShrink: 0,
    transition: "background .15s",
  },
  preview: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 20px 60px rgba(0,0,0,.45)",
    minHeight: 500,
  },
  placeholder: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "80px 24px", gap: 12,
    textAlign: "center",
  },
  placeholderIcon: { fontSize: 40 },
  placeholderTitle: {
    margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a",
    fontFamily: "'Inter', sans-serif",
  },
  placeholderSub: {
    margin: 0, fontSize: 13.5, color: "#94a3b8",
    fontFamily: "'Inter', sans-serif",
  },
  loadWrap: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#060f1e",
  },
  spinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "3px solid rgba(30,144,255,0.2)",
    borderTopColor: ACCENT,
    animation: "spin 0.8s linear infinite",
  },
};
