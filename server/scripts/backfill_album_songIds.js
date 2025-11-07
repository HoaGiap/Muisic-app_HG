import mongoose from "mongoose";
import "dotenv/config";
import Album from "../src/models/Album.js";
import Song from "../src/models/Song.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const albums = await Album.find({
    $or: [{ songIds: { $exists: false } }, { songIds: { $size: 0 } }],
  });
  for (const a of albums) {
    const songs = await Song.find({ albumId: a._id })
      .sort({ createdAt: 1 })
      .select("_id");
    a.songIds = songs.map((s) => s._id);
    await a.save();
    console.log(`Updated album ${a.title} -> ${a.songIds.length} songs`);
  }
  await mongoose.disconnect();
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
