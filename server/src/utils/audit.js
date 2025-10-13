// server/src/utils/audit.js
import AuditLog from "../models/AuditLog.js";

export async function audit(req, action, target = "", meta = {}) {
  try {
    const actorUid = req.user?.uid || "unknown";
    await AuditLog.create({ actorUid, action, target, meta });
  } catch (e) {
    console.error("Audit error:", e.message);
  }
}
