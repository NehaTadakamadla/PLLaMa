import React, { useState, useRef, useEffect } from "react";
import { queryModel } from "../utils/queryModel"; // Ensure this points to your correct utils path
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { LlamaOutput } from "../utils/LlamaOutput";

export default function Chatbot() {
  const [user, setUser] = useState(null);

  const [showYolo, setShowYolo] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const titleInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // YOLO detection states and functions
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detections, setDetections] = useState([]);
  const [detecting, setDetecting] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filePreview = URL.createObjectURL(file);

    // 1️⃣ Show uploaded image immediately in chat
    const userImageMessage = {
      role: "user",
      content: { imageUrl: filePreview },
    };

    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, userImageMessage] }
          : chat
      )
    );

    const activeChat = chatHistory.find((chat) => chat.id === activeChatId);

    // 2️⃣ Send image to YOLO backend
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Detection failed");
      const data = await res.json();

      // 3️⃣ Prepare YOLO detection text
      const yoloText = `🧠 YOLO detected: ${data.detections
        .map((d) => `${d.class} (${d.confidence}%)`)
        .join(", ")}`;

      // 4️⃣ Create YOLO assistant messages
      const yoloMessages = [
        { role: "assistant", content: yoloText },
        { role: "assistant", content: { imageUrl: data.annotated_image } },
      ];

      // 5️⃣ Update frontend chat
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, ...yoloMessages] }
            : chat
        )
      );

      // 6️⃣ Save everything (user image + YOLO detections) to MongoDB
      if (activeChat) {
        await fetch(
          `http://localhost:5000/api/history/conversations/${activeChatId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify({
              title: activeChat.title,
              messages: [
                ...activeChat.messages,
                userImageMessage,
                ...yoloMessages,
              ],
            }),
          }
        );
      }
    } catch (error) {
      console.error("❌ YOLO detection failed:", error);
      alert("Something went wrong while detecting.");
    }
  };

  const API_BASE = "http://localhost:5000/api/history";

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const currentUser = localStorage.getItem("current_user");

    if (!token || !currentUser) {
      window.location.href = "/login";
      return;
    }

    setUser(JSON.parse(currentUser));
  }, []);

  // Load chats from server
  const fetchChats = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations.map((c) => ({
          id: c._id,
          title: c.title || "New Chat",
          date: new Date(c.createdAt).toLocaleDateString(),
          messages: c.messages || [],
        }));
        setChatHistory(convs);
        if (convs.length > 0 && !activeChatId) {
          setActiveChatId(convs[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations from server:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, chatHistory]);

  const activeChat = chatHistory.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages || [];

  const filteredChatHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateConversation = async (convId, payload) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return false;

    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to update conversation:", err);
      return false;
    }
  };

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
      if (res.ok) {
        const data = await res.json();
        return data.conversation;
      }
      return null;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  };

  const deleteConversation = async (convId) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return false;

    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      return false;
    }
  };

  // Refetch chats after mutations
  const refetchChats = () => {
    fetchChats();
  };

  const handleSaveTitle = async (id) => {
    const trimmedTitle = tempTitle.trim();
    if (!trimmedTitle) {
      setEditingChatId(null);
      setTempTitle("");
      setOriginalTitle("");
      return;
    }

    const currentChat = chatHistory.find((c) => c.id === id);
    if (!currentChat) return;

    // Optimistic update
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, title: trimmedTitle } : chat
      )
    );

    const success = await updateConversation(id, {
      title: trimmedTitle,
      messages: currentChat.messages,
    });

    if (!success) {
      // Rollback
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === id ? { ...chat, title: originalTitle } : chat
        )
      );
      alert("Failed to update title. Please try again.");
    }

    setEditingChatId(null);
    setTempTitle("");
    setOriginalTitle("");
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || submitting || !activeChatId) return;

    setSubmitting(true);
    const userMessage = { role: "user", content: String(inputValue) };

    // Optimistically add user message
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );
    setInputValue("");

    try {
      // Get AI reply
      // Read latest current_user from localStorage (Login/SignIn now store full profile)
      const stored = localStorage.getItem("current_user");
      let currentUser = null;
      try {
        currentUser = stored ? JSON.parse(stored) : null;
      } catch (err) {
        currentUser = null;
      }

      const user_location = currentUser?.location || "india";
      // user_name from stored profile or fallback to 'User'
      const user_name = currentUser?.username || "User";
      const chat_id = activeChatId;

      const aiResponse = await queryModel({
        user_query: inputValue,
        user_id: chat_id,
        user_location,
        user_name,
        use_web_search: useWebSearch,
      });
      const assistantMessage = {
        role: "assistant",
        content: String(aiResponse),
      };

      // Optimistically add assistant message
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );

      // Update on server
      const activeChatCopy = {
        ...activeChat,
        messages: [...messages, userMessage, assistantMessage],
      };
      const success = await updateConversation(activeChatId, {
        title: activeChatCopy.title,
        messages: activeChatCopy.messages,
      });

      if (!success) {
        throw new Error("Server update failed");
      }
    } catch (err) {
      console.error("Error fetching model response or updating:", err);
      const errorMessage = {
        role: "assistant",
        content: "❌ Failed to get response from AI model. Please try again.",
      };

      // Rollback to add error message instead
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [...chat.messages.slice(0, -1), errorMessage],
              } // Remove optimistic assistant, add error
            : chat
        )
      );

      // Still try to save the user msg + error
      const activeChatCopy = {
        ...activeChat,
        messages: [...messages, userMessage, errorMessage],
      };
      await updateConversation(activeChatId, {
        title: activeChatCopy.title,
        messages: activeChatCopy.messages,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // New chat
  const handleNewChat = async () => {
    if (submitting) return;

    // Compute next numbered title
    let nextNum = 1;
    chatHistory.forEach((chat) => {
      const match = chat.title.match(/^New Chat (\d+)$/);
      if (match) {
        nextNum = Math.max(nextNum, parseInt(match[1]) + 1);
      }
    });
    const newTitle = `New Chat ${nextNum}`;

    const newPayload = {
      title: newTitle,
      messages: [
        {
          role: "assistant",
          content:
            "Hello! I'm AgriBot, your AI farming assistant. How can I help you today?",
        },
      ],
    };

    const newConv = await createConversation(newPayload);
    if (newConv) {
      // Add to state immediately
      const newChat = {
        id: newConv._id,
        title: newConv.title,
        date: new Date(newConv.createdAt).toLocaleDateString(),
        messages: newConv.messages,
      };
      setChatHistory((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } else {
      alert("Failed to create new chat. Please try again.");
    }
  };

  // Start rename (inline edit)
  const handleStartRename = (id) => {
    if (submitting) return;

    const currentChat = chatHistory.find((chat) => chat.id === id);
    if (!currentChat) return;

    setOriginalTitle(currentChat.title);
    setTempTitle(currentChat.title);
    setEditingChatId(id);

    // Focus input after render
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);
  };

  // Delete chat
  const handleDeleteChat = async (id) => {
    if (submitting || editingChatId) return;

    // Optimistically remove from state
    const wasActive = id === activeChatId;
    const optimisticHistory = chatHistory.filter((chat) => chat.id !== id);
    setChatHistory(optimisticHistory);

    if (wasActive) {
      const newActiveId = optimisticHistory[0]?.id || null;
      setActiveChatId(newActiveId);
    }

    const success = await deleteConversation(id);
    if (!success) {
      // Rollback on failure
      setChatHistory(chatHistory);
      if (wasActive) {
        setActiveChatId(id);
      }
      alert("Failed to delete chat. Please try again.");
    } else {
      // Refetch to ensure sync
      refetchChats();
    }
  };

  // Rename chat (now starts inline edit)
  const handleRenameChat = (id) => {
    handleStartRename(id);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
    window.location.href = "/login";
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
                disabled={submitting || editingChatId !== null}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
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
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            chat.id === activeChatId ? "bg-gray-800" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
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
                                handleRenameChat(chat.id);
                              }}
                              disabled={submitting || editingChatId !== null}
                            >
                              <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
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

            {/* Footer */}
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
                    {user?.username || "User"}
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
                              alt="YOLO Detection Result"
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

        <div className="border-t border-gray-200 bg-white p-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  activeChatId
                    ? "Ask me anything about farming..."
                    : "Select a chat to message"
                }
                disabled={!activeChatId || submitting}
                className="flex-1 h-14 px-6 text-base border-gray-300 focus:border-green-500 focus:ring-green-500 disabled:opacity-50"
              />
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
                  disabled={!activeChatId || !inputValue.trim() || submitting}
                  className="h-10 w-10 rounded bg-gradient-to-r flex items-center justify-center from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
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
