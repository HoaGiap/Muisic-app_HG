import mongoose from "mongoose";

const SongSchema = new mongoose.Schema(
  {
    // --- Thông tin cũ (giữ nguyên) ---
    title: {
      type: String,
      required: [true, "Thiếu tiêu đề bài hát"],
      trim: true,
    },
    artist: {
      type: String, // vẫn giữ chuỗi để tương thích dữ liệu cũ
      required: [true, "Thiếu tên ca sĩ"],
      trim: true,
    },
    audioUrl: { type: String, required: [true, "Thiếu đường dẫn file audio"] },
    coverUrl: { type: String, default: "" },
    lyrics: {
      text: { type: String, default: "" },
      language: { type: String, default: "" },
      updatedAt: { type: Date },
    },
    duration: {
      type: Number, // giây
      required: [true, "Thiếu độ dài bài hát"],
    },
    createdBy: {
      type: String, // Firebase uid
      required: true,
      index: true,
    },

    // --- Thêm mới để phục vụ Home / xếp hạng ---
    playCount: { type: Number, default: 0, index: true }, // số lần nghe
    likedCount: { type: Number, default: 0, index: true }, // số lượt thích
    popularity: { type: Number, default: 0, index: true }, // tuỳ bạn cập nhật (công thức tổng hợp)

    // --- (Tuỳ chọn) Quan hệ tới Artist/Album để render subtitle/cover đẹp hơn ---
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      index: true,
      default: null,
    },
    albumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      index: true,
      default: null,
    },

    // --- (Tuỳ chọn) cờ hiển thị ---
    isPublic: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Tối ưu truy vấn "thịnh hành"
SongSchema.index({ playCount: -1, likedCount: -1, createdAt: -1 });

export default mongoose.model("Song", SongSchema);
