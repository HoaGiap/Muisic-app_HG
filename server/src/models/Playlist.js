import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Playlist", PlaylistSchema);
