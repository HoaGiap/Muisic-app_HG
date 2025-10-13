import "dotenv/config";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // đọc từ GOOGLE_APPLICATION_CREDENTIALS
  });
}

export { admin as default, admin };
