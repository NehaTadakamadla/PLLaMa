// backend/src/routes/model.js
import express from "express";
import modelClient from "../lib/modelClient.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { user_query, user_id, user_location, user_name, use_web_search } = req.body;
    if (!user_query || !user_id) return res.status(400).json({ error: "user_query and user_id are required" });

    const output = await modelClient({ user_query, user_id, user_location, user_name, use_web_search }); // string guaranteed
    res.json({ output });
  } catch (err) {
    console.error("Model route error:", err);
    res.status(500).json({ error: "Failed to get response from AI model" });
  }
});

export default router;
