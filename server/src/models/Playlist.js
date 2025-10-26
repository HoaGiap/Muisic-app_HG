import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerUid: { type: String, index: true, required: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    coverUrl: { type: String, default: null },
    type: {
      type: String,
      enum: ["normal", "radio"],
      default: "normal",
      index: true,
    },
    popularity: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
export default mongoose.model("Playlist", PlaylistSchema);
