import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

// Sử dụng chung 1 cấu hình populate (đủ field cho UI & Player)
const songPopulate = {
  path: "songs",
  // ⬇️ NHỚ giữ đủ field sau
  select: "title artist coverUrl audioUrl duration plays",
};

// GET /api/playlists  -> trả cả danh sách bài (đủ field)
export async function listPlaylists(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const items = await Playlist.find({ ownerUid: req.user.uid })
    .sort({ updatedAt: -1 })
    .populate(songPopulate)
    .lean();

  res.json(items);
}

// GET /api/playlists/:id
export async function getPlaylist(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const p = await Playlist.findById(req.params.id)
      .populate(songPopulate)
      .lean();

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
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "Missing name" });

  const doc = await Playlist.create({
    name: name.trim(),
    ownerUid: req.user.uid,
    songs: [],
  });

  // Có thể populate để FE hiển thị ngay (trống cũng ok)
  const populated = await doc.populate(songPopulate);
  res.status(201).json(populated.toObject());
}

// PATCH /api/playlists/:id  { name }
export async function renamePlaylist(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "Missing name" });

  const p = await Playlist.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });

  p.name = name.trim();
  await p.save();

  const populated = await p.populate(songPopulate);
  res.json(populated.toObject());
}

// DELETE /api/playlists/:id
export async function deletePlaylist(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const p = await Playlist.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });

  await p.deleteOne();
  res.json({ ok: true });
}

// POST /api/playlists/add   { playlistId, songId }
export async function addSong(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

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

  const populated = await p.populate(songPopulate);
  res.json(populated.toObject());
}

// POST /api/playlists/remove   { playlistId, songId }
export async function removeSong(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { playlistId, songId } = req.body || {};
  const p = await Playlist.findById(playlistId);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });

  p.songs = p.songs.filter((id) => String(id) !== String(songId));
  await p.save();

  const populated = await p.populate(songPopulate);
  res.json(populated.toObject());
}

// PATCH /api/playlists/:id/reorder   { songIds: [id1,id2,...] }
export async function reorderSongs(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { songIds } = req.body || {};
  if (!Array.isArray(songIds) || songIds.length === 0) {
    return res.status(400).json({ error: "songIds must be a non-empty array" });
  }

  const p = await Playlist.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });

  // chỉ giữ những id thuộc playlist
  const set = new Set(p.songs.map((x) => String(x)));
  const cleaned = songIds.map(String).filter((id) => set.has(id));
  // giữ nguyên những id thiếu (nếu FE gửi thiếu)
  const missing = p.songs.map(String).filter((id) => !cleaned.includes(id));
  p.songs = [...cleaned, ...missing];

  await p.save();

  const populated = await p.populate(songPopulate);
  res.json(populated.toObject());
}

// PATCH /api/playlists/:id/meta  (đổi ảnh bìa / mô tả / tag)
export async function updatePlaylistMeta(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { name, coverUrl, description, tags } = req.body;

  const p = await Playlist.findById(id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.ownerUid !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });

  if (typeof name === "string") p.name = name;
  if (typeof coverUrl === "string") p.coverUrl = coverUrl || null;
  if (typeof description === "string") p.description = description;
  if (Array.isArray(tags)) p.tags = tags;

  await p.save();
  const populated = await p.populate(songPopulate);
  res.json(populated.toObject());
}
