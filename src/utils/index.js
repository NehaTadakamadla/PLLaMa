/**
 * Utility functions
 */

// Create page URL for routing
export const createPageUrl = (pageName) => {
  switch (pageName) {
    case "Landing":
      return "/";
    case "Chatbot":
      return "/chatbot";
    case "SignIn":
      return "/signin";
    case "Login":
      return "/login";
    default:
      return "/";
  }
};
