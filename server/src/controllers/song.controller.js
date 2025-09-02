import Song from "../models/Song.js";
import cloudinary from "../services/cloudinary.js";

/** GET /api/songs?q=&owner=me&page=&limit= */
export async function listSongs(req, res) {
  const { q, owner, page = 1, limit = 50, sort, order } = req.query;

  const filter = {};
  if (q) {
    filter.$or = [
      { title: new RegExp(q, "i") },
      { artist: new RegExp(q, "i") },
    ];
  }
  if (owner === "me" && req.user?.uid) {
    filter.ownerUid = req.user.uid;
  }

  // sort: 'plays' (phổ biến) hoặc mặc định theo createdAt
  let sortObj = { createdAt: -1 };
  if (sort === "plays") sortObj = { plays: order === "asc" ? 1 : -1 };

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

  const [items, total] = await Promise.all([
    Song.find(filter)
      .sort(sortObj)
      .skip((p - 1) * l)
      .limit(l),
    Song.countDocuments(filter),
  ]);

  res.json({ items, total, page: p });
}

/** POST /api/songs (yêu cầu token) */
export async function createSong(req, res) {
  const {
    title,
    artist,
    duration,
    audioUrl,
    audioPublicId,
    coverUrl,
    coverPublicId,
  } = req.body;

  if (!title || !artist || !audioUrl) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!req.user?.uid) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const doc = await Song.create({
    title,
    artist,
    duration: duration ? Number(duration) : null,
    audioUrl,
    audioPublicId: audioPublicId || null,
    coverUrl: coverUrl || null,
    coverPublicId: coverPublicId || null,
    ownerUid: req.user.uid,
  });

  res.status(201).json(doc);
}

/** DELETE /api/songs/:id (yêu cầu token + đúng chủ) */
export async function deleteSong(req, res) {
  if (!req.user?.uid) return res.status(401).json({ error: "unauthorized" });

  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ error: "Not found" });
  if (song.ownerUid !== req.user.uid) {
    return res.status(403).json({ error: "forbidden" });
  }

  // dọn file Cloudinary (best-effort)
  try {
    if (song.audioPublicId) {
      await cloudinary.uploader.destroy(song.audioPublicId, {
        resource_type: "video", // mp3 xử lý dưới 'video'
      });
    }
    if (song.coverPublicId) {
      await cloudinary.uploader.destroy(song.coverPublicId); // mặc định image
    }
  } catch (e) {
    console.warn("Cloudinary cleanup error:", e.message);
  }

  await song.deleteOne();
  res.json({ ok: true });
}

/** POST /api/songs/:id/play (tăng lượt phát – không bắt buộc token) */
export async function incPlay(req, res) {
  await Song.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } });
  res.json({ ok: true });
}

export async function getSong(req, res) {
  try {
    const s = await Song.findById(req.params.id);
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json(s);
  } catch (e) {
    if (e.name === "CastError")
      return res.status(404).json({ error: "Not found" });
    res.status(500).json({ error: e.message });
  }
}
