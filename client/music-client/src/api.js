import axios from "axios";
import { getIdToken } from "./auth/firebase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api",
  timeout: 30000,
});

// Interceptor: luôn gửi Authorization: Bearer <idToken> nếu có
api.interceptors.request.use((cfg) => {
  const t = getIdToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
