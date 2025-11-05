import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { User, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) throw new Error("Email and password required");

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Save token
      localStorage.setItem("auth_token", data.token);

      // Try to fetch full user profile from backend and store it
      try {
        const userResp = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(data.user.email)}`);
        if (userResp.ok) {
          const fullUser = await userResp.json();
          localStorage.setItem("current_user", JSON.stringify(fullUser));
        } else {
          // fallback to login response user object
          localStorage.setItem("current_user", JSON.stringify(data.user));
        }
      } catch (err) {
        // on error, fallback
        localStorage.setItem("current_user", JSON.stringify(data.user));
      }

      // Redirect to Chatbot page
      navigate("/chatbot");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Login to AgriBot</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-12 pl-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 pl-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-full text-gray-500 hover:text-gray-700 border border-gray-200"
          >
            ← Back
          </Button>
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <span
              className="text-green-600 font-medium cursor-pointer hover:underline"
              onClick={() => navigate("/signin")}
            >
              Sign Up
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
