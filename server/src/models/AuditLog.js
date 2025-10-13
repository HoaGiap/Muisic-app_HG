// server/src/models/AuditLog.js
import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actorUid: { type: String, index: true, required: true },
    action: { type: String, index: true, required: true }, // e.g. 'set-admin','disable','revoke','transfer','delete-user','create-song','delete-song'
    target: { type: String, default: "" }, // uid/email/songId/playlistId...
    meta: { type: Object, default: {} }, // dữ liệu thêm
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", AuditLogSchema);
