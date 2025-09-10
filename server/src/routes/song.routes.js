import { Router } from "express";
import {
  listSongs,
  createSong,
  deleteSong,
  incPlays,
  getLyrics,
  upsertLyrics,
} from "../controllers/song.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", listSongs);
router.post("/", requireAuth, createSong);
router.delete("/:id", requireAuth, deleteSong);
router.post("/:id/plays", incPlays);

// Lyrics
router.get("/:id/lyrics", getLyrics); // public
router.put("/:id/lyrics", requireAuth, upsertLyrics); // owner

export default router;
