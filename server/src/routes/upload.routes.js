// server/src/routes/upload.routes.js
import { Router } from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../services/cloudinary.js";

const router = Router();

/**
 * Giới hạn: tổng 25MB. Ở dưới còn chặn riêng audio/image.
 * Dùng memoryStorage để stream thẳng lên Cloudinary.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const MAX_AUDIO = 20 * 1024 * 1024; // 20MB
const MAX_IMAGE = 5 * 1024 * 1024; // 5MB

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });

    const folder = req.query.folder || "music-app";
    const { mimetype, size } = req.file;

    const isAudio = /^audio\//i.test(mimetype);
    const isImage = /^image\//i.test(mimetype);

    if (!isAudio && !isImage) {
      return res
        .status(400)
        .json({
          error: "Định dạng không hỗ trợ. Chỉ chấp nhận audio/* hoặc image/*",
        });
    }
    if (isAudio && size > MAX_AUDIO) {
      return res.status(413).json({ error: "Audio vượt quá 20MB" });
    }
    if (isImage && size > MAX_IMAGE) {
      return res.status(413).json({ error: "Ảnh vượt quá 5MB" });
    }

    // Cloudinary: resource_type = auto (audio sẽ được xếp vào 'video')
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder,
        // bạn có thể thêm transformations với image nếu muốn:
        // transformation: isImage ? [{ width: 1000, height: 1000, crop: "limit" }] : undefined,
      },
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          url: result.secure_url,
          public_id: result.public_id,
          duration: result.duration ?? null, // Cloudinary trả duration với audio/video
          bytes: result.bytes,
          format: result.format,
          width: result.width ?? null,
          height: result.height ?? null,
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
