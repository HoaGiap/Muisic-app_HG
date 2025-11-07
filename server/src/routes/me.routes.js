import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import User from "../models/User.js";
import admin from "../firebaseAdmin.js"; // default export từ firebaseAdmin.js

const router = express.Router();

/**
 * GET /api/me/whoami
 * Trả về thông tin đã decode từ Firebase ID token (uid, email, admin...)
 */
router.get("/whoami", requireAuth, (req, res) => {
  return res.json(req.user);
});

/**
 * POST /api/me/sync
 * - Tạo/cập nhật bản ghi User trong Mongo từ token hiện tại
 * - (Tuỳ chọn) đồng bộ custom claims nếu bạn muốn
 */
router.post("/sync", requireAuth, async (req, res) => {
  try {
    const { uid, email } = req.user;

    const user = await User.findByIdAndUpdate(
      uid,
      { _id: uid, email: email || "" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // (Optional) đồng bộ roles -> custom claims
    // await admin.auth().setCustomUserClaims(uid, { admin: user.roles.includes("admin") });
    // await admin.auth().revokeRefreshTokens(uid);

    return res.json({ ok: true, uid: user._id, roles: user.roles });
  } catch (e) {
    console.error("Sync me error:", e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/me/following/artists
 * - Trả danh sách artistId (string) mà user đang theo dõi
 */
router.get("/following/artists", requireAuth, async (req, res) => {
  try {
    const u = await User.findById(req.user.uid)
      .select("followingArtistIds")
      .lean();

    const artistIds = (u?.followingArtistIds || []).map(String);
    return res.json({ artistIds });
  } catch (e) {
    console.error("Get following artists error:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
