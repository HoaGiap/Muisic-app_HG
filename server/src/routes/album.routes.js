// server/src/routes/album.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import Album from "../models/Album.js";
import Artist from "../models/Artist.js";
import Song from "../models/Song.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

/* ========== Create (Admin) ========== */
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { artistId, title, coverUrl, releaseDate } = req.body || {};
    if (!artistId || !title) {
      return res.status(400).json({ message: "artistId và title là bắt buộc" });
    }
    const artist = await Artist.findById(artistId).lean();
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const doc = await Album.create({
      artistId,
      title: String(title).trim(),
      coverUrl: coverUrl || "",
      songIds: [],
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      popularity: 0,
    });
    res.json({ ok: true, album: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========== List (search) – Public ========== */
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const where = q
      ? {
          title: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {};
    const items = await Album.find(where)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id title coverUrl releaseDate artistId popularity")
      .lean();
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========== Detail – Public ========== */
router.get("/:id", async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).lean();
    if (!album) return res.status(404).json({ message: "Album not found" });

    const [artist, songs] = await Promise.all([
      album.artistId
        ? Artist.findById(album.artistId).select("_id name avatarUrl").lean()
        : null,
      Song.find({ albumId: album._id })
        .select("_id title artist coverUrl duration audioUrl popularity")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.json({ album, artist, songs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========== Update (Admin) ========== */
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { title, coverUrl, releaseDate, artistId } = req.body || {};
    const update = {};
    if (typeof title === "string") update.title = title.trim();
    if (typeof coverUrl === "string") update.coverUrl = coverUrl.trim();
    if (releaseDate) update.releaseDate = new Date(releaseDate);
    if (artistId) {
      if (!mongoose.Types.ObjectId.isValid(artistId)) {
        return res.status(400).json({ message: "Invalid artistId" });
      }
      const a = await Artist.findById(artistId).select("_id").lean();
      if (!a) return res.status(404).json({ message: "Artist not found" });
      update.artistId = artistId;
    }

    const doc = await Album.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Album not found" });
    res.json({ ok: true, album: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========== Delete (Admin) ========== */
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found" });

    // Gỡ liên kết albumId khỏi các bài hát thuộc album
    await Song.updateMany({ albumId: album._id }, { $unset: { albumId: 1 } });

    await album.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
