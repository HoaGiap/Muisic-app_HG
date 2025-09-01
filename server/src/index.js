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

// CORS theo ENV (ALLOWED_ORIGIN có thể là 1 hoặc nhiều, cách nhau dấu phẩy)
const allowList = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowList.length === 0 || allowList.includes(origin))
        return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

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
    app.listen(PORT, () =>
      console.log(`Server is running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));
