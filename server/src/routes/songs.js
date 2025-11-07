// server/src/routes/songs.js
import { Router } from "express";
import mongoose from "mongoose";
import Song from "../models/Song.js";
import Artist from "../models/Artist.js";
import {
  listSongs,
  createSong,
  deleteSong,
  incPlays,
  getLyrics,
  upsertLyrics,
} from "../controllers/song.controller.js";
import {
  requireAuth,
  requireAuthOptional,
  requireRole,
} from "../middlewares/auth.js";

const router = Router();

/** ---------------- Public / User ---------------- **/

// GET /api/songs  (có hỗ trợ owner=me nếu có token)
router.get("/", requireAuthOptional, listSongs);

// GET /api/songs/:id  (chi tiết bài hát + nghệ sĩ)
router.get("/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).lean();
    if (!song) return res.status(404).json({ message: "Song not found" });

    let artist = null;
    if (song.artistId) {
      artist = await Artist.findById(song.artistId)
        .select("_id name avatarUrl")
        .lean();
    } else if (song.artist) {
      artist = await Artist.findOne({ name: song.artist })
        .select("_id name avatarUrl")
        .lean();
    }
    res.json({ song, artist });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Lyrics
router.get("/:id/lyrics", getLyrics);
router.put("/:id/lyrics", requireAuth, upsertLyrics);

// Tăng lượt nghe
router.post("/:id/plays", incPlays);

/** ---------------- Create / Delete ---------------- **/

// POST /api/songs  (tùy bạn: yêu cầu admin hay user thường)
// Nếu muốn chỉ admin: thêm requireRole("admin") vào giữa requireAuth và createSong
router.post("/", requireAuth, createSong);

// DELETE /api/songs/:id  (controller sẽ kiểm quyền: admin xoá tất cả, user xoá bài của mình)
router.delete("/:id", requireAuth, deleteSong);

/** ---------------- Admin: Update ---------------- **/

// PATCH /api/songs/:id  (admin)
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      title,
      artist, // string hiển thị
      artistId, // ObjectId -> gán quan hệ
      coverUrl,
      audioUrl,
      duration,
      isPublic,
      popularity,
      albumId, // ⬅️ THÊM: nhận albumId từ client
    } = req.body || {};

    const update = {};
    if (typeof title === "string") update.title = title.trim();
    if (typeof artist === "string") update.artist = artist.trim();
    if (typeof coverUrl === "string") update.coverUrl = coverUrl.trim();
    if (typeof audioUrl === "string") update.audioUrl = audioUrl.trim();
    if (typeof duration === "number") update.duration = duration;
    if (typeof isPublic === "boolean") update.isPublic = isPublic;
    if (typeof popularity === "number") update.popularity = popularity;

    // artistId (đồng bộ tên artist)
    if (typeof artistId !== "undefined" && artistId !== null) {
      if (!mongoose.Types.ObjectId.isValid(artistId)) {
        return res.status(400).json({ message: "Invalid artistId" });
      }
      update.artistId = new mongoose.Types.ObjectId(artistId);
      const a = await Artist.findById(artistId).select("name").lean();
      if (a?.name) update.artist = a.name;
    } else if (artistId === null) {
      // cho phép xoá liên kết nghệ sĩ
      update.artistId = null;
    }

    // ⬅️ albumId: gán hoặc gỡ khỏi album
    if (typeof albumId !== "undefined" && albumId !== null) {
      if (!mongoose.Types.ObjectId.isValid(albumId)) {
        return res.status(400).json({ message: "Invalid albumId" });
      }
      update.albumId = new mongoose.Types.ObjectId(albumId);
    } else if (albumId === null) {
      update.albumId = null;
    }

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!song) return res.status(404).json({ message: "Song not found" });
    res.json({ ok: true, song });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
