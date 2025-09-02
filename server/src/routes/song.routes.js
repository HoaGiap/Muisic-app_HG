import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  listSongs,
  createSong,
  deleteSong,
  incPlay,
  getSong,
} from "../controllers/song.controller.js";

const router = Router();

// Public
router.get("/", listSongs);
router.get("/:id", getSong);
router.post("/:id/play", incPlay);

// Require auth
router.post("/", requireAuth, createSong);
router.delete("/:id", requireAuth, deleteSong);

export default router;
