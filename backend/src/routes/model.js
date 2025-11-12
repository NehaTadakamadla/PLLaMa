// backend/src/routes/model.js
import express from "express";
import modelClient from "../lib/modelClient.js";
import { detectLang, translate } from "../lib/translate.js";

const router = express.Router();

/**
 * POST /api/model/generate[?debug=1]
 * body: {
 *   user_query: string,
 *   user_id: string,
 *   user_location?: string,
 *   user_name?: string,
 *   use_web_search?: boolean,
 *   lang?: 'auto'|'en'|'hi'|'te'
 * }
 *
 * returns: {
 *   output: string,
 *   lang: 'en'|'hi'|'te',
 *   _debug?: { detected, promptEn, outputEn }
 * }
 */
router.post("/generate", async (req, res) => {
  try {
    const {
      user_query,
      user_id,
      user_location,
      user_name,
      use_web_search,
      lang,
    } = req.body;

    // ✅ Validate input
    if (!user_query || !user_id) {
      return res
        .status(400)
        .json({ error: "user_query and user_id are required." });
    }

    // ✅ Debug mode detection
    const wantDebug =
      (req.query && req.query.debug === "1") ||
      process.env.DEBUG_TRANSLATIONS === "1";

    // ---- DEBUG LOGS ----
    console.log("\n=== /generate ===");
    console.log("REQ lang:", lang, "| PROMPT:", String(user_query).slice(0, 120));

    // 1️⃣ Detect or use provided language
    const originalLang =
      lang && lang !== "auto" ? lang : detectLang(user_query);
    console.log("DETECTED:", originalLang);

    // 2️⃣ Translate user_query -> English (for PLLaMA model)
    const promptEn =
      originalLang === "en"
        ? user_query
        : await translate(user_query, originalLang, "en");
    console.log("PROMPT_EN:", String(promptEn).slice(0, 200));

    // 3️⃣ Query PLLaMA model (always in English)
    const outputEn = await modelClient({
      user_query: promptEn,
      user_id,
      user_location,
      user_name,
      use_web_search,
    });
    console.log("OUTPUT_EN:", String(outputEn).slice(0, 200));

    // 4️⃣ Translate English output -> original language
    const finalOutput =
      originalLang === "en"
        ? outputEn
        : await translate(outputEn, "en", originalLang);
    console.log("FINAL_OUTPUT:", String(finalOutput).slice(0, 200));

    // 5️⃣ Build response (optionally include debug info)
    const response = { output: finalOutput, lang: originalLang };
    if (wantDebug) {
      response._debug = {
        detected: originalLang,
        promptEn,
        outputEn,
      };
    }

    // ✅ Send final JSON once
    return res.json(response);
  } catch (err) {
    console.error("Model route error:", err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: "Failed to get response from AI model" });
    }
  }
});

export default router;
