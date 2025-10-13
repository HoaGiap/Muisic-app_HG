// src/ApiTester.jsx
import { useEffect } from "react";
import { api } from "./api";
import useAuthClaims from "./auth/useAuthClaims";

export default function ApiTester() {
  const { user, token, loading } = useAuthClaims();

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      try {
        const body = {
          title: "Bài test",
          artist: "Admin",
          audioUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp3",
          coverUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          duration: 180, // giây
        };
        const res = await api.post("/songs", body);
        console.log("OK:", res.data);
      } catch (e) {
        console.error(
          "API error:",
          e.response?.status,
          e.response?.data || e.message
        );
      }
    })();
  }, [loading, user]);

  return null;
}
