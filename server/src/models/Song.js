import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: String,
    artist: String,
    duration: Number,
    audioUrl: { type: String, required: true },
    coverUrl: String,
    ownerUid: String, // người upload
    plays: { type: Number, default: 0 }, // lượt nghe
  },
  { timestamps: true }
);

export default mongoose.model("Song", songSchema);
