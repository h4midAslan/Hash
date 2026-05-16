import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, MessageCircle, ArrowLeft, Circle } from "lucide-react";
import api from "../api/client";
import { formatBakuHM, isActiveNow, formatLastSeen } from "../utils/time";
import { useLang } from "../hooks/useLang";
import { useIsMobile } from "../hooks/useIsMobile";

export default function Messages() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadChats();
  }, []);

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
    } catch (err) {}
  };

  const openChat = async (userId, fullName, lastSeen = null) => {
    setActiveChat({ userId, fullName, lastSeen });
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
      loadChats();
      if (!lastSeen) {
        try {
          const userRes = await api.get(`/users/${userId}`);
          setActiveChat((prev) => prev && prev.userId === userId ? { ...prev, lastSeen: userRes.data.last_seen } : prev);
        } catch (err) {}
      }
    } catch (err) {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;
    try {
      await api.post(`/messages/${activeChat.userId}`, { content: newMsg });
      setNewMsg("");
      const res = await api.get(`/messages/${activeChat.userId}`);
      setMessages(res.data);
    } catch (err) {}
  };

  const { t } = useLang();
  const isMobile = useIsMobile();

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 900, margin: "0 auto", padding: isMobile ? "0" : "32px 16px" }}>
      {!isMobile && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{t("messages_title")}</h2>
          <p style={{ fontSize: 13, color: "#999", marginTop: 4, marginBottom: 0 }}>{t("messages_subtitle")}</p>
        </div>
      )}

      <div style={{ display: "flex", height: isMobile ? "calc(100vh - 60px)" : 560, border: isMobile ? "none" : "1px solid #d4d4d4", background: "#fff", overflow: "hidden" }}>
        {/* Chat list sidebar */}
        <div
          style={{
            width: isMobile ? "100%" : 260,
            borderRight: isMobile ? "none" : "1px solid #d4d4d4",
            overflowY: "auto",
            flexShrink: 0,
            display: isMobile ? (activeChat ? "none" : "flex") : "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #d4d4d4" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>{t("messages_chats")}</span>
          </div>

          {chats.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#999", padding: "0 20px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <MessageCircle size={24} color="#bbb" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#666", margin: 0 }}>{t("messages_empty")}</p>
              <p style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{t("messages_empty_sub")}</p>
            </div>
          )}

          {chats.map((chat) => {
            const isActive = activeChat?.userId === chat.user_id;
            return (
              <div
                key={chat.user_id}
                onClick={() => openChat(chat.user_id, chat.full_name, chat.last_seen)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid #ececec",
                  borderLeft: isActive ? "2px solid #1a4a8a" : "2px solid transparent",
                  background: isActive ? "#eef3fb" : "transparent",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f5f5f5"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, background: "#1a4a8a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {chat.full_name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{chat.full_name}</span>
                      {chat.unread_count > 0 && (
                        <span style={{ background: "#1a4a8a", color: "#fff", fontSize: 11, fontWeight: 700, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#999", margin: 0, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.last_message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message area */}
        <div style={{ flex: 1, display: isMobile && !activeChat ? "none" : "flex", flexDirection: "column", minWidth: 0 }}>
          {activeChat ? (
            <>
              {/* Chat header */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #d4d4d4", background: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setActiveChat(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: 4, display: "flex", alignItems: "center" }}
                >
                  <ArrowLeft size={18} />
                </button>
                <div style={{ width: 36, height: 36, background: "#1a4a8a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {activeChat.fullName?.charAt(0)}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", margin: 0 }}>{activeChat.fullName}</p>
                  {(() => {
                    const active = isActiveNow(activeChat.lastSeen);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        <Circle size={7} fill={active ? "#22c55e" : "#9ca3af"} color={active ? "#22c55e" : "#9ca3af"} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: active ? "#22c55e" : "#999" }}>
                          {active ? t("messages_active") : formatLastSeen(activeChat.lastSeen)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Messages list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#fafafa", display: "flex", flexDirection: "column", gap: 8 }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.is_mine ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        background: msg.is_mine ? "#1a4a8a" : "#f0f0f0",
                        color: msg.is_mine ? "#fff" : "#222",
                      }}
                    >
                      <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                      <p style={{ fontSize: 11, marginTop: 4, marginBottom: 0, color: msg.is_mine ? "rgba(255,255,255,0.65)" : "#999" }}>
                        {formatBakuHM(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <form
                onSubmit={sendMessage}
                style={{ padding: "10px 14px", borderTop: "1px solid #d4d4d4", background: "#fff", display: "flex", gap: 10, alignItems: "center" }}
              >
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={t("messages_placeholder")}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    border: inputFocused ? "1px solid #1a4a8a" : "1px solid #ccc",
                    fontSize: 14,
                    color: "#1a1a1a",
                    background: "#fff",
                    outline: "none",
                    borderRadius: 2,
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim()}
                  style={{
                    background: newMsg.trim() ? "#1a4a8a" : "#a0b4d0",
                    color: "#fff",
                    border: "none",
                    padding: "9px 14px",
                    cursor: newMsg.trim() ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                  }}
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#999", padding: "0 24px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: "#eef3fb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <MessageCircle size={28} color="#1a4a8a" />
              </div>
              <p style={{ fontWeight: 600, fontSize: 16, color: "#1a1a1a", margin: 0 }}>{t("messages_select")}</p>
              <p style={{ fontSize: 13, color: "#999", marginTop: 6 }}>{t("messages_select_sub")}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
