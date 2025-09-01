// server/src/middlewares/auth.js
import admin from "firebase-admin";
import fs from "fs";

let inited = false;
function initFirebaseAdmin() {
  if (inited || (admin.apps && admin.apps.length)) return;

  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    credential = admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    );
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  } else {
    const json = fs.readFileSync(
      new URL("../../firebase-service-account.json", import.meta.url),
      "utf8"
    );
    credential = admin.credential.cert(JSON.parse(json));
  }

  admin.initializeApp({ credential });
  inited = true;
}

export async function requireAuth(req, res, next) {
  if (req.method === "OPTIONS") return next();
  try {
    initFirebaseAdmin();
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// NEW: đọc token nếu có, nhưng không bắt buộc
export async function optionalAuth(req, _res, next) {
  if (req.method === "OPTIONS") return next();
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) return next();
    initFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
    req.user = { uid: decoded.uid, email: decoded.email || null };
  } catch (_) {
    // bỏ qua
  } finally {
    next();
  }
}
