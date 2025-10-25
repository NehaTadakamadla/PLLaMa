import express from "express";
import modelClient from "../lib/modelClient.js"; // ✅ default import

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {message} = req.body;
    if (!message)
      return res.status(400).json({ error: "Invalid message" });

    const reply = await modelClient({prompt:message});
    res.json({ reply });
  } catch (err) {
    console.error("chatRoutes error:", err);
    res.status(500).json({ error: "Failed to get reply" });
  }
});

export default router;
