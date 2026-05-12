import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, UserPlus, Users, SlidersHorizontal, X } from "lucide-react";
import api from "../api/client";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";

const COURSES = [
  { val: 1, label: "I" },
  { val: 2, label: "II" },
  { val: 3, label: "III" },
  { val: 4, label: "IV" },
];

export default function Search() {
  const [query, setQuery]             = useState("");
  const [skill, setSkill]             = useState("");
  const [course, setCourse]           = useState(null);
  const [openForTeam, setOpenForTeam] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults]         = useState([]);
  const [searched, setSearched]       = useState(false);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [pendingIds, setPendingIds]   = useState(new Set());
  const d = useDarkClasses();
  const { t } = useLang();
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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${d.heading}`}>{t("search_title")}</h2>
        <p className={`${d.textFaint} text-sm mt-1`}>{t("search_subtitle")}</p>
      </div>

      <form onSubmit={handleSearch} className={`${d.card} rounded-2xl shadow-sm p-5 mb-6`}>

        {/* Search inputs row */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <SearchIcon size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${d.textFaint}`} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("search_name")}
              className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
            />
          </div>
          <div className="relative flex-1">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${d.textFaint}`}>#</span>
            <input
              type="text"
              value={skill}
              onChange={e => setSkill(e.target.value)}
              placeholder={t("search_skill")}
              className={`w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${d.inputAlt}`}
            />
          </div>

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all shrink-0 ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-600 text-white border-blue-600"
                : d.dark
                  ? "bg-white/5 text-gray-400 border-white/10 hover:border-blue-500 hover:text-blue-400"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            <SlidersHorizontal size={15} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel — collapsible */}
        {showFilters && (
          <div className={`rounded-xl p-4 mb-3 space-y-3 ${d.dark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-gray-50 border border-gray-100"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${d.textFaint}`}>Filtrlər</span>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition">
                  <X size={11} /> Təmizlə
                </button>
              )}
            </div>

            {/* Course chips */}
            <div className="flex items-center gap-2">
              <span className={`text-xs shrink-0 ${d.textFaint}`}>Kurs:</span>
              <div className="flex gap-1.5">
                {COURSES.map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCourse(course === val ? null : val)}
                    className={`w-9 h-8 rounded-lg text-xs font-bold transition-all border ${
                      course === val
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : d.dark
                          ? "bg-white/5 text-gray-400 border-white/10 hover:border-blue-500 hover:text-blue-400"
                          : "bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                    }`}
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border w-full justify-center ${
                openForTeam
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : d.dark
                    ? "bg-white/5 text-gray-400 border-white/10 hover:border-emerald-500 hover:text-emerald-400"
                    : "bg-white text-gray-500 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${openForTeam ? "bg-white" : "bg-emerald-500"}`} />
              Komanda axtaranlar
            </button>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
        >
          <SearchIcon size={15} /> {t("search_btn")}
        </button>
      </form>

      {searched && results.length > 0 && (
        <p className={`text-sm ${d.textFaint} mb-4`}>{results.length} {t("search_results")}</p>
      )}

      <div className="space-y-3">
        {results.map((user) => (
          <div key={user.id}
            className={`${d.card} rounded-2xl shadow-sm p-4 flex items-center hover:shadow-md transition-all duration-300 group`}>
            <Link to={`/profile/${user.id}`}
              className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm">
              {user.profile_picture
                ? <img src={user.profile_picture} alt="" className="w-11 h-11 object-cover" />
                : <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">{user.full_name?.charAt(0)}</div>
              }
            </Link>
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/profile/${user.id}`}
                  className={`font-semibold ${d.text} text-sm hover:text-blue-600 transition`}>
                  {user.full_name}
                </Link>
                {user.is_open_for_team && (
                  <span className="text-[10px] font-semibold text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                    Komanda
                  </span>
                )}
              </div>
              <p className={`text-xs ${d.textFaint} mt-0.5`}>
                {[user.major, user.course && `${COURSES.find(c => c.val === user.course)?.label || user.course} kurs`].filter(Boolean).join(" · ")}
              </p>
              {user.skills && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {user.skills.split(",").slice(0, 3).map((s, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                      d.dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>{s.trim()}</span>
                  ))}
                  {user.skills.split(",").length > 3 && (
                    <span className={`px-2 py-0.5 rounded-md text-[11px] ${d.textFaint}`}>+{user.skills.split(",").length - 3}</span>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0 ml-3">
              {connectedIds.has(user.id) ? (
                <span className={`text-xs px-2.5 py-1.5 rounded-xl font-medium border ${d.dark ? "text-gray-500 border-gray-700" : "text-gray-400 border-gray-200"}`}>Bağlı</span>
              ) : pendingIds.has(user.id) ? (
                <span className={`text-xs px-2.5 py-1.5 rounded-xl font-medium ${d.dark ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" : "text-amber-600 bg-amber-50 border border-amber-200"}`}>Gözləyir</span>
              ) : (
                <button onClick={() => sendConnection(user.id)}
                  className={`p-2 rounded-xl transition-all border ${d.dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"}`}
                  title={t("search_connect")}>
                  <UserPlus size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {searched && results.length === 0 && (
        <div className="text-center py-16">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${d.dark ? "bg-gray-800" : "bg-gray-100"}`}>
            <Users size={24} className="text-gray-400" />
          </div>
          <p className={`${d.text} font-semibold text-sm`}>{t("search_empty")}</p>
          <p className={`${d.textFaint} text-xs mt-1`}>{t("search_empty_sub")}</p>
        </div>
      )}
    </div>
  );
}
