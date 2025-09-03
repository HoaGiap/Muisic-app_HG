import { Router } from "express";
import {
  listSongs,
  createSong,
  deleteSong,
  incPlays,
} from "../controllers/song.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Public
router.get("/", listSongs);

// Tạo/xoá cần token (đã có Firebase auth middleware)
router.post("/", requireAuth, createSong);
router.delete("/:id", requireAuth, deleteSong);

// ✅ Tăng lượt nghe (public — kể cả khách cũng đếm)
router.post("/:id/plays", incPlays);

export default router;
