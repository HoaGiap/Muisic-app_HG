// server/src/validators/song.schema.js
import { z } from "zod";

export const CreateSongSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  audioUrl: z.string().url(),
  coverUrl: z.string().url().nullable().optional(),
  duration: z
    .number()
    .int()
    .min(0)
    .max(60 * 60 * 24)
    .nullable()
    .optional(),
  lyrics: z.string().max(10000).optional(),
});

// middleware validate chung
export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: e.errors });
    }
  };
}
