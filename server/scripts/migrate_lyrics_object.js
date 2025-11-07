// scripts/migrate_lyrics_object.js
import "dotenv/config";
import mongoose from "mongoose";
import Song from "../src/models/Song.js";

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const cur = await Song.find({ lyrics: { $type: "string" } }).lean();
  for (const s of cur) {
    await Song.updateOne(
      { _id: s._id },
      {
        $set: {
          lyrics: { text: s.lyrics || "", language: "", updatedAt: new Date() },
        },
      },
      { runValidators: false }
    );
  }
  console.log("Migrated", cur.length, "songs");
  await mongoose.disconnect();
})();
