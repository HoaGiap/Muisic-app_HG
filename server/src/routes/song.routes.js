import { Router } from "express";
import {
  listSongs,
  createSong,
  deleteSong,
} from "../controllers/song.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";

const router = Router();

// KHÔNG thêm '/songs' ở đây nữa — vì đã mount ở index.js: app.use('/api/songs', router)
router.get("/", optionalAuth, listSongs); // GET /api/songs
router.post("/", requireAuth, createSong); // POST /api/songs
router.delete("/:id", requireAuth, deleteSong); // DELETE /api/songs/:id

export default router;
