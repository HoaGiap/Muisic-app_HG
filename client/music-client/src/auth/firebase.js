// src/auth/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Biến “token hiện tại” dùng cho axios interceptor
let _idToken = null;
onIdTokenChanged(auth, async (user) => {
  _idToken = user ? await user.getIdToken() : null;
});
export const getIdToken = () => _idToken;

// Helpers
export const login = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export const register = (email, pw) =>
  createUserWithEmailAndPassword(auth, email, pw);
export const logout = () => signOut(auth);
