import "dotenv/config.js";
import mongoose from "mongoose";
import Artist from "../src/models/Artist.js";
import Song from "../src/models/Song.js";

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  // Lấy tất cả bài chưa có artistId nhưng có tên artist
  const songs = await Song.find({
    artistId: { $exists: false },
    artist: { $ne: null },
  })
    .select("_id artist")
    .lean();

  console.log("Songs needing backfill:", songs.length);
  for (const s of songs) {
    const name = (s.artist || "").trim();
    if (!name) continue;

    // tìm (không phân biệt hoa/thường); nếu không có thì tạo mới
    let artist = await Artist.findOne({
      name: { $regex: `^${esc(name)}$`, $options: "i" },
    });
    if (!artist) {
      artist = await Artist.create({
        name,
        avatarUrl: "",
        popularity: 0,
        followerCount: 0,
      });
      console.log("Created artist:", artist.name, artist._id.toString());
    }

    await Song.updateOne({ _id: s._id }, { $set: { artistId: artist._id } });
  }

  console.log("Done.");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
