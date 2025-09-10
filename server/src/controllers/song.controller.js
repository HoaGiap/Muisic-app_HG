import Song from "../models/Song.js";

/** GET /api/songs?q=...&owner=me&page=&limit=&sort= */
export async function listSongs(req, res) {
  const { q, owner, page = 1, limit = 50, sort = "newest" } = req.query;

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

  let sortBy = { createdAt: -1 };
  if (sort === "popular") sortBy = { plays: -1, createdAt: -1 };
  else if (sort === "az") sortBy = { title: 1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Song.find(filter).sort(sortBy).skip(skip).limit(Number(limit)),
    Song.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page) });
}

/** POST /api/songs */
export async function createSong(req, res) {
  const { title, artist, duration, audioUrl, coverUrl, lyrics } = req.body;
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
    lyrics: lyrics || "",
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

/** POST /api/songs/:id/plays */
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

/* ---------------- LRC helpers ---------------- */
function parseLrc(text = "") {
  const cues = [];
  const lines = String(text).split(/\r?\n/);
  const timeRe = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]/g;

  for (const raw of lines) {
    timeRe.lastIndex = 0;
    let m;
    const lineText = raw.replace(timeRe, "").trim();
    if (!lineText) continue;

    while ((m = timeRe.exec(raw))) {
      const min = +m[1];
      const sec = +m[2];
      const cs = m[3] ? +m[3] : 0; // centiseconds
      const t = min * 60 + sec + cs / 100;
      cues.push({ t, l: lineText });
    }
  }
  cues.sort((a, b) => a.t - b.t);
  return cues;
}

function formatTime(sec) {
  const t = Math.max(0, +sec || 0);
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.round((t - Math.floor(t)) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(
    cs
  ).padStart(2, "0")}`;
}

/** GET /api/songs/:id/lyrics -> { lyrics, lrc, cues } */
export async function getLyrics(req, res) {
  const { id } = req.params;
  const s = await Song.findById(id).select("lyrics lyricsLrc");
  if (!s) return res.status(404).json({ error: "Not found" });

  const lrcText = (s.lyricsLrc || [])
    .map((c) => `[${formatTime(c.t)}] ${c.l}`)
    .join("\n");

  res.json({
    lyrics: s.lyrics || "",
    lrc: lrcText,
    cues: s.lyricsLrc || [],
  });
}

/** PUT /api/songs/:id/lyrics
 * body: { lrc?: string, lyrics?: string }
 * - nếu có lrc -> parse và lưu vào lyricsLrc
 * - lyrics (không time) lưu vào lyrics
 */
export async function upsertLyrics(req, res) {
  const { id } = req.params;
  const { lrc = "", lyrics = "" } = req.body;

  const s = await Song.findById(id);
  if (!s) return res.status(404).json({ error: "Not found" });
  if (!req.user || s.ownerUid !== req.user.uid) {
    return res.status(403).json({ error: "forbidden" });
  }

  if (typeof lrc === "string" && lrc.trim()) {
    s.lyricsLrc = parseLrc(lrc);
  }
  if (typeof lyrics === "string") {
    s.lyrics = lyrics;
  }

  await s.save();

  res.json({
    ok: true,
    lyrics: s.lyrics,
    cues: s.lyricsLrc,
  });
}
