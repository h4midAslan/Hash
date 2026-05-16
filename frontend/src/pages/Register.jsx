import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

export default function Register() {
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", faculty: "", major: "", course: "",
  });
  const [faculties, setFaculties] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/faculties").then((res) => setFaculties(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "faculty") setForm({ ...form, faculty: value, major: "" });
    else setForm({ ...form, [name]: value });
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
            <Link to="/" style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", textDecoration: "none" }}>Hash</Link>
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
            <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#999" }}>
              Kod gəlmədi?{" "}
              <button onClick={resendCode} style={{ background: "none", border: "none", color: "#1a4a8a", fontWeight: 600, cursor: "pointer", fontSize: 12, padding: 0 }}>
                Yenidən göndər
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link to="/" style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", textDecoration: "none" }}>Hash</Link>
          <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Yeni hesab yarat</p>
        </div>
        <div style={card}>
          {error && <div style={errBox}>{error}</div>}
          <form onSubmit={handleSubmit}>
            {[
              { label: "Ad Soyad", name: "full_name", type: "text", placeholder: "Ad Soyad" },
              { label: "Email", name: "email", type: "email", placeholder: "ad.soyad@naa.edu.az" },
              { label: "Şifrə", name: "password", type: "password", placeholder: "Minimum 6 simvol" },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name} style={{ marginBottom: 10 }}>
                <label style={lbl}>{label}</label>
                <input type={type} name={name} placeholder={placeholder} value={form[name]} onChange={handleChange}
                  style={inp} onFocus={e => e.target.style.borderColor = "#1a4a8a"} onBlur={e => e.target.style.borderColor = "#ccc"} required />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Fakultə</label>
              <select name="faculty" value={form.faculty} onChange={handleChange} style={{ ...inp, color: form.faculty ? "#1a1a1a" : "#999" }} required>
                <option value="">Fakultə seçin</option>
                {Object.keys(faculties).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>İxtisas</label>
              <select name="major" value={form.major} onChange={handleChange} style={{ ...inp, color: form.major ? "#1a1a1a" : "#999" }} required disabled={!form.faculty}>
                <option value="">{form.faculty ? "İxtisas seçin" : "Əvvəlcə fakultə seçin"}</option>
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Kurs</label>
              <select name="course" value={form.course} onChange={handleChange} style={{ ...inp, color: form.course ? "#1a1a1a" : "#999" }} required>
                <option value="">Kurs seçin</option>
                <option value="1">1-ci kurs</option>
                <option value="2">2-ci kurs</option>
                <option value="3">3-cü kurs</option>
                <option value="4">4-cü kurs</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a", padding: "9px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
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
