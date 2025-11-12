import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { User } from "./entities/User";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.href = createPageUrl("Landing");
  };

  // Don't show navigation on chatbot page
  if (currentPageName === "Chatbot") {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Landing")} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">AgriBot</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="/#home" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                Home
              </a>
              <a href="/#about" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                About Us
              </a>
              <a href="/#feedback" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                Feedback
              </a>
              {user ? (
                <>
                  <Link
                    to={createPageUrl("Chatbot")}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <></>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}