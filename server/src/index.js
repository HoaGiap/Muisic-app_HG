// server/src/index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

import songRoutes from "./routes/song.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { requireAuth } from "./middlewares/auth.js";

dotenv.config();

console.log("Booting API...");

// ✅ PHẢI tạo app TRƯỚC rồi mới dùng app.use(...)
const app = express();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Health check
app.get("/", (_req, res) => res.send("Backend is running 🚀"));

// Routes
app.use("/api/songs", songRoutes);
app.use("/api/playlists", requireAuth, playlistRoutes);
app.use("/api/upload", requireAuth, uploadRoutes);

const PORT = process.env.PORT || 8080;

// Kết nối DB rồi mới listen
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Server is running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
