// server/src/middlewares/auth.js
import admin from "firebase-admin";

// Cách 1: dán nguyên JSON service account vào env FIREBASE_SERVICE_ACCOUNT
const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

// Cách 2: set 3 biến riêng lẻ (nhớ replace \\n)
const credFromPieces =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
    ? {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }
    : null;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(svcJson || credFromPieces),
  });
}

export async function requireAuth(req, res, next) {
  // ✅ Cho phép preflight đi qua
  if (req.method === "OPTIONS") return next();

  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token", detail: e.message });
  }
}
