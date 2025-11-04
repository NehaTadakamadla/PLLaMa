// ========== Capability checks ==========
export function canUseVoice() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// ========== Locale helpers ==========
export function localeFor(lang) {
  if (!lang || lang === "auto") return "en-US";
  if (lang === "hi") return "hi-IN";
  if (lang === "te") return "te-IN";
  return "en-US";
}

// ========== User-gesture gating (prevents autoplay blocks) ==========
const G = typeof window !== "undefined" ? window : {};
const GESTURE_KEY = "__VOICE_LAST_GESTURE_AT__";
const USER_GESTURE_WINDOW_MS = 8_000;

function now() { return Date.now(); }

export function markUserGesture() {
  if (G) G[GESTURE_KEY] = now();
}

function hasRecentUserGesture() {
  // Prefer the browser's own userActivation if present
  try {
    if (typeof navigator !== "undefined" &&
        navigator.userActivation &&
        typeof navigator.userActivation.isActive === "boolean") {
      if (navigator.userActivation.isActive) return true;
    }
  } catch {}
  const last = (G && G[GESTURE_KEY]) || 0;
  return now() - last <= USER_GESTURE_WINDOW_MS;
}

// ========== Voice loading / picking ==========
async function waitForVoices(timeoutMs = 2000) {
  return new Promise((resolve) => {
    if (!canUseVoice()) return resolve([]);
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length) return resolve(voices);

    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve(window.speechSynthesis.getVoices() || []);
      }
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", finish, { once: true });
    setTimeout(finish, timeoutMs);
  });
}

function pickVoiceFor(locale, voices) {
  const lc = String(locale || "en-US").toLowerCase();
  const exact = voices.find(v => v.lang && v.lang.toLowerCase() === lc);
  if (exact) return exact;
  const base = lc.split("-")[0];
  return voices.find(v => v.lang?.toLowerCase().startsWith(base)) || null;
}

// ========== Online TTS (Google) ==========
const FORCE_TELUGU_ONLINE_TTS = true; // always use online TTS for Telugu

function googleTtsUrl(text, langCode, preferGoogleapis = true) {
  const q = encodeURIComponent(text);
  const tl = encodeURIComponent(langCode);
  if (preferGoogleapis) {
    // client=gtx commonly works without API key
    return `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${q}&tl=${tl}&client=gtx`;
  }
  // fallback endpoint
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=${tl}&client=tw-ob`;
}

let _fallbackAudio = null;

async function playWithGoogleTTS(text, langCode) {
  let lastErr = null;
  for (const preferGoogleapis of [true, false]) {
    const url = googleTtsUrl(text, langCode, preferGoogleapis);
    try {
      // must be triggered by a user gesture
      _fallbackAudio = new Audio(url);
      await _fallbackAudio.play();
      return; // success
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Both Google TTS endpoints failed");
}

// ========== Chunking & queue (so long texts don't get cut) ==========
function chunkText(text, maxLen = 200) {
  // Split on sentence boundaries first; hard-split if needed.
  const parts = [];
  const withDelims = text
    .split(/([\.!\?]|।|॥)/) // keep punctuation for Indic
    .reduce((acc, cur, i, arr) => {
      if (i % 2 === 0) acc.push((cur + (arr[i + 1] || "")).trim());
      return acc;
    }, [])
    .filter(Boolean);

  const sentences = withDelims.length ? withDelims : [String(text)];
  let buf = "";
  for (const s of sentences) {
    const next = buf ? `${buf} ${s}` : s;
    if (next.length <= maxLen) {
      buf = next;
    } else {
      if (buf) parts.push(buf);
      if (s.length <= maxLen) {
        parts.push(s);
      } else {
        for (let i = 0; i < s.length; i += maxLen) {
          parts.push(s.slice(i, i + maxLen));
        }
      }
      buf = "";
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

let _queue = [];
let _playing = false;

async function playQueueSequentially(langCode) {
  if (_playing) return;
  _playing = true;
  try {
    while (_queue.length) {
      const next = _queue.shift();
      await playWithGoogleTTS(next, langCode);
      await new Promise(r => setTimeout(r, 40));
    }
  } finally {
    _playing = false;
  }
}

// ========== Public speaking API ==========
/**
 * Speaks text and returns a controller:
 *   const ctl = speak("హలో", "te-IN");
 *   await ctl.done;  // resolves when finished
 *   ctl.stop();      // stop early
 */
export function speak(text, locale = "en-US", opts = { allowAutoplay: false }) {
  const allowAutoplay = !!(opts && opts.allowAutoplay);

  // controller we'll return
  let stopped = false;
  const stop = () => {
    stopped = true;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch {}
    try {
      if (_fallbackAudio) {
        _fallbackAudio.pause();
        _fallbackAudio.currentTime = 0;
        _fallbackAudio = null;
      }
    } catch {}
    _queue = [];
  };

  const done = (async () => {
    try {
      const plain = String(text || "").trim();
      if (!plain) return;
      if (!allowAutoplay && !hasRecentUserGesture()) return; // blocked by autoplay policy

      const lc = String(locale || "en-US").toLowerCase();

      // Telugu → always online
      if (lc.startsWith("te") && FORCE_TELUGU_ONLINE_TTS) {
        _queue = chunkText(plain);
        await playQueueSequentially("te");
        return;
      }

      // Native voices first (en/hi)
      if (canUseVoice()) {
        const voices = await waitForVoices();
        const voice = pickVoiceFor(locale, voices);
        if (voice && !stopped) {
          return await new Promise((resolve) => {
            const u = new SpeechSynthesisUtterance(plain);
            u.voice = voice;
            u.lang = voice.lang || locale;
            u.rate = 1;
            u.onend = resolve;
            u.onerror = resolve;
            try { window.speechSynthesis.cancel(); } catch {}
            try { window.speechSynthesis.speak(u); } catch { resolve(); }
          });
        }
      }

      // Fallback online (also works for hi/en if no voice)
      const langCode = lc.startsWith("hi") ? "hi" : lc.startsWith("te") ? "te" : "en";
      _queue = chunkText(plain);
      await playQueueSequentially(langCode);
    } finally {
      // no-op
    }
  })();

  return { stop, done };
}

// Convenience wrappers
export function speakSmart(text, lang = "en", opts) {
  return speak(text, localeFor(lang), opts);
}

export function speakFromUserGesture(text, lang = "en") {
  markUserGesture();
  return speakSmart(text, lang, { allowAutoplay: false });
}

// ========== Stop everything (for UI toggle buttons) ==========
export function stopAllTTS() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch {}
  try {
    if (_fallbackAudio) {
      _fallbackAudio.pause();
      _fallbackAudio.currentTime = 0;
      _fallbackAudio = null;
    }
  } catch {}
  _queue = [];
}

// ========== Microphone (Speech → Text) ==========
export function listen(locale = "en-US") {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return reject("Speech recognition not supported in this browser");

    const rec = new SR();
    rec.lang = locale;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => resolve(e.results?.[0]?.[0]?.transcript || "");
    rec.onerror = (e) => reject(e.error || e);
    rec.onend = () => {};
    try { rec.start(); } catch (err) { reject(err); }
  });
}
