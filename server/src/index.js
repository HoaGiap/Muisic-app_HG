// server/src/index.js
import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";
import morgan from "morgan";

// ❌ nếu còn import file song.routes.js cũ thì bỏ đi
// import songRoutes from "./routes/song.routes.js";

// ✅ dùng file mới /routes/songs.js
import songsRoutes from "./routes/songs.js";

import playlistRoutes from "./routes/playlist.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import meRoutes from "./routes/me.routes.js";
import { requireAuth, requireRole } from "./middlewares/auth.js";
import adminRoutes from "./routes/admin.routes.js";
import { limitSensitive } from "./middlewares/rateLimit.js";

const app = express();

/* ====================== CORS ====================== */
const normalize = (s = "") => s.toLowerCase().trim().replace(/\/+$/, "");
const toHost = (s = "") => normalize(s).replace(/^https?:\/\//, "");
const rawList = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowList = rawList.map(toHost);
const isAllowedHost = (host) => {
  if (!host || allowList.length === 0) return true;
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

// Health check
app.get("/", (_req, res) => res.send("Backend is running 🚀"));

// ✅ /api/songs là PUBLIC (GET) — token optional
app.use("/api/songs", songsRoutes);

// Tuỳ bạn: playlist cần token
app.use("/api/playlists", requireAuth, playlistRoutes);

// Upload route đã tự kiểm soát auth/role bên trong
app.use("/api/upload", requireAuth, requireRole("admin"), uploadRoutes);
app.use("/api/upload", limitSensitive);
app.use("/api/admin", limitSensitive);
// Đồng bộ user vào DB
app.use("/api/me", meRoutes);
app.use("/api/admin", adminRoutes); // ✅ chỉ admin (route đã tự kiểm tra)
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
