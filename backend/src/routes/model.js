// backend/src/routes/model.js
import express from "express";
import modelClient from "../lib/modelClient.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const {prompt} = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const output = await modelClient(prompt); // string guaranteed
    res.json({ output });
  } catch (err) {
    console.error("Model route error:", err);
    res.status(500).json({ error: "Failed to get response from AI model" });
  }
});

export default router;
