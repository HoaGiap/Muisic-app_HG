import express from "express";
import {
  listSongs,
  createSong,
  deleteSong,
  incPlays,
} from "../controllers/song.controller.js";
import { requireAuth, requireAuthOptional } from "../middlewares/auth.js";

const router = express.Router();

// Cooldown 30s cho mỗi (user|ip|bài)
const lastHitMap = new Map();
function keyFor(req) {
  const uid = req.user?.uid || "anon";
  const ip = (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    ""
  ).toString();
  return `${uid}|${ip}|${req.params.id}`;
}
function rateLimitPlays(req, res, next) {
  const key = keyFor(req);
  const now = Date.now();
  const last = lastHitMap.get(key) || 0;
  if (now - last < 30_000) return res.status(204).end(); // bỏ qua lặng lẽ
  lastHitMap.set(key, now);
  next();
}

// /api/songs
router.get("/", requireAuthOptional, listSongs);
router.post("/", requireAuth, createSong);
router.delete("/:id", requireAuth, deleteSong);

// tăng plays (không bắt buộc phải login)
router.post("/:id/plays", requireAuthOptional, rateLimitPlays, incPlays);

export default router;
