// server/src/routes/admin.routes.js
import { Router } from "express";
import admin from "firebase-admin";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import Song from "../models/Song.js";
import Playlist from "../models/Playlist.js";
import User from "../models/User.js";
import { audit } from "../utils/audit.js";

const router = Router();

/**
 * GET /api/admin/users?limit=20&next=&q=
 * Liệt kê user + phân trang (token-based)
 */
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { limit = 20, next = "", q = "" } = req.query;
    const l = Math.min(1000, Math.max(1, parseInt(limit, 10) || 20));

    const result = await admin.auth().listUsers(l, next || undefined);

    let users = result.users.map((u) => ({
      uid: u.uid,
      email: u.email || "",
      displayName: u.displayName || "",
      disabled: u.disabled,
      admin: !!u.customClaims?.admin,
      createdAt: u.metadata.creationTime,
      lastLoginAt: u.metadata.lastSignInTime,
      providerIds: u.providerData?.map((p) => p.providerId) || [],
    }));

    if (q) {
      const s = String(q).toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(s) ||
          (u.displayName || "").toLowerCase().includes(s) ||
          u.uid.includes(s)
      );
    }

    res.json({ users, nextPageToken: result.pageToken || null });
  } catch (e) {
    console.error("list users error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * CẤP / BỎ quyền admin cho 1 user
 * POST /api/admin/users/:uid/admin  { isAdmin: boolean }
 */
router.post(
  "/users/:uid/admin",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { uid } = req.params;
      const { isAdmin } = req.body ?? {};
      if (!uid || typeof isAdmin !== "boolean") {
        return res
          .status(400)
          .json({ error: "uid & isAdmin(boolean) required" });
      }

      await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
      await admin.auth().revokeRefreshTokens(uid); // hiệu lực ngay
      await audit(req, "set-admin", uid, { admin: isAdmin });

      res.json({ ok: true, uid, admin: isAdmin });
    } catch (e) {
      console.error("set admin error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

/**
 * Khóa/Mở khóa user
 * POST /api/admin/users/:uid/disabled  { disabled: boolean }
 */
router.post(
  "/users/:uid/disabled",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { uid } = req.params;
      const { disabled } = req.body ?? {};
      if (!uid || typeof disabled !== "boolean") {
        return res
          .status(400)
          .json({ error: "uid & disabled(boolean) required" });
      }

      await admin.auth().updateUser(uid, { disabled });
      await audit(req, "disable", uid, { disabled });

      res.json({ ok: true, uid, disabled });
    } catch (e) {
      console.error("disable user error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

/**
 * Thu hồi refresh tokens -> buộc user login lại
 * POST /api/admin/users/:uid/revoke
 */
router.post(
  "/users/:uid/revoke",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { uid } = req.params;
      if (!uid) return res.status(400).json({ error: "uid required" });

      await admin.auth().revokeRefreshTokens(uid);
      await audit(req, "revoke", uid);

      res.json({ ok: true, uid });
    } catch (e) {
      console.error("revoke error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

/**
 * Xoá user khỏi Firebase Auth
 * DELETE /api/admin/users/:uid
 * (Nếu có dữ liệu liên quan trong Mongo, nhớ transfer/xoá trước khi gọi endpoint này)
 */
router.delete(
  "/users/:uid",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { uid } = req.params;
      if (!uid) return res.status(400).json({ error: "uid required" });
      if (uid === req.user.uid)
        return res.status(400).json({ error: "Không thể tự xoá chính mình" });

      await admin.auth().deleteUser(uid);
      await audit(req, "delete-user", uid);

      res.json({ ok: true, uid });
    } catch (e) {
      console.error("delete user error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

/**
 * Chuyển quyền dữ liệu giữa 2 user
 * POST /api/admin/transfer  { fromUid, toUid }
 * - Song: field createdBy
 * - Playlist: field ownerUid
 */
router.post(
  "/transfer",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { fromUid, toUid } = req.body || {};
      if (!fromUid || !toUid) {
        return res.status(400).json({ error: "fromUid & toUid required" });
      }
      if (fromUid === toUid) {
        return res.status(400).json({ error: "fromUid phải khác toUid" });
      }

      // check tồn tại
      await Promise.all([
        admin.auth().getUser(fromUid),
        admin.auth().getUser(toUid),
      ]);

      // transfer dữ liệu
      const songsR = await Song.updateMany(
        { createdBy: fromUid },
        { $set: { createdBy: toUid } }
      );
      const playlistsR = await Playlist.updateMany(
        { ownerUid: fromUid },
        { $set: { ownerUid: toUid } }
      );

      await audit(req, "transfer", `${fromUid}→${toUid}`, {
        songsUpdated: songsR.modifiedCount || 0,
        playlistsUpdated: playlistsR.modifiedCount || 0,
      });

      res.json({
        ok: true,
        songsUpdated: songsR.modifiedCount || 0,
        playlistsUpdated: playlistsR.modifiedCount || 0,
      });
    } catch (e) {
      console.error("transfer error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

/**
 * GET /api/admin/stats/overview
 * - usersPerDay: mA?i ngA?y trong kho?ng (default 14 ngA?y)
 * - topSongsWeek: top bA?i hA?t theo plays trong 7 ngA?y qua (d?a trA?n updatedAt)
 * - bandwidth: ???ng d?ng l??ng ???c ???c ??c (??nh giA? theo plays * duration * bitrate)
 */
router.get(
  "/stats/overview",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const daysParam = parseInt(req.query.days, 10);
      const days = Math.min(60, Math.max(1, isNaN(daysParam) ? 14 : daysParam));

      // ===== New users per day =====
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      start.setUTCDate(start.getUTCDate() - (days - 1));

      const usersAgg = await User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const userMap = new Map(usersAgg.map((u) => [u._id, u.count]));
      const usersPerDay = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        usersPerDay.push({ date: key, count: userMap.get(key) || 0 });
      }

      // ===== Top songs in the last 7 days (by plays/playCount) =====
      const weekAgo = new Date();
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

      const topSongsRaw = await Song.aggregate([
        { $match: { updatedAt: { $gte: weekAgo } } },
        {
          $project: {
            title: 1,
            artist: 1,
            coverUrl: 1,
            plays: {
              $ifNull: ["$plays", { $ifNull: ["$playCount", 0] }],
            },
          },
        },
        { $sort: { plays: -1 } },
        { $limit: 10 },
      ]);

      const topSongsWeek = topSongsRaw.map((s) => ({
        id: s._id,
        title: s.title,
        artist: s.artist,
        coverUrl: s.coverUrl || "",
        plays: s.plays || 0,
      }));

      // ===== Bandwidth estimation (plays * duration * 128 kbps) =====
      const bwAgg = await Song.aggregate([
        {
          $project: {
            plays: {
              $ifNull: ["$plays", { $ifNull: ["$playCount", 0] }],
            },
            duration: { $ifNull: ["$duration", 0] }, // seconds
          },
        },
        {
          $group: {
            _id: null,
            totalPlays: { $sum: "$plays" },
            totalSeconds: { $sum: { $multiply: ["$plays", "$duration"] } },
          },
        },
      ]);

      const bitrateKbps = 128;
      const totalPlays = bwAgg?.[0]?.totalPlays || 0;
      const totalSeconds = bwAgg?.[0]?.totalSeconds || 0;
      const totalBytes = totalSeconds * ((bitrateKbps * 1000) / 8);

      res.json({
        usersPerDay,
        topSongsWeek,
        bandwidth: {
          totalBytes,
          totalGB: totalBytes / 1024 / 1024 / 1024,
          totalPlays,
          bitrateKbps,
        },
      });
    } catch (e) {
      console.error("stats overview error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
