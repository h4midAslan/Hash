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
    background: "rgba(30,144,255,0.12)",
    border: "1px solid rgba(30,144,255,0.25)",
    borderRadius: 8, padding: "4px 12px",
    fontSize: 11, fontWeight: 700, color: ACCENT,
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
  danger: {
    background: "rgba(248,113,113,0.07)",
    border: "1px solid rgba(248,113,113,0.20)",
    borderRadius: 10, padding: "12px 16px",
    fontSize: 13, color: "#f87171", lineHeight: 1.7, margin: "12px 0",
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

export default function Terms() {
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

        <div style={s.badge}>Hüquqi Sənəd</div>
        <h1 style={s.h1}>İstifadəçi Şərtləri və Davranış Qaydaları</h1>
        <p style={s.date}>Son yenilənmə: May 2025 · Bu sənəd platforma ilə istifadəçi arasında hüquqi öhdəlik yaradır</p>

        <div style={{ height: 32 }} />

        <Section num="1" title="Giriş Şərtləri — Tələbə Statusu">
          <p style={s.p}>
            Hash platformasına giriş hüququ yalnız aktiv tələbə statusuna malik, etibarlı və təsdiqedilmiş
            universitetin korporativ email ünvanına sahib olan şəxslərə məxsusdur.
          </p>
          <p style={s.p}>
            Qeydiyyat zamanı <strong>universitetin korporativ email ünvanı</strong> aktiv tələbəliyi
            müstəqil şəkildə təsdiqləmək üçün texniki filtr kimi tətbiq edilir. Universiteti tərk etmiş,
            xaric edilmiş və ya email-i deaktiv edilmiş şəxslərin platformada hesab saxlaması bu Şərtlərə
            zidd sayılır.
          </p>
          <div style={s.highlight}>
            Platforma istənilən vaxt texniki doğrulama aparmaq və uyğunsuz hesabları deaktiv etmək hüququnu
            özündə saxlayır.
          </div>
        </Section>

        <Section num="2" title="Akademik Dürüstlük — Fırıldaqçılıq Qadağası">
          <p style={s.p}>
            Platformadan aşağıdakı məqsədlər üçün istifadə <strong>qəti qadağandır:</strong>
          </p>
          <ul style={s.ul}>
            <li>İmtahan sualları və ya cavablarının paylaşılması</li>
            <li>Sistematik köçürməyə xidmət edən şəbəkələrin qurulması</li>
            <li>Akademik işlərin alqı-satqısı (kurslar, dissertasiyalar, layihələr)</li>
            <li>Plagiat məzmunun paylaşılması</li>
          </ul>
          <div style={s.danger}>
            <strong>Mühüm qeyd:</strong> Platforma istifadəçinin postları vasitəsilə aşkar edilən akademik
            dürüstsüzlüyə görə universiteti tərəfindən tənbeh edilməsi halında <strong>heç bir hüquqi
            məsuliyyət daşımır.</strong> İstifadəçi öz davranışının bütün nəticələrinə şəxsən cavabdehdir.
          </div>
        </Section>

        <Section num="3" title="Kiber-Zorakılıq və Böhtan Qadağası">
          <p style={s.p}>Platformada aşağıdakılar <strong>ciddi şəkildə qadağandır:</strong></p>
          <ul style={s.ul}>
            <li><strong>Nifrət nitqi</strong> — irq, din, cins, milliyyət əsasında ayrı-seçkilik</li>
            <li><strong>Kiber-zorakılıq (cyberbullying)</strong> — şəxsi hücumlar, təhdidlər, məqsədli incitmə</li>
            <li><strong>Doksing (doxing)</strong> — şəxsin razılığı olmadan şəxsi məlumatlarının yayılması</li>
            <li><strong>Böhtan</strong> — tələbə və ya müəllim haqqında yanlış, ləkələyici iddiaların yayılması</li>
            <li><strong>Seksual təcavüz məzmunu</strong> — istənilən formada</li>
            <li><strong>Hakimiyyəti çağırış</strong> — qanunpozmaya, şiddətə dəvət</li>
          </ul>
          <div style={s.warn}>
            Bu qaydaları pozan istifadəçilər barəsində hesab dayandırma, blok etmə və ya daimi silmə
            tədbirləri görülür. Ciddi hallarda müvafiq dövlət orqanlarına məlumat verilə bilər.
          </div>
        </Section>

        <Section num="4" title="Məzmun Məsuliyyətinin Məhdudlaşdırılması">
          <p style={s.p}>
            Hash platforması istifadəçilər arasında məlumat mübadiləsi üçün passiv texniki vasitədir.
            Platforma administrasiyası:
          </p>
          <ul style={s.ul}>
            <li>İstifadəçilərin ifadə etdiyi fikir və mövqelərə görə məsuliyyət daşımır</li>
            <li>Paylaşılan məlumatların doğruluğunu əvvəlcədən yoxlamır</li>
            <li>Üçüncü tərəflərin hüquqlarına münasibətdə birbaşa cavabdeh deyil</li>
          </ul>
          <div style={s.highlight}>
            Hər istifadəçi platformada paylaşdığı məzmunun hüquqi məsuliyyətini tam şəkildə özü daşıyır.
            Bu öhdəlik Azərbaycan Respublikasının mülki və cinayət qanunvericiliyi ilə tənzimlənir.
          </div>
        </Section>

        <Section num="5" title="Şikayət və Məzmunun Götürülməsi (Notice & Takedown)">
          <p style={s.p}>
            İstifadəçilər qanunsuz, zərərli və ya bu Şərtlərə zidd məzmunu platforma daxilindəki
            <strong> "Şikayət et"</strong> funksiyası vasitəsilə admin diqqətinə çatdıra bilər.
          </p>
          <p style={s.p}>
            Platforma administrasiyası şikayəti aldıqdan sonra <strong>ağlabatan müddət ərzində</strong>
            (ən geci 72 iş saatı) yoxlayır. Şikayət əsaslı hesab edildikdə məzmun gizlədilir və ya silinir.
          </p>
          <div style={s.highlight}>
            Bu mexanizm platformanın passiv vasitəçi statusunu qoruyaraq hüquqi məsuliyyətsizlik statusunu
            (safe harbor) saxlamaq üçün tətbiq edilir.
          </div>
        </Section>

        <Section num="6" title="Admin Tənbeh Hüququ">
          <p style={s.p}>
            Platforma administrasiyası bu Şərtləri pozan istənilən hesabı:
          </p>
          <ul style={s.ul}>
            <li>Əvvəlcədən xəbərdar etmədən müvəqqəti dayandırmaq</li>
            <li>Funksionallığını məhdudlaşdırmaq</li>
            <li>Daimi şəkildə silmək</li>
          </ul>
          <p style={s.p}>hüququna sahibdir. Bu tədbirlər üçün heç bir kompensasiya ödənilmir.</p>
          <div style={s.danger}>
            Hesabın silinməsi ilə bağlı şikayət hüququ yalnız Azərbaycan Respublikasının müvafiq
            məhkəmə instansiyaları vasitəsilə həyata keçirilə bilər.
          </div>
        </Section>

        <Section num="7" title="Şərtlərin Qəbulu">
          <p style={s.p}>
            Qeydiyyatdan keçməklə siz bu Şərtləri tam oxuduğunuzu, başa düşdüyünüzü və qəbul etdiyinizi
            hüquqi cəhətdən təsdiqləyirsiniz. Bu razılıq Azərbaycan Respublikasının müqavilə hüququ
            çərçivəsində bağlayıcı sayılır.
          </p>
        </Section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, marginTop: 8 }}>
          <p style={{ ...s.p, color: "#7d8ba3", fontSize: 12 }}>
            Hash platforması müstəqil, qeyri-kommersiya tələbə təşəbbüsüdür. Bu sənəd Azərbaycan
            Respublikasının mülki qanunvericiliyinə uyğun hazırlanmışdır.
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <Link to="/privacy" style={{ color: ACCENT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Məxfilik Siyasəti →</Link>
            <Link to="/disclaimer" style={{ color: ACCENT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Məsuliyyətdən İmtina →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
