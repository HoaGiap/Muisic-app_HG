import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerUid: { type: String, index: true, required: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
  },
  { timestamps: true }
);

export default mongoose.model("Playlist", PlaylistSchema);
