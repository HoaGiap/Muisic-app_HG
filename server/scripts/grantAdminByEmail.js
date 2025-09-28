// server/scripts/grantAdminByEmail.js
import "dotenv/config"; // ✅ đúng: không phải dotenv/config.js
import { admin } from "../src/firebaseAdmin.js";

const email = process.argv[2];

(async () => {
  try {
    if (!email) {
      console.error("Usage: node scripts/grantAdminByEmail.js <email>");
      process.exit(1);
    }

    // Debug: đảm bảo đã nạp service account
    const app = admin.app();
    console.log("Firebase app name:", app.name);

    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    await admin.auth().revokeRefreshTokens(user.uid); // ép client refresh token
    console.log(`✅ Granted admin to ${email} (uid=${user.uid})`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err?.message || err);
    process.exit(1);
  }
})();

// Bắt mọi lỗi chưa catch
process.on("unhandledRejection", (e) => {
  console.error("❌ UnhandledRejection:", e);
  process.exit(1);
});
process.on("uncaughtException", (e) => {
  console.error("❌ UncaughtException:", e);
  process.exit(1);
});
