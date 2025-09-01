import { Router } from "express";
import { getSongs, createSong } from "../controllers/song.controller.js";

const router = Router();
router.get("/", getSongs);
router.post("/", createSong);

export default router;
