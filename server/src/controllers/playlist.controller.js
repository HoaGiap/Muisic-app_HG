import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

// GET /api/playlists
export const myPlaylists = async (req, res) => {
  const userId = req.user.uid;
  const pls = await Playlist.find({ userId }).populate("songs");
  res.json(pls);
};

// POST /api/playlists { name }
export const createPlaylist = async (req, res) => {
  const userId = req.user.uid;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name là bắt buộc" });
  const exists = await Playlist.findOne({ userId, name });
  if (exists) return res.status(409).json({ error: "Playlist đã tồn tại" });
  const doc = await Playlist.create({ name, userId, songs: [] });
  res.status(201).json(doc);
};

// POST /api/playlists/add { playlistId, songId }
export const addSong = async (req, res) => {
  const userId = req.user.uid;
  const { playlistId, songId } = req.body;

  const p = await Playlist.findOne({ _id: playlistId, userId });
  if (!p) return res.status(404).json({ error: "Playlist not found" });

  const s = await Song.findById(songId);
  if (!s) return res.status(404).json({ error: "Song not found" });

  p.songs.addToSet(s._id);
  await p.save();
  await p.populate("songs");
  res.json({ ok: true, count: p.songs.length, playlist: p });
};

// POST /api/playlists/remove { playlistId, songId }
export const removeSong = async (req, res) => {
  const userId = req.user.uid;
  const { playlistId, songId } = req.body;

  const p = await Playlist.findOne({ _id: playlistId, userId });
  if (!p) return res.status(404).json({ error: "Playlist not found" });

  p.songs.pull(songId);
  await p.save();
  await p.populate("songs");
  res.json({ ok: true, count: p.songs.length, playlist: p });
};
