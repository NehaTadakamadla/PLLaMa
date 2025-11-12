// backend/src/lib/translate.js
import fetch from "node-fetch";
import { franc } from "franc-min";

// --- supported langs ---
const ISO6393_TO_2 = { eng: "en", hin: "hi", tel: "te" };
const SUPPORTED = new Set(["en", "hi", "te"]);
const clamp2 = (c) => (SUPPORTED.has(c) ? c : "en");

// ---------- Language detection ----------
export function detectLang(text) {
  try {
    const code3 = franc(text || "", { minLength: 9 }); // stricter to avoid mis-detects
    const code2 = ISO6393_TO_2[code3] || "en";
    const out = clamp2(code2);
    console.log(`[detectLang] -> ${code3} -> ${out}`);
    return out;
  } catch (e) {
    console.warn("[detectLang] error; defaulting to en:", e?.message);
    return "en";
  }
}

// ---------- LibreTranslate helper (optional, if you set BASE/API key) ----------
async function libreTranslate(q, source, target, base, apikey) {
  const url = `${base.replace(/\/+$/, "")}/translate`;
  const body = { q, source, target, format: "text", ...(apikey ? { api_key: apikey } : {}) };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Libre HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.translatedText ?? q;
}

// ---------- Google Web fallback (no package, no key) ----------
async function googleWebTranslate(q, source, target) {
  // NOTE: This uses the same endpoint Chrome uses. For server-side only.
  const params = new URLSearchParams({
    client: "gtx",
    sl: source || "auto",
    tl: target,
    dt: "t",
    q,
  });
  const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`GoogleWeb HTTP ${res.status}`);

  const json = await res.json();
  // Response is nested: [[["translated chunk","orig",null,null,...], ...], null, "sourceLang", ...]
  const chunks = (json && Array.isArray(json[0])) ? json[0] : [];
  const out = chunks.map(arr => (Array.isArray(arr) ? arr[0] : "")).join("");
  return out || q;
}

// ---------- Public API ----------
export async function translate(text, source, target) {
  if (!text || source === target) return text;

  const src = clamp2(source);
  const tgt = clamp2(target);

  console.log(`[translate] ${src} -> ${tgt}: "${String(text).slice(0, 60)}..."`);

  const base = process.env.TRANSLATE_BASE || "";      // e.g. https://libretranslate.com or http://localhost:5001
  const apikey = process.env.TRANSLATE_API_KEY || "";

  // 1) Try LibreTranslate if configured (and key if required)
  if (base) {
    try {
      const out = await libreTranslate(text, src, tgt, base, apikey);
      console.log("[translate] Libre OK");
      return out;
    } catch (e) {
      console.warn("[translate] Libre failed:", e?.message || e);
    }
  } else {
    console.warn("[translate] No TRANSLATE_BASE set; using Google Web fallback");
  }

  // 2) Google Web fallback
  try {
    const out = await googleWebTranslate(text, src, tgt);
    console.log("[translate] GoogleWeb OK");
    return out;
  } catch (e) {
    console.error("[translate] GoogleWeb failed:", e?.message || e);
    return text; // fail-open
  }
}
