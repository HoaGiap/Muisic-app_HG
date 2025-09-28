// server/src/firebaseAdmin.js
import admin from "firebase-admin";

function loadCred() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      "base64"
    ).toString("utf8");
    return JSON.parse(json);
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  throw new Error(
    "Missing FIREBASE_SERVICE_ACCOUNT_B64 or FIREBASE_SERVICE_ACCOUNT_JSON"
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadCred()),
  });
}

export { admin };
