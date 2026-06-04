import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

const ACCENT = "#1E90FF";

function HashMark({ size = 32 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block" }}>
      <g fill="#ffffff">
        <rect x="32" y="10" width="11" height="80" />
        <rect x="57" y="10" width="11" height="80" />
        <rect x="10" y="32" width="80" height="11" />
        <rect x="10" y="57" width="80" height="11" />
      </g>
      <g fill="#00CFFF">
        <circle cx="37" cy="37" r="7" />
        <circle cx="63" cy="37" r="7" />
        <circle cx="37" cy="63" r="7" />
        <circle cx="63" cy="63" r="7" />
      </g>
    </svg>
  );
}

function useFonts() {
  useEffect(() => {
    if (document.getElementById("hash-fonts")) return;
    const link = document.createElement("link");
    link.id = "hash-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,800&family=JetBrains+Mono:wght@500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 600,
  color: "#7d8ba3", marginBottom: 7,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.06em", textTransform: "uppercase",
};

const inputBase = {
  width: "100%", padding: "11px 14px",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 11, fontSize: 14,
  color: "#ffffff", background: "rgba(255,255,255,0.04)",
  outline: "none", boxSizing: "border-box",
  fontFamily: "'Archivo', sans-serif",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ borderOverride, ...props }) {
  return (
    <input
      {...props}
      style={{ ...inputBase, ...(borderOverride ? { borderColor: borderOverride } : {}) }}
      onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(30,144,255,0.15)"; }}
      onBlur={e => { e.target.style.borderColor = borderOverride || "rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

function StyledSelect(props) {
  return (
    <select
      {...props}
      style={{
        ...inputBase,
        color: props.value ? "#ffffff" : "#7d8ba3",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237d8ba3' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: 36,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
      }}
      onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(30,144,255,0.15)"; }}
      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

export default function Register() {
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", faculty: "", major: "", course: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [faculties, setFaculties] = useState({});
  const [detectedUni, setDetectedUni] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef([]);
  const navigate = useNavigate();
  useFonts();

  useEffect(() => {
    document.body.style.background = "#050f1f";
    document.body.style.margin = "0";
    return () => { document.body.style.background = ""; };
  }, []);

  const detectDomain = async (email) => {
    const match = email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
    if (!match) {
      setDetectedUni(null); setFaculties({});
      setForm(f => ({ ...f, faculty: "", major: "" }));
      return;
    }
    try {
      const res = await api.get(`/auth/faculties?email=${encodeURIComponent(email)}`);
      const data = res.data;
      if (!data || Object.keys(data).length === 0) {
        setDetectedUni("invalid"); setFaculties({});
        setForm(f => ({ ...f, faculty: "", major: "" }));
      } else {
        setDetectedUni({ name: data.university_name });
        setFaculties(data.faculties);
        setForm(f => ({ ...f, faculty: "", major: "" }));
      }
    } catch { setDetectedUni("invalid"); setFaculties({}); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "faculty") {
      setForm(f => ({ ...f, faculty: value, major: "" }));
    } else if (name === "email") {
      setForm(f => ({ ...f, email: value }));
      if (value.includes("@") && value.split("@")[1]?.includes(".")) detectDomain(value);
      else { setDetectedUni(null); setFaculties({}); }
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleEmailBlur = () => { if (form.email.includes("@")) detectDomain(form.email); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/register", { ...form, course: parseInt(form.course) });
      setPendingEmail(res.data.email);
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.detail || "Qeydiyyat uğursuz oldu");
    } finally { setLoading(false); }
  };

  const handleCodeChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code]; next[i] = val; setCode(next);
    if (val && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleCodeKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) codeRefs.current[i - 1]?.focus();
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setCode(pasted.split("")); codeRefs.current[5]?.focus(); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) { setError("6 rəqəmli kodu daxil edin"); return; }
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/verify-code", { email: pendingEmail, code: fullCode });
      localStorage.setItem("token", res.data.access_token);
      navigate("/feed");
    } catch (err) {
      setError(err.response?.data?.detail || "Kod yanlışdır");
    } finally { setLoading(false); }
  };

  const resendCode = async () => {
    setError("");
    try {
      await api.post("/auth/register", { ...form, course: parseInt(form.course) });
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } catch {}
  };

  const specializations = form.faculty ? faculties[form.faculty] || [] : [];

  const pageStyle = {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "#050f1f",
    padding: "24px 16px",
    fontFamily: "'Archivo', sans-serif",
    position: "relative", overflow: "hidden",
  };

  const cardStyle = {
    background: "#0a1c39",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "32px 28px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
  };

  const errBoxStyle = {
    background: "rgba(248,113,113,0.10)",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13, color: "#f87171",
    marginBottom: 20,
  };

  const logoBlock = (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <Link to="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: "#071428",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(30,144,255,0.45)",
        }}>
          <HashMark size={34} />
        </div>
        <span style={{ fontWeight: 900, fontSize: 26, letterSpacing: "0.06em", color: "#ffffff" }}>HASH</span>
      </Link>
    </div>
  );

  const glowBg = (
    <div style={{
      position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
      width: 600, height: 350,
      background: "radial-gradient(ellipse at center, rgba(30,144,255,0.10) 0%, transparent 70%)",
      pointerEvents: "none",
    }} />
  );

  // ── Verify step ──────────────────────────────────────────────────
  if (step === "verify") {
    return (
      <div style={pageStyle}>
        {glowBg}
        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
          {logoBlock}
          <div style={cardStyle}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(30,144,255,0.12)",
                border: "1px solid rgba(30,144,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
                fontSize: 24,
              }}>✉</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: 0 }}>Email təsdiqi</p>
              <p style={{ fontSize: 13, color: "#7d8ba3", marginTop: 6 }}>
                6 rəqəmli kod göndərildi
              </p>
              <p style={{
                fontSize: 13, color: ACCENT, marginTop: 4,
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              }}>{pendingEmail}</p>
            </div>

            {error && <div style={errBoxStyle}>{error}</div>}

            <form onSubmit={handleVerify}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }} onPaste={handleCodePaste}>
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={el => codeRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    style={{
                      width: 46, height: 54, textAlign: "center",
                      fontSize: 24, fontWeight: 800,
                      border: `1px solid ${d ? ACCENT : "rgba(255,255,255,0.12)"}`,
                      borderRadius: 12, outline: "none",
                      background: d ? "rgba(30,144,255,0.10)" : "rgba(255,255,255,0.04)",
                      color: "#ffffff",
                      fontFamily: "'JetBrains Mono', monospace",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxShadow: d ? "0 0 0 3px rgba(30,144,255,0.15)" : "none",
                    }}
                    onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(30,144,255,0.20)"; }}
                    onBlur={e => { e.target.style.borderColor = d ? ACCENT : "rgba(255,255,255,0.12)"; e.target.style.boxShadow = d ? "0 0 0 3px rgba(30,144,255,0.15)" : "none"; }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "rgba(30,144,255,0.5)" : ACCENT,
                  color: "#fff", border: "none",
                  padding: "13px", borderRadius: 12,
                  fontSize: 14, fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Archivo', sans-serif",
                  boxShadow: loading ? "none" : "0 6px 20px rgba(30,144,255,0.40)",
                }}
              >
                {loading ? "Yoxlanılır..." : "Təsdiqlə"}
              </button>
            </form>

            <div style={{
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.20)",
              borderRadius: 10,
              padding: "12px 14px", marginTop: 16,
              fontSize: 12, color: "#fbbf24", lineHeight: 1.7,
            }}>
              <strong>Vacib qeyd:</strong> Kod <strong>Spam / Junk</strong> qovluğuna düşə bilər — həmin qovluğu yoxlayın.
            </div>

            <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#7d8ba3" }}>
              Kod gəlmədi?{" "}
              <button onClick={resendCode} style={{
                background: "none", border: "none", color: ACCENT,
                fontWeight: 700, cursor: "pointer", fontSize: 12, padding: 0,
              }}>
                Yenidən göndər
              </button>
            </p>

            <a href="https://wa.me/994504319040" target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                marginTop: 12, padding: "12px",
                background: "#25d366", borderRadius: 12,
                color: "#fff", fontWeight: 700, fontSize: 13,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(37,211,102,0.30)",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Kodu ala bilmirsənsə — Bizimlə əlaqə saxla
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Register form ────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      {glowBg}
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {logoBlock}

        <div style={cardStyle}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            color: "#7d8ba3", fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase", marginBottom: 20, textAlign: "center",
          }}>YENİ HESAB YARAT</p>

          {error && <div style={errBoxStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <Field label="Ad Soyad">
              <StyledInput type="text" name="full_name" placeholder="Ad Soyad" value={form.full_name} onChange={handleChange} required />
            </Field>

            <Field label="Email">
              <StyledInput
                type="email" name="email"
                placeholder="ad.soyad@uni.edu.az"
                value={form.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                borderOverride={detectedUni === "invalid" ? "#f87171" : detectedUni ? "#34d399" : undefined}
                required
              />
              {detectedUni && detectedUni !== "invalid" && (
                <p style={{ fontSize: 11, color: "#34d399", marginTop: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  ✓ {detectedUni.name}
                </p>
              )}
              {detectedUni === "invalid" && (
                <p style={{ fontSize: 11, color: "#f87171", marginTop: 5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  ✗ Bu email domeninə qeydiyyat açıq deyil
                </p>
              )}
            </Field>

            <Field label="Şifrə">
              <StyledInput type="password" name="password" placeholder="Minimum 6 simvol" value={form.password} onChange={handleChange} required />
            </Field>

            <Field label="Fakultə">
              <StyledSelect name="faculty" value={form.faculty} onChange={handleChange} required disabled={Object.keys(faculties).length === 0}>
                <option value="" style={{ background: "#0a1c39" }}>
                  {detectedUni && detectedUni !== "invalid" ? "Fakultə seçin" : "Əvvəlcə email yazın"}
                </option>
                {Object.keys(faculties).map(f => <option key={f} value={f} style={{ background: "#0a1c39" }}>{f}</option>)}
              </StyledSelect>
            </Field>

            <Field label="İxtisas">
              <StyledSelect name="major" value={form.major} onChange={handleChange} required disabled={!form.faculty}>
                <option value="" style={{ background: "#0a1c39" }}>{form.faculty ? "İxtisas seçin" : "Əvvəlcə fakultə seçin"}</option>
                {specializations.map(s => <option key={s} value={s} style={{ background: "#0a1c39" }}>{s}</option>)}
              </StyledSelect>
            </Field>

            <Field label="Kurs">
              <StyledSelect name="course" value={form.course} onChange={handleChange} required>
                <option value="" style={{ background: "#0a1c39" }}>Kurs seçin</option>
                <option value="1" style={{ background: "#0a1c39" }}>1-ci kurs</option>
                <option value="2" style={{ background: "#0a1c39" }}>2-ci kurs</option>
                <option value="3" style={{ background: "#0a1c39" }}>3-cü kurs</option>
                <option value="4" style={{ background: "#0a1c39" }}>4-cü kurs</option>
              </StyledSelect>
            </Field>

            {/* Consent checkbox */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "14px 0 6px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 3, accentColor: ACCENT, width: 15, height: 15, flexShrink: 0, cursor: "pointer" }}
              />
              <span style={{ fontSize: 12, color: "#7d8ba3", lineHeight: 1.6 }}>
                <Link to="/terms" target="_blank" style={{ color: ACCENT, fontWeight: 700, textDecoration: "none" }}>İstifadəçi Şərtlərini</Link>
                {" "}və{" "}
                <Link to="/privacy" target="_blank" style={{ color: ACCENT, fontWeight: 700, textDecoration: "none" }}>Məxfilik Siyasətini</Link>
                {" "}oxudum və qəbul edirəm. Həmçinin platformanın universitetlə rəsmi əlaqəsi olmadığını{" "}
                <Link to="/disclaimer" target="_blank" style={{ color: "#7d8ba3", textDecoration: "underline" }}>başa düşürəm</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || detectedUni === "invalid" || !detectedUni || !agreed}
              style={{
                width: "100%", marginTop: 10,
                background: (loading || !detectedUni || detectedUni === "invalid" || !agreed) ? "rgba(30,144,255,0.35)" : ACCENT,
                color: "#fff", border: "none",
                padding: "13px", borderRadius: 12,
                fontSize: 14, fontWeight: 800,
                cursor: (loading || !detectedUni || detectedUni === "invalid" || !agreed) ? "not-allowed" : "pointer",
                fontFamily: "'Archivo', sans-serif",
                letterSpacing: "0.02em",
                boxShadow: (!loading && detectedUni && detectedUni !== "invalid" && agreed) ? "0 6px 20px rgba(30,144,255,0.40)" : "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { if (!loading && detectedUni && detectedUni !== "invalid" && agreed) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Gözləyin..." : "Qeydiyyatdan keç"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#7d8ba3" }}>
          Artıq hesabın var?{" "}
          <Link to="/login" style={{ color: ACCENT, fontWeight: 700, textDecoration: "none" }}>
            Daxil ol
          </Link>
        </p>

      </div>
    </div>
  );
}
