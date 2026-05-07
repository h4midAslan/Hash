import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Trophy, Star } from "lucide-react";
import api from "../api/client";
import { useDarkClasses } from "../hooks/useDarkClasses";

export default function HackathonWidget({ isAdmin = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const d = useDarkClasses();

  const load = async () => {
    try {
      const res = await api.get("/hackathons");
      setItems(res.data);
    } catch {
      // silently ignore — widget is non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post("/hackathons/refresh");
      setTimeout(() => { load(); setRefreshing(false); }, 3000);
    } catch {
      setRefreshing(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 ${d.card}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className={`font-semibold text-sm ${d.text}`}>Hackathon & Yarışlar</span>
        </div>
        {isAdmin && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Yenilə"
            className={`p-1.5 rounded-lg transition ${d.dark ? "hover:bg-gray-700" : "hover:bg-gray-100"} disabled:opacity-40`}
          >
            <RefreshCw size={14} className={`${d.textMuted} ${refreshing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-12 rounded-xl animate-pulse ${d.dark ? "bg-gray-700" : "bg-gray-100"}`} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className={`text-xs text-center py-4 ${d.textFaint}`}>
          Hazırda aktiv yarış tapılmadı
        </p>
      )}

      {!loading && items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map(item => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-start gap-2 p-2.5 rounded-xl transition group ${
                  d.dark ? "hover:bg-gray-700/60" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {item.trusted && (
                      <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                    )}
                    <span className={`text-xs font-medium leading-tight line-clamp-2 ${d.textSecondary} group-hover:text-blue-500 transition`}>
                      {item.title}
                    </span>
                  </div>
                  {item.deadline && (
                    <span className={`text-[10px] ${d.textFaint}`}>
                      📅 {item.deadline}
                    </span>
                  )}
                </div>
                <ExternalLink size={12} className={`${d.textFaint} shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition`} />
              </a>
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length > 0 && (
        <p className={`text-[10px] text-center mt-3 ${d.textFaint}`}>
          🇦🇿 Azərbaycan • avtomatik yenilənir
        </p>
      )}
    </div>
  );
}
