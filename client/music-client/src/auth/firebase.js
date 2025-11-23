// src/auth/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

// Cấu hình Firebase (đảm bảo các biến môi trường này có trong .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ======================================
// 🔒 Giữ token hiện tại để axios có thể dùng
// ======================================
let _idToken = null;
onIdTokenChanged(auth, async (user) => {
  if (user) {
    try {
      _idToken = await user.getIdToken();
    } catch {
      _idToken = null;
    }
  } else {
    _idToken = null;
  }
});
export const getIdToken = () => _idToken;

// ======================================
// 🔑 Helpers
// ======================================
export async function register(email, password, profile = {}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Cap nhat ten hien thi / avatar neu UI co gui len
  try {
    const { displayName, photoURL } = profile || {};
    if (displayName || photoURL) {
      await updateProfile(cred.user, {
        displayName: displayName || cred.user.displayName,
        photoURL: photoURL || cred.user.photoURL,
      });
    }
  } catch (err) {
    console.warn("Khong cap nhat duoc profile:", err?.message || err);
  }

  // ✅ Tự động gửi email xác thực (không bắt buộc nhưng nên có)
  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.warn("Không gửi được email xác thực:", err.message);
  }

  return cred.user; // Firebase sẽ tự login sau khi tạo
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}
