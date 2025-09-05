// server/src/controllers/song.controller.js
import Song from "../models/Song.js";

// escape chuỗi để dùng trong RegExp an toàn
const escapeRx = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** GET /api/songs?q=&owner=me&page=&limit=&sort=newest|popular|az */
export async function listSongs(req, res) {
  try {
    const { q = "", owner, page = 1, limit = 50, sort = "newest" } = req.query;

    const filter = {};
    if (q) {
      const rx = new RegExp(escapeRx(q), "i");
      filter.$or = [{ title: rx }, { artist: rx }];
    }

    if (owner === "me") {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      filter.ownerUid = req.user.uid;
    }

    // ép kiểu & giới hạn
    const p = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (p - 1) * lim;

    // ánh xạ tiêu chí sắp xếp
    let sortBy = { createdAt: -1 }; // newest
    if (sort === "popular") sortBy = { plays: -1, createdAt: -1 };
    else if (sort === "az") sortBy = { title: 1 };

    const [items, total] = await Promise.all([
      Song.find(filter).sort(sortBy).skip(skip).limit(lim).lean(),
      Song.countDocuments(filter),
    ]);

    res.json({ items, total, page: p });
  } catch (err) {
    console.error("listSongs error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/** POST /api/songs */
export async function createSong(req, res) {
  try {
    const { title, artist, duration, audioUrl, coverUrl } = req.body;
    if (!title || !artist || !audioUrl) {
      return res.status(400).json({ error: "Missing fields" });
    }
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const s = await Song.create({
      title: title.trim(),
      artist: artist.trim(),
      duration: duration ? Math.round(Number(duration)) : null,
      audioUrl,
      coverUrl: coverUrl || null,
      ownerUid: req.user.uid,
    });

    res.status(201).json(s);
  } catch (err) {
    console.error("createSong error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/** DELETE /api/songs/:id */
export async function deleteSong(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: "Not found" });
    if (!req.user || song.ownerUid !== req.user.uid) {
      return res.status(403).json({ error: "forbidden" });
    }
    await song.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteSong error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/** POST /api/songs/:id/plays -> tăng 1 lượt nghe */
export async function incPlays(req, res) {
  try {
    const { id } = req.params;
    const s = await Song.findByIdAndUpdate(
      id,
      { $inc: { plays: 1 } },
      { new: true, lean: true }
    );
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, plays: s.plays });
  } catch (err) {
    console.error("incPlays error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
