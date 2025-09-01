// server/src/controllers/song.controller.js
import Song from "../models/Song.js";

export async function listSongs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "50", 10))
    );
    const { owner } = req.query;
    const q = (req.query.q || "").trim();

    const filter = {};
    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { artist: new RegExp(q, "i") },
      ];
    }
    // đọc chủ bài khi có token
    if (owner === "me" && req.user?.uid) {
      filter.ownerUid = req.user.uid;
    }

    const [items, total] = await Promise.all([
      Song.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Song.countDocuments(filter),
    ]);

    res.json({ items, total, page });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

export async function createSong(req, res) {
  try {
    // bắt buộc đăng nhập
    if (!req.user?.uid) return res.status(401).json({ error: "unauthorized" });

    const {
      title = "",
      artist = "",
      duration,
      audioUrl,
      coverUrl,
    } = req.body || {};
    if (!title.trim() || !artist.trim() || !audioUrl?.trim()) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const doc = await Song.create({
      title: title.trim(),
      artist: artist.trim(),
      duration: duration ? Number(duration) : null,
      audioUrl: audioUrl.trim(),
      coverUrl: coverUrl || null,
      ownerUid: req.user.uid, // lưu chủ sở hữu
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteSong(req, res) {
  // bắt buộc đăng nhập
  if (!req.user?.uid) return res.status(401).json({ error: "unauthorized" });

  const { id } = req.params;
  try {
    const song = await Song.findById(id);
    if (!song) return res.status(404).json({ error: "Not found" });
    if (song.ownerUid !== req.user.uid) {
      return res.status(403).json({ error: "forbidden" });
    }
    await song.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    if (e.name === "CastError") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
