import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Sparkles, Leaf, MessageSquare, TrendingUp, Mail, Send, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { motion } from "framer-motion";

export default function Landing() {
  const navigate = useNavigate();
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackForm({ name: "", email: "", message: "" });
    }, 3000);
  };

  const handleUseAgriBot = () => {
    try {
      // Direct to Login for immediate flow start
      navigate(createPageUrl("Login"));
    } catch (error) {
      console.error("Redirect failed:", error);
      // Fallback: Hardcode if utils missing
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50/30 to-white">
      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">AI-Powered Agriculture Assistant</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Smart Farming,
              <br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Smarter Decisions
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform your agricultural practices with AI-driven insights, real-time crop monitoring, 
              and expert guidance at your fingertips.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleUseAgriBot}
                className="px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-6 text-lg rounded-xl border-2 border-gray-200 hover:border-green-500 transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mt-20"
          >
            {[
              {
                icon: MessageSquare,
                title: "AI Chat Assistant",
                description: "Get instant answers to your farming questions with our intelligent chatbot"
              },
              {
                icon: Leaf,
                title: "Crop Intelligence",
                description: "Receive personalized recommendations for optimal crop growth and health"
              },
              {
                icon: TrendingUp,
                title: "Yield Optimization",
                description: "Maximize your harvest with data-driven insights and predictions"
              }
            ].map((feature, index) => (
              <Card key={index} className="p-8 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-6">
                <Leaf className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">About AgriBot</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Revolutionizing Agriculture with AI
              </h2>
              
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                AgriBot is your intelligent farming companion, designed to empower farmers with cutting-edge 
                AI technology. We combine decades of agricultural expertise with modern machine learning to 
                provide actionable insights.
              </p>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Whether you're managing a small farm or large-scale operations, AgriBot adapts to your needs, 
                offering personalized guidance on crop selection, pest management, irrigation, and more.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { number: "10K+", label: "Active Farmers" },
                { number: "50+", label: "Crop Types" },
                { number: "95%", label: "Accuracy Rate" },
                { number: "24/7", label: "Support" }
              ].map((stat, index) => (
                <Card key={index} className="p-6 text-center border-none shadow-md">
                  <p className="text-3xl font-bold text-green-600 mb-2">{stat.number}</p>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section id="feedback" className="py-20 px-6 bg-gradient-to-b from-white to-green-50/30">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-6">
              <Mail className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Get in Touch</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              We'd Love to Hear From You
            </h2>
            <p className="text-lg text-gray-600">
              Share your feedback, suggestions, or questions with us
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 border-none shadow-xl">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-600">Your feedback has been received. We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <Input
                      required
                      value={feedbackForm.name}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <Input
                      required
                      type="email"
                      value={feedbackForm.email}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                    <Textarea
                      required
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      placeholder="Tell us what you think..."
                      className="min-h-32 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold">AgriBot</span>
          </div>
          <p className="text-gray-400 mb-6">Empowering farmers with intelligent solutions</p>
          <p className="text-gray-500 text-sm">© 2024 AgriBot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}