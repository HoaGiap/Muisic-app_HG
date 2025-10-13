import { Router } from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../services/cloudinary.js";

const router = Router();

// Giới hạn tổng 25MB để chặn sớm
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

    const isAudio = /^audio\//.test(mimetype);
    const isImage = /^image\//.test(mimetype);

    if (!isAudio && !isImage) {
      return res
        .status(400)
        .json({ error: "Định dạng không hỗ trợ (audio/image)" });
    }
    if (isAudio && size > MAX_AUDIO) {
      return res.status(413).json({ error: "Audio quá 20MB" });
    }
    if (isImage && size > MAX_IMAGE) {
      return res.status(413).json({ error: "Ảnh quá 5MB" });
    }

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder },
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          url: result.secure_url,
          public_id: result.public_id,
          duration: result.duration ?? null,
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
