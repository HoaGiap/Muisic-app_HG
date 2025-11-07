import Song from "../models/Song.js";

/** GET /api/songs?q=...&owner=me&page=&limit=&sort= */
export async function listSongs(req, res) {
  const {
    q,
    owner,
    page = 1,
    limit = 50,
    sort = "newest",
    albumId,
    withoutAlbum,
  } = req.query;

  const filter = {};

  // text search
  const textOr = [];
  if (q) {
    textOr.push({ title: new RegExp(q, "i") }, { artist: new RegExp(q, "i") });
  }

  // owner
  if (owner === "me" && req.user) {
    filter.createdBy = req.user.uid;
  }

  // album filter
  if (albumId) {
    filter.albumId = albumId;
  } else if (String(withoutAlbum) === "1") {
    // các bài chưa gán album
    filter.$or = [{ albumId: { $exists: false } }, { albumId: null }];
  }

  // gộp điều kiện text search (không đè $or bên trên)
  if (textOr.length) {
    if (filter.$or) filter.$and = [{ $or: textOr }, { $or: filter.$or }];
    else filter.$or = textOr;
  }

  let sortBy = { createdAt: -1 };
  if (sort === "popular") sortBy = { plays: -1, createdAt: -1 };
  else if (sort === "az") sortBy = { title: 1 };

  const pageNum = Math.max(1, Number(page) || 1);
  const lim = Math.min(100, Math.max(1, Number(limit) || 50));
  const skip = (pageNum - 1) * lim;

  const [items, total] = await Promise.all([
    Song.find(filter).sort(sortBy).skip(skip).limit(lim),
    Song.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum });
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
    createdBy: req.user.uid,
    lyrics: lyrics || "",
  });
  res.status(201).json(s);
}

/** DELETE /api/songs/:id */
export async function deleteSong(req, res) {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ error: "Not found" });
  if (!canEdit(req.user, song)) {
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

export async function getLyrics(req, res) {
  try {
    const song = await Song.findById(req.params.id).lean();
    if (!song) return res.status(404).json({ message: "Song not found" });

    // Chuẩn hoá output theo LyricsEditor: { lrc, lyrics }
    // Dữ liệu cũ có thể là string, hoặc object { text, language, lrc?, updatedAt? }
    let lrc = "";
    let plain = "";

    if (typeof song.lyrics === "string") {
      plain = song.lyrics;
    } else if (song.lyrics && typeof song.lyrics === "object") {
      plain = song.lyrics.text || "";
      lrc = song.lyrics.lrc || "";
    }

    return res.json({ lrc, lyrics: plain });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

// user có thể sửa nếu là chủ bài hát; admin sửa tất cả
function canEdit(user, song) {
  if (!user) return false;
  if (user.admin || user.isAdmin || user?.claims?.admin) return true;
  return String(song.createdBy || "") === String(user.uid || "");
}

export async function upsertLyrics(req, res) {
  try {
    const song = await Song.findById(req.params.id).lean();
    if (!song) return res.status(404).json({ message: "Song not found" });
    if (!canEdit(req.user, song))
      return res.status(403).json({ message: "Forbidden" });

    // Nhận body đúng theo LyricsEditor: { lrc, lyrics }
    const lrc = typeof req.body?.lrc === "string" ? req.body.lrc : "";
    const plain = typeof req.body?.lyrics === "string" ? req.body.lyrics : "";

    const now = new Date();

    // Nếu lyrics hiện là string -> set mới cả object
    let updateDoc;
    if (typeof song.lyrics === "string") {
      updateDoc = {
        $set: { lyrics: { text: plain, lrc, language: "", updatedAt: now } },
      };
    } else {
      updateDoc = {
        $set: {
          "lyrics.text": plain,
          "lyrics.lrc": lrc,
          "lyrics.updatedAt": now,
        },
        $setOnInsert: { "lyrics.language": "" },
      };
    }

    await Song.updateOne({ _id: req.params.id }, updateDoc, {
      runValidators: false,
    });

    return res.json({ ok: true, lrc, lyrics: plain, updatedAt: now });
  } catch (e) {
    console.error("upsertLyrics error:", e);
    res.status(500).json({ message: "Server error" });
  }
}
