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
    const trendingItems = await Song.find({
      /* isPublic: true */
    })
      .sort({ popularity: -1, playCount: -1, createdAt: -1 })
      .limit(24)
      .select("_id title artist audioUrl coverUrl duration popularity")
      .lean();

    // 2) Popular artists (ưu tiên bảng Artist, nếu trống -> suy luận từ Song và auto-create)
    let artistItems = await Artist.find({})
      .sort({ popularity: -1, createdAt: -1 })
      .limit(18)
      .select("_id name avatarUrl popularity")
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

      const names = topBySongs.map((a) => a.name?.trim()).filter(Boolean);

      // lấy các nghệ sĩ đã tồn tại (case-sensitive trước, rồi ta map lowercase để rộng hơn)
      const existed = await Artist.find({ name: { $in: names } })
        .select("_id name avatarUrl popularity")
        .lean();

      // map theo lowercase để tìm nhanh
      const existedMap = new Map(
        existed.map((a) => [String(a.name).toLowerCase(), a])
      );

      const toCreate = [];
      for (const n of names) {
        const key = String(n).toLowerCase();
        if (!existedMap.has(key)) {
          toCreate.push({
            name: n,
            avatarUrl: "",
            popularity: 0,
            followerCount: 0,
          });
        }
      }

      if (toCreate.length) {
        // tạo nhanh những artist còn thiếu
        const inserted = await Artist.insertMany(toCreate, { ordered: false });
        for (const a of inserted) {
          existedMap.set(String(a.name).toLowerCase(), {
            _id: a._id,
            name: a.name,
            avatarUrl: a.avatarUrl || "",
            popularity: a.popularity || 0,
          });
        }
      }

      // ghép theo thứ tự popularity từ aggregation
      artistItems = topBySongs.map((a) => {
        const key = String(a.name).toLowerCase();
        const exist = existedMap.get(key);
        return {
          _id: exist?._id, // đảm bảo là ObjectId
          name: exist?.name || a.name,
          avatarUrl: exist?.avatarUrl || "",
          popularity: exist?.popularity ?? a.popularity ?? 0,
        };
      });
    }

    // 3) Albums (chỉ trả trường cần)
    const albumItems = await Album.find({})
      .sort({ popularity: -1, createdAt: -1 })
      .limit(18)
      .select("_id title coverUrl artistId releaseDate popularity")
      .lean();

    // 4) Radios (Playlist.type = 'radio')
    const radioItemsRaw = await Playlist.find({ type: "radio" })
      .sort({ popularity: -1, updatedAt: -1 })
      .limit(18)
      .select("_id name coverUrl songs")
      .lean();

    const radioItems = radioItemsRaw.map((r) => ({
      _id: r._id,
      title: r.name,
      description: `${r.songs?.length || 0} bài`,
      coverUrl: r.coverUrl || "",
    }));

    const data = {
      trending: { title: "Bài hát thịnh hành", items: trendingItems },
      artists: { title: "Nghệ sĩ phổ biến", items: artistItems },
      albums: { title: "Album & Đĩa đơn nổi tiếng", items: albumItems },
      radios: { title: "Radio phổ biến", items: radioItems },
    };

    CACHE = { data, at: now };
    res.json(data);
  } catch (e) {
    console.error("home error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
