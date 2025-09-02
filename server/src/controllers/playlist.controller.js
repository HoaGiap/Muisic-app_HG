import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

// GET /api/playlists
export async function listPlaylists(req, res) {
  const items = await Playlist.find({ ownerUid: req.user.uid })
    .sort({ updatedAt: -1 })
    .lean();
  res.json(items);
}

// GET /api/playlists/:id
export async function getPlaylist(req, res) {
  try {
    const p = await Playlist.findById(req.params.id).populate("songs").lean();
    if (!p) return res.status(404).json({ error: "Not found" });
    if (p.ownerUid !== req.user.uid)
      return res.status(403).json({ error: "forbidden" });
    res.json(p);
  } catch (e) {
    if (e.name === "CastError")
      return res.status(404).json({ error: "Not found" });
    res.status(500).json({ error: e.message });
  }
}

// POST /api/playlists  { name }
export async function createPlaylist(req, res) {
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "Missing name" });
  const doc = await Playlist.create({
    name: name.trim(),
    ownerUid: req.user.uid,
    songs: [],
  });
  res.status(201).json(doc);
}

// PATCH /api/playlists/:id  { name }
export async function renamePlaylist(req, res) {
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "Missing name" });
  const p = await Playlist.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });
  p.name = name.trim();
  await p.save();
  res.json(p);
}

// DELETE /api/playlists/:id
export async function deletePlaylist(req, res) {
  const p = await Playlist.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });
  await p.deleteOne();
  res.json({ ok: true });
}

// POST /api/playlists/add   { playlistId, songId }
export async function addSong(req, res) {
  const { playlistId, songId } = req.body || {};
  const p = await Playlist.findById(playlistId);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });

  const s = await Song.findById(songId);
  if (!s) return res.status(404).json({ error: "Song not found" });

  if (!p.songs.find((id) => String(id) === String(songId))) {
    p.songs.push(songId);
    await p.save();
  }
  const populated = await p.populate("songs");
  res.json(populated);
}

// POST /api/playlists/remove   { playlistId, songId }
export async function removeSong(req, res) {
  const { playlistId, songId } = req.body || {};
  const p = await Playlist.findById(playlistId);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });

  p.songs = p.songs.filter((id) => String(id) !== String(songId));
  await p.save();
  const populated = await p.populate("songs");
  res.json(populated);
}

// PATCH /api/playlists/:id/reorder   { songIds: [id1,id2,...] }
export async function reorderSongs(req, res) {
  const { songIds } = req.body || {};
  if (!Array.isArray(songIds) || songIds.length === 0) {
    return res.status(400).json({ error: "songIds must be a non-empty array" });
  }
  const p = await Playlist.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });

  // chỉ nhận những id thuộc playlist
  const set = new Set(p.songs.map((x) => String(x)));
  const cleaned = songIds.map(String).filter((id) => set.has(id));

  // giữ nguyên những bài còn thiếu ở cuối (phòng trường hợp FE gửi thiếu)
  const missing = p.songs.map(String).filter((id) => !cleaned.includes(id));
  p.songs = [...cleaned, ...missing];

  await p.save();
  const populated = await p.populate("songs");
  res.json(populated);
}
