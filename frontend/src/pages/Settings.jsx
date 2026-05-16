import { useState } from "react";
import { Settings as SettingsIcon, Check, Moon, Sun, Image as ImageIcon, Globe, Lock, Eye, EyeOff } from "lucide-react";
import { useLang, setLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import api from "../api/client";
import { toast } from "../components/Toast";

const BG_OPTIONS = [
  { id: "default", labelKey: "bg_default", previewColor: "#f9f9f9" },
  { id: "navy", labelKey: "bg_navy", previewColor: "#0f172a" },
  { id: "vectors", labelKey: "bg_vectors", previewColor: "#1a1a2e", local: true },
];

const LANG_OPTIONS = [
  { id: "az", flag: "🇦🇿", labelKey: "settings_lang_az" },
  { id: "en", flag: "🇬🇧", labelKey: "settings_lang_en" },
];

const sectionCard = {
  background: "#ffffff",
  border: "1px solid #d4d4d4",
  padding: "16px 18px",
  marginBottom: 12,
};

const sectionLabel = {
  fontSize: 14,
  fontWeight: 700,
  color: "#222",
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const baseInput = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  fontSize: 14,
  color: "#1a1a1a",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  borderRadius: 2,
};

export default function Settings() {
  const [selected, setSelected] = useState(localStorage.getItem("bg_theme") || "default");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("dark_mode") === "true");
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const { lang, t } = useLang();
  const isMobile = useIsMobile();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Yeni şifrələr uyğun gəlmir");
      return;
    }
    if (pwForm.newPw.length < 6) {
      toast.error("Şifrə ən az 6 simvol olmalıdır");
      return;
    }
    setPwLoading(true);
    try {
      await api.put("/users/me/password", {
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      });
      toast.success("Şifrə uğurla dəyişdirildi");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
    setPwLoading(false);
  };

  const handleSelect = (id) => {
    setSelected(id);
    localStorage.setItem("bg_theme", id);
    window.dispatchEvent(new Event("bg_theme_change"));
  };

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem("dark_mode", String(newVal));
    window.dispatchEvent(new Event("dark_mode_change"));
  };

  const inputStyle = (id) => ({
    ...baseInput,
    borderColor: focusedInput === id ? "#1a4a8a" : "#ccc",
  });

  const submitDisabled = pwLoading || !pwForm.current || !pwForm.newPw || !pwForm.confirm;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "12px 10px" : "32px 16px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ background: "#1a4a8a", padding: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SettingsIcon size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{t("settings_title")}</h1>
          <p style={{ fontSize: 13, color: "#999", margin: 0, marginTop: 2 }}>{t("settings_subtitle")}</p>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div style={sectionCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {darkMode ? <Moon size={18} color="#666" /> : <Sun size={18} color="#666" />}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{t("settings_dark_mode")}</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{t("settings_dark_desc")}</div>
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
              style={{ width: 16, height: 16, accentColor: "#1a4a8a", cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: "#666" }}>{darkMode ? t("settings_on") || "On" : t("settings_off") || "Off"}</span>
          </label>
        </div>
      </div>

      {/* Password Change */}
      <div style={sectionCard}>
        <div style={sectionLabel}>
          <Lock size={15} color="#444" />
          <span>Şifrəni dəyişdir</span>
        </div>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <input
              type={showCurrent ? "text" : "password"}
              placeholder="Cari şifrə"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              onFocus={() => setFocusedInput("current")}
              onBlur={() => setFocusedInput(null)}
              style={{ ...inputStyle("current"), paddingRight: 38 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(v => !v)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999", padding: 0, display: "flex", alignItems: "center" }}
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type={showNew ? "text" : "password"}
              placeholder="Yeni şifrə (min. 6 simvol)"
              value={pwForm.newPw}
              onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              onFocus={() => setFocusedInput("newPw")}
              onBlur={() => setFocusedInput(null)}
              style={{ ...inputStyle("newPw"), paddingRight: 38 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999", padding: 0, display: "flex", alignItems: "center" }}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <input
            type="password"
            placeholder="Yeni şifrəni təkrarla"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            onFocus={() => setFocusedInput("confirm")}
            onBlur={() => setFocusedInput(null)}
            style={inputStyle("confirm")}
            required
          />
          {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
            <p style={{ fontSize: 12, color: "#c0392b", margin: 0 }}>Şifrələr uyğun gəlmir</p>
          )}
          <button
            type="submit"
            disabled={submitDisabled}
            style={{
              background: submitDisabled ? "#a0b4d0" : "#1a4a8a",
              color: "#fff",
              border: "none",
              padding: "10px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: submitDisabled ? "not-allowed" : "pointer",
              width: "100%",
              borderRadius: 2,
              marginTop: 2,
            }}
          >
            {pwLoading ? "Dəyişdirilir..." : "Şifrəni dəyişdir"}
          </button>
        </form>
      </div>

      {/* Language Selector */}
      <div style={sectionCard}>
        <div style={sectionLabel}>
          <Globe size={15} color="#444" />
          <span>{t("settings_lang")}</span>
        </div>
        <p style={{ fontSize: 12, color: "#999", margin: 0, marginBottom: 12 }}>{t("settings_lang_desc")}</p>
        <div style={{ display: "flex", gap: 10 }}>
          {LANG_OPTIONS.map((opt) => {
            const isActive = lang === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setLang(opt.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 0",
                  border: isActive ? "2px solid #1a4a8a" : "1px solid #d4d4d4",
                  background: isActive ? "#eef3fb" : "#fff",
                  color: isActive ? "#1a4a8a" : "#555",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  borderRadius: 2,
                }}
              >
                <span style={{ fontSize: 16 }}>{opt.flag}</span>
                <span>{t(opt.labelKey)}</span>
                {isActive && <Check size={13} color="#1a4a8a" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Background Selector */}
      <div style={{ ...sectionCard, marginBottom: 0 }}>
        <div style={sectionLabel}>
          <ImageIcon size={15} color="#444" />
          <span>{t("settings_bg")}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
          {BG_OPTIONS.map((opt) => {
            const isActive = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                style={{
                  border: isActive ? "2px solid #1a4a8a" : "1px solid #d4d4d4",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  borderRadius: 2,
                  overflow: "hidden",
                  outline: "none",
                }}
              >
                <div
                  style={{
                    height: 64,
                    background: opt.previewColor,
                    position: "relative",
                    ...(opt.local
                      ? {
                          backgroundImage: "url('/bg-vectors.png')",
                          backgroundSize: "300px",
                          backgroundRepeat: "repeat",
                        }
                      : {}),
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 20,
                        height: 20,
                        background: "#1a4a8a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={12} color="#fff" />
                    </div>
                  )}
                </div>
                <div style={{ background: "#fff", padding: "6px 8px", borderTop: "1px solid #e5e5e5" }}>
                  <span style={{ fontSize: 12, color: "#444", fontWeight: 500 }}>{t(opt.labelKey)}</span>
                </div>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: "#999", marginTop: 12, textAlign: "center" }}>{t("settings_bg_note")}</p>
      </div>
    </div>
  );
}
