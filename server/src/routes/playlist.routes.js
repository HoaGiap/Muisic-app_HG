import { Router } from "express";
import {
  myPlaylists,
  createPlaylist,
  addSong,
  removeSong,
} from "../controllers/playlist.controller.js";

const router = Router();

router.get("/", myPlaylists);
router.post("/", createPlaylist);
router.post("/add", addSong); // ✅ CHỈ addSong
router.post("/remove", removeSong); // ✅ removeSong

export default router;
