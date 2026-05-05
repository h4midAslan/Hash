import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, UserPlus, Filter, Sparkles, Users } from "lucide-react";
import api from "../api/client";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";

export default function Search() {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const d = useDarkClasses();
  const { t } = useLang();
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q, s) => {
    try {
      const res = await api.get("/users/search", { params: { q, skill: s } });
      setResults(res.data);
      setSearched(true);
    } catch (err) {}
  }, []);

  useEffect(() => {
    if (!query && !skill) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, skill), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, skill, doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    doSearch(query, skill);
  };

  const sendConnection = async (userId) => {
    try {
      await api.post(`/connections/${userId}`);
      toast.success("Bağlantı istəyi göndərildi!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${d.heading}`}>{t("search_title")}</h2>
        <p className={`${d.textFaint} text-sm mt-1`}>{t("search_subtitle")}</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className={`${d.card} rounded-2xl shadow-sm p-6 mb-8 hover:shadow-md transition-shadow duration-300`}>
        <div className="relative mb-4">
          <SearchIcon size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${d.textFaint}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_name")}
            className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${d.inputAlt}`}
          />
        </div>
        <div className="relative mb-5">
          <Sparkles size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${d.textFaint}`} />
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder={t("search_skill")}
            className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${d.inputAlt}`}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
        >
          <SearchIcon size={18} /> {t("search_btn")}
        </button>
      </form>

      {/* Results count */}
      {searched && results.length > 0 && (
        <p className={`text-sm ${d.textFaint} mb-4 font-medium`}>{results.length} {t("search_results")}</p>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((user, index) => (
          <div
            key={user.id}
            className={`${d.card} rounded-2xl shadow-sm p-5 flex items-center hover:shadow-md hover:border-blue-100 transition-all duration-300 group`}
          >
            <Link to={`/profile/${user.id}`} className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md shadow-blue-100 group-hover:shadow-blue-200 transition-shadow">
              {user.full_name?.charAt(0)}
            </Link>
            <div className="ml-4 flex-1 min-w-0">
              <Link to={`/profile/${user.id}`} className={`font-semibold ${d.text} text-[15px] hover:text-blue-600 transition`}>{user.full_name}</Link>
              <p className={`text-sm ${d.textFaint} mt-0.5`}>
                {user.major} {user.course && `· ${t("search_course")} ${user.course}`}
              </p>
              {user.skills && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {user.skills.split(",").slice(0, 4).map((s, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${d.dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-blue-100"}`}>
                      {s.trim()}
                    </span>
                  ))}
                  {user.skills.split(",").length > 4 && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${d.dark ? "bg-gray-700 text-gray-400" : "bg-gray-50 text-gray-400"}`}>
                      +{user.skills.split(",").length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => sendConnection(user.id)}
              className={`p-3 rounded-xl hover:shadow-md transition-all duration-200 shrink-0 ml-3 border ${d.dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:shadow-blue-900" : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-blue-100 hover:shadow-blue-100"}`}
              title={t("search_connect")}
            >
              <UserPlus size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {searched && results.length === 0 && (
        <div className="text-center py-20">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm ${d.dark ? "bg-gray-700" : "bg-gradient-to-br from-gray-50 to-gray-100"}`}>
            <Users size={32} className="text-gray-400" />
          </div>
          <p className={`${d.text} font-semibold text-lg`}>{t("search_empty")}</p>
          <p className={`${d.textFaint} text-sm mt-2 max-w-xs mx-auto`}>{t("search_empty_sub")}</p>
        </div>
      )}
    </div>
  );
}
