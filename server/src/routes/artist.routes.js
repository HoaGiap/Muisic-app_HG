import { Router } from "express";
import {
  getArtistDetail,
  getRelatedArtists,
  followArtist,
  unfollowArtist,
} from "../controllers/artist.controller.js";
import Artist from "../models/Artist.js";
import Song from "../models/Song.js"; // ⬅️ thêm để dọn quan hệ bài hát
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// === Public ===
router.get("/:id", getArtistDetail);
router.get("/:id/related", getRelatedArtists);

// === Admin: list/search ===
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const where = q
      ? {
          name: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {};
    const items = await Artist.find(where)
      .sort({ popularity: -1, createdAt: -1 })
      .limit(limit)
      .select("_id name avatarUrl popularity followerCount")
      .lean();
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// === Admin: tạo nghệ sĩ ===
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, avatarUrl, bio } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên nghệ sĩ là bắt buộc" });
    }
    const doc = await Artist.create({
      name: name.trim(),
      avatarUrl: (avatarUrl || "").trim(),
      bio: bio || "",
      popularity: 0,
      followerCount: 0,
    });
    res.json({ ok: true, artist: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// === Admin: cập nhật ===
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, bio } = req.body || {};
    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof avatarUrl === "string") update.avatarUrl = avatarUrl.trim();
    if (typeof bio === "string") update.bio = bio;

    const doc = await Artist.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Artist not found" });
    res.json({ ok: true, artist: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// === Admin: xoá nghệ sĩ ===
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const artist = await Artist.findByIdAndDelete(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    // Dọn tham chiếu ở bài hát (giữ nguyên chuỗi artist để không mất hiển thị)
    await Song.updateMany(
      { artistId: artist._id },
      { $unset: { artistId: 1 } }
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// === Follow APIs (giữ) ===
router.post("/:id/follow", requireAuth, followArtist);
router.post("/:id/unfollow", requireAuth, unfollowArtist);

export default router;
