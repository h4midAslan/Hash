import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, UserPlus, Users, SlidersHorizontal, X } from "lucide-react";
import api from "../api/client";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

const COURSES = [
  { val: 1, label: "I" },
  { val: 2, label: "II" },
  { val: 3, label: "III" },
  { val: 4, label: "IV" },
];

const makeS = (dark) => ({
  page: { maxWidth: 720, margin: "0 auto", padding: "20px 12px" },
  heading: { fontSize: 22, fontWeight: 700, color: dark ? "#f3f4f6" : "#1a1a1a", margin: 0 },
  subtitle: { fontSize: 13, color: dark ? "#6b7280" : "#999", marginTop: 4 },
  formCard: { background: dark ? "#1f2937" : "#ffffff", border: dark ? "1px solid #374151" : "1px solid #d4d4d4", padding: "16px", marginBottom: 20 },
  inputWrap: { position: "relative", flex: 1 },
  input: (focused) => ({
    width: "100%",
    border: `1px solid ${focused ? "#60a5fa" : (dark ? "#374151" : "#ccc")}`,
    padding: "6px 10px 6px 32px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    background: dark ? "#111827" : "#fff",
    color: dark ? "#f3f4f6" : "#1a1a1a",
  }),
  inputIcon: {
    position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
    color: dark ? "#6b7280" : "#999", pointerEvents: "none", display: "flex", alignItems: "center",
  },
  filterToggle: (active) => ({
    display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
    border: `1px solid ${active ? "#1a4a8a" : (dark ? "#374151" : "#ccc")}`,
    background: active ? "#1a4a8a" : (dark ? "#111827" : "#fff"),
    color: active ? "#fff" : (dark ? "#9ca3af" : "#444"),
    fontSize: 13, cursor: "pointer", position: "relative", flexShrink: 0,
  }),
  filterBadge: {
    position: "absolute", top: -6, right: -6, width: 16, height: 16,
    background: "#c0392b", color: "#fff", fontSize: 10, fontWeight: 700,
    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
  },
  filterPanel: { border: dark ? "1px solid #374151" : "1px solid #d4d4d4", background: dark ? "#111827" : "#f7f7f7", padding: 12, marginBottom: 10 },
  filterLabel: { fontSize: 11, fontWeight: 600, color: dark ? "#9ca3af" : "#666", textTransform: "uppercase", letterSpacing: "0.05em" },
  clearBtn: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: dark ? "#60a5fa" : "#1a4a8a", background: "none", border: "none", cursor: "pointer", padding: 0 },
  courseChip: (active) => ({
    width: 36, height: 30,
    border: `1px solid ${active ? "#60a5fa" : (dark ? "#374151" : "#ccc")}`,
    background: dark ? "#1f2937" : "#fff",
    color: active ? (dark ? "#60a5fa" : "#1a4a8a") : (dark ? "#9ca3af" : "#666"),
    fontSize: 12, fontWeight: 700, cursor: "pointer",
  }),
  teamBtn: (active) => ({
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "6px 12px",
    border: `1px solid ${active ? "#27ae60" : (dark ? "#374151" : "#ccc")}`,
    background: active ? "#27ae60" : (dark ? "#1f2937" : "#fff"),
    color: active ? "#fff" : (dark ? "#9ca3af" : "#666"),
    fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%",
  }),
  submitBtn: {
    width: "100%", background: "#1a4a8a", color: "#fff", border: "1px solid #1a4a8a",
    padding: "8px 0", fontSize: 13, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  userRow: {
    background: dark ? "#1f2937" : "#ffffff", border: dark ? "1px solid #374151" : "1px solid #d4d4d4", padding: "10px 12px",
    display: "flex", alignItems: "center", marginBottom: 6,
  },
  avatar: {
    width: 44, height: 44, background: "#1a4a8a", display: "flex",
    alignItems: "center", justifyContent: "center", color: "#fff",
    fontWeight: 700, fontSize: 18, flexShrink: 0, overflow: "hidden", textDecoration: "none",
  },
  userName: { fontWeight: 600, fontSize: 13, color: dark ? "#f3f4f6" : "#1a1a1a", textDecoration: "none" },
  userMeta: { fontSize: 12, color: dark ? "#6b7280" : "#999", marginTop: 2 },
  skillChip: {
    padding: "2px 6px", border: dark ? "1px solid #374151" : "1px solid #c0d4f0", background: dark ? "#1f2937" : "#eef4ff",
    color: dark ? "#60a5fa" : "#1a4a8a", fontSize: 11, marginRight: 4, marginTop: 4, display: "inline-block",
  },
  skillChipMore: { padding: "2px 4px", fontSize: 11, color: dark ? "#6b7280" : "#999", marginTop: 4, display: "inline-block" },
  teamBadge: { fontSize: 10, fontWeight: 600, color: "#27ae60", border: "1px solid #27ae60", padding: "1px 5px", marginLeft: 6 },
  badgeConnected: { border: dark ? "1px solid #374151" : "1px solid #ccc", color: dark ? "#9ca3af" : "#888", padding: "3px 8px", fontSize: 11, background: dark ? "#1f2937" : "#fff" },
  badgePending: { border: "1px solid #e0a800", color: "#b8860b", padding: "3px 8px", fontSize: 11, background: dark ? "#1f1a00" : "#fffbf0" },
  connectBtn: { border: "1px solid #1a4a8a", color: dark ? "#60a5fa" : "#1a4a8a", background: dark ? "#1f2937" : "#f0f5ff", padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" },
  resultsCount: { fontSize: 13, color: dark ? "#9ca3af" : "#666", marginBottom: 12 },
  emptyWrap: { textAlign: "center", padding: "60px 0" },
  emptyIcon: { width: 52, height: 52, background: dark ? "#1f2937" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
});

export default function Search() {
  const dark = useDarkMode();
  const S = makeS(dark);
  const [query, setQuery]             = useState("");
  const [skill, setSkill]             = useState("");
  const [course, setCourse]           = useState(null);
  const [openForTeam, setOpenForTeam] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults]         = useState([]);
  const [searched, setSearched]       = useState(false);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [pendingIds, setPendingIds]   = useState(new Set());
  const [focusedInput, setFocusedInput] = useState(null);
  const { t } = useLang();
  const isMobile = useIsMobile();
  const debounceRef = useRef(null);

  useEffect(() => {
    api.get("/connections/my").then(r => setConnectedIds(new Set(r.data.map(c => c.user_id)))).catch(() => {});
    api.get("/connections/sent").then(r => setPendingIds(new Set(r.data.map(c => c.receiver_id)))).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q, s, c, oft) => {
    try {
      const params = { q, skill: s };
      if (c) params.course = c;
      if (oft) params.open_for_team = true;
      const res = await api.get("/users/search", { params });
      setResults(res.data);
      setSearched(true);
    } catch {}
  }, []);

  useEffect(() => {
    const hasAny = query || skill || course || openForTeam;
    if (!hasAny) { setResults([]); setSearched(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, skill, course, openForTeam), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, skill, course, openForTeam, doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query && !skill && !course && !openForTeam) return;
    clearTimeout(debounceRef.current);
    doSearch(query, skill, course, openForTeam);
  };

  const activeFilterCount = [course, openForTeam].filter(Boolean).length;

  const clearFilters = () => { setCourse(null); setOpenForTeam(false); };

  const sendConnection = async (userId) => {
    setPendingIds(prev => new Set([...prev, userId]));
    try {
      await api.post(`/connections/${userId}`);
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) {
      setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  return (
    <div style={{ ...S.page, padding: isMobile ? "12px 10px" : S.page.padding, minHeight: "100vh", background: dark ? "#111827" : undefined }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={S.heading}>{t("search_title")}</h2>
        <p style={S.subtitle}>{t("search_subtitle")}</p>
      </div>

      <form onSubmit={handleSearch} style={S.formCard}>

        {/* Search inputs row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <div style={{ ...S.inputWrap, flexBasis: isMobile ? "100%" : undefined }}>
            <span style={S.inputIcon}><SearchIcon size={13} /></span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("search_name")}
              style={S.input(focusedInput === "query")}
              onFocus={() => setFocusedInput("query")}
              onBlur={() => setFocusedInput(null)}
            />
          </div>
          <div style={{ ...S.inputWrap, flexBasis: isMobile ? "100%" : undefined }}>
            <span style={{ ...S.inputIcon, fontSize: 13, fontWeight: 700 }}>#</span>
            <input
              type="text"
              value={skill}
              onChange={e => setSkill(e.target.value)}
              placeholder={t("search_skill")}
              style={S.input(focusedInput === "skill")}
              onFocus={() => setFocusedInput("skill")}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            style={S.filterToggle(showFilters || activeFilterCount > 0)}
          >
            <SlidersHorizontal size={14} />
            {activeFilterCount > 0 && (
              <span style={S.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Filter panel — collapsible */}
        {showFilters && (
          <div style={S.filterPanel}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={S.filterLabel}>Filtrlər</span>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} style={S.clearBtn}>
                  <X size={11} /> Təmizlə
                </button>
              )}
            </div>

            {/* Course chips */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#666", flexShrink: 0 }}>Kurs:</span>
              <div style={{ display: "flex", gap: 4 }}>
                {COURSES.map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCourse(course === val ? null : val)}
                    style={S.courseChip(course === val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Open for team */}
            <button
              type="button"
              onClick={() => setOpenForTeam(v => !v)}
              style={S.teamBtn(openForTeam)}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: openForTeam ? "#fff" : "#27ae60", display: "inline-block" }} />
              Komanda axtaranlar
            </button>
          </div>
        )}

        <button type="submit" style={S.submitBtn}>
          <SearchIcon size={14} /> {t("search_btn")}
        </button>
      </form>

      {searched && results.length > 0 && (
        <p style={S.resultsCount}>{results.length} {t("search_results")}</p>
      )}

      <div>
        {results.map((user) => (
          <div
            key={user.id}
            style={S.userRow}
            onMouseEnter={e => e.currentTarget.style.background = dark ? "#111827" : "#f7f9fc"}
            onMouseLeave={e => e.currentTarget.style.background = dark ? "#1f2937" : "#ffffff"}
          >
            <Link to={`/profile/${user.id}`} style={S.avatar}>
              {user.profile_picture
                ? <img src={user.profile_picture} alt="" style={{ width: 44, height: 44, objectFit: "cover", display: "block" }} />
                : user.full_name?.charAt(0)
              }
            </Link>
            <div style={{ marginLeft: 10, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                <Link to={`/profile/${user.id}`} style={S.userName}>
                  {user.full_name}
                </Link>
                {user.is_open_for_team && (
                  <span style={S.teamBadge}>Komanda</span>
                )}
              </div>
              <p style={S.userMeta}>
                {[user.major, user.course && `${COURSES.find(c => c.val === user.course)?.label || user.course} kurs`].filter(Boolean).join(" · ")}
              </p>
              {user.skills && (
                <div>
                  {user.skills.split(",").slice(0, 3).map((s, i) => (
                    <span key={i} style={S.skillChip}>{s.trim()}</span>
                  ))}
                  {user.skills.split(",").length > 3 && (
                    <span style={S.skillChipMore}>+{user.skills.split(",").length - 3}</span>
                  )}
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0, marginLeft: 10 }}>
              {connectedIds.has(user.id) ? (
                <span style={S.badgeConnected}>Bağlı</span>
              ) : pendingIds.has(user.id) ? (
                <span style={S.badgePending}>Gözləyir</span>
              ) : (
                <button onClick={() => sendConnection(user.id)} style={S.connectBtn} title={t("search_connect")}>
                  <UserPlus size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {searched && results.length === 0 && (
        <div style={S.emptyWrap}>
          <div style={S.emptyIcon}>
            <Users size={22} color="#aaa" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: dark ? "#f3f4f6" : "#1a1a1a", margin: 0 }}>{t("search_empty")}</p>
          <p style={{ fontSize: 12, color: dark ? "#6b7280" : "#999", marginTop: 4 }}>{t("search_empty_sub")}</p>
        </div>
      )}
    </div>
  );
}
