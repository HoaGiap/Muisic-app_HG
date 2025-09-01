import axios from "axios";
import { auth } from "./auth/firebase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api",
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  try {
    const u = auth.currentUser;
    if (u) {
      const t = await u.getIdToken(); // hoặc getIdToken(true) nếu muốn cưỡng bức refresh
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }
  } catch {
    // bỏ qua, gửi request như bình thường
  }
  return config;
});
