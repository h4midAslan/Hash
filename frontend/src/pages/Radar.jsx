/*
 * Hash · Radar — Azərbaycandakı aktiv fürsətlər
 * Pixel-perfect implementation of the Claude Design handoff.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import api from "../api/client";
import { useDarkMode } from "../hooks/useTheme";

// ─── Inline SVG Icons ──────────────────────────────────────────────────────────
const Ic = ({ size = 18, sw = 2, children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...style }}>{children}</svg>
);
const ISearch   = (p) => <Ic {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Ic>;
const IPin      = (p) => <Ic {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Ic>;
const IClock    = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></Ic>;
const IX        = (p) => <Ic {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Ic>;
const IArrow    = (p) => <Ic {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></Ic>;
const ILink     = (p) => <Ic {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></Ic>;
const ICheck    = (p) => <Ic {...p}><polyline points="20 6 9 17 4 12" /></Ic>;
const IChevron  = (p) => <Ic {...p}><polyline points="6 9 12 15 18 9" /></Ic>;
const ICompass  = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><polygon points="15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5 15.5 8.5" /></Ic>;
const ITrophy   = (p) => <Ic {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3" /><path d="M17 6h3v1a3 3 0 0 1-3 3" /><line x1="12" y1="13" x2="12" y2="17" /><path d="M8.5 20h7" /><path d="M10 17h4l1 3H9l1-3Z" /></Ic>;
const ILayers   = (p) => <Ic {...p}><polygon points="12 3 21 8 12 13 3 8 12 3" /><polyline points="3 13 12 18 21 13" /></Ic>;

// ─── Theme ────────────────────────────────────────────────────────────────────
const ACCENT = "#1E90FF";

function mkTheme(dark) {
  return dark ? {
    dark: true, accent: ACCENT,
    accentSoft: "rgba(30,144,255,0.12)", accentText: ACCENT,
    bgGrad: "radial-gradient(1200px 620px at 80% -10%, rgba(30,144,255,0.10), transparent 60%), #060f1e",
    card: "#0a1c39", control: "#0a1c39", controlBorder: "#1a2b49",
    border: "#1a2b49", borderSoft: "rgba(255,255,255,0.06)",
    text: "#ffffff", textMuted: "#94a3b8", textFaint: "#5b6b85",
    chipBg: "rgba(148,163,184,0.10)", chipText: "#94a3b8",
    skel1: "#0a1c39", skel2: "#142a4d",
    shadow: "0 8px 32px rgba(0,0,0,0.45)",
    shadowHover: "0 18px 48px rgba(0,0,0,0.55)",
    headerBg: "rgba(6,15,30,0.88)",
    overlay: "rgba(2,6,16,0.66)",
  } : {
    dark: false, accent: ACCENT,
    accentSoft: "rgba(30,144,255,0.10)", accentText: "#1668c4",
    bgGrad: "radial-gradient(1100px 560px at 82% -12%, rgba(30,144,255,0.10), transparent 60%), #f1f5f9",
    card: "#ffffff", control: "#ffffff", controlBorder: "#e4e9f1",
    border: "#e4e9f1", borderSoft: "#eef2f7",
    text: "#071428", textMuted: "#64748b", textFaint: "#94a3b8",
    chipBg: "#f1f5f9", chipText: "#475569",
    skel1: "#e9eef5", skel2: "#f4f7fb",
    shadow: "0 1px 2px rgba(7,20,40,0.04), 0 10px 30px rgba(7,20,40,0.08)",
    shadowHover: "0 1px 2px rgba(7,20,40,0.06), 0 22px 48px rgba(7,20,40,0.14)",
    headerBg: "rgba(241,245,249,0.88)",
    overlay: "rgba(7,20,40,0.42)",
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATS = {
  hackathon: { label: "HACKATHON", dot: "#1E90FF" },
  staj:      { label: "STAJ",      dot: "#8b5cf6" },
  teqaud:    { label: "TƏQAÜD",    dot: "#22c55e" },
  tedbir:    { label: "TƏDBİR",    dot: "#f59e0b" },
  proqram:   { label: "PROQRAM",   dot: "#06b6d4" },
};
const TABS = [
  { key: null,        label: "Hamısı" },
  { key: "hackathon", label: "Hackathon" },
  { key: "staj",      label: "Staj" },
  { key: "teqaud",    label: "Təqaüd" },
  { key: "tedbir",    label: "Tədbir" },
  { key: "proqram",   label: "Proqram" },
];
const AZ_MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avqust","sentyabr","oktyabr","noyabr","dekabr"];
const DAY = 86400000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysLeft(deadline, now) {
  if (!deadline) return null;
  const d = new Date(String(deadline).slice(0,10) + "T23:59:59");
  return Math.ceil((d.getTime() - now) / DAY);
}
function deadlineInfo(deadline, now) {
  if (!deadline) return { label: "Davamlı", tone: "muted", days: Infinity };
  const days = daysLeft(deadline, now);
  if (days < 0)   return { label: "Bitib",   tone: "expired", days };
  if (days === 0) return { label: "Bu gün",  tone: "danger",  days };
  if (days < 7)   return { label: days + " gün", tone: "danger", days };
  if (days <= 14) return { label: days + " gün", tone: "warn",   days };
  return              { label: days + " gün", tone: "muted",  days };
}
function toneColor(tone, t) {
  if (tone === "danger")  return "#ef4444";
  if (tone === "warn")    return "#f59e0b";
  if (tone === "expired") return t.textFaint;
  return t.textMuted;
}
function fmtDate(deadline) {
  if (!deadline) return "Davamlı";
  const d = new Date(String(deadline).slice(0,10) + "T00:00:00");
  return d.getDate() + " " + AZ_MONTHS[d.getMonth()];
}
function prizeVal(prize) {
  if (!prize) return -1;
  const n = parseInt(String(prize).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? -1 : n;
}
function monogram(name) {
  const w = name.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/);
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + w[1][0]).toUpperCase();
}
function normTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch (_) {}
  return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
}

// ─── Fallback data (shown while API is being scraped) ─────────────────────────
const FALLBACK = [
  { id:1, title:"Openwave Hackathon 2026", organizer:"Bakı Şəhər İcra Hakimiyyəti", category:"hackathon", deadline:"2026-06-29", location:"Bakı", prize:"10 000 AZN", description:"Şəhərin rəqəmsal problemlərinə 48 saat ərzində həll yaradan komandalar üçün milli miqyaslı hakaton. Qaliblər birbaşa pilot layihə imkanı qazanır.", tags:["Komanda","Açıq data","Smart City","Web","AI"], url:"https://openwave.az", is_featured:true, is_new:true, difficulty:"Orta" },
  { id:2, title:"AZAL Yay Staj Proqramı", organizer:"Azerbaijan Airlines", category:"staj", deadline:"2026-07-01", location:"Bakı", prize:null, description:"Aviasiya sənayesində IT, data analitikası və əməliyyat istiqamətləri üzrə 8 həftəlik ödənişli staj. Mentor dəstəyi və real layihələrdə iştirak.", tags:["Ödənişli","Data","Backend","Mentor"], url:"https://azal.az", is_featured:false, is_new:true, difficulty:"Başlanğıc" },
  { id:3, title:"Kapital Bank Tech Internship", organizer:"Kapital Bank", category:"staj", deadline:"2026-06-20", location:"Bakı", prize:null, description:"Bankın texnologiya komandasında mobil və veb tətbiqlərin hazırlanmasına qoşul. Frontend, backend və QA istiqamətləri üzrə yerlər mövcuddur.", tags:["Fintech","React","Java","QA"], url:"https://kapitalbank.az", is_featured:false, is_new:false, difficulty:"Orta" },
  { id:4, title:"MOST Biznes İnkubatoru — Kohort 8", organizer:"MOST Technology Park", category:"proqram", deadline:"2026-07-15", location:"Bakı", prize:null, description:"Erkən mərhələ startaplar üçün 12 həftəlik inkubasiya proqramı. İnvestor şəbəkəsi, ofis məkanı və sahə üzrə mentorlarla birbaşa iş.", tags:["Startup","İnkubator","Pitch","Network"], url:"https://most.az", is_featured:true, is_new:false, difficulty:"İrəli" },
  { id:5, title:"Rəqəmsal Gənclər Dövlət Proqramı", organizer:"Rəqəmsal İnkişaf Nazirliyi", category:"proqram", deadline:"2026-08-01", location:"Bakı / Onlayn", prize:null, description:"Tələbələr üçün pulsuz rəqəmsal bacarıqlar proqramı: data, kibertəhlükəsizlik və süni intellekt modulları. Sertifikat və iş yerləşdirmə dəstəyi.", tags:["Pulsuz","Sertifikat","AI","Kiber"], url:"https://mincom.gov.az", is_featured:false, is_new:false, difficulty:"Başlanğıc" },
  { id:6, title:"ABB Innovation Challenge", organizer:"ABB Azerbaijan", category:"hackathon", deadline:"2026-07-10", location:"Bakı", prize:"3 000 AZN", description:"Bank məhsullarını yenidən düşünən innovativ həllər müsabiqəsi. UX, məlumat analitikası və avtomatlaşdırma trekləri üzrə komandalar yarışır.", tags:["Fintech","UX","Komanda","Prototip"], url:"https://abb-bank.az", is_featured:false, is_new:true, difficulty:"Orta" },
  { id:7, title:"PAŞA Holding Yay Stajı", organizer:"PAŞA Holding", category:"staj", deadline:"2026-06-25", location:"Bakı", prize:null, description:"Holdinqin müxtəlif biznes bölmələrində strategiya, maliyyə və texnologiya istiqamətləri üzrə struktur staj. Rotasiya formatı.", tags:["Strategiya","Maliyyə","Rotasiya"], url:"https://pasha-holding.az", is_featured:false, is_new:false, difficulty:"Orta" },
  { id:8, title:"Azercell DigiCamp 2026", organizer:"Azercell Telekom", category:"proqram", deadline:"2026-07-20", location:"Bakı", prize:null, description:"Telekom və mobil texnologiyalar üzrə intensiv yay düşərgəsi. 5G, IoT və məhsul idarəçiliyi mövzularında praktiki emalatxanalar.", tags:["Telekom","5G","IoT","Product"], url:"https://azercell.com", is_featured:false, is_new:false, difficulty:"Orta" },
  { id:9, title:"ADA University Research Grant", organizer:"ADA Universiteti", category:"teqaud", deadline:"2026-09-01", location:"Bakı", prize:"2 400 AZN/il", description:"Bakalavr və magistr tələbələri üçün tədqiqat qrantı. Elmi rəhbər təyinatı, laboratoriya çıxışı və konfrans iştirakı üçün maliyyə dəstəyi.", tags:["Tədqiqat","Qrant","Elm","Magistr"], url:"https://ada.edu.az", is_featured:false, is_new:false, difficulty:"İrəli" },
  { id:10, title:"TEKNOFEST Azərbaycan — Yerli Seçim", organizer:"TEKNOFEST Azərbaycan", category:"hackathon", deadline:"2026-08-15", location:"Bakı", prize:null, description:"Aerokosmik və texnologiya festivalının yerli seçim mərhələsi. Pilotsuz uçuş aparatları, robototexnika və proqramlaşdırma kateqoriyaları.", tags:["Robototexnika","Drone","AI","Komanda","STEM"], url:"https://teknofest.az", is_featured:true, is_new:false, difficulty:"İrəli" },
  { id:11, title:"Startup Baku Accelerator — Məzunlar Proqramı", organizer:"Startup Baku", category:"proqram", deadline:"2026-07-31", location:"Bakı", prize:null, description:"Məzun mərhələsindəki komandalar üçün sürətləndirici proqram. İnvestisiya hazırlığı, hüquqi dəstək və beynəlxalq bazara çıxış.", tags:["Akselerator","İnvestisiya","Scale","Hüquq"], url:"https://startupbaku.az", is_featured:false, is_new:true, difficulty:"İrəli" },
  { id:12, title:"SOCAR Digital Internship Program", organizer:"SOCAR", category:"staj", deadline:"2026-06-30", location:"Bakı", prize:null, description:"Enerji sənayesinin rəqəmsal transformasiyası üzrə staj. Data mühəndisliyi, bulud infrastrukturu və proses avtomatlaşdırması istiqamətləri.", tags:["Enerji","Cloud","Data","DevOps"], url:"https://socar.az", is_featured:false, is_new:false, difficulty:"Orta" },
];

// ─── Small sub-components ─────────────────────────────────────────────────────
function OrgLogo({ org, category, size = 38, t }) {
  const dot = CATS[category]?.dot || ACCENT;
  return (
    <div style={{ width:size, height:size, borderRadius:9, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: t.dark ? "rgba(255,255,255,0.04)" : "#f6f8fc", border:"1px solid "+t.border, color:dot, fontWeight:800, fontSize:size*0.36, fontFamily:"'Archivo',sans-serif", letterSpacing:"-0.01em" }}>
      {monogram(org)}
    </div>
  );
}

function CatLabel({ category, t }) {
  const c = CATS[category];
  if (!c) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:10.5, fontWeight:700, letterSpacing:"0.13em", color:t.textMuted, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot }} />
      {c.label}
    </span>
  );
}

function NewBadge() {
  return <span style={{ fontSize:9.5, fontWeight:800, letterSpacing:"0.16em", color:ACCENT, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>YENİ</span>;
}

function DeadlineChip({ deadline, now, t }) {
  const info = deadlineInfo(deadline, now);
  const col = toneColor(info.tone, t);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight: info.tone==="danger" ? 800 : 600, color:col, textDecoration: info.tone==="expired" ? "line-through" : "none", fontFamily:"'JetBrains Mono',monospace" }}>
      <IClock size={13} sw={2.2} />
      {info.label}
    </span>
  );
}

function MetaItem({ icon, children, t }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:t.textMuted, fontFamily:"'JetBrains Mono',monospace" }}>
      {icon}{children}
    </span>
  );
}

function Tag({ children, t }) {
  return <span style={{ fontSize:11, fontWeight:600, color:t.chipText, background:t.chipBg, padding:"3px 9px", borderRadius:6, whiteSpace:"nowrap" }}>{children}</span>;
}

function PrizePill({ prize, t }) {
  return (
    <span style={{ fontSize:12, fontWeight:700, color:t.textMuted, fontFamily:"'JetBrains Mono',monospace", display:"inline-flex", alignItems:"center", gap:5 }}>
      <ITrophy size={13} sw={2} style={{ color:t.textFaint }} />{prize}
    </span>
  );
}

function StyledSelect({ value, onChange, options, t, label }) {
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <select aria-label={label} value={value} onChange={(e)=>onChange(e.target.value)} style={{ appearance:"none", WebkitAppearance:"none", background:t.control, color:t.text, border:"1px solid "+t.controlBorder, borderRadius:10, padding:"0 36px 0 13px", height:42, fontSize:13.5, fontWeight:600, cursor:"pointer", minWidth:142, fontFamily:"'Archivo',sans-serif" }}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:t.textMuted, pointerEvents:"none", display:"flex" }}><IChevron size={16} sw={2.2} /></span>
    </div>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────
function Card({ item, now, t, onOpen, index }) {
  const [hov, setHov] = useState(false);
  const tags = normTags(item.tags);
  const info = deadlineInfo(item.deadline, now);
  return (
    <article onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onOpen(item)}
      style={{ background:t.card, border:"1px solid "+(hov?t.accent:t.border), borderRadius:16, padding:"18px 18px 16px", display:"flex", flexDirection:"column", gap:13, cursor:"pointer", position:"relative", transform:hov?"translateY(-2px)":"translateY(0)", boxShadow:hov?t.shadowHover:t.shadow, transition:"transform .18s ease, box-shadow .18s ease, border-color .18s ease", opacity:info.tone==="expired"?0.62:1, animation:"radarCardIn .4s ease both", animationDelay:(index*0.03)+"s" }}>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <OrgLogo org={item.organizer} category={item.category} t={t} />
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:700, color:t.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.organizer}</span>
            {(item.is_new) && <NewBadge />}
          </div>
          <div style={{ marginTop:4 }}><CatLabel category={item.category} t={t} /></div>
        </div>
      </div>
      <div>
        <h3 style={{ margin:0, fontSize:16.5, fontWeight:800, lineHeight:1.25, color:t.text, letterSpacing:"-0.01em", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.title}</h3>
        <p style={{ margin:"7px 0 0", fontSize:13, lineHeight:1.5, color:t.textMuted, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.description}</p>
      </div>
      <div style={{ height:1, background:t.borderSoft }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
        <MetaItem t={t} icon={<IPin size={13} sw={2.2} />}>{item.location}</MetaItem>
        <DeadlineChip deadline={item.deadline} now={now} t={t} />
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", minWidth:0 }}>
          {tags.slice(0,3).map((tg)=><Tag key={tg} t={t}>{tg}</Tag>)}
        </div>
        {item.prize && <PrizePill prize={item.prize} t={t} />}
      </div>
      <button onClick={(e)=>{e.stopPropagation();onOpen(item);}} style={{ marginTop:2, width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid "+(hov?t.accent:t.border), background:hov?t.accentSoft:"transparent", color:hov?t.accent:t.text, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all .18s ease", fontFamily:"'Archivo',sans-serif" }}>
        Ətraflı <IArrow size={15} sw={2.4} />
      </button>
    </article>
  );
}

function FeaturedCard({ item, now, t, onOpen }) {
  const [hov, setHov] = useState(false);
  const tags = normTags(item.tags);
  return (
    <article onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onOpen(item)}
      style={{ flexShrink:0, width:360, scrollSnapAlign:"start", background:t.card, border:"1px solid "+(hov?t.accent:t.border), borderLeft:"3px solid "+t.accent, borderRadius:16, padding:"18px 20px", display:"flex", flexDirection:"column", gap:12, cursor:"pointer", transform:hov?"translateY(-2px)":"translateY(0)", boxShadow:hov?t.shadowHover:t.shadow, transition:"transform .18s ease, box-shadow .18s ease, border-color .18s ease" }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:11, alignItems:"center", minWidth:0 }}>
          <OrgLogo org={item.organizer} category={item.category} t={t} size={40} />
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:t.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.organizer}</div>
            <div style={{ marginTop:3 }}><CatLabel category={item.category} t={t} /></div>
          </div>
        </div>
        {item.prize && <PrizePill prize={item.prize} t={t} />}
      </div>
      <h3 style={{ margin:0, fontSize:19, fontWeight:800, lineHeight:1.2, color:t.text, letterSpacing:"-0.015em", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.title}</h3>
      <p style={{ margin:0, fontSize:13, lineHeight:1.5, color:t.textMuted, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.description}</p>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:"auto", paddingTop:4 }}>
        <MetaItem t={t} icon={<IPin size={13} sw={2.2} />}>{item.location}</MetaItem>
        <DeadlineChip deadline={item.deadline} now={now} t={t} />
      </div>
    </article>
  );
}

function SkeletonCard({ t }) {
  const sh = { background:`linear-gradient(90deg, ${t.skel1} 0%, ${t.skel2} 50%, ${t.skel1} 100%)`, backgroundSize:"480px 100%", animation:"radarShimmer 1.4s infinite linear", borderRadius:6 };
  const B = ({ w, h=12, mt=0 }) => <div style={{ ...sh, width:w, height:h, marginTop:mt }} />;
  return (
    <div style={{ background:t.card, border:"1px solid "+t.border, borderRadius:16, padding:18, display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <div style={{ ...sh, width:38, height:38, borderRadius:9 }} />
        <div style={{ flex:1 }}><B w="55%" h={11} /><B w="38%" h={9} mt={7} /></div>
      </div>
      <div><B w="90%" h={15} /><B w="70%" h={15} mt={8} /></div>
      <B w="100%" h={1} />
      <div style={{ display:"flex", justifyContent:"space-between" }}><B w="30%" h={11} /><B w="22%" h={11} /></div>
      <B w="100%" h={38} />
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function Modal({ item, now, t, onClose }) {
  const [copied, setCopied] = useState(false);
  const vw = window.innerWidth;
  const isMob = vw < 680;
  const tags = normTags(item.tags);
  const info = deadlineInfo(item.deadline, now);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, []);

  const copy = () => {
    navigator.clipboard?.writeText(item.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:200, background:t.overlay, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", display:"flex", alignItems:isMob?"flex-end":"center", justifyContent:"center", padding:isMob?0:24, animation:"radarOverlay .2s ease" }}>
      <div onClick={(e)=>e.stopPropagation()} style={{ background:t.card, color:t.text, width:"100%", maxWidth:600, maxHeight:isMob?"92vh":"88vh", overflowY:"auto", borderRadius:isMob?"20px 20px 0 0":20, border:t.dark?"1px solid "+t.border:"none", padding:28, position:"relative", boxShadow:"0 24px 64px rgba(0,0,0,0.4)", animation:(isMob?"radarModalMob":"radarModalDesk")+" .28s cubic-bezier(.2,.7,.3,1)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:18, right:18, width:34, height:34, borderRadius:9, border:"1px solid "+t.border, background:"transparent", color:t.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <IX size={17} sw={2.2} />
        </button>
        <div style={{ display:"flex", gap:13, alignItems:"center", paddingRight:40 }}>
          <OrgLogo org={item.organizer} category={item.category} t={t} size={46} />
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:t.text }}>{item.organizer}</div>
            <div style={{ marginTop:4 }}><CatLabel category={item.category} t={t} /></div>
          </div>
        </div>
        <h2 style={{ margin:"20px 0 0", fontSize:24, fontWeight:900, lineHeight:1.18, color:t.text, letterSpacing:"-0.02em" }}>{item.title}</h2>
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:"8px 16px", marginTop:14, paddingBottom:18, borderBottom:"1px solid "+t.borderSoft }}>
          <MetaItem t={t} icon={<IPin size={14} sw={2.2} />}>{item.location}</MetaItem>
          <span style={{ color:t.textFaint }}>·</span>
          <MetaItem t={t} icon={<IClock size={14} sw={2.2} />}>
            {fmtDate(item.deadline)}{info.days !== Infinity && info.tone !== "expired" ? " ("+info.label+")" : ""}
          </MetaItem>
          {item.difficulty && <>
            <span style={{ color:t.textFaint }}>·</span>
            <MetaItem t={t} icon={<ILayers size={14} sw={2} />}>{item.difficulty}</MetaItem>
          </>}
        </div>
        <p style={{ margin:"18px 0 0", fontSize:15, lineHeight:1.65, color:t.dark?"#cdd6e4":"#33415c" }}>{item.description}</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:18 }}>
          {tags.map((tg)=><Tag key={tg} t={t}>{tg}</Tag>)}
        </div>
        {item.prize && (
          <div style={{ marginTop:20, padding:"16px 18px", borderRadius:12, background:t.accentSoft, borderLeft:"3px solid "+t.accent }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:t.accentText, fontFamily:"'JetBrains Mono',monospace" }}>Mükafat fondu</div>
            <div style={{ fontSize:26, fontWeight:900, color:t.text, marginTop:4, letterSpacing:"-0.02em" }}>{item.prize}</div>
          </div>
        )}
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ marginTop:22, width:"100%", padding:14, borderRadius:10, background:t.accent, color:"#fff", fontSize:15, fontWeight:800, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxSizing:"border-box" }}>
          Müraciət et <IArrow size={17} sw={2.5} />
        </a>
        <button onClick={copy} style={{ marginTop:10, width:"100%", padding:12, borderRadius:10, background:"transparent", border:"1px solid "+t.border, color:copied?"#22c55e":t.textMuted, fontSize:13.5, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"color .2s ease", fontFamily:"'Archivo',sans-serif" }}>
          {copied ? <><ICheck size={15} sw={2.5} /> Linki kopyalandı</> : <><ILink size={15} sw={2} /> Linki kopyala</>}
        </button>
      </div>
    </div>
  );
}

// ─── Global CSS injected once ─────────────────────────────────────────────────
const RADAR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
.radar-no-scroll::-webkit-scrollbar { display: none; }
.radar-no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes radarCardIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes radarShimmer { from { background-position: -480px 0; } to { background-position: 480px 0; } }
@keyframes radarOverlay { from { opacity:0; } to { opacity:1; } }
@keyframes radarModalDesk { from { opacity:0; transform:scale(.96) translateY(12px); } to { opacity:1; transform:none; } }
@keyframes radarModalMob  { from { transform:translateY(100%); } to { transform:translateY(0); } }
@keyframes radarPulse { 0%,100% { box-shadow:0 0 0 0 rgba(30,144,255,.55); } 70% { box-shadow:0 0 0 7px rgba(30,144,255,0); } }
`;

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Radar() {
  const dark = useDarkMode();
  const t = mkTheme(dark);

  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [now, setNow]             = useState(Date.now());
  const [tab, setTab]             = useState(null);
  const [query, setQuery]         = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sort, setSort]           = useState("newest");
  const [selected, setSelected]   = useState(null);
  const [stuck, setStuck]         = useState(false);
  const sentinel = useRef(null);

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById("radar-css")) return;
    const s = document.createElement("style");
    s.id = "radar-css";
    s.textContent = RADAR_CSS;
    document.head.appendChild(s);
  }, []);

  // Fetch from API, fallback to hardcoded
  useEffect(() => {
    const tid = setTimeout(() => {
      api.get("/opportunities")
        .then((r) => setData(r.data.length > 0 ? r.data : FALLBACK))
        .catch(() => setData(FALLBACK))
        .finally(() => setLoading(false));
    }, 800); // small delay for skeleton effect
    return () => clearTimeout(tid);
  }, []);

  // Live countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Sticky detection
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { threshold: 1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const filtered = useMemo(() => {
    let list = data.slice();
    if (tab) list = list.filter((o) => o.category === tab);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((o) =>
      o.title.toLowerCase().includes(q) ||
      o.organizer.toLowerCase().includes(q) ||
      normTags(o.tags).some((tg) => tg.toLowerCase().includes(q))
    );
    if (dateFilter !== "all") {
      const limit = dateFilter === "week" ? 7 : 30;
      list = list.filter((o) => { const d = daysLeft(o.deadline, now); return d !== null && d >= 0 && d <= limit; });
    }
    list.sort((a, b) => {
      if (sort === "deadline") {
        const da = daysLeft(a.deadline, now), db = daysLeft(b.deadline, now);
        return (da == null ? Infinity : da) - (db == null ? Infinity : db);
      }
      if (sort === "prize") return prizeVal(b.prize) - prizeVal(a.prize);
      if (a.is_new !== b.is_new) return a.is_new ? -1 : 1;
      return b.id - a.id;
    });
    return list;
  }, [data, tab, query, dateFilter, sort, now]);

  const featured  = useMemo(() => filtered.filter((o) => o.is_featured), [filtered]);
  const gridItems = useMemo(() => filtered.filter((o) => !o.is_featured), [filtered]);
  const activeCount = useMemo(() => data.filter((o) => { const d = daysLeft(o.deadline, now); return d == null || d >= 0; }).length, [data, now]);

  const clearAll = () => { setTab(null); setQuery(""); setDateFilter("all"); setSort("newest"); };

  // responsive cols
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const calc = () => setCols(window.innerWidth >= 1080 ? 3 : window.innerWidth >= 720 ? 2 : 1);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const isMob = cols === 1;

  return (
    <div style={{ minHeight:"100vh", background:t.bgGrad, color:t.text, transition:"background .3s ease" }}>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:`0 ${isMob?16:28}px` }}>

        {/* Header */}
        <header style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap", padding:isMob?"26px 0 18px":"38px 0 24px" }}>
          <div>
            <h1 style={{ margin:0, fontSize:isMob?28:34, fontWeight:900, letterSpacing:"-0.025em", color:t.text, fontFamily:"'Archivo',sans-serif" }}>
              Hash <span style={{ color:t.accent }}>·</span> Radar
            </h1>
            <p style={{ margin:"6px 0 0", fontSize:14, color:t.textMuted, fontWeight:500, fontFamily:"'Archivo',sans-serif" }}>
              Azərbaycandakı aktiv fürsətlər
            </p>
          </div>
          {!loading && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:20, background:t.accentSoft, border:"1px solid "+(dark?"rgba(30,144,255,0.28)":"rgba(30,144,255,0.22)") }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:t.accent, animation:"radarPulse 2s infinite ease-in-out" }} />
              <span style={{ fontSize:13, fontWeight:700, color:t.accentText, fontFamily:"'JetBrains Mono',monospace" }}>
                {activeCount} aktiv imkan
              </span>
            </div>
          )}
        </header>

        <div ref={sentinel} style={{ height:1 }} />

        {/* Sticky controls + tabs */}
        <div style={{ position:"sticky", top:0, zIndex:50, background:t.headerBg, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", margin:`0 -${isMob?16:28}px`, padding:`12px ${isMob?16:28}px 0`, borderBottom:"1px solid "+t.border, boxShadow:stuck?(dark?"0 8px 24px rgba(0,0,0,0.35)":"0 8px 24px rgba(7,20,40,0.06)"):"none", transition:"box-shadow .2s ease" }}>
          {/* controls */}
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:"1 1 240px", minWidth:200 }}>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:t.textMuted, display:"flex" }}><ISearch size={17} sw={2} /></span>
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Axtar: təşkilat, mövzu..." style={{ width:"100%", height:42, boxSizing:"border-box", background:t.control, color:t.text, border:"1px solid "+t.controlBorder, borderRadius:10, padding:"0 14px 0 40px", fontSize:14, fontWeight:500, fontFamily:"'Archivo',sans-serif", outline:"none" }} />
              {query && (
                <button onClick={()=>setQuery("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", width:26, height:26, borderRadius:7, border:"none", background:"transparent", color:t.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <IX size={15} sw={2.2} />
                </button>
              )}
            </div>
            <StyledSelect value={dateFilter} onChange={setDateFilter} t={t} label="Tarix filtri"
              options={[{v:"all",l:"Bütün tarixlər"},{v:"week",l:"Bu həftə"},{v:"month",l:"Bu ay"}]} />
            <StyledSelect value={sort} onChange={setSort} t={t} label="Sıralama"
              options={[{v:"newest",l:"Ən yeni"},{v:"deadline",l:"Bitmə tarixi"},{v:"prize",l:"Mükafat"}]} />
          </div>
          {/* tabs */}
          <div className="radar-no-scroll" style={{ display:"flex", gap:4, overflowX:"auto", marginTop:10 }}>
            {TABS.map((tb) => {
              const active = tab === tb.key;
              return (
                <button key={tb.label} onClick={()=>setTab(tb.key)} style={{ position:"relative", flexShrink:0, padding:"11px 14px 13px", background:"transparent", border:"none", cursor:"pointer", fontSize:14, fontWeight:active?800:600, color:active?t.text:t.textMuted, whiteSpace:"nowrap", letterSpacing:"-0.01em", transition:"color .15s ease", fontFamily:"'Archivo',sans-serif" }}>
                  {tb.label}
                  <span style={{ position:"absolute", left:6, right:6, bottom:-1, height:2.5, borderRadius:2, background:active?t.accent:"transparent", transition:"background .15s ease" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:16, padding:"24px 0 60px" }}>
            {Array.from({length:6}).map((_,i)=><SkeletonCard key={i} t={t} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"90px 20px 100px", color:t.textMuted }}>
            <div style={{ width:64, height:64, borderRadius:16, border:"1px solid "+t.border, display:"flex", alignItems:"center", justifyContent:"center", color:t.textFaint }}>
              <ICompass size={30} sw={1.8} />
            </div>
            <div style={{ marginTop:18, fontSize:18, fontWeight:800, color:t.text, fontFamily:"'Archivo',sans-serif" }}>Uyğun imkan tapılmadı</div>
            <p style={{ margin:"6px 0 0", fontSize:14, maxWidth:340, lineHeight:1.5, fontFamily:"'Archivo',sans-serif" }}>Axtarış və ya filtrləri dəyişməyi sınayın — yeni imkanlar mütəmadi əlavə olunur.</p>
            <button onClick={clearAll} style={{ marginTop:18, padding:"10px 18px", borderRadius:10, border:"1px solid "+t.accent, background:t.accentSoft, color:t.accent, fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"'Archivo',sans-serif" }}>Filtrləri təmizlə</button>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <section style={{ paddingTop:24 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:t.textFaint, fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>Seçilmiş</div>
                <div className="radar-no-scroll" style={{ display:"flex", gap:14, overflowX:"auto", scrollSnapType:"x mandatory", margin:`0 -${isMob?16:28}px`, padding:`2px ${isMob?16:28}px 8px` }}>
                  {featured.map((item)=><FeaturedCard key={item.id} item={item} now={now} t={t} onOpen={setSelected} />)}
                </div>
              </section>
            )}
            <section style={{ padding:`${featured.length>0?22:24}px 0 64px` }}>
              {gridItems.length > 0 ? (
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:16, alignItems:"start" }}>
                  {gridItems.map((item,i)=><Card key={item.id} item={item} now={now} t={t} onOpen={setSelected} index={i} />)}
                </div>
              ) : (
                <div style={{ fontSize:13.5, color:t.textMuted, padding:"8px 2px", fontFamily:"'Archivo',sans-serif" }}>Bu bölmədə yalnız seçilmiş imkanlar var.</div>
              )}
            </section>
          </>
        )}
      </div>

      {selected && <Modal item={selected} now={now} t={t} onClose={()=>setSelected(null)} />}
    </div>
  );
}
