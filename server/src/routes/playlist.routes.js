// server/src/routes/playlist.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  listPlaylists,
  getPlaylist,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  updatePlaylistMeta,
  addSong,
  removeSong,
  reorderSongs,
} from "../controllers/playlist.controller.js";

const router = Router();

/**
 * Toàn bộ playlist API yêu cầu token
 */
router.use(requireAuth);

// List & detail
router.get("/", listPlaylists);
router.get("/:id", getPlaylist);

// Create
router.post("/", createPlaylist);

// Update info
router.patch("/:id", renamePlaylist);
router.put("/:id", updatePlaylistMeta);

// Reorder & delete
router.patch("/:id/reorder", reorderSongs);
router.delete("/:id", deletePlaylist);

// Add/Remove songs
router.post("/add", addSong);
router.post("/remove", removeSong);

export default router;
