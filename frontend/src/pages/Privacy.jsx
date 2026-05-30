import { useEffect } from "react";
import { Link } from "react-router-dom";

const ACCENT = "#1E90FF";

const s = {
  page: {
    minHeight: "100vh",
    background: "#050f1f",
    color: "#e6edf7",
    fontFamily: "'Archivo', sans-serif",
    padding: "0 16px 60px",
  },
  inner: { maxWidth: 720, margin: "0 auto" },
  header: {
    padding: "32px 0 24px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    marginBottom: 36,
    display: "flex", alignItems: "center", gap: 16,
  },
  logo: {
    width: 40, height: 40, borderRadius: 12, background: ACCENT,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 900, fontSize: 22, flexShrink: 0,
    boxShadow: "0 4px 14px rgba(30,144,255,0.40)",
  },
  logoText: { fontWeight: 900, fontSize: 20, letterSpacing: "0.06em", color: "#ffffff" },
  badge: {
    display: "inline-block",
    background: "rgba(30,144,255,0.12)",
    border: "1px solid rgba(30,144,255,0.25)",
    borderRadius: 8, padding: "4px 12px",
    fontSize: 11, fontWeight: 700, color: ACCENT,
    letterSpacing: "0.08em", textTransform: "uppercase",
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 12,
  },
  h1: { fontSize: 28, fontWeight: 900, color: "#ffffff", margin: "0 0 8px", letterSpacing: "0.01em" },
  date: { fontSize: 12, color: "#7d8ba3", fontFamily: "'JetBrains Mono', monospace" },
  section: { marginBottom: 36 },
  h2: {
    fontSize: 16, fontWeight: 800, color: "#ffffff",
    margin: "0 0 12px", display: "flex", alignItems: "center", gap: 10,
    paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  num: {
    width: 26, height: 26, borderRadius: 8,
    background: "rgba(30,144,255,0.15)",
    color: ACCENT, fontSize: 12, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
  },
  p: { fontSize: 14, lineHeight: 1.8, color: "#c4d0e0", margin: "0 0 10px" },
  highlight: {
    background: "rgba(30,144,255,0.08)",
    border: "1px solid rgba(30,144,255,0.18)",
    borderRadius: 10, padding: "14px 16px",
    fontSize: 13, color: "#93c5fd", lineHeight: 1.7, margin: "12px 0",
  },
  warn: {
    background: "rgba(251,191,36,0.07)",
    border: "1px solid rgba(251,191,36,0.18)",
    borderRadius: 10, padding: "12px 16px",
    fontSize: 13, color: "#fbbf24", lineHeight: 1.7, margin: "12px 0",
  },
  ul: { paddingLeft: 18, margin: "8px 0 12px", color: "#c4d0e0", fontSize: 14, lineHeight: 2 },
  back: {
    display: "inline-flex", alignItems: "center", gap: 8,
    color: "#7d8ba3", textDecoration: "none", fontSize: 13, fontWeight: 600,
    padding: "8px 0", marginBottom: 24,
  },
};

function Section({ num, title, children }) {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>
        <span style={s.num}>{num}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function Privacy() {
  useEffect(() => {
    document.body.style.background = "#050f1f";
    document.body.style.margin = "0";
    return () => { document.body.style.background = ""; };
  }, []);

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.header}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={s.logo}>#</div>
            <span style={s.logoText}>HASH</span>
          </Link>
        </div>

        <Link to="/register" style={s.back}>← Qeydiyyata qayıt</Link>

        <div style={s.badge}>Hüquqi Sənəd</div>
        <h1 style={s.h1}>Məxfilik Siyasəti</h1>
        <p style={s.date}>Son yenilənmə: May 2025 · Azərbaycan Respublikasının "Fərdi məlumatlar haqqında" Qanununa uyğun</p>

        <div style={{ height: 32 }} />

        <Section num="1" title="Məlumatların Toplayıcısı">
          <p style={s.p}>
            Hash platformasında fərdi məlumatlarınızı toplayan tərəf — platformanın müstəqil tələbə inzibatçılarıdır.
            Bu platforma heç bir dövlət qurumu, ticarət şirkəti və ya universitet administrasiyası ilə hüquqi bağlılığı olmayan
            fərdi bir tələbə təşəbbüsüdür.
          </p>
          <div style={s.highlight}>
            Məlumatların toplanmasının hüquqi əsası: <strong>İstifadəçinin açıq (eksplisit) razılığı.</strong> Siz qeydiyyatdan keçərkən
            bu Məxfilik Siyasətini qəbul etməklə məlumatlarınızın aşağıda təsvir olunan qaydada işlənməsinə razılıq verirsiniz.
          </div>
        </Section>

        <Section num="2" title="Toplanan Məlumatların Həcmi">
          <p style={s.p}>Platforma yalnız aşağıdakı məlumatları toplayır:</p>
          <ul style={s.ul}>
            <li><strong>Korporativ email ünvanı</strong> — aktiv tələbə statusunu texniki yolla təsdiqləmək üçün</li>
            <li><strong>Ad və soyad</strong> — profil yaratmaq üçün (istifadəçi tərəfindən daxil edilir)</li>
            <li><strong>Fakültə, ixtisas, kurs</strong> — icma xüsusiyyətləri üçün (könüllü)</li>
            <li><strong>Hesab yaradılma tarixi və vaxtı</strong> — texniki qeyd məqsədi ilə</li>
            <li><strong>Şifrələnmiş etimadnamə (credential)</strong> — autentifikasiya üçün</li>
            <li><strong>İstifadəçinin yaratdığı məzmun</strong> — postlar, şərhlər, mesajlar</li>
          </ul>
          <div style={s.warn}>
            Platforma heç vaxt şəxsiyyət vəsiqəsi nömrəsi, ödəniş məlumatı, telefon nömrəsi və ya coğrafi
            məkan məlumatı toplamır.
          </div>
        </Section>

        <Section num="3" title="Şifrə Təhlükəsizliyi və Kriptoqrafik Şifrələmə">
          <p style={s.p}>
            İstifadəçi şifrələri verilənlər bazasında <strong>heç vaxt açıq (plain-text) formada saxlanmır.</strong>
            Bütün şifrələr sənaye standartlarına uyğun kriptoqrafik hash funksiyası (bcrypt) ilə birtərəfli çevrilmə
            prosesinə məruz qalır.
          </p>
          <div style={s.highlight}>
            Bu o deməkdir ki: platforma inzibatçıları da daxil olmaqla <strong>heç kim</strong> sizin orijinal şifrənizi
            görə bilməz, bərpa edə bilməz. Şifrənizi unutsanız, yeni şifrə təyin etmək üçün email doğrulaması tələb olunur.
          </div>
        </Section>

        <Section num="4" title="Üçüncü Tərəflərlə Paylaşım Qadağası">
          <p style={s.p}>
            İstifadəçi məlumatları heç bir halda üçüncü tərəflərə — o cümlədən:
          </p>
          <ul style={s.ul}>
            <li>Ticarət şirkətlərinə və reklam platformalarına</li>
            <li>Universitet administrasiyasına</li>
            <li>Dövlət qurumlarına (məhkəmə qərarı və ya rəsmi icra sənədi olmadan)</li>
            <li>Tədqiqat təşkilatlarına</li>
          </ul>
          <p style={s.p}>— satılmaz, icarəyə verilməz, ötürülməz.</p>
          <div style={s.warn}>
            İstisna: Yalnız Azərbaycan Respublikası məhkəməsinin qanuni qərarı və ya rəsmi hüquq-mühafizə
            orqanının əmri olduqda qanunla müəyyən edilmiş məlumatlar təqdim edilə bilər.
          </div>
        </Section>

        <Section num="5" title="Unudulma Hüququ (Hesabın Silinməsi)">
          <p style={s.p}>
            Azərbaycan Respublikasının "Fərdi məlumatlar haqqında" Qanununun 12-ci maddəsinə əsasən,
            hər istifadəçi öz məlumatlarının silinməsini tələb etmək hüququna malikdir.
          </p>
          <p style={s.p}>
            Hesab silmə tələbi göndərildikdən sonra:
          </p>
          <ul style={s.ul}>
            <li>Bütün şəxsi identifikatorlar (ad, email, profil şəkli)</li>
            <li>İstifadəçinin yaratdığı bütün postlar və şərhlər</li>
            <li>Bütün mesajlaşma qeydləri</li>
            <li>Əlaqə və bildiriş tarixçəsi</li>
          </ul>
          <p style={s.p}>— aktiv verilənlər bazası cədvəllərindən <strong>daimi və geri dönüşsüz şəkildə</strong> silinir.</p>
          <div style={s.highlight}>
            Hesab silmə tələbini <strong>Parametrlər → Hesabı Sil</strong> bölməsindən göndərə bilərsiniz.
          </div>
        </Section>

        <Section num="6" title="Əlaqə">
          <p style={s.p}>
            Bu Məxfilik Siyasəti ilə bağlı suallarınız üçün platforma inzibatçıları ilə
            platformanın rəsmi kanalları vasitəsilə əlaqə saxlaya bilərsiniz.
          </p>
        </Section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, marginTop: 8 }}>
          <p style={{ ...s.p, color: "#7d8ba3", fontSize: 12 }}>
            Bu sənəd Azərbaycan Respublikasının "Fərdi məlumatlar haqqında" 11 may 2010-cu il tarixli
            Qanununa (№ 998-IIIQ) uyğun hazırlanmışdır. Hash platforması müstəqil, qeyri-kommersiya tələbə
            təşəbbüsüdür.
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <Link to="/terms" style={{ color: ACCENT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>İstifadəçi Şərtləri →</Link>
            <Link to="/disclaimer" style={{ color: ACCENT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Məsuliyyətdən İmtina →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
