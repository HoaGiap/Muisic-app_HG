import { useEffect, useState } from "react";
import { api } from "../api";
import { auth } from "../auth/firebase";

export default function Upload() {
  const [user, setUser] = useState(null);
  useEffect(() => auth?.onAuthStateChanged(setUser), []);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [progAudio, setProgAudio] = useState(0);
  const [progCover, setProgCover] = useState(0);

  if (!user) {
    return (
      <div>
        <h2>Upload bài hát</h2>
        <p style={{ color: "crimson" }}>Bạn cần đăng nhập để upload.</p>
      </div>
    );
  }

  const validate = () => {
    if (!title.trim() || !artist.trim() || !audioFile)
      return "Thiếu tiêu đề / ca sĩ / file audio.";
    if (!audioFile.type.startsWith("audio/")) return "File audio không hợp lệ.";
    if (audioFile.size > 20 * 1024 * 1024) return "Audio quá lớn (>20MB).";
    if (coverFile) {
      if (!coverFile.type.startsWith("image/")) return "Ảnh bìa không hợp lệ.";
      if (coverFile.size > 5 * 1024 * 1024) return "Ảnh bìa quá lớn (>5MB).";
    }
    return "";
  };

  const doUpload = async (file, setProg) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/upload?folder=music-app", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total) setProg(Math.round((e.loaded * 100) / e.total));
      },
    });
    return data; // { url, public_id, duration? }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const err = validate();
    if (err) {
      setMsg("❌ " + err);
      return;
    }

    try {
      setBusy(true);
      setProgAudio(0);
      setProgCover(0);

      const audio = await doUpload(audioFile, setProgAudio);
      const cover = coverFile
        ? await doUpload(coverFile, setProgCover)
        : { url: "", public_id: "" };

      await api.post("/songs", {
        title: title.trim(),
        artist: artist.trim(),
        duration: audio.duration ? Math.round(audio.duration) : null,
        audioUrl: audio.url,
        audioPublicId: audio.public_id,
        coverUrl: cover.url || null,
        coverPublicId: cover.public_id || null,
      });

      setMsg("✅ Tạo bài hát thành công!");
      setTitle("");
      setArtist("");
      setAudioFile(null);
      setCoverFile(null);
      setProgAudio(0);
      setProgCover(0);
      (document.getElementById("audio-input") || {}).value = "";
      (document.getElementById("cover-input") || {}).value = "";
    } catch (err) {
      console.error(err);
      setMsg("❌ Lỗi: " + (err.response?.data?.error || err.message));
    } finally {
      setBusy(false);
    }
  };

  const Bar = ({ v }) => (
    <div
      style={{
        background: "#eee",
        borderRadius: 6,
        height: 8,
        overflow: "hidden",
      }}
    >
      <div style={{ width: `${v}%`, height: "100%", background: "#0d6efd" }} />
    </div>
  );

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
          Audio (mp3/… ≤ 20MB) *
          <input
            id="audio-input"
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        {busy && progAudio > 0 && (
          <div>
            <small>Audio: {progAudio}%</small>
            <Bar v={progAudio} />
          </div>
        )}
        <label>
          Ảnh bìa (≤ 5MB)
          <input
            id="cover-input"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          />
        </label>
        {busy && coverFile && progCover > 0 && (
          <div>
            <small>Ảnh bìa: {progCover}%</small>
            <Bar v={progCover} />
          </div>
        )}
        <button disabled={busy}>
          {busy ? "Đang xử lý..." : "Tải lên & Tạo bài"}
        </button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
