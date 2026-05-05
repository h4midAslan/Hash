import { useState, useEffect } from "react";
import {
  BarChart3, Users, FileText, MessageCircle, Link2, UserCheck,
  Shield, ShieldOff, Ban, CheckCircle, Trash2, Pin, PinOff,
  Search, Heart, Activity, TrendingUp, Calendar, Mail, GraduationCap,
  RefreshCw, ChevronRight, Eye, LogIn, LogOut, UserPlus, Image, Send, Clock, Globe, Flag
} from "lucide-react";
import api from "../api/client";
import { formatBakuDate, formatBakuTime, formatBakuHM } from "../utils/time";
import { toast } from "../components/Toast";

export default function Admin() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [logAction, setLogAction] = useState("");
  const [logEmail, setLogEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "posts") loadPosts();
    if (tab === "logs") loadLogs();
    if (tab === "reports") loadReports();
  }, [tab]);

  const loadStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {}
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", { params: { q: userSearch } });
      setUsers(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/posts", { params: { q: postSearch } });
      setPosts(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports");
      setReports(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const dismissReports = async (postId) => {
    try {
      await api.post(`/admin/reports/dismiss/${postId}`);
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const deleteReportedPost = async (postId) => {
    if (!confirm("Bu postu silmək istəyirsinizmi? Şikayətlər də silinəcək.")) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      loadReports();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (logAction) params.action = logAction;
      if (logEmail) params.email = logEmail;
      const res = await api.get("/admin/logs", { params });
      setLogs(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const toggleActive = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      loadUsers();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const toggleAdmin = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-admin`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const deleteUser = async (userId, name) => {
    if (!confirm(`"${name}" istifadəçisini silmək istəyirsinizmi?\n\nBu əməliyyat geri qaytarıla bilməz. İstifadəçinin bütün postları, mesajları və bağlantıları da silinəcək.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      loadUsers();
      loadStats();
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const togglePin = async (postId) => {
    try {
      await api.patch(`/admin/posts/${postId}/pin`);
      loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const deletePost = async (postId) => {
    if (!confirm("Bu postu silmək istəyirsinizmi?")) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      loadPosts();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xəta baş verdi");
    }
  };

  const tabs = [
    { id: "dashboard", icon: BarChart3, label: "Panel" },
    { id: "users", icon: Users, label: "İstifadəçilər" },
    { id: "posts", icon: FileText, label: "Postlar" },
    { id: "reports", icon: Flag, label: "Şikayətlər" },
    { id: "logs", icon: Activity, label: "Loglar" },
  ];

  const banCount = users.filter(u => !u.is_active).length;
  const adminCount = users.filter(u => u.is_admin).length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
              <Shield size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-400 text-sm mt-0.5">Hash platformasını idarə et</p>
            </div>
          </div>
          <button
            onClick={() => { loadStats(); if (tab === "users") loadUsers(); if (tab === "posts") loadPosts(); if (tab === "logs") loadLogs(); if (tab === "reports") loadReports(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all shadow-sm"
          >
            <RefreshCw size={15} />
            Yenilə
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                tab === id
                  ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </div>

        {/* ═══════ DASHBOARD ═══════ */}
        {tab === "dashboard" && (
          <div>
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <StatCard icon={Users} label="Ümumi istifadəçi" value={stats.total_users} color="slate" />
                <StatCard icon={UserCheck} label="Aktiv istifadəçi" value={stats.active_users} color="emerald" subtitle={stats.total_users > 0 ? `${Math.round((stats.active_users / stats.total_users) * 100)}% aktiv` : null} />
                <StatCard icon={FileText} label="Ümumi post" value={stats.total_posts} color="blue" />
                <StatCard icon={Link2} label="Bağlantı istəyi" value={stats.total_connections} color="violet" />
                <StatCard icon={CheckCircle} label="Qəbul edilmiş" value={stats.accepted_connections} color="teal" subtitle={stats.total_connections > 0 ? `${Math.round((stats.accepted_connections / stats.total_connections) * 100)}% qəbul` : null} />
                <StatCard icon={MessageCircle} label="Ümumi mesaj" value={stats.total_messages} color="amber" />
              </div>
            )}

            {/* Quick overview cards */}
            {stats && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Platform xülasəsi</h3>
                    <Activity size={18} className="text-gray-300" />
                  </div>
                  <div className="space-y-4">
                    <OverviewRow label="Orta post/istifadəçi" value={stats.total_users > 0 ? (stats.total_posts / stats.total_users).toFixed(1) : "0"} />
                    <OverviewRow label="Orta mesaj/istifadəçi" value={stats.total_users > 0 ? (stats.total_messages / stats.total_users).toFixed(1) : "0"} />
                    <OverviewRow label="Orta bağlantı/istifadəçi" value={stats.total_users > 0 ? (stats.accepted_connections / stats.total_users).toFixed(1) : "0"} />
                    <OverviewRow label="Bloklanmış istifadəçi" value={stats.total_users - stats.active_users} highlight={stats.total_users - stats.active_users > 0} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Sürətli əməliyyatlar</h3>
                    <TrendingUp size={18} className="text-gray-300" />
                  </div>
                  <div className="space-y-2.5">
                    <QuickAction icon={Users} label="İstifadəçiləri idarə et" count={stats.total_users} onClick={() => setTab("users")} />
                    <QuickAction icon={FileText} label="Postları idarə et" count={stats.total_posts} onClick={() => setTab("posts")} />
                    <QuickAction icon={Ban} label="Bloklanmış hesablar" count={stats.total_users - stats.active_users} onClick={() => setTab("users")} warning={stats.total_users - stats.active_users > 0} />
                  </div>
                </div>
              </div>
            )}

            {!stats && (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-slate-800 rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* ═══════ USERS ═══════ */}
        {tab === "users" && (
          <div>
            {/* Search + meta */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <form onSubmit={(e) => { e.preventDefault(); loadUsers(); }} className="flex-1">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Ad ilə axtar..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-sm shadow-sm"
                  />
                </div>
              </form>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 shadow-sm">
                  <Users size={14} /> {users.length} istifadəçi
                </span>
                {adminCount > 0 && (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 rounded-xl text-xs font-semibold text-white shadow-sm">
                    <Shield size={14} /> {adminCount} admin
                  </span>
                )}
                {banCount > 0 && (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-500 shadow-sm">
                    <Ban size={14} /> {banCount} blok
                  </span>
                )}
              </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">İstifadəçi</div>
                <div className="col-span-2">İxtisas</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Qeydiyyat</div>
                <div className="col-span-2 text-right">Əməliyyat</div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 border-3 border-gray-200 border-t-slate-800 rounded-full animate-spin" />
                </div>
              )}

              {!loading && users.map((user, index) => (
                <div
                  key={user.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors ${
                    index !== users.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  {/* User info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${
                      !user.is_active
                        ? "bg-gradient-to-br from-gray-400 to-gray-500"
                        : user.is_admin
                        ? "bg-gradient-to-br from-slate-700 to-slate-900"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}>
                      {user.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</p>
                        {user.is_admin && (
                          <span className="bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Major */}
                  <div className="col-span-2 hidden md:block">
                    {user.major ? (
                      <span className="text-sm text-gray-600">{user.major}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2 hidden md:flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold ${
                      user.is_active
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-red-50 text-red-500 border border-red-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                      {user.is_active ? "Aktiv" : "Bloklanıb"}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 hidden md:block">
                    <span className="text-xs text-gray-400">{formatBakuDate(user.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex gap-1.5 justify-end">
                    <button
                      onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all border border-gray-100"
                      title="Bax"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => toggleActive(user.id)}
                      className={`p-2 rounded-lg transition-all border ${
                        user.is_active
                          ? "bg-orange-50 text-orange-500 hover:bg-orange-100 border-orange-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100"
                      }`}
                      title={user.is_active ? "Blokla" : "Aktiv et"}
                    >
                      {user.is_active ? <Ban size={15} /> : <CheckCircle size={15} />}
                    </button>
                    <button
                      onClick={() => toggleAdmin(user.id)}
                      className={`p-2 rounded-lg transition-all border ${
                        user.is_admin
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100"
                      }`}
                      title={user.is_admin ? "Admin çıxar" : "Admin et"}
                    >
                      {user.is_admin ? <ShieldOff size={15} /> : <Shield size={15} />}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.full_name)}
                      className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all border border-red-100"
                      title="Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {selectedUser?.id === user.id && (
                    <div className="col-span-full bg-gray-50 rounded-xl p-4 mt-1 border border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Email</p>
                          <p className="text-gray-700 font-medium flex items-center gap-1.5"><Mail size={13} /> {user.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">İxtisas</p>
                          <p className="text-gray-700 font-medium flex items-center gap-1.5"><GraduationCap size={13} /> {user.major || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Kurs</p>
                          <p className="text-gray-700 font-medium">{user.course ? `${user.course}-ci kurs` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Qeydiyyat tarixi</p>
                          <p className="text-gray-700 font-medium flex items-center gap-1.5"><Calendar size={13} /> {formatBakuDate(user.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${user.is_open_for_team ? "bg-green-50 text-green-600 border border-green-100" : "bg-gray-100 text-gray-400"}`}>
                          {user.is_open_for_team ? "Komanda üçün açıq" : "Komanda üçün bağlı"}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${user.is_admin ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {user.is_admin ? "Admin" : "Normal istifadəçi"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!loading && users.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users size={28} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">İstifadəçi tapılmadı</p>
                  <p className="text-gray-400 text-xs mt-1">Axtarış sorğunuzu dəyişin</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ POSTS ═══════ */}
        {tab === "posts" && (
          <div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <form onSubmit={(e) => { e.preventDefault(); loadPosts(); }} className="flex-1">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    placeholder="Post içəriğində axtar..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-sm shadow-sm"
                  />
                </div>
              </form>
              <span className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 shadow-sm">
                <FileText size={14} /> {posts.length} post
              </span>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-7 h-7 border-3 border-gray-200 border-t-slate-800 rounded-full animate-spin" />
              </div>
            )}

            <div className="space-y-3">
              {!loading && posts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  {/* Post header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                        {post.author_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{post.author_name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{formatBakuDate(post.created_at)}</span>
                          <span>·</span>
                          <span>{formatBakuHM(post.created_at)}</span>
                          <span>·</span>
                          <span>ID: {post.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.is_pinned && (
                        <span className="bg-amber-50 text-amber-600 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-amber-100 uppercase tracking-wide">
                          Sabit
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post content */}
                  {post.content && (
                    <div className="px-5 pb-4">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {post.content.length > 300 ? post.content.slice(0, 300) + "..." : post.content}
                      </p>
                    </div>
                  )}

                  {/* Post footer */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex items-center gap-5">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Heart size={14} className="text-red-400" />
                        {post.like_count} bəyəni
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <MessageCircle size={14} className="text-blue-400" />
                        {post.comment_count} şərh
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => togglePin(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          post.is_pinned
                            ? "bg-amber-100 text-amber-600 hover:bg-amber-200 border border-amber-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                        }`}
                      >
                        {post.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                        {post.is_pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100"
                      >
                        <Trash2 size={13} />
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!loading && posts.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <FileText size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold text-lg">Post tapılmadı</p>
                <p className="text-gray-400 text-sm mt-2">Axtarış sorğunuzu dəyişin</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════ REPORTS ═══════ */}
        {tab === "reports" && (
          <div>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <p className="text-gray-700 font-semibold text-lg">Açıq şikayət yoxdur</p>
                <p className="text-gray-400 text-sm mt-2">Hər şey səliqəlidir</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((r) => (
                  <div key={r.post_id} className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <Flag size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-red-700 text-sm">{r.report_count} şikayət</p>
                          <p className="text-xs text-red-500">Son: {formatBakuDate(r.latest_reported_at)} · {formatBakuHM(r.latest_reported_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      <p className="text-xs text-gray-400 mb-1">Müəllif</p>
                      <p className="text-sm font-semibold text-gray-800 mb-3">{r.author_name}</p>

                      {r.post_content && (
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                          {r.post_content.length > 300 ? r.post_content.slice(0, 300) + "..." : r.post_content}
                        </p>
                      )}

                      {r.post_image_url && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-gray-100">
                          <img src={r.post_image_url} alt="" className="w-full max-h-64 object-cover" />
                        </div>
                      )}

                      {r.post_video_url && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 bg-black">
                          <video src={r.post_video_url} controls className="w-full max-h-64" />
                        </div>
                      )}

                      {r.reasons.length > 0 && (
                        <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Səbəblər:</p>
                          <ul className="space-y-1">
                            {r.reasons.map((reason, i) => (
                              <li key={i} className="text-sm text-gray-600">• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2 justify-end">
                      <button
                        onClick={() => dismissReports(r.post_id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition"
                      >
                        <CheckCircle size={15} />
                        Rədd et
                      </button>
                      <button
                        onClick={() => deleteReportedPost(r.post_id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition"
                      >
                        <Trash2 size={15} />
                        Postu sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ LOGS ═══════ */}
        {tab === "logs" && (
          <div>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <select
                value={logAction}
                onChange={(e) => setLogAction(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Bütün əməliyyatlar</option>
                <option value="login_success">Uğurlu giriş</option>
                <option value="login_failed">Uğursuz giriş</option>
                <option value="register">Qeydiyyat</option>
              </select>
              <form onSubmit={(e) => { e.preventDefault(); loadLogs(); }} className="flex-1 flex gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    value={logEmail}
                    onChange={(e) => setLogEmail(e.target.value)}
                    placeholder="Email ilə axtar..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition"
                >
                  Filtrələ
                </button>
              </form>
              <span className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 shadow-sm">
                <Activity size={14} /> {logs.length} log
              </span>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-7 h-7 border-3 border-gray-200 border-t-slate-800 rounded-full animate-spin" />
              </div>
            )}

            {/* Logs table */}
            {!loading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-3">İstifadəçi</div>
                  <div className="col-span-2">Əməliyyat</div>
                  <div className="col-span-3">Vaxt</div>
                  <div className="col-span-2">IP</div>
                  <div className="col-span-2">Ətraflı</div>
                </div>

                {logs.map((log, i) => (
                  <LogRow key={log.id} log={log} isLast={i === logs.length - 1} />
                ))}

                {logs.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Activity size={28} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Log qeydi yoxdur</p>
                    <p className="text-gray-400 text-xs mt-1">Filtri dəyişin və ya yenilə</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


/* ─── Log Row ─── */
const actionMeta = {
  login_success: { label: "Uğurlu giriş", icon: LogIn, color: "emerald" },
  login_failed: { label: "Uğursuz giriş", icon: Ban, color: "red" },
  register: { label: "Qeydiyyat", icon: UserPlus, color: "blue" },
  profile_picture_update: { label: "Profil şəkli", icon: Image, color: "violet" },
  message_send: { label: "Mesaj", icon: Send, color: "amber" },
};

const actionColors = {
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  red: "bg-red-50 text-red-500 border-red-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  gray: "bg-gray-50 text-gray-500 border-gray-100",
};

function LogRow({ log, isLast }) {
  const meta = actionMeta[log.action] || { label: log.action, icon: Activity, color: "gray" };
  const Icon = meta.icon;
  const date = formatBakuDate(log.created_at);
  const time = formatBakuTime(log.created_at);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 items-center hover:bg-gray-50/50 transition-colors ${!isLast ? "border-b border-gray-50" : ""}`}>
      <div className="col-span-3 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{log.full_name || "—"}</p>
        <p className="text-xs text-gray-400 truncate">{log.email || "—"}</p>
      </div>
      <div className="col-span-2">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold border ${actionColors[meta.color]}`}>
          <Icon size={12} />
          {meta.label}
        </span>
      </div>
      <div className="col-span-3 flex items-center gap-1.5 text-xs text-gray-500">
        <Clock size={13} className="text-gray-300" />
        <span className="font-medium text-gray-700">{date}</span>
        <span className="text-gray-400">{time}</span>
      </div>
      <div className="col-span-2 flex items-center gap-1.5 text-xs text-gray-500 font-mono">
        <Globe size={12} className="text-gray-300" />
        {log.ip_address || "—"}
      </div>
      <div className="col-span-2 text-xs text-gray-400 truncate" title={log.user_agent || log.details || ""}>
        {log.details || (log.user_agent ? log.user_agent.split(" ")[0] : "—")}
      </div>
    </div>
  );
}


/* ─── Stat Card ─── */
const colorMap = {
  slate: { bg: "from-slate-700 to-slate-900", shadow: "shadow-slate-200", text: "text-slate-600", light: "bg-slate-50" },
  emerald: { bg: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-200", text: "text-emerald-600", light: "bg-emerald-50" },
  blue: { bg: "from-blue-500 to-blue-600", shadow: "shadow-blue-200", text: "text-blue-600", light: "bg-blue-50" },
  violet: { bg: "from-violet-500 to-purple-600", shadow: "shadow-violet-200", text: "text-violet-600", light: "bg-violet-50" },
  teal: { bg: "from-teal-500 to-cyan-600", shadow: "shadow-teal-200", text: "text-teal-600", light: "bg-teal-50" },
  amber: { bg: "from-amber-500 to-orange-600", shadow: "shadow-amber-200", text: "text-amber-600", light: "bg-amber-50" },
};

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${c.bg} ${c.shadow} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
          <Icon size={22} className="text-white" />
        </div>
        {subtitle && (
          <span className={`text-[11px] font-semibold ${c.text} ${c.light} px-2.5 py-1 rounded-lg`}>{subtitle}</span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );
}


/* ─── Overview Row ─── */
function OverviewRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-red-500" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}


/* ─── Quick Action ─── */
function QuickAction({ icon: Icon, label, count, onClick, warning }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group text-left ${
        warning ? "bg-red-50 hover:bg-red-100 border border-red-100" : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${warning ? "bg-red-100 text-red-500" : "bg-white text-gray-500 shadow-sm"}`}>
        <Icon size={17} />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${warning ? "text-red-700" : "text-gray-700"}`}>{label}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${warning ? "text-red-600" : "text-gray-900"}`}>{count}</span>
        <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}
