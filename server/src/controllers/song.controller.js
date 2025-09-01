import Song from "../models/Song.js";

// GET /api/songs?q=keyword
export const getSongs = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = q
      ? { $or: [{ title: new RegExp(q, "i") }, { artist: new RegExp(q, "i") }] }
      : {};
    const songs = await Song.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(songs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/songs
export const createSong = async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    const artist = (req.body.artist || "").trim();
    const audioUrl = (req.body.audioUrl || "").trim();
    const duration = Number.isFinite(+req.body.duration)
      ? +req.body.duration
      : undefined;
    const coverUrl = req.body.coverUrl || undefined;

    if (!title || !artist || !audioUrl) {
      return res
        .status(400)
        .json({ error: "title, artist, audioUrl là bắt buộc" });
    }

    const doc = await Song.create({
      title,
      artist,
      audioUrl,
      duration,
      coverUrl,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
