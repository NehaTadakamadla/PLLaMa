import React, { useState, useRef, useEffect } from "react";
import { listen, speak, canUseVoice } from "../utils/voice";
import { queryModel } from "../utils/queryModel";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Chatbot() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm AgriBot, your AI farming assistant. How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: "Crop Disease Diagnosis", date: "Today" },
    { id: 2, title: "Soil pH Management", date: "Yesterday" },
    { id: 3, title: "Irrigation Scheduling", date: "2 days ago" }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      User.loginWithRedirect(window.location.origin + createPageUrl("Chatbot"));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.href = createPageUrl("Landing");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userText = inputValue.trim();
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInputValue("");

    // // Simulate bot response (non-functional, just for UI demo)
    // setTimeout(() => {
    //   setMessages([
    //     ...newMessages,
    //     {
    //       role: "assistant",
    //       content: "This is a UI demonstration. The chatbot is not connected to any backend or API."
    //     }
    //   ]);
    // }, 1000);

    const reply = await queryModel({ prompt: userText });
    setMessages([...newMessages, { role: "assistant", content: reply }]);
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm AgriBot, your AI farming assistant. How can I help you today?"
      }
    ]);
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
            {/* Sidebar Header */}
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
                  placeholder="Search chats..."
                  className="w-full bg-gray-800 border-gray-700 pl-10 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Recent Chats</h3>
              <div className="space-y-2">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{chat.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{chat.date}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all">
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Footer */}
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
        {/* Chat Header */}
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
        </header>

        {/* Messages Area */}
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
                  <div className="flex items-center gap-2">
                  <p className="text-[15px] leading-relaxed">{message.content}</p>

                  {message.role === "assistant" && canUseVoice() && (
                    <button
                      onClick={() => speak(message.content)}
                      title="Read aloud"
                      className="ml-2 p-1 rounded-full hover:bg-gray-200 transition"
                    >
                      🔊
                    </button>
                  )}
                </div>

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

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about farming..."
                className="flex-1 h-14 px-6 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
              />

              <Button
                type="button"
                className="h-14 px-4 bg-green-500 hover:bg-green-600 transition-all duration-200"
                onClick={async () => {
                  try {
                    const heard = await listen();
                    setInputValue(heard); // show recognized text in input box

                    // optionally send immediately after hearing:
                    document.querySelector("form").requestSubmit();
                  } catch (err) {
                    alert("Voice not supported or failed. Try again.");
                    console.error(err);
                  }
                }}
              >
                🎤 Speak
              </Button>


              <Button
                type="submit"
                className="h-14 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-3 text-center">
              This is a UI demonstration. The chatbot is not connected to any backend.
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