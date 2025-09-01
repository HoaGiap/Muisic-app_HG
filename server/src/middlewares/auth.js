// server/src/middlewares/auth.js
import admin from "firebase-admin";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Đường dẫn tới file service account (đặt ở server/firebase-service-account.json)
const svcPath = join(__dirname, "../../firebase-service-account.json");

// Đọc JSON 1 lần ở top-level
const serviceAccount = JSON.parse(await readFile(svcPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function requireAuth(req, res, next) {
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
