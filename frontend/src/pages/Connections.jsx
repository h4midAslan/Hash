import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, Users, Clock, UserCheck, UserMinus } from "lucide-react";
import api from "../api/client";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { toast } from "../components/Toast";
import { useLang } from "../hooks/useLang";

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState("my");
  const d = useDarkClasses();
  const { t } = useLang();

  useEffect(() => {
    loadConnections();
    loadPending();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await api.get("/connections/my");
      setConnections(res.data);
    } catch {}
  };

  const loadPending = async () => {
    try {
      const res = await api.get("/connections/pending");
      setPending(res.data);
    } catch {}
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/connections/${id}/accept`);
      toast.success("Bağlantı qəbul edildi!");
      loadPending();
      loadConnections();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/connections/${id}/reject`);
      toast.info("İstək rədd edildi");
      loadPending();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const handleRemove = async (id, name) => {
    try {
      await api.delete(`/connections/${id}`);
      setConnections(prev => prev.filter(c => c.id !== id));
      toast.info(`${name} bağlantılardan silindi`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${d.heading}`}>{t("connections_title")}</h2>
        <p className={`${d.textFaint} text-sm mt-1`}>{t("connections_subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 mb-8 ${d.dark ? "bg-gray-800" : "bg-gray-100"} p-1.5 rounded-2xl`}>
        <button
          onClick={() => setTab("my")}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            tab === "my"
              ? `${d.dark ? "bg-gray-700 text-blue-400" : "bg-white text-blue-600"} shadow-sm`
              : `${d.textFaint} hover:text-gray-700`
          }`}
        >
          <UserCheck size={17} /> {t("connections_yours")} ({connections.length})
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            tab === "pending"
              ? `${d.dark ? "bg-gray-700 text-blue-400" : "bg-white text-blue-600"} shadow-sm`
              : `${d.textFaint} hover:text-gray-700`
          }`}
        >
          <Clock size={17} /> {t("connections_pending")} ({pending.length})
          {pending.length > 0 && (
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Connections list */}
      <div className="space-y-3">
        {tab === "my" && connections.map((c) => (
          <div
            key={c.id}
            className={`${d.card} rounded-2xl border shadow-sm p-4 flex items-center hover:shadow-md transition-all duration-300 group`}
          >
            <Link
              to={`/profile/${c.user_id}`}
              className="w-13 h-13 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md shadow-blue-100 group-hover:shadow-blue-200 transition-shadow"
              style={{ width: "52px", height: "52px" }}
            >
              {c.full_name?.charAt(0)}
            </Link>
            <div className="ml-4 flex-1 min-w-0">
              <Link to={`/profile/${c.user_id}`} className={`font-semibold ${d.text} hover:text-blue-600 transition`}>
                {c.full_name}
              </Link>
              <p className={`text-sm ${d.textFaint} mt-0.5 truncate`}>{c.major}</p>
            </div>
            <button
              onClick={() => handleRemove(c.id, c.full_name)}
              className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 ml-3 border ${
                d.dark
                  ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                  : "bg-red-50 text-red-400 border-red-100 hover:bg-red-100"
              }`}
              title="Bağlantını sil"
            >
              <UserMinus size={17} />
            </button>
          </div>
        ))}

        {tab === "pending" && pending.map((p) => (
          <div
            key={p.id}
            className={`${d.card} rounded-2xl border shadow-sm p-4 flex items-center hover:shadow-md transition-all duration-300 group`}
          >
            <Link
              to={`/profile/${p.sender_id}`}
              className="w-13 h-13 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md shadow-orange-100"
              style={{ width: "52px", height: "52px" }}
            >
              {p.sender_name?.charAt(0)}
            </Link>
            <div className="ml-4 flex-1 min-w-0">
              <Link to={`/profile/${p.sender_id}`} className={`font-semibold ${d.text} hover:text-blue-600 transition`}>
                {p.sender_name}
              </Link>
              <p className={`text-sm ${d.textFaint} mt-0.5`}>{p.sender_major}</p>
            </div>
            <div className="flex gap-2 shrink-0 ml-3">
              <button
                onClick={() => handleAccept(p.id)}
                className={`p-2.5 rounded-xl transition-all duration-200 border ${
                  d.dark
                    ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                    : "bg-green-50 text-green-600 border-green-100 hover:shadow-md hover:shadow-green-100"
                }`}
                title={t("connections_accept")}
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => handleReject(p.id)}
                className={`p-2.5 rounded-xl transition-all duration-200 border ${
                  d.dark
                    ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                    : "bg-red-50 text-red-400 border-red-100 hover:bg-red-100"
                }`}
                title={t("connections_reject")}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty states */}
      {tab === "my" && connections.length === 0 && (
        <div className="text-center py-20">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm ${d.dark ? "bg-gray-800" : "bg-gradient-to-br from-blue-50 to-indigo-50"}`}>
            <Users size={32} className="text-blue-400" />
          </div>
          <p className={`${d.text} font-semibold text-lg`}>{t("connections_empty")}</p>
          <p className={`${d.textFaint} text-sm mt-2 max-w-xs mx-auto`}>
            {t("feed_no_connections_sub")}
          </p>
        </div>
      )}
      {tab === "pending" && pending.length === 0 && (
        <div className="text-center py-20">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm ${d.dark ? "bg-gray-800" : "bg-gradient-to-br from-gray-50 to-gray-100"}`}>
            <Clock size={32} className="text-gray-400" />
          </div>
          <p className={`${d.text} font-semibold text-lg`}>{t("connections_pending_empty")}</p>
        </div>
      )}
    </div>
  );
}
