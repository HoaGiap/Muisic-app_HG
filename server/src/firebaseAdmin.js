// server/src/firebaseAdmin.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Ưu tiên đọc từ biến môi trường JSON
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback: dùng GOOGLE_APPLICATION_CREDENTIALS nếu có
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export default admin;
