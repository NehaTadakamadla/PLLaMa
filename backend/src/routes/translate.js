// backend/src/routes/translate.js
import express from "express";
import { translate, detectLang } from "../lib/translate.js";

const router = express.Router();

// POST /api/translate
router.post("/", async (req, res) => {
  try {
    const { text, target_lang } = req.body;

    if (!text || !target_lang) {
      return res.status(400).json({ error: "text and target_lang are required" });
    }

    // Detect language automatically
    const source_lang = detectLang(text);

    const translated = await translate(text, source_lang, target_lang);

    res.json({
      translated_text: translated,
      source_lang,
      target_lang,
    });
  } catch (err) {
    console.error("Translation failed:", err);
    res.status(500).json({
      error: "Translation failed",
      message: err.message || String(err),
    });
  }
});

export default router;
