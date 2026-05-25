import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, MessageCircle, ArrowLeft, Circle, CheckCheck } from "lucide-react";
import api from "../api/client";
import { toast } from "../components/Toast";
import { formatBakuHM, isActiveNow, formatLastSeen } from "../utils/time";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkClasses } from "../hooks/useDarkClasses";
import { useDarkMode } from "../hooks/useTheme";

function Avatar({ name, picture, size = 40 }) {
  const colors = ["#1a4a8a", "#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (picture) {
    return (
      <img src={picture} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.38,
    }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

const WS_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000/api")
  .replace(/^http/, "ws");

export default function Messages() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const wsRef = useRef(null);
  const activeChatRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLang();
  const isMobile = useIsMobile();
  const dc = useDarkClasses();
  const dark = useDarkMode();

  // Keep ref in sync so WS handler never has stale activeChat
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // ── WebSocket ──────────────────────────────────────────────────
  const connectWs = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_BASE}/messages/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsReady(true);
      clearInterval(pingTimer.current);
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, 25000);
    };

    ws.onmessage = (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }

      if (data.type === "message") {
        const chat = activeChatRef.current;
        const partnerId = data.is_mine ? data.receiver_id : data.sender_id;

        if (chat && (chat.userId === data.sender_id || chat.userId === data.receiver_id)) {
          setMessages(prev =>
            prev.some(m => m.id === data.id) ? prev : [...prev, {
              id: data.id,
              sender_id: data.sender_id,
              content: data.content,
              is_mine: data.is_mine,
              is_read: data.is_mine,
              created_at: data.created_at,
            }]
          );
          if (!data.is_mine && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "read", other_user_id: data.sender_id }));
          }
        } else {
          setChats(prev => {
            const exists = prev.find(c => c.user_id === partnerId);
            if (exists) {
              return prev.map(c => c.user_id === partnerId
                ? { ...c, last_message: data.content, unread_count: data.is_mine ? c.unread_count : c.unread_count + 1 }
                : c
              );
            }
            return [{
              user_id: partnerId,
              full_name: data.sender_name,
              profile_picture: data.sender_picture,
              last_message: data.content,
              unread_count: data.is_mine ? 0 : 1,
              is_online: true,
            }, ...prev];
          });
        }
      }

      if (data.type === "read") {
        setMessages(prev => prev.map(m => m.is_mine ? { ...m, is_read: true } : m));
      }
    };

    ws.onclose = () => {
      setWsReady(false);
      clearInterval(pingTimer.current);
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connectWs]);

  // ── Data loading ───────────────────────────────────────────────
  useEffect(() => { loadChats(); }, []);

  useEffect(() => {
    const to = searchParams.get("to");
    const name = searchParams.get("name");
    if (to) {
      openChat(Number(to), name || "İstifadəçi");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChats = async () => {
    try {
      const res = await api.get("/messages");
      setChats(res.data);
    } catch {}
  };

  const openChat = async (userId, fullName, picture = null, lastSeen = null, isOnline = false) => {
    setActiveChat({ userId, fullName, picture, lastSeen, isOnline });
    setMessages([]);
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
      setChats(prev => prev.map(c => c.user_id === userId ? { ...c, unread_count: 0 } : c));

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "read", other_user_id: userId }));
      }

      if (!lastSeen) {
        try {
          const u = await api.get(`/users/${userId}`);
          setActiveChat(prev => prev?.userId === userId ? { ...prev, lastSeen: u.data.last_seen } : prev);
        } catch {}
      }
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat || sending) return;

    const content = newMsg.trim();
    setNewMsg("");
    setSending(true);

    try {
      const res = await api.post(`/messages/${activeChat.userId}`, { content });
      setMessages(prev =>
        prev.some(m => m.id === res.data.id) ? prev : [...prev, {
          id: res.data.id,
          content: res.data.content,
          is_mine: true,
          is_read: false,
          created_at: res.data.created_at,
        }]
      );
      setChats(prev => {
        const exists = prev.find(c => c.user_id === activeChat.userId);
        if (exists) return prev.map(c => c.user_id === activeChat.userId ? { ...c, last_message: content } : c);
        return [{ user_id: activeChat.userId, full_name: activeChat.fullName, profile_picture: activeChat.picture, last_message: content, unread_count: 0 }, ...prev];
      });
    } catch (err) {
      setNewMsg(content);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403) {
        toast.error(detail || "Yalnız bağlantılarınıza mesaj göndərə bilərsiniz");
      }
    }
    setSending(false);
  };

  // ── Theme values ───────────────────────────────────────────────
  const sidebarBg = dc.dark ? "#1e2736" : "#ffffff";
  const chatBg = dc.dark ? "#111827" : "#f3f4f6";
  const borderColor = dc.dark ? "#2d3748" : "#e5e7eb";
  const headBg = dc.dark ? "#1e2736" : "#ffffff";
  const nameColor = dc.dark ? "#f1f5f9" : "#111827";
  const metaColor = dc.dark ? "#94a3b8" : "#6b7280";

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 960, margin: "0 auto", padding: isMobile ? 0 : "20px 16px" }}>
      {!isMobile && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: nameColor, margin: 0 }}>{t("messages_title")}</h2>
          <p style={{ fontSize: 13, color: metaColor, marginTop: 4, marginBottom: 0 }}>{t("messages_subtitle")}</p>
        </div>
      )}

      <div style={{
        display: "flex",
        height: isMobile ? "calc(100dvh - 60px)" : "calc(100vh - 104px)",
        border: isMobile ? "none" : `1px solid ${borderColor}`,
        borderRadius: isMobile ? 0 : 14,
        overflow: "hidden",
        boxShadow: isMobile ? "none" : (dc.dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.06)"),
      }}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div style={{
          width: isMobile ? "100%" : 280,
          borderRight: `1px solid ${borderColor}`,
          background: sidebarBg,
          display: isMobile ? (activeChat ? "none" : "flex") : "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflowY: "auto",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: metaColor, textTransform: "uppercase", letterSpacing: 1 }}>
              {t("messages_chats")}
            </span>
            <span title={wsReady ? "Bağlantı aktiv" : "Bağlanır..."} style={{ width: 8, height: 8, borderRadius: "50%", background: wsReady ? "#22c55e" : "#f59e0b", display: "inline-block" }} />
          </div>

          {chats.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, background: dc.dark ? "#2d3748" : "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MessageCircle size={24} color={dc.dark ? "#4b5563" : "#9ca3af"} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: nameColor, margin: 0 }}>{t("messages_empty")}</p>
              <p style={{ fontSize: 12, color: metaColor, marginTop: 4 }}>{t("messages_empty_sub")}</p>
            </div>
          ) : chats.map((chat) => {
            const isActive = activeChat?.userId === chat.user_id;
            return (
              <div
                key={chat.user_id}
                onClick={() => openChat(chat.user_id, chat.full_name, chat.profile_picture, chat.last_seen, chat.is_online)}
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  borderBottom: `1px solid ${borderColor}`,
                  background: isActive ? (dc.dark ? "#2d3f5c" : "#eff6ff") : "transparent",
                  borderLeft: isActive ? "3px solid #1a4a8a" : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = dc.dark ? "#1e2736" : "#f9fafb"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? (dc.dark ? "#2d3f5c" : "#eff6ff") : "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={chat.full_name} picture={chat.profile_picture} size={42} />
                    {chat.is_online && (
                      <span style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", background: "#22c55e", border: `2px solid ${sidebarBg}` }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span style={{ fontWeight: chat.unread_count > 0 ? 700 : 600, fontSize: 13, color: nameColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {chat.full_name}
                      </span>
                      {chat.unread_count > 0 && (
                        <span style={{ background: "#1a4a8a", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "2px 7px", flexShrink: 0 }}>
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: metaColor, margin: 0, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chat.last_message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Chat pane ───────────────────────────────────── */}
        <div style={{ flex: 1, display: isMobile && !activeChat ? "none" : "flex", flexDirection: "column", minWidth: 0 }}>
          {activeChat ? (
            <>
              {/* Header */}
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${borderColor}`, background: headBg, display: "flex", alignItems: "center", gap: 10 }}>
                {isMobile && (
                  <button onClick={() => setActiveChat(null)} style={{ background: "none", border: "none", cursor: "pointer", color: metaColor, padding: 4, display: "flex" }}>
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div style={{ position: "relative" }}>
                  <Avatar name={activeChat.fullName} picture={activeChat.picture} size={38} />
                  {activeChat.isOnline && (
                    <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "#22c55e", border: `2px solid ${headBg}` }} />
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: nameColor, margin: 0 }}>{activeChat.fullName}</p>
                  {(() => {
                    const active = activeChat.isOnline || isActiveNow(activeChat.lastSeen);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Circle size={6} fill={active ? "#22c55e" : (dc.dark ? "#4b5563" : "#9ca3af")} color="transparent" />
                        <span style={{ fontSize: 11, color: active ? "#22c55e" : metaColor }}>
                          {active ? t("messages_active") : formatLastSeen(activeChat.lastSeen)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Messages list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: chatBg, display: "flex", flexDirection: "column", gap: 6 }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.is_mine ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "72%",
                      padding: "9px 13px",
                      borderRadius: msg.is_mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: msg.is_mine ? "#1a4a8a" : (dc.dark ? "#2d3748" : "#ffffff"),
                      color: msg.is_mine ? "#fff" : nameColor,
                      boxShadow: dc.dark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>{msg.content}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: msg.is_mine ? "rgba(255,255,255,0.6)" : metaColor }}>
                          {formatBakuHM(msg.created_at)}
                        </span>
                        {msg.is_mine && (
                          <CheckCheck size={12} color={msg.is_read ? "#60a5fa" : "rgba(255,255,255,0.5)"} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={sendMessage}
                style={{ padding: "10px 14px", borderTop: `1px solid ${borderColor}`, background: headBg, display: "flex", gap: 10, alignItems: "center" }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder={t("messages_placeholder")}
                  style={{
                    flex: 1, padding: "10px 16px",
                    border: `1px solid ${dc.dark ? "#374151" : "#e5e7eb"}`,
                    borderRadius: 24, fontSize: 14,
                    color: nameColor, background: dc.dark ? "#374151" : "#f9fafb",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#1a4a8a"}
                  onBlur={e => e.target.style.borderColor = dc.dark ? "#374151" : "#e5e7eb"}
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim() || sending}
                  style={{
                    width: 42, height: 42, borderRadius: "50%",
                    border: "none", flexShrink: 0,
                    background: newMsg.trim() && !sending ? "#1a4a8a" : (dc.dark ? "#374151" : "#e5e7eb"),
                    color: newMsg.trim() && !sending ? "#fff" : metaColor,
                    cursor: newMsg.trim() && !sending ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, background: dc.dark ? "#1e2736" : "#eff6ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <MessageCircle size={30} color="#1a4a8a" />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, color: nameColor, margin: 0 }}>{t("messages_select")}</p>
              <p style={{ fontSize: 13, color: metaColor, marginTop: 8, maxWidth: 280 }}>{t("messages_select_sub")}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
