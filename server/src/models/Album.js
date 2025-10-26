import mongoose from "mongoose";

const AlbumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    coverUrl: { type: String, default: "" },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      index: true,
    },
    songIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    releaseDate: { type: Date, default: Date.now },
    popularity: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Album", AlbumSchema);
