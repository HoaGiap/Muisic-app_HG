import Song from "../models/Song.js";

export const getSongs = async (req, res) => {
  const q = req.query.q?.trim();
  const filter = q
    ? {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { artist: { $regex: q, $options: "i" } },
        ],
      }
    : {};
  const songs = await Song.find(filter).sort({ createdAt: -1 });
  res.json(songs);
};

export const createSong = async (req, res) => {
  const { title, artist, audioUrl } = req.body;
  if (!title || !artist || !audioUrl) {
    return res
      .status(400)
      .json({ error: "title, artist, audioUrl là bắt buộc" });
  }
  const doc = await Song.create(req.body);
  res.status(201).json(doc);
};
