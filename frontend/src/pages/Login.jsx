import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/feed");
    } catch (err) {
      setError(err.response?.data?.detail || "Giriş uğursuz oldu");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "8px 10px", border: "1px solid #ccc",
    fontSize: 13, color: "#1a1a1a", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f2f2", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link to="/" style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", textDecoration: "none" }}>Hash</Link>
          <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Hesabına daxil ol</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #d4d4d4", padding: "24px 24px", boxSizing: "border-box" }}>
          {error && (
            <div style={{ background: "#fff0f0", color: "#c0392b", border: "1px solid #f5c6cb", padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 4 }}>Email</label>
              <input type="email" placeholder="ad.soyad@naa.edu.az" value={email} onChange={e => setEmail(e.target.value)}
                style={inp} onFocus={e => e.target.style.borderColor = "#1a4a8a"} onBlur={e => e.target.style.borderColor = "#ccc"} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 4 }}>Şifrə</label>
              <input type="password" placeholder="Şifrənizi daxil edin" value={password} onChange={e => setPassword(e.target.value)}
                style={inp} onFocus={e => e.target.style.borderColor = "#1a4a8a"} onBlur={e => e.target.style.borderColor = "#ccc"} required />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a", padding: "9px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Gözləyin..." : "Daxil ol"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#666" }}>
          Hesabın yoxdur?{" "}
          <Link to="/register" style={{ color: "#1a4a8a", fontWeight: 600, textDecoration: "none" }}>Qeydiyyat</Link>
        </p>
      </div>
    </div>
  );
}
