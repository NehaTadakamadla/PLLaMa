import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { User, Mail, Lock, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) throw new Error("Email and password required");

      // Signup request
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, location }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      // Auto-login after signup
      const loginRes = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.error || "Login after signup failed");

      localStorage.setItem("auth_token", loginData.token);

      // Fetch full user profile and store
      try {
        const userResp = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(loginData.user.email)}`);
        if (userResp.ok) {
          const fullUser = await userResp.json();
          localStorage.setItem("current_user", JSON.stringify(fullUser));
        } else {
          localStorage.setItem("current_user", JSON.stringify(loginData.user));
        }
      } catch (err) {
        localStorage.setItem("current_user", JSON.stringify(loginData.user));
      }

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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Join AgriBot today</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="relative">
            <div className="relative">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-12 pl-3 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 group">
                <Info className="w-4 h-4" />
                <div className="invisible group-hover:visible absolute right-0 -top-10 w-56 bg-gray-800 text-white text-xs rounded-md p-2 shadow-lg">
                  This is used when Llama needs to know how to address you.
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 pl-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 pl-10 pr-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="relative">
            <div className="relative">
              <Input
                type="text"
                placeholder="Location (city, region)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-12 pl-3 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 group">
                <Info className="w-4 h-4" />
                <div className="invisible group-hover:visible absolute right-0 -top-14 w-64 bg-gray-800 text-white text-xs rounded-md p-2 shadow-lg">
                  This is used to give context-filled answers tailored to your location.
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>
          )}

              <Button
                type="submit"
                disabled={loading || !email || !password || !username}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
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
            Already have an account?{" "}
            <span
              className="text-green-600 font-medium cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Log In
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
