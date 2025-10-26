import mongoose from "mongoose";

const ArtistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    followerCount: { type: Number, default: 0 },
    popularity: { type: Number, default: 0, index: true }, // để sort nhanh
  },
  { timestamps: true }
);

export default mongoose.model("Artist", ArtistSchema);
