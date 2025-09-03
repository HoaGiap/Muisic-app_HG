import mongoose from "mongoose";

const SongSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    duration: { type: Number, default: null },
    audioUrl: { type: String, required: true },
    coverUrl: { type: String, default: null },
    ownerUid: { type: String, index: true }, // người upload
    plays: { type: Number, default: 0 }, // ✅ lượt nghe
  },
  { timestamps: true }
);

export default mongoose.model("Song", SongSchema);
