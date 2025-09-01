// src/pages/Upload.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import { auth } from "../auth/firebase";

export default function Upload() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged(setUser);
    return () => unsub && unsub();
  }, []);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!user) {
    return (
      <div>
        <h2>Upload bài hát</h2>
        <p style={{ color: "crimson" }}>Bạn cần đăng nhập để upload.</p>
      </div>
    );
  }

  // Upload 1 file lên Cloudinary (tăng timeout 120s)
  const doUpload = async (file) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/upload?folder=music-app", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000, // 120s để tránh timeout do Render ngủ + file lớn
    });
    return data; // { url, public_id, duration? }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!title || !artist || !audioFile) {
      setMsg("Thiếu tiêu đề / ca sĩ / file audio");
      return;
    }

    try {
      setBusy(true);

      // Đánh thức backend Render trước (nếu đang ngủ)
      await api.get("/songs", { timeout: 15_000 }).catch(() => {});

      // Upload audio (+ ảnh bìa nếu có)
      const audio = await doUpload(audioFile);
      const cover = coverFile ? await doUpload(coverFile) : { url: "" };

      // Tạo bản ghi bài hát
      const body = {
        title,
        artist,
        duration: audio.duration ? Math.round(audio.duration) : null,
        audioUrl: audio.url,
        coverUrl: cover.url || null,
      };
      await api.post("/songs", body);

      setMsg("✅ Tạo bài hát thành công!");
      setTitle("");
      setArtist("");
      setAudioFile(null);
      setCoverFile(null);
      (document.getElementById("audio-input") || {}).value = "";
      (document.getElementById("cover-input") || {}).value = "";
    } catch (err) {
      console.error("Upload error detail:", err.toJSON ? err.toJSON() : err);
      setMsg("❌ Lỗi: " + (err.response?.data?.error || err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Upload bài hát</h2>
      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 12, maxWidth: 480 }}
      >
        <label>
          Tiêu đề
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Ca sĩ
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
          />
        </label>
        <label>
          Audio (mp3/…) *
          <input
            id="audio-input"
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        <label>
          Ảnh bìa (tuỳ chọn)
          <input
            id="cover-input"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          />
        </label>
        <button disabled={busy}>
          {busy ? "Đang xử lý..." : "Tải lên & Tạo bài"}
        </button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
