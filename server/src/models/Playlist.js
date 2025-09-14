import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerUid: { type: String, index: true, required: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    coverUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Playlist", PlaylistSchema);
