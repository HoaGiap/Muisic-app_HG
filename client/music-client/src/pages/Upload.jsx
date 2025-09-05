import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { auth } from "../auth/firebase";
import { t } from "../ui/toast";

export default function Upload() {
  const [user, setUser] = useState(null);
  useEffect(() => auth?.onAuthStateChanged(setUser), []);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // tiến độ & huỷ
  const [pAudio, setPAudio] = useState(0);
  const [pCover, setPCover] = useState(0);
  const abortAudio = useRef(null);
  const abortCover = useRef(null);

  if (!user) {
    return (
      <div>
        <h2>Upload bài hát</h2>
        <p style={{ color: "crimson" }}>Bạn cần đăng nhập để upload.</p>
      </div>
    );
  }

  const doUpload = async (file, setProgress, abortRef) => {
    const form = new FormData();
    form.append("file", file);

    // Kiểm tra nhẹ client-side
    if (file.size > 50 * 1024 * 1024) throw new Error("File quá 50MB.");
    if (
      file.type.startsWith("audio/") === false &&
      file.type.startsWith("image/") === false
    ) {
      throw new Error("Định dạng không hỗ trợ.");
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const { data } = await api.post("/upload?folder=music-app", form, {
      headers: { "Content-Type": "multipart/form-data" },
      signal: controller.signal,
      onUploadProgress: (e) => {
        if (!e.total) return;
        const percent = Math.round((e.loaded * 100) / e.total);
        setProgress(percent);
      },
    });

    abortRef.current = null;
    setProgress(100);
    return data; // { url, public_id, duration? }
  };

  const cancelAll = () => {
    abortAudio.current?.abort();
    abortCover.current?.abort();
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setPAudio(0);
    setPCover(0);

    if (!title || !artist || !audioFile) {
      setMsg("Thiếu tiêu đề / ca sĩ / file audio");
      return;
    }

    try {
      setBusy(true);
      const audio = await doUpload(audioFile, setPAudio, abortAudio);
      const cover = coverFile
        ? await doUpload(coverFile, setPCover, abortCover)
        : { url: "" };

      const body = {
        title,
        artist,
        duration: audio.duration ? Math.round(audio.duration) : null,
        audioUrl: audio.url,
        coverUrl: cover.url || null,
      };
      await api.post("/songs", body);

      t.ok("✅ Tạo bài hát thành công!");
      setTitle("");
      setArtist("");
      setAudioFile(null);
      setCoverFile(null);
      setPAudio(0);
      setPCover(0);
      (document.getElementById("audio-input") || {}).value = "";
      (document.getElementById("cover-input") || {}).value = "";
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") {
        setMsg("⏹ Đã huỷ upload.");
      } else {
        console.error(err);
        t.err("❌ Lỗi: " + (err.response?.data?.error || err.message));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Upload bài hát</h2>
      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 12, maxWidth: 520 }}
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
        {audioFile && (
          <progress max="100" value={pAudio} style={{ width: "100%" }} />
        )}

        <label>
          Ảnh bìa (tuỳ chọn)
          <input
            id="cover-input"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          />
        </label>
        {coverFile && (
          <progress max="100" value={pCover} style={{ width: "100%" }} />
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={busy}>
            {busy ? "Đang xử lý..." : "Tải lên & Tạo bài"}
          </button>
          <button type="button" onClick={cancelAll} disabled={!busy}>
            Huỷ upload
          </button>
        </div>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
