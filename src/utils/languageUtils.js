// languageUtils.js
import { franc } from "franc-min";

export const langMap = {
  hin: "hi-IN",
  tel: "te-IN",
  tam: "ta-IN",
  kan: "kn-IN",
  mal: "ml-IN",
  guj: "gu-IN",
  ben: "bn-IN",
  mar: "mr-IN",
  urd: "ur-IN",
  pan: "pa-IN",
  eng: "en-US",
  // fallback
  default: "en-US",
};

/**
 * Detects language from text and returns a browser-compatible locale
 * @param {string} text
 * @returns {string} locale (e.g. "hi-IN")
 */
export function detectLocale(text) {
  const code = franc(text);
  return langMap[code] || langMap.default;
}
