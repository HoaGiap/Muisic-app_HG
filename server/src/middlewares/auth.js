// server/src/middlewares/auth.js
import dotenv from "dotenv";
dotenv.config(); // ✅ đảm bảo .env có hiệu lực trước khi đọc env

import admin from "firebase-admin";

/**
 * Hỗ trợ 2 cách cấu hình:
 * 1) FIREBASE_SERVICE_ACCOUNT = JSON đầy đủ (string)
 * 2) FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

function buildCredentialFromEnv() {
  // Cách 1: một biến JSON đầy đủ
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    try {
      // Cho phép chứa \n dạng escaped
      const parsed = JSON.parse(saJson.replace(/\\n/g, "\n"));
      return admin.credential.cert(parsed);
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT parse error:", e.message);
      // tiếp tục thử cách 2
    }
  }

  // Cách 2: 3 biến lẻ
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey && privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase admin env. Cần 1 trong 2:\n" +
        " - FIREBASE_SERVICE_ACCOUNT (JSON đầy đủ), hoặc\n" +
        " - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  return admin.credential.cert({ projectId, clientEmail, privateKey });
}

// Khởi tạo admin 1 lần
if (!admin.apps.length) {
  admin.initializeApp({
    credential: buildCredentialFromEnv(),
  });
}

function tokenFrom(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function requireAuth(req, res, next) {
  const token = tokenFrom(req);
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || "" };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Cho phép không bắt buộc token; nếu có thì gắn req.user
export async function requireAuthOptional(req, _res, next) {
  const token = tokenFrom(req);
  if (!token) return next();
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || "" };
  } catch {
    // bỏ qua
  }
  next();
}
