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
  },
  logo: {
    width: 40, height: 40, borderRadius: 12, background: ACCENT,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 900, fontSize: 22, flexShrink: 0,
    boxShadow: "0 4px 14px rgba(30,144,255,0.40)",
  },
  badge: {
    display: "inline-block",
    background: "rgba(251,191,36,0.10)",
    border: "1px solid rgba(251,191,36,0.25)",
    borderRadius: 8, padding: "4px 12px",
    fontSize: 11, fontWeight: 700, color: "#fbbf24",
    letterSpacing: "0.08em", textTransform: "uppercase",
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 12,
  },
  h1: { fontSize: 28, fontWeight: 900, color: "#ffffff", margin: "0 0 8px" },
  date: { fontSize: 12, color: "#7d8ba3", fontFamily: "'JetBrains Mono', monospace" },
  section: { marginBottom: 36 },
  h2: {
    fontSize: 16, fontWeight: 800, color: "#ffffff",
    margin: "0 0 12px", display: "flex", alignItems: "center", gap: 10,
    paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  num: {
    width: 26, height: 26, borderRadius: 8,
    background: "rgba(251,191,36,0.12)",
    color: "#fbbf24", fontSize: 12, fontWeight: 800,
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
    border: "1px solid rgba(251,191,36,0.20)",
    borderRadius: 10, padding: "14px 16px",
    fontSize: 13, color: "#fbbf24", lineHeight: 1.7, margin: "12px 0",
  },
  box: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "20px 22px",
    margin: "16px 0",
  },
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

export default function Disclaimer() {
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
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: "0.06em", color: "#ffffff" }}>HASH</span>
          </Link>
        </div>

        <Link to="/register" style={s.back}>← Qeydiyyata qayıt</Link>

        <div style={s.badge}>Rəsmi Bəyanat</div>
        <h1 style={s.h1}>Məsuliyyətdən İmtina Bəyanatı</h1>
        <p style={s.date}>Son yenilənmə: May 2025</p>

        <div style={{ height: 32 }} />

        <div style={s.warn}>
          <strong>Mühüm xəbərdarlıq:</strong> Bu sənədi diqqətlə oxuyun. Platforma ilə bağlı hər hansı
          hüquqi suala cavab tapmaq üçün bu bəyanat əsas istinad sənədi sayılır.
        </div>

        <Section num="1" title="Universitetlə Sıfır Əlaqə Bəyanatı">
          <p style={s.p}>
            <strong>Hash</strong> — tam müstəqil, qeyri-kommersiya, tələbə tərəfindən yaradılmış
            rəqəmsal platformadır.
          </p>
          <div style={s.box}>
            <p style={{ ...s.p, margin: 0, fontWeight: 700, color: "#ffffff" }}>
              Bu platforma aşağıdakı qurumlarla heç bir münasibətdə deyil:
            </p>
            <ul style={{ paddingLeft: 18, margin: "10px 0 0", color: "#c4d0e0", fontSize: 14, lineHeight: 2.2 }}>
              <li>Milli Aviasiya Akademiyası (MAA) — rəsmi, struktur, hüquqi, maliyyə və ya inzibati baxımdan</li>
              <li>MAA administrasiyası, rəhbərliyi, tədris heyəti</li>
              <li>MAA-nın hər hansı rəsmi bölməsi, şöbəsi və ya tabeliyindəki qurum</li>
              <li>Hər hansı digər dövlət ali məktəbi və ya universitetin inzibatçılığı</li>
            </ul>
          </div>
          <div style={s.highlight}>
            Hash platformasının mövcudluğu, fəaliyyəti, məzmunu, qərarları və ya istifadəçi davranışları
            üçün <strong>heç bir universitetin heç bir məsuliyyəti yoxdur.</strong> Eyni şəkildə, heç bir
            universitetin bu platforma üzərində hüquqi nəzarəti, mülkiyyət hüququ və ya idarəetmə
            səlahiyyəti yoxdur.
          </div>
        </Section>

        <Section num="2" title="Email Doğrulamasının Hüquqi Statusu">
          <p style={s.p}>
            Platformada qeydiyyat zamanı universitetin korporativ email domeninin (@naa.edu.az və s.)
            istifadəsi <strong>yalnız texniki filtrasiya məqsədi daşıyır.</strong>
          </p>
          <p style={s.p}>
            Bu texniki proses:
          </p>
          <div style={s.box}>
            <ul style={{ paddingLeft: 18, margin: 0, color: "#c4d0e0", fontSize: 14, lineHeight: 2.2 }}>
              <li>Universitetin rəsmi İT infrastrukturuna <strong>hər hansı inteqrasiya deyil</strong></li>
              <li>Universitetin rəsmi tərəfindən <strong>icazə verilmiş əməliyyat deyil</strong></li>
              <li>Universitetin verilənlər bazasına <strong>heç bir giriş nəzərdə tutmur</strong></li>
              <li>Avtomatik email doğrulama sistemi — standart texnologiya tətbiqidir</li>
            </ul>
          </div>
          <div style={s.highlight}>
            Email filtrasiyası müstəqil icma məqsədi güdür: platformanın yalnız aktiv tələbə auditoriyasına
            xidmət etməsini texniki yolla təmin edir. Bu, hər hansı rəsmi əməkdaşlıq kimi qiymətləndirilə bilməz.
          </div>
        </Section>

        <Section num="3" title="Əqli Mülkiyyət Bəyanatı">
          <p style={s.p}>
            Platforma daxilində universitetlərə aid hər hansı rəsmi loqo, simvol, ad və ya rəng sxemi
            <strong> yalnız akademik identifikasiya məqsədi ilə</strong> və fair use (ədalətli istifadə)
            prinsipləri çərçivəsində istifadə edilir.
          </p>
          <p style={s.p}>
            Hash platforması:
          </p>
          <ul style={{ paddingLeft: 18, margin: "8px 0 12px", color: "#c4d0e0", fontSize: 14, lineHeight: 2 }}>
            <li>Heç bir universitetin əqli mülkiyyəti üzərində <strong>mülkiyyət iddiası irəli sürmür</strong></li>
            <li>Universitetin ticarət nişanlarını kommersiya məqsədi ilə <strong>istifadə etmir</strong></li>
            <li>Platforma öz brendini (HASH) <strong>müstəqil şəkildə idarə edir</strong></li>
          </ul>
          <div style={s.warn}>
            Hər hansı universitetin hüquq şöbəsi tərəfindən rəsmi sorğu daxil olduqda, platforma
            administrasiyası əqli mülkiyyətlə bağlı məsələləri dərhal aradan qaldırmağa hazırdır.
          </div>
        </Section>

        <Section num="4" title="Məzmun Müstəqilliyi">
          <p style={s.p}>
            Platformada dərc edilən bütün məzmun — postlar, şərhlər, məqalələr — münhasirən
            <strong> istifadəçilərin şəxsi ifadəsidir</strong> və heç bir universitetin rəsmi mövqeyini,
            siyasətini və ya tövsiyəsini əks etdirmir.
          </p>
          <p style={s.p}>
            Platforma administrasiyası istifadəçi məzmununun nəşrindən əvvəl senzura tətbiq etmir.
            Ancaq bu Şərtlərə zidd məzmun şikayət mexanizmi vasitəsilə götürülə bilər.
          </p>
        </Section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, marginTop: 8 }}>
          <p style={{ ...s.p, color: "#7d8ba3", fontSize: 12 }}>
            Bu bəyanat platformanın hüquqi statusunu aydınlaşdırmaq məqsədi ilə hazırlanmışdır.
            Hash — müstəqil, qeyri-kommersiya, açıq tələbə icma platformasıdır.
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <Link to="/privacy" style={{ color: ACCENT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Məxfilik Siyasəti →</Link>
            <Link to="/terms" style={{ color: ACCENT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>İstifadəçi Şərtləri →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
