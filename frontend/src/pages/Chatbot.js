import React, { useState, useRef, useEffect } from "react";
import { queryModel } from "../utils/queryModel";

// ✅ Voice utils: click-only speak, stop, STT, and locale helper
import { speakFromUserGesture,speakSmart, stopAllTTS, listen, localeFor } from "../utils/voice";

import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  LogOut,
  Send,
  Menu,
  X,
  Leaf,
  Sparkles,
  Edit2,
  Mic,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Chatbot() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Read-aloud state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingCtlRef = useRef(null);
  // UI language: 'auto' | 'en' | 'hi' | 'te'
  const [lang, setLang] = useState("auto");

  const messagesEndRef = useRef(null);

  // Get last assistant message (return full object)
  const getLastAssistantMessage = () => {
    const active = chatHistory.find((c) => c.id === activeChatId);
    if (!active) return null;
    for (let i = active.messages.length - 1; i >= 0; i--) {
      if (active.messages[i].role === "assistant") return active.messages[i];
    }
    return null;
  };

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const currentUser = localStorage.getItem("current_user");
    if (!token || !currentUser) {
      window.location.href = "/login";
      return;
    }
    setUser(JSON.parse(currentUser));
  }, []);

  // Load chats
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) {
      const parsed = JSON.parse(saved);
      setChatHistory(parsed);
      setActiveChatId(parsed[0]?.id || null);
    } else {
      const seed = [
        {
          id: Date.now(),
          title: "Crop Disease Diagnosis",
          date: "Today",
          messages: [{ role: "assistant", content: "Hello! How can I help with your crops?" }],
        },
      ];
      setChatHistory(seed);
      setActiveChatId(seed[0].id);
      localStorage.setItem("chatHistory", JSON.stringify(seed));
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, activeChatId]);

  const activeChat = chatHistory.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  const filteredChatHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveChats = (updated) => {
    setChatHistory(updated);
    localStorage.setItem("chatHistory", JSON.stringify(updated));
  };

  // Send message (text)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", content: inputValue };

    const updatedChats = chatHistory.map((chat) =>
      chat.id === activeChatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
    );
    saveChats(updatedChats);
    setInputValue("");

    try {
      const { output, lang: replyLang } = await queryModel({
        prompt: userMessage.content,
        lang,
      });

      // Store reply with detected language so the button can read in that lang
      const assistantMessage = { role: "assistant", content: output, replyLang };

      const updatedWithReply = updatedChats.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      );
      saveChats(updatedWithReply);

      // 🔇 IMPORTANT: No autoplay here. Read Aloud will only happen on button click.
    } catch (err) {
      console.error("Error fetching model response:", err);
      const errorMsg = {
        role: "assistant",
        content: "❌ Failed to get response from AI model. Please try again.",
      };
      const updatedWithError = updatedChats.map((chat) =>
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMsg] } : chat
      );
      saveChats(updatedWithError);
    }
  };

  // New chat
  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      date: "Today",
      messages: [
        {
          role: "assistant",
          content: "Hello! I'm AgriBot, your AI farming assistant. How can I help you today?",
        },
      ],
    };
    const updated = [newChat, ...chatHistory];
    saveChats(updated);
    setActiveChatId(newChat.id);
  };

  // Delete chat
  const handleDeleteChat = (id) => {
    const updated = chatHistory.filter((c) => c.id !== id);
    saveChats(updated);
    if (activeChatId === id) setActiveChatId(updated[0]?.id || null);
  };

  // Rename chat
  const handleRenameChat = (id) => {
    const newTitle = prompt("Enter new chat title:");
    if (!newTitle) return;
    const updated = chatHistory.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
    saveChats(updated);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
    window.location.href = "/login";
  };

  // Mic: capture speech in selected language and put into input
  const handleMic = async () => {
    try {
      // Prevent TTS and STT overlapping
      stopAllTTS();
      const sttLocale = localeFor(lang === "auto" ? "en" : lang);
      const heard = await listen(sttLocale);
      setInputValue(heard || "");
    } catch (e) {
      console.error("STT error:", e);
    }
  };

  // // Read aloud toggle: click -> read last reply; click again -> stop
  // const handleSpeakLast = async () => {
  //   const last = getLastAssistantMessage();
  //   if (!last) return;

  //   // Toggle: if currently speaking, stop
  //   if (isSpeaking) {
  //     stopAllTTS();
  //     setIsSpeaking(false);
  //     return;
  //   }

  //   // Pick language: prefer message.replyLang; otherwise UI choice
  //   const replyLanguage = last.replyLang || lang || "te"; // default to te if you want Telugu by default
  //   const langCode = replyLanguage === "auto" ? "te" : replyLanguage; // force te if auto

  //   try {
  //     // Start speaking on user gesture (this click)
  //     await speakFromUserGesture(last.content, langCode);
  //     // We don't get a "done" signal from browsers, so we mark speaking true briefly.
  //     setIsSpeaking(true);

  //     // Optional: rough timer to reset the icon; tweak multiplier as needed
  //     const approxMs = Math.min(15000, Math.max(2000, last.content.length * 40));
  //     setTimeout(() => setIsSpeaking(false), approxMs);
  //   } catch (e) {
  //     console.error("TTS error:", e);
  //     setIsSpeaking(false);
  //   }
  // };
  const handleSpeakLast = async () => {
  if (isSpeaking && speakingCtlRef.current) {
    speakingCtlRef.current.stop();
    speakingCtlRef.current = null;
    setIsSpeaking(false);
    return;
  }
  const last = getLastAssistantMessage();
  if (!last) return;

  const replyLanguage = last.replyLang || lang; // 'te' | 'hi' | 'en'
  const ctl = speakSmart(last.content, replyLanguage); // Telugu will auto-fallback online
  speakingCtlRef.current = ctl;
  setIsSpeaking(true);
  try { await ctl.done; } finally {
    speakingCtlRef.current = null;
    setIsSpeaking(false);
  }
};

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
            transition={{ duration: 0.3 }}
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
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
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

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Recent Chats
              </h3>
              <div className="space-y-2">
                {filteredChatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors group ${
                      chat.id === activeChatId ? "bg-gray-800" : ""
                    }`}
                    onClick={() => setActiveChatId(chat.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{chat.date}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameChat(chat.id);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
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
            <h1 className="text-lg font-semibold text-gray-900">AgriBot Chat</h1>
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
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}
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
                  <p className="text-[15px] leading-relaxed">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-700 font-medium">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
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
                    ? "कृषि से जुड़ा कुछ भी पूछें..."
                    : lang === "te"
                    ? "వ్యవసాయం గురించి ఏదైనా అడగండి..."
                    : "Ask me anything about farming..."
                }
                className="flex-1 h-14 px-6 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
              />

              {/* Read-aloud toggle button (click-only, no autoplay) */}
              {(() => {
                const last = getLastAssistantMessage();
                const hasLast = !!last;
                const title =
                  !hasLast
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
                      hasLast ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
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

              <Button
                type="submit"
                className="h-14 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                title="Send"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>

            <p className="text-xs text-gray-500 mt-3 text-center">
              All chats are saved in your browser. Tip: set the language to हिन्दी/తెలుగు
              before using the mic for best transcription.
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
