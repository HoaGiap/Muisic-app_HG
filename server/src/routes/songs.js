// server/src/routes/songs.js
import express from "express";
import Song from "../models/Song.js";
import {
  requireAuth,
  requireAuthOptional,
  requireRole,
} from "../middlewares/auth.js";
import { validate, CreateSongSchema } from "../validators/song.schema.js";

const router = express.Router();

/** helper: nhận diện admin từ nhiều kiểu claims */
function isAdminUser(user) {
  return !!(user && (user.admin || user.isAdmin || user?.claims?.admin));
}

/**
 * Tạo bài hát – chỉ admin
 *  - có validate payload bằng Zod
 */
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(CreateSongSchema),
  async (req, res) => {
    try {
      const song = await Song.create({ ...req.body, createdBy: req.user.uid });
      res.status(201).json(song);
    } catch (e) {
      console.error("Create song error:", e);
      res.status(400).json({ error: e.message, details: e.errors });
    }
  }
);

/**
 * Xoá bài hát
 *  - Admin xoá tất cả
 *  - User thường chỉ xoá bài do mình tạo
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: "Không tìm thấy bài hát" });

    if (isAdminUser(req.user) || song.createdBy === req.user.uid) {
      await song.deleteOne();
      return res.json({ ok: true });
    }
    return res.status(403).json({ error: "Bạn không có quyền xoá bài này" });
  } catch (e) {
    console.error("Delete song error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * Danh sách bài hát – PUBLIC
 *  - Nếu có token: hỗ trợ owner=me (user thường xem bài của mình)
 *  - Admin: mặc định xem tất cả; có thể thêm filter sau nếu cần
 */
router.get("/", requireAuthOptional, async (req, res) => {
  try {
    const { owner, page = 1, limit = 24, sort = "newest" } = req.query;

    const q = {};
    if (owner === "me" && req.user && !isAdminUser(req.user)) {
      q.createdBy = req.user.uid;
    }

    const sortOpt = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const pageNum = Math.max(1, Number(page) || 1);
    const lim = Math.min(100, Math.max(1, Number(limit) || 24));

    const [items, total] = await Promise.all([
      Song.find(q)
        .sort(sortOpt)
        .skip((pageNum - 1) * lim)
        .limit(lim),
      Song.countDocuments(q),
    ]);

    res.json({ items, total, page: pageNum });
  } catch (e) {
    console.error("List songs error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
