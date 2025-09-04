import Song from "../models/Song.js";

/** GET /api/songs?q=...&owner=me&page=&limit= */
export async function listSongs(req, res) {
  const { q, owner, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { title: new RegExp(q, "i") },
      { artist: new RegExp(q, "i") },
    ];
  }
  if (owner === "me" && req.user) {
    filter.ownerUid = req.user.uid;
  }
  const items = await Song.find(filter)
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit)
    .limit(+limit);
  const total = await Song.countDocuments(filter);
  res.json({ items, total, page: +page });
}

/** POST /api/songs */
export async function createSong(req, res) {
  const { title, artist, duration, audioUrl, coverUrl } = req.body;
  if (!title || !artist || !audioUrl) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const s = await Song.create({
    title,
    artist,
    duration: duration ? +duration : null,
    audioUrl,
    coverUrl: coverUrl || null,
    ownerUid: req.user.uid,
  });
  res.status(201).json(s);
}

/** DELETE /api/songs/:id */
export async function deleteSong(req, res) {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ error: "Not found" });
  if (!req.user || song.ownerUid !== req.user.uid) {
    return res.status(403).json({ error: "forbidden" });
  }
  await song.deleteOne();
  res.json({ ok: true });
}

/** POST /api/songs/:id/plays  -> tăng 1 lượt nghe */
export async function incPlays(req, res) {
  const { id } = req.params;
  const s = await Song.findByIdAndUpdate(
    id,
    { $inc: { plays: 1 } },
    { new: true }
  );
  if (!s) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true, plays: s.plays });
}
