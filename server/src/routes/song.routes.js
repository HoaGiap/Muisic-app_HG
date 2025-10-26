// server/src/routes/song.routes.js
import { Router } from "express";
import {
  listSongs,
  createSong,
  deleteSong,
  incPlays,
  getLyrics,
  upsertLyrics,
} from "../controllers/song.controller.js";
import { requireAuth, requireAuthOptional } from "../middlewares/auth.js";

const router = Router();

/**
 * GET /api/songs
 * - PUBLIC: token optional (để filter owner=me nếu có token)
 */
router.get("/", requireAuthOptional, listSongs);

/**
 * POST /api/songs
 * - Cần token (tùy app: có thể yêu cầu admin nếu muốn)
 */
router.post("/", requireAuth, createSong);

/**
 * DELETE /api/songs/:id
 * - Cần token (controller sẽ tự kiểm tra quyền: admin xoá tất cả, user xoá bài của mình)
 */
router.delete("/:id", requireAuth, deleteSong);

/**
 * POST /api/songs/:id/plays
 * - Tăng lượt nghe + popularity (PUBLIC hoặc requireAuth tuỳ bạn)
 */
router.post("/:id/plays", incPlays);

/**
 * Lyrics
 * - GET: public
 * - PUT: cần token, chủ bài hát (controller kiểm quyền)
 */
router.get("/:id/lyrics", getLyrics);
router.put("/:id/lyrics", requireAuth, upsertLyrics);

export default router;
