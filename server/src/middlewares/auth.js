import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";

function tokenFrom(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

// ✅ gắn admin vào req.user luôn
export async function requireAuth(req, res, next) {
  const token = tokenFrom(req);
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      admin: !!decoded.admin, // <--- quan trọng
    };
    next();
  } catch (e) {
    console.error("verifyIdToken error:", e.code, e.message);
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireAuthOptional(req, _res, next) {
  const token = tokenFrom(req);
  if (!token) return next();
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      admin: !!decoded.admin, // <--- cũng gắn ở optional
    };
  } catch {}
  next();
}

// ✅ middleware kiểm tra role dựa trên req.user.admin
export function requireRole(role = "admin") {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Missing token" });
    if (role === "admin" && req.user.admin) return next();
    return res.status(403).json({ error: "Admin only" });
  };
}
