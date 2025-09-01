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

const app = express();

/* ====================== CORS ====================== */
// Cho phép nhiều origin, phân tách bởi dấu phẩy trong ALLOWED_ORIGIN
const allowList = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) =>
  !origin || allowList.length === 0 || allowList.includes(origin);

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

// Trả CORS cho tất cả request
app.use(cors(corsOptions));

// ✅ TỰ XỬ LÝ PREFLIGHT (không dùng '*' để tránh lỗi Express 5)
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();

  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    return res.status(403).send("CORS not allowed");
  }

  // Header CORS cho preflight
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  return res.sendStatus(204); // preflight OK
});
/* ================================================= */

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_req, res) => res.send("Backend is running 🚀"));

// Routes
app.use("/api/songs", songRoutes); // public
app.use("/api/playlists", requireAuth, playlistRoutes); // cần token
app.use("/api/upload", requireAuth, uploadRoutes); // cần token

// DB & start
const PORT = process.env.PORT || 8080;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

export default app;
