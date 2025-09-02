import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  listPlaylists,
  getPlaylist,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  addSong,
  removeSong,
  reorderSongs,
} from "../controllers/playlist.controller.js";

const router = Router();
router.use(requireAuth);

// List & create
router.get("/", listPlaylists);
router.get("/:id", getPlaylist);
router.post("/", createPlaylist);

// Update name & reorder & delete
router.patch("/:id", renamePlaylist);
router.patch("/:id/reorder", reorderSongs);
router.delete("/:id", deletePlaylist);

// Add/Remove songs
router.post("/add", addSong);
router.post("/remove", removeSong);

export default router;
