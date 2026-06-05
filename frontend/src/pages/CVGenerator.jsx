/**
 * CVGenerator — Multi-Template CV/Resume Generator
 * activeTemplate: 'tech' | 'corporate' | 'creative'
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const ACCENT = "#1E90FF";

// ── Helpers ───────────────────────────────────────────────────────────────────
function asList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch (_) {}
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

function dateRange(start, end, isCurrent) {
  if (!start && !end) return "";
  const fmt = (s) => s ? String(s).slice(0, 7) : "";
  return [fmt(start), isCurrent ? "Present" : fmt(end)].filter(Boolean).join(" — ");
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IPin = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IMail = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>;
const ILinkedin = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" /></svg>;
const IGithub = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" /></svg>;
const IArrow = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 17 17 7M7 7h10v10" /></svg>;
const ISun = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>;
const IMoon = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
const ISpark = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" /></svg>;

// ── CSS injected once ─────────────────────────────────────────────────────────
const CREATIVE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap');
.cv-creative { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.cv-creative .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
.grid-texture {
  background-image: linear-gradient(to right, rgba(37,99,235,.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,.07) 1px, transparent 1px);
  background-size: 34px 34px;
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at 80% 0%, #000 0%, transparent 75%);
  mask-image: radial-gradient(ellipse 70% 80% at 80% 0%, #000 0%, transparent 75%);
}
@keyframes cv-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.cv-rise { animation: cv-rise .7s cubic-bezier(.16,1,.3,1) both; }
@keyframes cv-pulse-node { 0%,100%{box-shadow:0 0 8px rgba(37,99,235,.5);} 50%{box-shadow:0 0 16px rgba(37,99,235,.85);} }
.cv-node-pulse { animation: cv-pulse-node 3.2s ease-in-out infinite; }
.cv-theme { transition: background-color .5s cubic-bezier(.4,0,.2,1), border-color .5s cubic-bezier(.4,0,.2,1), color .5s cubic-bezier(.4,0,.2,1); }
@media print {
  .cv-no-print { display: none !important; }
  .cv-creative { background: #fff !important; }
}
`;

// ── Creative Template Building Blocks ────────────────────────────────────────
function GroupHeader({ children, index }) {
  return (
    <h2 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11, fontWeight: 900, color: "#3b82f6" }}>
      <span style={{ fontFamily: "monospace", fontSize: 10, opacity: 0.5 }}>{index}</span>
      {children}
    </h2>
  );
}

function TechTag({ children, dark }) {
  return (
    <span style={{
      background: dark ? "#0f172a" : "#f1f5f9",
      border: `1px solid ${dark ? "rgba(148,163,184,0.2)" : "#e2e8f0"}`,
      color: dark ? "#cbd5e1" : "#475569",
      padding: "2px 8px", borderRadius: 4,
      fontSize: 10, fontFamily: "monospace", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function ContactChip({ icon, label, href, dark }) {
  const style = {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 500,
    padding: "6px 10px", borderRadius: 8,
    background: dark ? "rgba(30,41,59,0.6)" : "#f1f5f9",
    border: `1px solid ${dark ? "rgba(71,85,105,0.5)" : "#e2e8f0"}`,
    color: dark ? "#cbd5e1" : "#475569",
    textDecoration: "none",
    cursor: href ? "pointer" : "default",
  };
  const inner = (
    <>
      <span style={{ color: dark ? "#64748b" : "#94a3b8", display: "flex" }}>{icon}</span>
      {label}
    </>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a> : <span style={style}>{inner}</span>;
}

function ContactRow({ icon, label, href, dark }) {
  const style = {
    display: "flex", alignItems: "center", gap: 12,
    padding: "6px 4px", borderRadius: 8, textDecoration: "none",
    color: dark ? "#e2e8f0" : "#374151",
  };
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
      <span style={{ color: "#3b82f6", display: "flex", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <IArrow width={13} height={13} style={{ color: dark ? "#475569" : "#d1d5db", flexShrink: 0 }} />
    </a>
  ) : (
    <div style={style}>
      <span style={{ color: "#3b82f6", display: "flex", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function TimelineEntry({ item, delay, dark, index }) {
  const flagship = index === 0 && item.tags;
  return (
    <div className="cv-rise" style={{ position: "relative", animationDelay: delay + "ms" }}>
      {/* timeline node */}
      <span className={flagship ? "cv-node-pulse" : ""} style={{
        position: "absolute", left: -31, top: 6,
        width: 12, height: 12, borderRadius: "50%",
        background: "#2563eb",
        border: `4px solid ${dark ? "#0B0F19" : "#fff"}`,
        boxShadow: "0 0 8px rgba(37,99,235,0.5)",
      }} />
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "4px 12px" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: dark ? "#fff" : "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            {item.name || item.role}
            {flagship && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: "#60a5fa", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 99, padding: "2px 8px" }}>
                <ISpark width={10} height={10} /> flagship
              </span>
            )}
          </h3>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: dark ? "#64748b" : "#94a3b8" }}>{item.period}</span>
        </div>
        {item.org && <div style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6", marginTop: 2 }}>{item.org}</div>}
        {item.blurb && <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.65, fontWeight: 500, color: dark ? "rgba(203,213,225,0.9)" : "#475569", maxWidth: 600 }}>{item.blurb}</p>}
        {item.tags && item.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {item.tags.map((t, i) => <TechTag key={i} dark={dark}>{t}</TechTag>)}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineSection({ title, index, items, startDelay, dark }) {
  if (!items || items.length === 0) return null;
  return (
    <section>
      <GroupHeader index={index}>{title}</GroupHeader>
      <div style={{ borderLeft: `2px solid ${dark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.2)"}`, marginLeft: 12, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 32 }}>
        {items.map((it, i) => (
          <TimelineEntry key={i} item={it} delay={startDelay + i * 90} dark={dark} index={i} />
        ))}
      </div>
    </section>
  );
}

function SidebarCard({ title, index, children, dark }) {
  return (
    <div style={{
      background: dark ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.8)",
      border: `1px solid ${dark ? "rgba(30,41,59,0.6)" : "#e2e8f0"}`,
      borderRadius: 16, padding: 20,
    }}>
      <GroupHeader index={index}>{title}</GroupHeader>
      {children}
    </div>
  );
}

// ── Creative Template (Founder Storytelling Layout) ───────────────────────────
function CreativeTemplate({ data }) {
  const [dark, setDark] = useState(true);

  // Build structured data from raw profile
  const skills       = asList(data.skills);
  const languages    = asList(data.languages);
  const experiences  = (data.experiences  || []).map(ex => ({
    role:   ex.role,
    org:    ex.company,
    period: dateRange(ex.start_date, ex.end_date, ex.is_current),
    blurb:  ex.description,
    tags:   [],
  }));
  const projects = (data.projects || []).map((p, i) => ({
    name:     p.title,
    period:   p.github_url ? undefined : undefined,
    blurb:    p.description,
    tags:     asList(p.technologies),
    flagship: i === 0,
  }));
  const certificates = data.certificates || [];
  const headlineParts = (data.headline || "")
    .split(/[•·|]/).map(s => s.trim()).filter(Boolean);
  const education = (data.university || data.faculty) ? [{
    role:   [data.major, data.faculty].filter(Boolean).join(" · ") || "Student",
    org:    data.university || data.faculty,
    period: data.edu_start_year ? `${data.edu_start_year} — ${data.edu_end_year || "Present"}` : "",
    blurb:  [data.gpa ? `GPA ${data.gpa}` : null, data.course ? `Year ${data.course}` : null].filter(Boolean).join(" · "),
    tags:   skills.slice(0, 4),
  }] : [];

  const langItems = languages.map(l => {
    const name  = typeof l === "object" ? l.lang   : l;
    const level = typeof l === "object" ? l.level  : "";
    const pctMap = { "Ana dili": 100, "C2": 95, "C1": 85, "B2": 70, "B1": 55, "A2": 35, "A1": 20 };
    const pct = Object.entries(pctMap).find(([k]) => level.includes(k))?.[1] ?? 60;
    return { name, level, pct };
  });

  const bg       = dark ? "#0B0F19" : "#F1F5F9";
  const heroBg   = dark ? "rgba(19,27,46,0.6)" : "rgba(255,255,255,0.9)";
  const borderC  = dark ? "rgba(51,65,85,0.7)" : "#e2e8f0";

  return (
    <div className="cv-creative cv-theme" style={{ background: bg, minHeight: "100%", padding: "28px 20px", color: dark ? "#f1f5f9" : "#1e293b" }}>
      <style>{CREATIVE_CSS}</style>

      {/* Theme toggle */}
      <button
        className="cv-no-print"
        onClick={() => setDark(d => !d)}
        style={{
          position: "fixed", top: 80, right: 20, zIndex: 200,
          width: 40, height: 40, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: dark ? "rgba(19,27,46,0.8)" : "rgba(255,255,255,0.9)",
          border: `1px solid ${borderC}`,
          color: dark ? "#94a3b8" : "#64748b",
          cursor: "pointer", backdropFilter: "blur(8px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
        aria-label="Toggle theme"
      >
        {dark ? <ISun width={18} height={18} /> : <IMoon width={18} height={18} />}
      </button>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* ── HERO ── */}
        <header className="cv-rise" style={{
          position: "relative", overflow: "hidden",
          borderRadius: 24, border: `1px solid ${borderC}`,
          background: heroBg, padding: "32px 36px", marginBottom: 28,
        }}>
          <div className="grid-texture" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(37,99,235,0.08)", filter: "blur(60px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
            {/* kicker + hash badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "#475569" : "#94a3b8" }}>
                Founder · Curriculum Vitae
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59,130,246,0.05)", color: "#60a5fa", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(59,130,246,0.15)" }}>
                <span className="cv-node-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
                # HASH Certified
              </span>
            </div>

            {/* name + headline + manifesto */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: "-0.025em", color: dark ? "#fff" : "#0f172a" }}>
                  {data.full_name}
                </h1>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px" }}>
                  {headlineParts.map((part, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      {i > 0 && <span className="cv-node-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(59,130,246,0.6)", display: "inline-block" }} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: dark ? "#e2e8f0" : "#374151" }}>{part}</span>
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <ContactChip dark={dark} icon={<IPin width={13} height={13} />} label="Baku, Azerbaijan" />
                  {data.show_email && data.email && <ContactChip dark={dark} icon={<IMail width={13} height={13} />} label={data.email} href={`mailto:${data.email}`} />}
                  {data.phone && <ContactChip dark={dark} icon={<IPin width={13} height={13} />} label={data.phone} />}
                  {data.linkedin_url && <ContactChip dark={dark} icon={<ILinkedin width={13} height={13} />} label="LinkedIn" href={data.linkedin_url} />}
                  {data.github_url && <ContactChip dark={dark} icon={<IGithub width={13} height={13} />} label="GitHub" href={data.github_url} />}
                </div>
              </div>
              {data.bio && (
                <div style={{ borderRadius: 16, border: `1px solid ${dark ? "rgba(51,65,85,0.4)" : "#e2e8f0"}`, background: dark ? "rgba(15,23,42,0.4)" : "rgba(248,250,252,0.8)", padding: 18 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 8 }}>// manifesto</div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, fontWeight: 500, color: dark ? "#e2e8f0" : "#374151" }}>{data.bio}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── BODY GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 28, alignItems: "start" }}>

          {/* Main timeline */}
          <main style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {experiences.length > 0 && <TimelineSection title="Experience" index="01" items={experiences} startDelay={120} dark={dark} />}
            {projects.length > 0    && <TimelineSection title="Projects"   index="02" items={projects}   startDelay={220} dark={dark} />}
            {education.length > 0   && <TimelineSection title="Education"  index="03" items={education}  startDelay={340} dark={dark} />}
          </main>

          {/* Sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {langItems.length > 0 && (
              <SidebarCard title="Languages" index="04" dark={dark}>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {langItems.map((l, i) => (
                    <li key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: dark ? "#f1f5f9" : "#0f172a" }}>{l.name}</span>
                        <span style={{ fontSize: 10, fontFamily: "monospace", color: dark ? "#64748b" : "#94a3b8" }}>{l.level}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: dark ? "#1e293b" : "#e2e8f0", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, width: `${l.pct}%`, background: "#2563eb", boxShadow: "0 0 8px rgba(37,99,235,0.5)" }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </SidebarCard>
            )}

            {certificates.length > 0 && (
              <SidebarCard title="Certificates" index="05" dark={dark}>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {certificates.map((c, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span className="cv-node-pulse" style={{ marginTop: 5, width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, boxShadow: "0 0 6px rgba(37,99,235,0.6)" }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#f1f5f9" : "#0f172a", lineHeight: 1.3 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: dark ? "#64748b" : "#94a3b8", fontWeight: 500, marginTop: 2 }}>
                          {c.issuer}
                          {c.issue_date ? <span style={{ fontFamily: "monospace" }}> · {c.issue_date.slice(0, 7)}</span> : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </SidebarCard>
            )}

            <SidebarCard title="Contact" index="06" dark={dark}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <ContactRow dark={dark} icon={<IPin width={15} height={15} />} label="Baku, Azerbaijan" />
                {data.show_email && data.email && <ContactRow dark={dark} icon={<IMail width={15} height={15} />} label={data.email} href={`mailto:${data.email}`} />}
                {data.linkedin_url && <ContactRow dark={dark} icon={<ILinkedin width={15} height={15} />} label="LinkedIn" href={data.linkedin_url} />}
                {data.github_url && <ContactRow dark={dark} icon={<IGithub width={15} height={15} />} label="GitHub" href={data.github_url} />}
              </div>
            </SidebarCard>
          </aside>
        </div>

        {/* footer signature */}
        <footer style={{ marginTop: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: dark ? "#334155" : "#cbd5e1" }}>
          <span style={{ width: 28, height: 1, background: dark ? "#334155" : "#cbd5e1" }} />
          built with hash · {new Date().getFullYear()}
          <span style={{ width: 28, height: 1, background: dark ? "#334155" : "#cbd5e1" }} />
        </footer>
      </div>
    </div>
  );
}

// ── Placeholder stubs (Tech + Corporate filled in later) ──────────────────────
function TechTemplate({ data }) {
  return <div style={S.placeholder}><div style={S.phIcon}>⚡</div><p style={S.phTitle}>Tech Template</p><p style={S.phSub}>Növbəti şablon — spesifikasiya gözlənilir</p></div>;
}
function CorporateTemplate({ data }) {
  return <div style={S.placeholder}><div style={S.phIcon}>📄</div><p style={S.phTitle}>Corporate Template</p><p style={S.phSub}>generate.js ilə docx kimi ixrac edilir</p></div>;
}

// ── Template switcher top bar ─────────────────────────────────────────────────
const TEMPLATES = [
  { key: "tech",      label: "Tech",      sublabel: "Mühəndis / Dev",   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
  { key: "corporate", label: "Korporativ",sublabel: "ATS-Friendly",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg> },
  { key: "creative",  label: "Kreativ",   sublabel: "Startup / Founder",icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg> },
];

function TemplateSwitcher({ active, onChange }) {
  const [hov, setHov] = useState(null);
  return (
    <div style={S.switcherWrap}>
      <div style={S.switcherLeft}>
        <div style={S.switcherIcon}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#f1f5f9" }}>CV Şablonu</p>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b", marginTop: 1 }}>Görünüş seç</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
        {TEMPLATES.map((tpl) => {
          const on = active === tpl.key;
          const isHov = hov === tpl.key;
          return (
            <button key={tpl.key} onClick={() => onChange(tpl.key)}
              onMouseEnter={() => setHov(tpl.key)} onMouseLeave={() => setHov(null)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", background: on ? "rgba(30,144,255,0.15)" : isHov ? "rgba(255,255,255,0.05)" : "transparent", border: on ? "1px solid rgba(30,144,255,0.45)" : "1px solid transparent", color: on ? ACCENT : isHov ? "#e2e8f0" : "#94a3b8", transition: "all .15s" }}>
              <span style={{ color: on ? ACCENT : "#64748b" }}>{tpl.icon}</span>
              <span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{tpl.label}</span>
                <span style={{ display: "block", fontSize: 10.5, opacity: 0.7, marginTop: 1 }}>{tpl.sublabel}</span>
              </span>
              {on && <span style={{ position: "absolute", top: 6, right: 6, width: 5, height: 5, borderRadius: "50%", background: ACCENT }} />}
            </button>
          );
        })}
      </div>
      <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.background = "#1668c4"}
        onMouseLeave={e => e.currentTarget.style.background = ACCENT}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" /></svg>
        PDF
      </button>
    </div>
  );
}

// ── CVPreviewContainer ────────────────────────────────────────────────────────
function CVPreviewContainer({ profileData }) {
  const [activeTemplate, setActiveTemplate] = useState("creative");
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
      <div className="cv-no-print"><TemplateSwitcher active={activeTemplate} onChange={setActiveTemplate} /></div>
      <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 20px 60px rgba(0,0,0,.45)", minHeight: 500 }}>
        {activeTemplate === "tech"      && <TechTemplate      data={profileData} />}
        {activeTemplate === "corporate" && <CorporateTemplate data={profileData} />}
        {activeTemplate === "creative"  && <CreativeTemplate  data={profileData} />}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
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
    Promise.all([
      api.get("/users/me"),
      api.get("/projects").catch(() => ({ data: [] })),
      api.get("/certificates").catch(() => ({ data: [] })),
      api.get("/experience").catch(() => ({ data: [] })),
    ]).then(([me, projects, certs, exp]) => {
      setProfile({
        ...me.data,
        projects:     projects.data     || [],
        certificates: certs.data        || [],
        experiences:  exp.data          || [],
      });
    }).catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060f1e" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(30,144,255,0.2)", borderTopColor: ACCENT, animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#060f1e", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: "32px 20px 60px", WebkitFontSmoothing: "antialiased" }}>
      <CVPreviewContainer profileData={profile} />
    </div>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────
const S = {
  switcherWrap: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "#0a1c39", border: "1px solid #1a2b49", borderRadius: 14, padding: "12px 16px", marginBottom: 24 },
  switcherLeft: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  switcherIcon: { width: 34, height: 34, borderRadius: 9, background: "rgba(30,144,255,0.12)", border: "1px solid rgba(30,144,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" },
  placeholder: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 12, textAlign: "center", background: "#fff", minHeight: 400 },
  phIcon: { fontSize: 40 },
  phTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" },
  phSub:   { margin: 0, fontSize: 13.5, color: "#94a3b8" },
};
