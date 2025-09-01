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
// ALLOWED_ORIGIN có thể là:
//   - https://music-app-hg.vercel.app
//   - music-app-hg.vercel.app
//   - *.vercel.app  (hỗ trợ wildcard)
const normalize = (s = "") => s.toLowerCase().trim().replace(/\/+$/, ""); // bỏ slash cuối

const toHost = (s = "") => normalize(s).replace(/^https?:\/\//, ""); // bỏ scheme

const rawList = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowList = rawList.map(toHost); // lưu dưới dạng host (không scheme)

const isAllowedHost = (host) => {
  if (!host || allowList.length === 0) return true; // allow all nếu chưa cấu hình
  return allowList.some((rule) => {
    if (rule.startsWith("*.")) {
      const base = rule.slice(2);
      return host === base || host.endsWith("." + base);
    }
    return host === rule;
  });
};

const corsOptions = {
  origin: (origin, cb) => {
    // origin có scheme; chuyển sang host để so
    const host = toHost(origin || "");
    if (!origin || isAllowedHost(host)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// TỰ xử lý preflight (tránh dùng pattern '*' của Express 5)
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();
  const origin = req.headers.origin || "";
  const host = toHost(origin);
  if (!origin || isAllowedHost(host)) {
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
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.sendStatus(204);
  }
  return res.status(403).send("CORS not allowed");
});
/* ================================================= */

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_req, res) => res.send("Backend is running 🚀"));

app.use("/api/songs", songRoutes); // public
app.use("/api/playlists", requireAuth, playlistRoutes); // cần token
app.use("/api/upload", requireAuth, uploadRoutes); // cần token

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
