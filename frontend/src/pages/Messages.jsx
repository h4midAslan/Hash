import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, MessageCircle, ArrowLeft, Circle, CheckCheck } from "lucide-react";
import api from "../api/client";
import { toast } from "../components/Toast";
import { formatBakuHM, isActiveNow, formatLastSeen } from "../utils/time";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDarkMode } from "../hooks/useTheme";

const ACCENT = "#1E90FF";

function useFonts() {
  useEffect(() => {
    if (document.getElementById("hash-fonts")) return;
    const link = document.createElement("link");
    link.id = "hash-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,800&family=JetBrains+Mono:wght@500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

function useColors(dark) {
  return {
    bg:       dark ? "#050f1f" : "#f0f4fa",
    surface:  dark ? "#0a1c39" : "#ffffff",
    surface2: dark ? "#0d2248" : "#f8faff",
    chatBg:   dark ? "#060e20" : "#f0f4fa",
    border:   dark ? "rgba(255,255,255,0.07)" : "#e4e9f1",
    text:     dark ? "#ffffff" : "#071428",
    muted:    dark ? "#7d8ba3" : "#69768d",
  };
}

function Avatar({ name, picture, size = 40 }) {
  const colors = ["#1a4a8a", "#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (picture) {
    return (
      <img src={picture} alt={name} style={{
        width: size, height: size, borderRadius: "50%",
        objectFit: "cover", flexShrink: 0,
        border: "2px solid rgba(30,144,255,0.25)",
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 800, fontSize: size * 0.38,
      fontFamily: "'Archivo', sans-serif",
      border: "2px solid rgba(30,144,255,0.25)",
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
  const dark = useDarkMode();
  const C = useColors(dark);
  useFonts();

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  const connectWs = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }

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
              id: data.id, sender_id: data.sender_id, content: data.content,
              is_mine: data.is_mine, is_read: data.is_mine, created_at: data.created_at,
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
            return [{ user_id: partnerId, full_name: data.sender_name, profile_picture: data.sender_picture, last_message: data.content, unread_count: data.is_mine ? 0 : 1, is_online: true }, ...prev];
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
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connectWs]);

  useEffect(() => { loadChats(); }, []);

  useEffect(() => {
    const to = searchParams.get("to");
    const name = searchParams.get("name");
    if (to) { openChat(Number(to), name || "İstifadəçi"); setSearchParams({}, { replace: true }); }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChats = async () => {
    try { const res = await api.get("/messages"); setChats(res.data); } catch {}
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
          id: res.data.id, content: res.data.content, is_mine: true, is_read: false, created_at: res.data.created_at,
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
      if (err.response?.status === 403) toast.error(detail || "Yalnız bağlantılarınıza mesaj göndərə bilərsiniz");
    }
    setSending(false);
  };

  return (
    <div style={{
      maxWidth: isMobile ? "100%" : 980,
      margin: "0 auto",
      padding: isMobile ? 0 : "24px 20px",
      fontFamily: "'Archivo', sans-serif",
    }}>
      {!isMobile && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
              color: ACCENT, fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
            }}>MESSAGES</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
            {t("messages_title")}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{t("messages_subtitle")}</p>
        </div>
      )}

      <div style={{
        display: "flex",
        height: isMobile ? "calc(100dvh - 60px)" : "calc(100vh - 70px)",
        background: C.surface,
        border: isMobile ? "none" : `1px solid ${C.border}`,
        borderRadius: isMobile ? 0 : 20,
        overflow: "hidden",
        boxShadow: isMobile ? "none" : (dark ? "0 8px 48px rgba(0,0,0,0.5)" : "0 8px 32px rgba(7,20,40,0.08)"),
      }}>

        {/* Sidebar */}
        <div style={{
          width: isMobile ? "100%" : 290,
          borderRight: `1px solid ${C.border}`,
          background: C.surface,
          display: isMobile ? (activeChat ? "none" : "flex") : "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflowY: "auto",
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.09em",
              color: C.muted, textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {t("messages_chats")}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: wsReady ? "#34d399" : "#f59e0b",
                display: "inline-block",
                boxShadow: wsReady ? "0 0 6px #34d399" : "none",
              }} />
              <span style={{
                fontSize: 10, color: wsReady ? "#34d399" : "#f59e0b",
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              }}>
                {wsReady ? "LIVE" : "..."}
              </span>
            </div>
          </div>

          {chats.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px", textAlign: "center" }}>
              <div style={{
                width: 52, height: 52,
                background: "rgba(30,144,255,0.08)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
                border: "1px solid rgba(30,144,255,0.15)",
              }}>
                <MessageCircle size={22} color={ACCENT} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{t("messages_empty")}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{t("messages_empty_sub")}</p>
            </div>
          ) : chats.map((chat) => {
            const isActive = activeChat?.userId === chat.user_id;
            return (
              <div
                key={chat.user_id}
                onClick={() => openChat(chat.user_id, chat.full_name, chat.profile_picture, chat.last_seen, chat.is_online)}
                style={{
                  padding: "11px 14px", cursor: "pointer",
                  borderBottom: `1px solid ${C.border}`,
                  background: isActive ? "rgba(30,144,255,0.08)" : "transparent",
                  borderLeft: `3px solid ${isActive ? ACCENT : "transparent"}`,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : "rgba(30,144,255,0.04)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={chat.full_name} picture={chat.profile_picture} size={42} />
                    {chat.is_online && (
                      <span style={{
                        position: "absolute", bottom: 1, right: 1,
                        width: 9, height: 9, borderRadius: "50%",
                        background: "#34d399", border: `2px solid ${C.surface}`,
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span style={{
                        fontWeight: chat.unread_count > 0 ? 800 : 600,
                        fontSize: 13, color: isActive ? ACCENT : C.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontFamily: "'Archivo', sans-serif",
                        transition: "color 0.15s",
                      }}>
                        {chat.full_name}
                      </span>
                      {chat.unread_count > 0 && (
                        <span style={{
                          background: ACCENT, color: "#fff", borderRadius: 99,
                          fontSize: 10, fontWeight: 700,
                          padding: "2px 7px", flexShrink: 0,
                          fontFamily: "'JetBrains Mono', monospace",
                          boxShadow: "0 2px 8px rgba(30,144,255,0.40)",
                        }}>
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 12, color: C.muted, margin: 0, marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {chat.last_message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat pane */}
        <div style={{
          flex: 1,
          display: isMobile && !activeChat ? "none" : "flex",
          flexDirection: "column",
          minWidth: 0,
          background: C.chatBg,
        }}>
          {activeChat ? (
            <>
              {/* Chat header */}
              <div style={{
                padding: "12px 18px",
                borderBottom: `1px solid ${C.border}`,
                background: C.surface,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                {isMobile && (
                  <button onClick={() => setActiveChat(null)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.muted, padding: 4, display: "flex",
                    transition: "color 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                    onMouseLeave={e => e.currentTarget.style.color = C.muted}
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div style={{ position: "relative" }}>
                  <Avatar name={activeChat.fullName} picture={activeChat.picture} size={38} />
                  {activeChat.isOnline && (
                    <span style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 9, height: 9, borderRadius: "50%",
                      background: "#34d399", border: `2px solid ${C.surface}`,
                    }} />
                  )}
                </div>
                <div>
                  <p style={{
                    fontWeight: 800, fontSize: 14, color: C.text, margin: 0,
                    fontFamily: "'Archivo', sans-serif",
                  }}>{activeChat.fullName}</p>
                  {(() => {
                    const active = activeChat.isOnline || isActiveNow(activeChat.lastSeen);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Circle size={6} fill={active ? "#34d399" : C.muted} color="transparent" />
                        <span style={{
                          fontSize: 11,
                          color: active ? "#34d399" : C.muted,
                          fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                        }}>
                          {active ? t("messages_active") : formatLastSeen(activeChat.lastSeen)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Messages list */}
              <div style={{
                flex: 1, overflowY: "auto",
                padding: "20px 20px 8px",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.is_mine ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: msg.is_mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: msg.is_mine ? ACCENT : C.surface,
                      color: msg.is_mine ? "#fff" : C.text,
                      boxShadow: msg.is_mine
                        ? "0 4px 16px rgba(30,144,255,0.30)"
                        : (dark ? "none" : "0 2px 8px rgba(7,20,40,0.07)"),
                      border: msg.is_mine ? "none" : `1px solid ${C.border}`,
                    }}>
                      <p style={{
                        fontSize: 14, lineHeight: 1.55, margin: 0,
                        wordBreak: "break-word", fontFamily: "'Archivo', sans-serif",
                      }}>{msg.content}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 5 }}>
                        <span style={{
                          fontSize: 10,
                          color: msg.is_mine ? "rgba(255,255,255,0.65)" : C.muted,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {formatBakuHM(msg.created_at)}
                        </span>
                        {msg.is_mine && (
                          <CheckCheck size={12} color={msg.is_read ? "#38bdf8" : "rgba(255,255,255,0.45)"} />
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
                style={{
                  padding: "12px 16px",
                  borderTop: `1px solid ${C.border}`,
                  background: C.surface,
                  display: "flex", gap: 10, alignItems: "center",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder={t("messages_placeholder")}
                  style={{
                    flex: 1, padding: "11px 18px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 28, fontSize: 14,
                    color: C.text,
                    background: C.chatBg,
                    outline: "none",
                    fontFamily: "'Archivo', sans-serif",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = ACCENT;
                    e.target.style.boxShadow = "0 0 0 3px rgba(30,144,255,0.12)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = C.border;
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim() || sending}
                  style={{
                    width: 44, height: 44, borderRadius: "50%",
                    border: "none", flexShrink: 0,
                    background: newMsg.trim() && !sending ? ACCENT : C.chatBg,
                    border: newMsg.trim() && !sending ? "none" : `1px solid ${C.border}`,
                    color: newMsg.trim() && !sending ? "#fff" : C.muted,
                    cursor: newMsg.trim() && !sending ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: newMsg.trim() && !sending ? "0 4px 14px rgba(30,144,255,0.35)" : "none",
                    transition: "background 0.15s, box-shadow 0.15s",
                  }}
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          ) : (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "0 24px", textAlign: "center",
            }}>
              <div style={{
                width: 68, height: 68,
                background: "rgba(30,144,255,0.10)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18,
                border: "1px solid rgba(30,144,255,0.20)",
              }}>
                <MessageCircle size={28} color={ACCENT} />
              </div>
              <p style={{
                fontWeight: 900, fontSize: 16, color: C.text, margin: 0,
                fontFamily: "'Archivo', sans-serif",
              }}>{t("messages_select")}</p>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 8, maxWidth: 280, lineHeight: 1.6 }}>
                {t("messages_select_sub")}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
