import { Router } from "express";
import Song from "../models/Song.js";
import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import Playlist from "../models/Playlist.js";

const router = Router();

// cache đơn giản trong RAM 60 giây
let CACHE = { data: null, at: 0 };
const TTL = 60 * 1000;

router.get("/", async (_req, res) => {
  try {
    const now = Date.now();
    if (CACHE.data && now - CACHE.at < TTL) {
      return res.json(CACHE.data);
    }

    // 1) Trending songs
    const trendingItems = await Song.find({})
      .sort({ popularity: -1, playCount: -1, createdAt: -1 })
      .limit(24)
      .lean();

    // 2) Popular artists (ưu tiên bảng Artist, nếu trống -> suy luận từ Song)
    let artistItems = await Artist.find({})
      .sort({ popularity: -1, createdAt: -1 })
      .limit(18)
      .lean();

    if (artistItems.length === 0) {
      // fallback: group theo artist từ Song
      const topBySongs = await Song.aggregate([
        { $match: { artist: { $ne: null } } },
        {
          $group: {
            _id: "$artist",
            totalPlays: { $sum: "$playCount" },
            totalPop: { $sum: "$popularity" },
          },
        },
        {
          $project: {
            name: "$_id",
            popularity: { $add: ["$totalPlays", "$totalPop"] },
          },
        },
        { $sort: { popularity: -1 } },
        { $limit: 18 },
      ]);
      artistItems = topBySongs.map((a) => ({
        _id: a.name,
        name: a.name,
        popularity: a.popularity,
        image: "", // nếu muốn có ảnh, thêm cột coverUrl vào Song rồi $first
      }));
    }

    // 3) Albums
    let albumItems = await Album.find({})
      .sort({ popularity: -1, createdAt: -1 })
      .limit(18)
      .lean();

    // 4) Radios (Playlist.type = 'radio')
    const radioItems = await Playlist.find({ type: "radio" })
      .sort({ popularity: -1, updatedAt: -1 })
      .limit(18)
      .lean();

    const data = {
      trending: { title: "Bài hát thịnh hành", items: trendingItems },
      artists: { title: "Nghệ sĩ phổ biến", items: artistItems },
      albums: { title: "Album & Đĩa đơn nổi tiếng", items: albumItems },
      radios: {
        title: "Radio phổ biến",
        items: radioItems.map((r) => ({
          _id: r._id,
          title: r.name,
          description: `${r.songs?.length || 0} bài`,
          coverUrl: r.coverUrl || "",
        })),
      },
    };

    CACHE = { data, at: now };
    res.json(data);
  } catch (e) {
    console.error("home error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
