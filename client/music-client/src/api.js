import axios from "axios";
import { getAuth } from "firebase/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api",
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  try {
    const u = getAuth().currentUser;
    if (u) {
      // ✅ ép refresh để chắc chắn có claim admin sau khi login/grant
      const t = await u.getIdToken(true);
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }
  } catch {}
  return config;
});
