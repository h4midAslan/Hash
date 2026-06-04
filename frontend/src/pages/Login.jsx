import { useState, useEffect } from "react";
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useFonts();

  useEffect(() => {
    document.body.style.background = "#050f1f";
    document.body.style.margin = "0";
    return () => { document.body.style.background = ""; };
  }, []);

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

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#050f1f",
      padding: "0 16px",
      fontFamily: "'Archivo', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300,
        background: "radial-gradient(ellipse at center, rgba(30,144,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link to="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: "#071428",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(30,144,255,0.45)",
            }}>
              <HashMark size={34} />
            </div>
            <span style={{
              fontWeight: 900, fontSize: 26, letterSpacing: "0.06em",
              color: "#ffffff", fontFamily: "'Archivo', sans-serif",
            }}>HASH</span>
          </Link>
          <p style={{
            fontSize: 13, color: "#7d8ba3", marginTop: 14,
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
            letterSpacing: "0.04em",
          }}>HESABINA DAXİL OL</p>
        </div>

        {/* Card */}
        <div style={{
          background: "#0a1c39",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          {error && (
            <div style={{
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13, color: "#f87171",
              marginBottom: 20,
              fontFamily: "'Archivo', sans-serif",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 600,
                color: "#7d8ba3", marginBottom: 7,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Email</label>
              <input
                type="email"
                placeholder="ad.soyad@uni.edu.az"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 11, fontSize: 14,
                  color: "#ffffff", background: "rgba(255,255,255,0.04)",
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "'Archivo', sans-serif",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(30,144,255,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; }}
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 600,
                color: "#7d8ba3", marginBottom: 7,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Şifrə</label>
              <input
                type="password"
                placeholder="Şifrənizi daxil edin"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 11, fontSize: 14,
                  color: "#ffffff", background: "rgba(255,255,255,0.04)",
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "'Archivo', sans-serif",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(30,144,255,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; }}
                required
              />
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
                letterSpacing: "0.02em",
                boxShadow: loading ? "none" : "0 6px 20px rgba(30,144,255,0.40)",
                transition: "opacity 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Gözləyin..." : "Daxil ol"}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: "center", marginTop: 20,
          fontSize: 13, color: "#7d8ba3",
          fontFamily: "'Archivo', sans-serif",
        }}>
          Hesabın yoxdur?{" "}
          <Link to="/register" style={{
            color: ACCENT, fontWeight: 700, textDecoration: "none",
            transition: "opacity 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Qeydiyyat
          </Link>
        </p>

      </div>
    </div>
  );
}
