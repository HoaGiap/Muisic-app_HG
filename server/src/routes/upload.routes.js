import { Router } from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../services/cloudinary.js";

const router = Router();
// nhận file vào bộ nhớ, giới hạn 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// POST /api/upload?folder=music-app
// form-data: field tên "file"
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const folder = req.query.folder || "music-app";

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder },
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        // result.duration có cho audio/video nếu Cloudinary phân tích được
        res.json({
          url: result.secure_url,
          public_id: result.public_id,
          duration: result.duration ?? null,
        });
      }
    );

    // đẩy Buffer lên stream
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
