import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Thiếu tiêu đề bài hát"],
      trim: true,
    },
    artist: {
      type: String,
      required: [true, "Thiếu tên ca sĩ"],
      trim: true,
    },
    audioUrl: {
      type: String,
      required: [true, "Thiếu đường dẫn file audio"],
    },
    coverUrl: {
      type: String,
      default: "",
    },
    lyrics: {
      type: String,
      default: "",
    },
    duration: {
      type: Number, // tính bằng giây
      required: [true, "Thiếu độ dài bài hát"],
    },
    createdBy: {
      type: String, // lưu uid của Firebase user
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // tự thêm createdAt, updatedAt
  }
);

export default mongoose.model("Song", songSchema);
