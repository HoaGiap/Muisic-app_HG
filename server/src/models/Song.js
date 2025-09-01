import mongoose from "mongoose";

const SongSchema = new mongoose.Schema(
  {
    title: String,
    artist: String,
    duration: Number,
    audioUrl: { type: String, required: true },
    coverUrl: String,
    // ⬇️ BẮT BUỘC có để lưu chủ sở hữu
    ownerUid: { type: String, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Song", SongSchema);
