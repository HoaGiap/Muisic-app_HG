import Album from "../models/Album.js";
import Artist from "../models/Artist.js";
import Song from "../models/Song.js";

/**
 * GET /api/albums/:id
 * Trả: { album, artist, songs }
 * - songs: ưu tiên theo album.songIds (nếu có), fallback theo Song.albumId
 * - sort theo thứ tự songIds; nếu fallback thì sort theo track # hoặc createdAt tăng dần
 */
export async function getAlbumDetail(req, res) {
  try {
    const { id } = req.params;
    const album = await Album.findById(id).lean();
    if (!album) return res.status(404).json({ message: "Album not found" });

    const artist = album.artistId
      ? await Artist.findById(album.artistId).lean()
      : null;

    let songs = [];
    if (album.songIds?.length) {
      // Lấy đúng thứ tự trong songIds
      const map = new Map();
      const found = await Song.find({
        _id: { $in: album.songIds },
        isPublic: true,
      }).lean();
      found.forEach((s) => map.set(String(s._id), s));
      songs = album.songIds.map((id) => map.get(String(id))).filter(Boolean);
    } else {
      // Fallback nếu chưa set songIds
      songs = await Song.find({ albumId: id, isPublic: true })
        .sort({ createdAt: 1 })
        .lean();
    }

    res.json({ album, artist, songs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// GET /api/albums/:id/related
export async function getRelatedAlbums(req, res) {
  try {
    const { id } = req.params;
    const album = await Album.findById(id).lean();
    if (!album) return res.status(404).json({ message: "Album not found" });

    // Gợi ý: các album khác cùng artist, sort theo popularity, trừ album hiện tại
    const related = await Album.find({
      _id: { $ne: id },
      artistId: album.artistId,
    })
      .sort({ popularity: -1, createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ related });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}
