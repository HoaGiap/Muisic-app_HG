// server/src/services/cloudinary.js
import dotenv from "dotenv";
dotenv.config(); // đảm bảo .env được nạp TRƯỚC khi config Cloudinary

import { v2 as cloudinary } from "cloudinary";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_URL,
} = process.env;

// Nếu dùng CLOUDINARY_URL, tự tách key/secret/cloud cho chắc
function parseFromUrl(url) {
  // cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
  const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url || "");
  if (!m) return null;
  return { api_key: m[1], api_secret: m[2], cloud_name: m[3] };
}

let cfg =
  parseFromUrl(CLOUDINARY_URL) ||
  (CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_SECRET && {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });

if (!cfg) {
  console.error(
    "[Cloudinary] ❌ Thiếu cấu hình. Hãy đặt CLOUDINARY_URL hoặc 3 biến CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET trong server/.env"
  );
} else {
  cloudinary.config({ ...cfg, secure: true });
  // Log chẩn đoán ẩn bớt thông tin nhạy cảm
  console.log(
    `[Cloudinary] ✅ Config OK for cloud: ${cfg.cloud_name}, key: ${String(
      cfg.api_key
    ).slice(0, 4)}****`
  );
}

// (tùy chọn) tự kiểm tra kết nối khi khởi động
try {
  const r = await cloudinary.api.ping();
  console.log("[Cloudinary] ping:", r.status); // "ok"
} catch (e) {
  console.error("[Cloudinary] ping ERROR:", e.message);
}

export default cloudinary;
