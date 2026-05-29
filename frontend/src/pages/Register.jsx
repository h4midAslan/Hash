import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

export default function Register() {
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", faculty: "", major: "", course: "",
  });
  const [faculties, setFaculties] = useState({});
  const [detectedUni, setDetectedUni] = useState(null); // { name } | null | "invalid"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef([]);
  const navigate = useNavigate();

  // Email domain detection — fires when email field loses focus or contains valid domain
  const detectDomain = async (email) => {
    const match = email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
    if (!match) {
      setDetectedUni(null);
      setFaculties({});
      setForm(f => ({ ...f, faculty: "", major: "" }));
      return;
    }
    try {
      const res = await api.get(`/auth/faculties?email=${encodeURIComponent(email)}`);
      const data = res.data;
      if (Object.keys(data).length === 0) {
        setDetectedUni("invalid");
        setFaculties({});
        setForm(f => ({ ...f, faculty: "", major: "" }));
      } else {
        // Get university name from backend or derive from domain
        const domain = match[1].toLowerCase();
        const uniNames = {
          "student.naa.edu.az": "Milli Aviasiya Akademiyası",
          "unec.edu.az": "UNEC",
        };
        setDetectedUni({ name: uniNames[domain] || domain });
        setFaculties(data);
        setForm(f => ({ ...f, faculty: "", major: "" }));
      }
    } catch {
      setDetectedUni("invalid");
      setFaculties({});
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "faculty") {
      setForm(f => ({ ...f, faculty: value, major: "" }));
    } else if (name === "email") {
      setForm(f => ({ ...f, email: value }));
      // Detect when full email is typed (has @ + domain)
      if (value.includes("@") && value.split("@")[1]?.includes(".")) {
        detectDomain(value);
      } else {
        setDetectedUni(null);
        setFaculties({});
      }
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleEmailBlur = () => {
    if (form.email.includes("@")) detectDomain(form.email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { ...form, course: parseInt(form.course) });
      setPendingEmail(res.data.email);
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.detail || "Qeydiyyat uğursuz oldu");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleCodeKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) codeRefs.current[i - 1]?.focus();
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      codeRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) { setError("6 rəqəmli kodu daxil edin"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-code", { email: pendingEmail, code: fullCode });
      localStorage.setItem("token", res.data.access_token);
      navigate("/feed");
    } catch (err) {
      setError(err.response?.data?.detail || "Kod yanlışdır");
    } finally {
      setLoading(false);
    }
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

  const pageWrap = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f2f2", padding: "0 16px" };
  const card = { background: "#fff", border: "1px solid #d4d4d4", padding: "24px 24px", boxSizing: "border-box" };
  const inp = { width: "100%", padding: "8px 10px", border: "1px solid #ccc", fontSize: 13, color: "#1a1a1a", outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 4 };
  const errBox = { background: "#fff0f0", color: "#c0392b", border: "1px solid #f5c6cb", padding: "8px 12px", fontSize: 12, marginBottom: 14 };

  if (step === "verify") {
    return (
      <div style={pageWrap}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
              <img src="/logo.png" alt="Hash" style={{ height: 56, width: 56, borderRadius: 14 }} />
            </Link>
            <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Email təsdiqi</p>
          </div>
          <div style={card}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>Emailinizə 6 rəqəmli kod göndərildi</p>
              <p style={{ fontSize: 12, color: "#1a4a8a", marginTop: 4 }}>{pendingEmail}</p>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <form onSubmit={handleVerify}>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }} onPaste={handleCodePaste}>
                {code.map((d, i) => (
                  <input key={i} ref={el => codeRefs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleCodeChange(i, e.target.value)} onKeyDown={e => handleCodeKeyDown(i, e)}
                    style={{ width: 40, height: 48, textAlign: "center", fontSize: 22, fontWeight: 700, border: "1px solid #ccc", outline: "none" }}
                    onFocus={e => e.target.style.borderColor = "#1a4a8a"} onBlur={e => e.target.style.borderColor = "#ccc"} />
                ))}
              </div>
              <button type="submit" disabled={loading}
                style={{ width: "100%", background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a", padding: "9px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Yoxlanılır..." : "Təsdiqlə"}
              </button>
            </form>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 12px", marginTop: 14, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
              <strong>Vacib qeyd:</strong> Universitetin daxili təhlükəsizlik filtrlərinə görə təsdiqləmə kodu <strong>Spam</strong> və ya <strong>Junk</strong> qovluğuna düşə bilər. Zəhmət olmasa, həmin qovluğu yoxlayın.
            </div>
            <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#999" }}>
              Kod gəlmədi?{" "}
              <button onClick={resendCode} style={{ background: "none", border: "none", color: "#1a4a8a", fontWeight: 600, cursor: "pointer", fontSize: 12, padding: 0 }}>
                Yenidən göndər
              </button>
            </p>
            <a href="https://wa.me/994504319040" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, padding: "10px", background: "#25d366", color: "#fff", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Kodu ala bilmirsənsə — Bizimlə əlaqə saxla
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <img src="/logo.png" alt="Hash" style={{ height: 56, width: 56, borderRadius: 14 }} />
          </Link>
          <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Yeni hesab yarat</p>
        </div>
        <div style={card}>
          {error && <div style={errBox}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Ad Soyad</label>
              <input type="text" name="full_name" placeholder="Ad Soyad" value={form.full_name} onChange={handleChange}
                style={inp} onFocus={e => e.target.style.borderColor = "#1a4a8a"} onBlur={e => e.target.style.borderColor = "#ccc"} required />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Email</label>
              <input type="email" name="email" placeholder="ad.soyad@uni.edu.az" value={form.email}
                onChange={handleChange} onBlur={handleEmailBlur}
                style={{ ...inp, borderColor: detectedUni === "invalid" ? "#e53e3e" : detectedUni ? "#22c55e" : "#ccc" }}
                onFocus={e => e.target.style.borderColor = "#1a4a8a"} required />
              {detectedUni && detectedUni !== "invalid" && (
                <p style={{ fontSize: 11, color: "#22c55e", marginTop: 4 }}>
                  ✓ {detectedUni.name} — qeydiyyat mümkündür
                </p>
              )}
              {detectedUni === "invalid" && (
                <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 4 }}>
                  Bu email domeninə qeydiyyat hələ açıq deyil
                </p>
              )}
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Şifrə</label>
              <input type="password" name="password" placeholder="Minimum 6 simvol" value={form.password} onChange={handleChange}
                style={inp} onFocus={e => e.target.style.borderColor = "#1a4a8a"} onBlur={e => e.target.style.borderColor = "#ccc"} required />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Fakultə</label>
              <select name="faculty" value={form.faculty} onChange={handleChange}
                style={{ ...inp, color: form.faculty ? "#1a1a1a" : "#999" }}
                required disabled={Object.keys(faculties).length === 0}>
                <option value="">
                  {detectedUni && detectedUni !== "invalid" ? "Fakultə seçin" : "Əvvəlcə email yazın"}
                </option>
                {Object.keys(faculties).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>İxtisas</label>
              <select name="major" value={form.major} onChange={handleChange}
                style={{ ...inp, color: form.major ? "#1a1a1a" : "#999" }}
                required disabled={!form.faculty}>
                <option value="">{form.faculty ? "İxtisas seçin" : "Əvvəlcə fakultə seçin"}</option>
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Kurs</label>
              <select name="course" value={form.course} onChange={handleChange}
                style={{ ...inp, color: form.course ? "#1a1a1a" : "#999" }} required>
                <option value="">Kurs seçin</option>
                <option value="1">1-ci kurs</option>
                <option value="2">2-ci kurs</option>
                <option value="3">3-cü kurs</option>
                <option value="4">4-cü kurs</option>
              </select>
            </div>

            <button type="submit" disabled={loading || detectedUni === "invalid" || !detectedUni}
              style={{ width: "100%", background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a", padding: "9px", fontSize: 13, fontWeight: 600, cursor: (loading || !detectedUni || detectedUni === "invalid") ? "not-allowed" : "pointer", opacity: (loading || !detectedUni || detectedUni === "invalid") ? 0.5 : 1 }}>
              {loading ? "Gözləyin..." : "Qeydiyyatdan keç"}
            </button>
          </form>
        </div>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#666" }}>
          Artıq hesabın var?{" "}
          <Link to="/login" style={{ color: "#1a4a8a", fontWeight: 600, textDecoration: "none" }}>Daxil ol</Link>
        </p>
      </div>
    </div>
  );
}
