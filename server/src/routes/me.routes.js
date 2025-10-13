import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import User from "../models/User.js";
import { admin as fbAdmin } from "../firebaseAdmin.js"; // nếu muốn sync to claims

const router = express.Router();
router.get("/whoami", requireAuth, (req, res) => res.json(req.user));
// POST /api/me/sync
router.post("/sync", requireAuth, async (req, res) => {
  try {
    const { uid, email } = req.user; // middleware của bạn đã gắn req.user từ token
    const user = await User.findByIdAndUpdate(
      uid,
      { _id: uid, email: email || "" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Optional: nếu bạn muốn đồng bộ DB -> custom claims (không bắt buộc)
    // await fbAdmin.auth().setCustomUserClaims(uid, { admin: user.roles.includes("admin") });
    // await fbAdmin.auth().revokeRefreshTokens(uid);

    return res.json({ ok: true, uid: user._id, roles: user.roles });
  } catch (e) {
    console.error("Sync me error:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
