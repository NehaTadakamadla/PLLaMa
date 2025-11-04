import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chatRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import modelRouter from "./routes/model.js"; // corrected path

dotenv.config();
const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN?.split(",") || "*" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/model", modelRouter); // moved after app creation

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


