import mongoose from "mongoose";
import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import Song from "../models/Song.js";
import User from "../models/User.js";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Tìm nghệ sĩ theo _id hoặc name (không phân biệt hoa/thường).
// Nếu chưa có mà trong Song có nghệ sĩ trùng tên thì tạo nhanh Artist để hợp thức hóa.
async function resolveArtist(idOrName) {
  const raw = idOrName || "";

  if (mongoose.Types.ObjectId.isValid(raw)) {
    const byId = await Artist.findById(raw).lean();
    if (byId) return byId;
  }

  const name = decodeURIComponent(raw).trim();
  if (!name) return null;

  const byName = await Artist.findOne({
    name: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
  }).lean();
  if (byName) return byName;

  const anySong = await Song.findOne({
    artist: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
  })
    .select("artist")
    .lean();

  if (anySong) {
    const created = await Artist.create({
      name: anySong.artist || name,
      avatarUrl: "",
      followerCount: 0,
      popularity: 0,
    });
    return created.toObject();
  }

  return null;
}

export async function getArtistDetail(req, res) {
  try {
    const artist = await resolveArtist(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const artistId = artist._id;

    // ✅ Lấy bài theo artistId HOẶC theo tên (nếu bài chưa backfill artistId)
    const nameRegex = new RegExp(`^${escapeRegExp(artist.name)}$`, "i");
    const songs = await Song.find({
      isPublic: { $in: [true, undefined] }, // nới lỏng nếu bạn chưa set isPublic
      $or: [{ artistId }, { artist: { $regex: nameRegex } }],
    })
      .sort({ popularity: -1, createdAt: -1 })
      .lean();

    // (tuỳ chọn) backfill nhanh các bài match theo tên để gán luôn artistId,
    // lần sau truy vấn sẽ nhanh và chuẩn. Không bắt buộc, nhưng nên có.
    const songsToBackfill = songs.filter((s) => !s.artistId).map((s) => s._id);
    if (songsToBackfill.length) {
      await Song.updateMany(
        { _id: { $in: songsToBackfill } },
        { $set: { artistId } }
      );
    }

    // Album: nếu bạn chưa tạo dữ liệu Album thì sẽ rỗng là đúng.
    const albums = await Album.find({ artistId })
      .sort({ popularity: -1, createdAt: -1 })
      .lean();

    res.json({ artist, albums, songs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function followArtist(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const artist = await resolveArtist(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const artistId = artist._id;
    const user =
      (await User.findById(uid)) ||
      (await User.create({ _id: uid, email: req.user?.email }));

    const already = (user.followingArtistIds || []).some(
      (x) => String(x) === String(artistId)
    );
    if (!already) {
      user.followingArtistIds = [...(user.followingArtistIds || []), artistId];
      await user.save();
      await Artist.updateOne({ _id: artistId }, { $inc: { followerCount: 1 } });
    }

    res.json({ ok: true, following: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function unfollowArtist(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const artist = await resolveArtist(req.params.id);
    if (!artist) return res.json({ ok: true, following: false });

    const artistId = artist._id;
    const user = await User.findById(uid);
    if (!user) return res.json({ ok: true, following: false });

    const before = user.followingArtistIds?.length || 0;
    user.followingArtistIds = (user.followingArtistIds || []).filter(
      (x) => String(x) !== String(artistId)
    );
    if (user.followingArtistIds.length < before) {
      await user.save();
      await Artist.updateOne(
        { _id: artistId },
        { $inc: { followerCount: -1 } }
      );
    }

    res.json({ ok: true, following: false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getRelatedArtists(req, res) {
  try {
    const artist = await resolveArtist(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const related = await Artist.find({ _id: { $ne: artist._id } })
      .sort({ popularity: -1, createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ related });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}
