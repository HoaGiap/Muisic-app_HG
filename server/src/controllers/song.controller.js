import Song from "../models/Song.js";

// ------------------- LIST -------------------
export async function listSongs(req, res) {
  const {
    q,
    owner, // "me" => chỉ bài của user hiện tại (theo token)
    page = 1,
    limit = 50,
    sort = "createdAt", // "createdAt" | "plays"
    order = "desc", // "asc" | "desc"
  } = req.query;

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

  const sortKey = sort === "plays" ? "plays" : "createdAt";
  const sortVal = order === "asc" ? 1 : -1;

  const items = await Song.find(filter)
    .sort({ [sortKey]: sortVal })
    .skip((+page - 1) * +limit)
    .limit(+limit);

  const total = await Song.countDocuments(filter);
  res.json({ items, total, page: +page });
}

// ------------------- CREATE -------------------
export async function createSong(req, res) {
  const { title, artist, duration, audioUrl, coverUrl } = req.body;
  if (!title || !artist || !audioUrl) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!req.user?.uid) {
    return res.status(401).json({ error: "unauthorized" });
  }
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

// ------------------- DELETE (owner only) -------------------
export async function deleteSong(req, res) {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ error: "Not found" });
  if (!req.user || song.ownerUid !== req.user.uid) {
    return res.status(403).json({ error: "forbidden" });
  }
  await song.deleteOne();
  res.json({ ok: true });
}

// ------------------- INCREMENT PLAYS -------------------
// chống spam đơn giản bằng cooldown theo uid/ip + songId
const playCooldown = new Map(); // key: `${uidOrIp}:${songId}` -> lastTs
const COOLDOWN_MS = 30_000; // 30 giây trong 1 phiên gọi server

export async function incPlays(req, res) {
  const { id } = req.params;
  const song = await Song.findById(id);
  if (!song) return res.status(404).json({ error: "Not found" });

  const key = `${req.user?.uid || req.ip}:${id}`;
  const now = Date.now();
  const last = playCooldown.get(key) || 0;
  if (now - last < COOLDOWN_MS) {
    return res.json({ ok: true, skipped: true, plays: song.plays });
  }

  playCooldown.set(key, now);

  song.plays = (song.plays || 0) + 1;
  await song.save();

  res.json({ ok: true, plays: song.plays });
}
