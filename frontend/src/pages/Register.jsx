import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, ShieldCheck } from "lucide-react";
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

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="text-4xl font-bold text-blue-600">Hash</Link>
            <p className="text-gray-500 mt-2">Email təsdiqi</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={28} className="text-blue-600" />
              </div>
              <p className="text-gray-700 font-medium">Emailinizə 6 rəqəmli kod göndərildi</p>
              <p className="text-blue-600 text-sm font-semibold mt-1">{pendingEmail}</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify}>
              <div className="flex gap-2 justify-center mb-6" onPaste={handleCodePaste}>
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={el => codeRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Yoxlanılır..." : "Təsdiqlə"}
              </button>
            </form>

            <p className="text-center mt-4 text-sm text-gray-400">
              Kod gəlmədi?{" "}
              <button onClick={resendCode} className="text-blue-600 font-medium hover:underline">
                Yenidən göndər
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-bold text-blue-600">Hash</Link>
          <p className="text-gray-500 mt-2">Yeni hesab yarat</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input type="text" name="full_name" placeholder="Ad Soyad" value={form.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" placeholder="ad.soyad@naa.edu.az və ya @student.naa.edu.az"
                value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
              <input type="password" name="password" placeholder="Minimum 6 simvol" value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fakultə</label>
              <select name="faculty" value={form.faculty} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-600"
                required>
                <option value="">Fakultə seçin</option>
                {Object.keys(faculties).map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İxtisas</label>
              <select name="major" value={form.major} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-600"
                required disabled={!form.faculty}>
                <option value="">{form.faculty ? "İxtisas seçin" : "Əvvəlcə fakultə seçin"}</option>
                {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kurs</label>
              <select name="course" value={form.course} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-600"
                required>
                <option value="">Kurs seçin</option>
                <option value="1">1-ci kurs</option>
                <option value="2">2-ci kurs</option>
                <option value="3">3-cü kurs</option>
                <option value="4">4-cü kurs</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
              <UserPlus size={18} />
              {loading ? "Gözləyin..." : "Qeydiyyatdan keç"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-gray-500">
          Artıq hesabın var?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Daxil ol</Link>
        </p>
      </div>
    </div>
  );
}
