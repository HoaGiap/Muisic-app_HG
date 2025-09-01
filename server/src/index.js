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

/* ====================== CORS (theo ENV) ====================== */
// Cho phép 1 hoặc nhiều origin, cách nhau dấu phẩy trong ALLOWED_ORIGIN
const allowList = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // origin = undefined với request từ curl/Postman — vẫn cho qua
    if (!origin || allowList.length === 0 || allowList.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // cache preflight 1 ngày
};

// Áp dụng CORS cho tất cả request trước khi vào routes
app.use(cors(corsOptions));

// ⚠️ Express 5 không hỗ trợ '*' => dùng mẫu bắt mọi đuôi dưới /api
app.options("/api/:path(*)", cors(corsOptions));
// (tùy chọn) nếu cần preflight cho route gốc
app.options("/", cors(corsOptions));
/* ============================================================ */

app.use(morgan("dev"));
app.use(express.json()); // nếu cần upload JSON lớn: { limit: "5mb" }

app.get("/", (_req, res) => res.send("Backend is running 🚀"));

// Routes
app.use("/api/songs", songRoutes); // public
app.use("/api/playlists", requireAuth, playlistRoutes); // cần token
app.use("/api/upload", requireAuth, uploadRoutes); // cần token

// Kết nối DB & khởi động server
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
