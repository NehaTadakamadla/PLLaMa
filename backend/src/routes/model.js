// backend/src/routes/model.js
import express from "express";
import modelClient from "../lib/modelClient.js";
import { detectLang, translate } from "../lib/translate.js";

const router = express.Router();

/**
 * POST /api/model/generate[?debug=1]
 * body: { prompt: string, lang?: 'auto'|'en'|'hi'|'te' }
 * returns: { output: string, lang: 'en'|'hi'|'te', _debug?: { detected, promptEn, outputEn } }
 */
router.post("/generate", async (req, res) => {
  try {
    const { prompt, lang } = req.body || {};
    const wantDebug =
      (req.query && req.query.debug === "1") ||
      process.env.DEBUG_TRANSLATIONS === "1";

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // ---- DEBUG LOGS (you'll see these in the backend console) ----
    console.log("\n=== /generate ===");
    console.log("REQ lang:", lang, "| PROMPT:", String(prompt).slice(0, 120));

    // 1) Decide the working language
    const originalLang =
      lang && lang !== "auto" ? lang : detectLang(prompt);
    console.log("DETECTED:", originalLang);

    // 2) Translate input -> English (only if needed)
    const promptEn =
      originalLang === "en"
        ? prompt
        : await translate(prompt, originalLang, "en");
    console.log("PROMPT_EN:", String(promptEn).slice(0, 200));

    // 3) Run the English-only model
    const outputEn = await modelClient(promptEn);
    console.log("OUTPUT_EN:", String(outputEn).slice(0, 200));

    // 4) Translate English -> original language (only if needed)
    const finalOutput =
      originalLang === "en"
        ? outputEn
        : await translate(outputEn, "en", originalLang);
    console.log("FINAL_OUTPUT:", String(finalOutput).slice(0, 200));

    // 5) Build response (optionally include debug)
    const response = { output: finalOutput, lang: originalLang };
    if (wantDebug) {
      response._debug = {
        detected: originalLang,
        promptEn,
        outputEn,
      };
    }

    return res.json(response);
  } catch (err) {
    console.error("Model route error:", err);
    return res
      .status(500)
      .json({ error: "Failed to get response from AI model" });
  }
});

export default router;
