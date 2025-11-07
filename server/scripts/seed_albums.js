// server/scripts/seed_albums.js
import "dotenv/config.js";
import mongoose from "mongoose";
import Artist from "../src/models/Artist.js";
import Album from "../src/models/Album.js";

/**
 * Cách dùng (ví dụ):
 *   node scripts/seed_albums.js --artist="Heki" --count=2
 *   node scripts/seed_albums.js --artistId=68feebbcc67b7... --title="Best Of 2022" --coverUrl="https://..."
 *
 * Tham số:
 *   --artist      : tên nghệ sĩ (không phân biệt hoa/thường)
 *   --artistId    : ObjectId nghệ sĩ
 *   --count       : số album muốn tạo (mặc định 1) nếu không truyền --title
 *   --title       : tạo 1 album với tên cụ thể
 *   --coverUrl    : url ảnh bìa (tùy chọn, có thể để trống)
 */

function arg(name, fallback = undefined) {
  const hit = process.argv.find((s) => s.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=").trim() : fallback;
}

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveArtist({ artistId, artistName }) {
  if (artistId && mongoose.Types.ObjectId.isValid(artistId)) {
    const byId = await Artist.findById(artistId);
    if (byId) return byId;
    throw new Error(`Không tìm thấy Artist theo _id=${artistId}`);
  }

  if (artistName) {
    const byName = await Artist.findOne({
      name: { $regex: `^${escRe(artistName)}$`, $options: "i" },
    });
    if (byName) return byName;
    throw new Error(`Không tìm thấy Artist theo name="${artistName}"`);
  }

  throw new Error("Thiếu --artist hoặc --artistId");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const artistId = arg("artistId");
  const artistName = arg("artist");
  const titleArg = arg("title");
  const coverArg = arg("coverUrl");
  const count = Number(arg("count", "1")) || 1;

  await mongoose.connect(process.env.MONGO_URI);

  const artist = await resolveArtist({ artistId, artistName });
  console.log("✓ Nghệ sĩ:", artist.name, `(${artist._id.toString()})`);

  const docs = [];

  if (titleArg) {
    docs.push({
      title: titleArg,
      coverUrl: coverArg || "",
      artistId: artist._id,
      songIds: [],
      releaseDate: new Date(`${randomInt(2018, 2025)}-01-01`),
      popularity: randomInt(0, 1000),
    });
  } else {
    const base = artist.name || "Unknown";
    for (let i = 1; i <= count; i++) {
      docs.push({
        title: `${base} • Album #${i}`,
        coverUrl: coverArg || "",
        artistId: artist._id,
        songIds: [],
        releaseDate: new Date(
          `${randomInt(2018, 2025)}-${randomInt(1, 12)}-01`
        ),
        popularity: randomInt(0, 1000),
      });
    }
  }

  const inserted = await Album.insertMany(docs, { ordered: false });
  console.log(`✓ Đã tạo ${inserted.length} album`);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seed error:", e.message);
    await mongoose.disconnect();
    process.exit(1);
  });
