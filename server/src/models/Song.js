import mongoose from "mongoose";

// Cue cho LRC: { t: seconds, l: line }
const CueSchema = new mongoose.Schema(
  {
    t: { type: Number, required: true },
    l: { type: String, required: true },
  },
  { _id: false }
);

const SongSchema = new mongoose.Schema(
  {
    title: String,
    artist: String,
    duration: Number,
    audioUrl: String,
    coverUrl: String,
    ownerUid: String,
    plays: { type: Number, default: 0 },

    // Lời không timestamp (tùy chọn)
    lyrics: { type: String, default: "" },

    // LRC đã parse: mảng cue { t, l }
    lyricsLrc: { type: [CueSchema], default: [] },
  },
  { timestamps: true }
);

// ✅ Export mặc định để file khác dùng: import Song from "../models/Song.js"
export default mongoose.model("Song", SongSchema);
