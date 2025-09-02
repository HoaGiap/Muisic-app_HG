import mongoose from "mongoose";

const SongSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    duration: Number,

    // URLs phát nhạc & ảnh bìa
    audioUrl: { type: String, required: true },
    coverUrl: String,

    // Lưu public_id để xóa file trên Cloudinary khi delete
    audioPublicId: String,
    coverPublicId: String,

    // Chủ sở hữu (uid từ token Firebase)
    ownerUid: { type: String, index: true },

    // Đếm lượt phát
    plays: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Song", SongSchema);
