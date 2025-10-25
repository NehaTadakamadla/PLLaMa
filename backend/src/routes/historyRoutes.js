import { Router } from "express";
const router = Router();

router.get("/conversations", async (req, res) => {
  try {
    const conversations = [
      { id: 1, messages: ["Hello", "Hi"] },
      { id: 2, messages: ["How are you?", "Good"] }
    ];
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

export default router;
