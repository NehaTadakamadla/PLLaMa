// frontend/src/pages/Chatbot.js
import React, { useState, useRef, useEffect } from "react";
import { queryModel } from "../utils/queryModel";
import {
  speakFromUserGesture,
  speakSmart,
  stopAllTTS,
  listen,
  localeFor,
} from "../utils/voice";

import {
  MessageSquare,
  Plus,
  Search,
  Globe,
  Trash2,
  LogOut,
  Send,
  Menu,
  X,
  Leaf,
  Sparkles,
  Edit2,
  Check,
  Mic,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { LlamaOutput } from "../utils/LlamaOutput";

/*
  Complete Chatbot.js
  - YOLO + PLLaMA
  - Multilingual UI + auto-translate
  - Mic (STT) + TTS
  - Inline rename, delete, search
  - Backend CRUD via API_BASE
*/

export default function Chatbot() {
  // Core UI & data
  const [user, setUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);

  // Layout & state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editingChatId, setEditingChatId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const titleInputRef = useRef(null);

  // YOLO
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detections, setDetections] = useState([]);
  const [detecting, setDetecting] = useState(false);

  // Voice & Multilingual
  const [lang, setLang] = useState("auto"); // 'auto' | 'en' | 'hi' | 'te'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingCtlRef = useRef(null);

  // Scroll & refs
  const messagesEndRef = useRef(null);

  // API endpoints
  const API_BASE = "http://localhost:5000/api/history";
  const TRANSLATE_API = "http://localhost:5000/api/translate";

  // Derived
  const activeChat = chatHistory.find((c) => c.id === activeChatId) || null;
  const messages = activeChat?.messages || [];

  // -----------------------
  // Helper: translation util
  // -----------------------
  const translateText = async (text, targetLang = "en") => {
    // If targetLang is 'auto' or 'en' => no-op for sending to PLLaMA (we require English)
    if (!text) return text;
    try {
      const res = await fetch(TRANSLATE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_lang: targetLang }),
      });
      if (!res.ok) {
        console.warn("Translate API returned non-ok:", res.status);
        return text;
      }
      const json = await res.json();
      return json.translated_text ?? text;
    } catch (e) {
      console.warn("Translation failed, falling back:", e);
      return text;
    }
  };

  // -----------------------
  // Auth + initial load
  // -----------------------
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const cuRaw = localStorage.getItem("current_user");
    if (!token || !cuRaw) {
      // redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }
    try {
      setUser(JSON.parse(cuRaw));
    } catch {
      setUser(null);
    }
  }, []);

  // fetch conversations from server
  const fetchChats = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.warn("Failed to fetch conversations:", res.status);
        setChatHistory([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const convs = (data.conversations || []).map((c) => ({
        id: c._id,
        title: c.title || "New Chat",
        date: c.createdAt
          ? new Date(c.createdAt).toLocaleDateString()
          : "Unknown",
        messages: c.messages || [],
      }));
      setChatHistory(convs);
      if (!activeChatId && convs.length > 0) setActiveChatId(convs[0].id);
    } catch (e) {
      console.error("fetchChats error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, chatHistory]);

  // -----------------------
  // Backend CRUD helpers
  // -----------------------
  const createConversation = async (payload) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.conversation ?? null;
    } catch (e) {
      console.error("createConversation error:", e);
      return null;
    }
  };

  const updateConversation = async (id, payload) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (e) {
      console.error("updateConversation error:", e);
      return false;
    }
  };

  const deleteConversation = async (id) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch (e) {
      console.error("deleteConversation error:", e);
      return false;
    }
  };

  // -----------------------
  // Rename / Inline edit helpers
  // -----------------------
  const handleStartRename = (id) => {
    if (submitting) return;
    const c = chatHistory.find((ch) => ch.id === id);
    if (!c) return;
    setOriginalTitle(c.title || "");
    setTempTitle(c.title || "");
    setEditingChatId(id);
    // focus after render
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);
  };

  const handleSaveTitle = async (id) => {
    const trimmed = (tempTitle || "").trim();
    if (!trimmed) {
      setEditingChatId(null);
      setTempTitle("");
      setOriginalTitle("");
      return;
    }
    const current = chatHistory.find((c) => c.id === id);
    if (!current) return;
    // optimistic update
    setChatHistory((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
    );
    const ok = await updateConversation(id, {
      title: trimmed,
      messages: current.messages,
    });
    if (!ok) {
      // rollback
      setChatHistory((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: originalTitle } : c))
      );
      alert("Failed to update chat title, please try again.");
    }
    setEditingChatId(null);
    setTempTitle("");
    setOriginalTitle("");
  };

  // -----------------------
  // New chat, delete chat
  // -----------------------
  const handleNewChat = async () => {
    if (submitting) return;
    // find next number
    let next = 1;
    chatHistory.forEach((c) => {
      const m = (c.title || "").match(/^New Chat(?: )?(\d+)?$/);
      if (m && m[1]) {
        next = Math.max(next, parseInt(m[1], 10) + 1);
      }
    });
    const title = `New Chat ${next}`;
    const payload = {
      title,
      messages: [
        {
          role: "assistant",
          content:
            "Hello! I'm AgriBot, your AI farming assistant. How can I help you today?",
        },
      ],
    };
    const conv = await createConversation(payload);
    if (conv) {
      const newC = {
        id: conv._id,
        title: conv.title,
        date: new Date(conv.createdAt).toLocaleDateString(),
        messages: conv.messages,
      };
      setChatHistory((prev) => [newC, ...prev]);
      setActiveChatId(newC.id);
    } else {
      alert("Failed to create new chat. Try again.");
    }
  };

  const handleDeleteChat = async (id) => {
    if (submitting || editingChatId) return;

    // ✅ Ask for user confirmation before deleting (using window.confirm)
    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?"
    );
    if (!confirmed) return;

    const wasActive = id === activeChatId;

    // Optimistically remove from UI
    const optimistic = chatHistory.filter((c) => c.id !== id);
    setChatHistory(optimistic);
    if (wasActive) setActiveChatId(optimistic[0]?.id || null);

    const ok = await deleteConversation(id);

    if (!ok) {
      // Rollback on failure
      alert("❌ Failed to delete chat. Please try again.");
      await fetchChats();
    } else {
      // Refresh on success
      await fetchChats();
    }
  };

  // -----------------------
  // Search filter
  // -----------------------
  const filteredChatHistory = chatHistory.filter((c) =>
    (c.title || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  // -----------------------
  // YOLO upload & PLLaMA flow
  // -----------------------
  const handleFileUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!activeChatId) {
      alert("Please select or create a chat first.");
      return;
    }

    // show immediate preview
    const previewUrl = URL.createObjectURL(file);
    const userImageMsg = { role: "user", content: { imageUrl: previewUrl } };
    setChatHistory((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, userImageMsg] }
          : c
      )
    );

    // send to YOLO backend
    const form = new FormData();
    form.append("file", file);

    try {
      setDetecting(true);
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("YOLO predict failed: " + res.status);
      const data = await res.json();
      const detected = (data?.detections || []).map((d) => d.class);
      const summary = detected.length
        ? `🧠 YOLO detected: ${detected.join(", ")}`
        : "🧠 YOLO found no clear objects.";

      // craft prompt for PLLaMA
      const prompt = detected.length
        ? `Explain the following crop diseases or objects in detail: ${detected.join(
            ", "
          )}. Provide causes, symptoms, and preventive measures.`
        : `Detector found no clear object. Provide general guidance on photographing plant leaves for diagnosis and what info to collect.`;

      // Query PLLaMA (via queryModel util) — we send English prompts; if UI lang is non-en, we still send English.
      const stored = localStorage.getItem("current_user");
      const currentUser = stored ? JSON.parse(stored) : null;
      const user_location = currentUser?.location || "India";
      const user_name = currentUser?.username || "User";

      const plResponse = await queryModel({
        user_query: prompt,
        user_id: activeChatId,
        user_location,
        user_name,
        use_web_search: false,
      });

      // Translate plResponse back to UI language if needed
      let translatedReply = plResponse;
      if (lang !== "en" && lang !== "auto") {
        translatedReply = await translateText(plResponse, lang);
      }

      const assistantMessages = [
        { role: "assistant", content: summary },
        data?.annotated_image
          ? { role: "assistant", content: { imageUrl: data.annotated_image } }
          : null,
        { role: "assistant", content: translatedReply },
      ].filter(Boolean);

      // update UI
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, ...assistantMessages] }
            : c
        )
      );

      // Persist to backend (best-effort)
      try {
        const active = chatHistory.find((c) => c.id === activeChatId) || null;
        if (active) {
          await updateConversation(activeChatId, {
            title: active.title,
            messages: [...active.messages, userImageMsg, ...assistantMessages],
          });
        }
      } catch (persistErr) {
        console.warn("Failed to persist YOLO chat:", persistErr);
      }
    } catch (err) {
      console.error("YOLO upload error:", err);
      const failMsg = {
        role: "assistant",
        content: "❌ YOLO detection failed. Please try again.",
      };
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, failMsg] }
            : c
        )
      );
    } finally {
      setDetecting(false);
    }
  };

  // -----------------------
  // Voice: STT & TTS
  // -----------------------
  const handleMic = async () => {
    try {
      stopAllTTS();
      const sttLocale = localeFor(lang === "auto" ? "en" : lang);
      const heard = await listen(sttLocale);
      setInputValue(heard || "");
    } catch (e) {
      console.error("STT error:", e);
      alert("Speech recognition failed. Please try again.");
    }
  };

  const getLastAssistantMessage = () => {
    const active = chatHistory.find((c) => c.id === activeChatId);
    if (!active) return null;
    for (let i = active.messages.length - 1; i >= 0; i--) {
      if (active.messages[i].role === "assistant") return active.messages[i];
    }
    return null;
  };

  const handleSpeakLast = async () => {
    if (isSpeaking && speakingCtlRef.current) {
      try {
        speakingCtlRef.current.stop();
      } catch {}
      speakingCtlRef.current = null;
      setIsSpeaking(false);
      return;
    }
    const last = getLastAssistantMessage();
    if (!last) return;
    const replyLang = last.replyLang || lang || "en";
    const ctl = speakSmart(last.content, replyLang);
    speakingCtlRef.current = ctl;
    setIsSpeaking(true);
    try {
      await ctl.done;
    } catch (e) {
      console.warn("TTS error:", e);
    } finally {
      speakingCtlRef.current = null;
      setIsSpeaking(false);
    }
  };

  // -----------------------
  // Send text message (with auto-translation)
  // -----------------------
  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputValue.trim() || !activeChatId || submitting) return;
    setSubmitting(true);

    const userMessage = { role: "user", content: inputValue.trim() };

    // Optimistic UI update (add user message)
    setChatHistory((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      )
    );
    setInputValue("");

    try {
      // 1) Translate user input -> English if UI language is not English
      let textToSend = userMessage.content;
      if (lang !== "en" && lang !== "auto") {
        textToSend = await translateText(textToSend, "en");
      }

      // 2) Query PLLaMA
      const stored = localStorage.getItem("current_user");
      const currentUser = stored ? JSON.parse(stored) : null;
      const user_location = currentUser?.location || "India";
      const user_name = currentUser?.username || "User";

      const modelResp = await queryModel({
        user_query: textToSend,
        user_id: activeChatId,
        user_location,
        user_name,
        use_web_search: useWebSearch,
      });

      // 3) Translate reply -> UI language (if not English)
      let shownReply = modelResp;
      if (lang !== "en" && lang !== "auto") {
        shownReply = await translateText(modelResp, lang);
      }

      const assistantMessage = { role: "assistant", content: shownReply };

      // 4) Update UI with assistant message
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );

      // 5) Persist chat to backend
      try {
        const active = chatHistory.find((c) => c.id === activeChatId) || {
          messages: [],
        };
        const updatedPayload = {
          title: active.title,
          messages: [...active.messages, userMessage, assistantMessage],
        };
        await updateConversation(activeChatId, updatedPayload);
      } catch (persistErr) {
        console.warn("Failed to persist chat:", persistErr);
      }
    } catch (err) {
      console.error("send message error:", err);
      const errMsg = {
        role: "assistant",
        content: "❌ Failed to get response. Please try again.",
      };
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, errMsg] }
            : c
        )
      );
      try {
        const active = chatHistory.find((c) => c.id === activeChatId) || {
          messages: [],
        };
        await updateConversation(activeChatId, {
          title: active.title,
          messages: [...active.messages, userMessage, errMsg],
        });
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------
  // Logout helper
  // -----------------------
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
    window.location.href = "/login";
  };

  // -----------------------
  // Render
  // -----------------------
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.28 }}
            className="w-80 bg-gray-900 text-white flex flex-col fixed md:relative h-full z-40"
          >
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">AgriBot</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Button
                onClick={handleNewChat}
                disabled={submitting || editingChatId !== null}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" /> New Chat
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-gray-800 border-gray-700 pl-10 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Recent Chats
              </h3>

              {filteredChatHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No chats found. Create a new one to start!
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredChatHistory.map((chat) => {
                    if (chat.id === editingChatId) {
                      return (
                        <div
                          key={chat.id}
                          className={`w-full text-left p-3 rounded-lg ${
                            chat.id === activeChatId ? "bg-gray-800" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <Input
                                ref={titleInputRef}
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={() => handleSaveTitle(chat.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveTitle(chat.id);
                                  } else if (e.key === "Escape") {
                                    setEditingChatId(null);
                                    setTempTitle(originalTitle);
                                    setOriginalTitle("");
                                  }
                                }}
                                className="text-sm font-medium bg-transparent border-0 border-b border-gray-600 focus:border-white text-white p-0 h-auto"
                                autoFocus
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                {chat.date}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveTitle(chat.id)}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingChatId(null);
                                  setTempTitle(originalTitle);
                                  setOriginalTitle("");
                                }}
                                className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={chat.id}
                        className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors group ${
                          chat.id === activeChatId ? "bg-gray-800" : ""
                        }`}
                        onClick={() => setActiveChatId(chat.id)}
                        disabled={submitting || editingChatId !== null}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {chat.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {chat.date}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(chat.id);
                              }}
                              disabled={submitting || editingChatId !== null}
                            >
                              <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!confirm("Delete this chat?")) return;
                                handleDeleteChat(chat.id);
                              }}
                              disabled={submitting || editingChatId !== null}
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.full_name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.full_name || user?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <h1 className="text-lg font-semibold text-gray-900">
              {activeChat ? activeChat.title : "AgriBot Chat"}
            </h1>
          </div>

          {/* Language selector */}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-600">Language:</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              title="Select input/output language"
            >
              <option value="auto">Auto</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {activeChatId ? (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`px-5 py-4 rounded-2xl max-w-2xl ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="text-[15px] leading-relaxed">
                        {typeof message.content === "string" ? (
                          message.content
                        ) : message.content?.imageUrl ? (
                          <img
                            src={message.content.imageUrl}
                            alt="Uploaded"
                            className="rounded-xl border w-80 shadow-md cursor-pointer hover:opacity-90"
                          />
                        ) : null}
                      </p>
                    ) : message.role === "assistant" ? (
                      <>
                        {typeof message.content === "string" ? (
                          <LlamaOutput content={message.content} />
                        ) : message.content && message.content.imageUrl ? (
                          <div className="mt-3">
                            <img
                              src={message.content.imageUrl}
                              alt="YOLO result"
                              className="rounded-xl border w-80 shadow-md cursor-pointer hover:opacity-90"
                              onClick={() =>
                                window.open(message.content.imageUrl, "_blank")
                              }
                            />
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  {message.role === "user" && (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-700 font-medium">
                        {user?.full_name?.charAt(0).toUpperCase() ||
                          user?.email?.charAt(0).toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Select a chat or create a new one to start messaging.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />

            {submitting && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="px-5 py-4 bg-gray-100 rounded-2xl">
                  <p className="text-gray-500">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSendMessage}
              className="flex gap-3 items-center"
            >
              <button
                type="button"
                onClick={handleMic}
                className="h-14 w-14 flex items-center justify-center rounded-xl border border-gray-300 hover:bg-gray-50"
                title="Speak (uses selected language)"
              >
                <Mic className="w-5 h-5 text-gray-700" />
              </button>

              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  lang === "hi"
                    ? "कृषि से जुड़ा कुछ भी पूछें..."
                    : lang === "te"
                    ? "వ్యవసాయం గురించి ఏదైనా అడగండి..."
                    : "Ask me anything about farming..."
                }
                disabled={!activeChatId || submitting}
                className="flex-1 h-14 px-6 text-base border-gray-300 focus:border-green-500 focus:ring-green-500 disabled:opacity-50"
              />

              {/* Read-aloud toggle button */}
              {(() => {
                const last = getLastAssistantMessage();
                const hasLast = !!last;
                const title = !hasLast
                  ? "Nothing to read yet"
                  : isSpeaking
                  ? "Stop reading"
                  : "Read last reply";
                return (
                  <button
                    type="button"
                    onClick={handleSpeakLast}
                    disabled={!hasLast}
                    className={`h-14 w-14 flex items-center justify-center rounded-xl border border-gray-300 ${
                      hasLast
                        ? "hover:bg-gray-50"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    title={title}
                  >
                    {hasLast ? (
                      isSpeaking ? (
                        <Volume2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-gray-700" />
                      )
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                );
              })()}

              <div className="flex items-center gap-2">
                {/* File Upload Button */}
                <label className="h-10 w-10 flex items-center justify-center rounded bg-gray-100 text-gray-600 hover:opacity-90 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Web search toggle button */}
                <button
                  type="button"
                  onClick={() => setUseWebSearch((s) => !s)}
                  title="Toggle web search"
                  className={`h-10 w-10 flex items-center justify-center rounded ${
                    useWebSearch
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  } hover:opacity-90 transition-colors`}
                >
                  <Globe className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={
                    !activeChatId ||
                    (!inputValue.trim() && !selectedFile) ||
                    submitting
                  }
                  className="h-10 px-4 rounded bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-3 text-center">
              All chats are saved on the server. Tip: set the language to
              हिन्दी/తెలుగు before using the mic for best transcription.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
