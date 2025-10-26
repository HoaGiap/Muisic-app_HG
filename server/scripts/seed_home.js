import "dotenv/config";
import mongoose from "mongoose";
import Artist from "../src/models/Artist.js";
import Album from "../src/models/Album.js";
import Playlist from "../src/models/Playlist.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  // Artists mẫu
  const artists = [
    { name: "Sơn Tùng M-TP", image: "", popularity: 1000 },
    { name: "SOOBIN", image: "", popularity: 900 },
    { name: "HIEUTHUHAI", image: "", popularity: 800 },
  ];
  for (const a of artists) {
    await Artist.updateOne(
      { name: a.name },
      { $setOnInsert: a },
      { upsert: true }
    );
  }

  // Albums mẫu
  const albums = [
    {
      title: "M-TP Mix",
      artistName: "Sơn Tùng M-TP",
      coverUrl: "",
      popularity: 500,
    },
    {
      title: "SOOBIN Hitlist",
      artistName: "SOOBIN",
      coverUrl: "",
      popularity: 480,
    },
  ];
  for (const al of albums) {
    await Album.updateOne(
      { title: al.title, artistName: al.artistName },
      { $setOnInsert: al },
      { upsert: true }
    );
  }

  // Radio mẫu (playlist.type = 'radio')
  const radios = [
    { name: "V-Pop Radio", coverUrl: "", type: "radio", popularity: 600 },
    { name: "Chill Radio", coverUrl: "", type: "radio", popularity: 550 },
  ];
  for (const r of radios) {
    await Playlist.updateOne(
      { name: r.name },
      { $setOnInsert: r },
      { upsert: true }
    );
  }

  console.log("✅ Seed xong");
  await mongoose.disconnect();
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
