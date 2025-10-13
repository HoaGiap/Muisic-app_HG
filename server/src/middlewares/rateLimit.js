// server/src/middlewares/rateLimit.js
import rateLimit from "express-rate-limit";

// Áp cho các endpoint nhạy cảm (admin, upload…)
export const limitSensitive = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // tối đa 100 req/15'
  standardHeaders: true,
  legacyHeaders: false,
});

// (tuỳ chọn) rate limit cho auth/login
export const limitAuth = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // 10 req/phút
  standardHeaders: true,
  legacyHeaders: false,
});
