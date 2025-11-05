import { Router } from "express";
import User from "../models/User.js";

const router = Router();

// GET /api/users/:email
router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ error: "Email parameter required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      username: user.username,
      email: user.email,
      location: user.location || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;