import mongoose from "mongoose";

const SongSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: String,
  duration: Number,
  audioUrl: { type: String, required: true },
  coverUrl: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Song", SongSchema);
