import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { auth } from "../auth/firebase";
import { t } from "../ui/toast";

const MAX_AUDIO = 20 * 1024 * 1024; // 20MB
const MAX_IMAGE = 5 * 1024 * 1024; // 5MB

function fmtBytes(n) {
  if (!n && n !== 0) return "";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0,
    v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return v.toFixed(v < 10 && i > 0 ? 1 : 0) + " " + u[i];
}

export default function Upload() {
  const [user, setUser] = useState(null);
  useEffect(() => auth?.onAuthStateChanged(setUser), []);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // progress
  const [pAudio, setPAudio] = useState(0);
  const [pCover, setPCover] = useState(0);
  const [speedAudio, setSpeedAudio] = useState(null);
  const [speedCover, setSpeedCover] = useState(null);
  const [etaAudio, setEtaAudio] = useState(null);
  const [etaCover, setEtaCover] = useState(null);

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

  const validateFile = (f, type) => {
    if (!f) throw new Error("Chưa chọn file");
    const isAudio = type === "audio";
    if (isAudio) {
      if (!f.type.startsWith("audio/"))
        throw new Error("File audio không hợp lệ");
      if (f.size > MAX_AUDIO) throw new Error("Audio quá 20MB");
    } else {
      if (!f.type.startsWith("image/"))
        throw new Error("File ảnh không hợp lệ");
      if (f.size > MAX_IMAGE) throw new Error("Ảnh quá 5MB");
    }
  };

  const doUpload = async (file, setProgress, abortRef, setSpeed, setEta) => {
    const form = new FormData();
    form.append("file", file);

    const controller = new AbortController();
    abortRef.current = controller;

    let lastLoaded = 0;
    let lastTime = Date.now();

    const { data } = await api.post("/upload?folder=music-app", form, {
      headers: { "Content-Type": "multipart/form-data" },
      signal: controller.signal,
      onUploadProgress: (e) => {
        if (!e.total) return;
        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        const dBytes = e.loaded - lastLoaded;
        if (dt > 0) {
          const sp = dBytes / dt; // B/s
          setSpeed(sp);
          const remain = e.total - e.loaded;
          setEta(remain / sp);
        }
        lastLoaded = e.loaded;
        lastTime = now;

        const percent = Math.round((e.loaded * 100) / e.total);
        setProgress(percent);
      },
    });

    abortRef.current = null;
    setProgress(100);
    setSpeed(null);
    setEta(null);

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
      validateFile(audioFile, "audio");
      if (coverFile) validateFile(coverFile, "image");
    } catch (err) {
      t.err(err.message);
      return;
    }

    try {
      setBusy(true);
      const audio = await doUpload(
        audioFile,
        setPAudio,
        abortAudio,
        setSpeedAudio,
        setEtaAudio
      );
      const cover = coverFile
        ? await doUpload(
            coverFile,
            setPCover,
            abortCover,
            setSpeedCover,
            setEtaCover
          )
        : { url: "" };

      const body = {
        title,
        artist,
        duration: audio.duration ? Math.round(audio.duration) : null,
        audioUrl: audio.url,
        coverUrl: cover.url || null,
        lyrics: lyrics || "",
      };
      await api.post("/songs", body);

      t.ok("✅ Tạo bài hát thành công!");
      setTitle("");
      setArtist("");
      setLyrics("");
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
      setSpeedAudio(null);
      setEtaAudio(null);
      setSpeedCover(null);
      setEtaCover(null);
    }
  };

  const ETA = ({ value }) =>
    value != null ? (
      <span style={{ opacity: 0.8 }}> • còn {Math.max(0, value | 0)}s</span>
    ) : null;

  return (
    <div>
      <h2>Upload bài hát (Admin)</h2>
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
          Audio (mp3/… ≤ {Math.round(MAX_AUDIO / 1024 / 1024)}MB) *
          <input
            id="audio-input"
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            required
          />
          {audioFile && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {audioFile.name} • {fmtBytes(audioFile.size)}
            </div>
          )}
        </label>
        {audioFile && (
          <>
            <progress max="100" value={pAudio} style={{ width: "100%" }} />
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {pAudio}%{speedAudio ? ` • ${fmtBytes(speedAudio)}/s` : ""}
              <ETA value={etaAudio} />
            </div>
          </>
        )}

        <label>
          Ảnh bìa (≤ {Math.round(MAX_IMAGE / 1024 / 1024)}MB, tuỳ chọn)
          <input
            id="cover-input"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          />
          {coverFile && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {coverFile.name} • {fmtBytes(coverFile.size)}
            </div>
          )}
        </label>
        {coverFile && (
          <>
            <progress max="100" value={pCover} style={{ width: "100%" }} />
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {pCover}%{speedCover ? ` • ${fmtBytes(speedCover)}/s` : ""}
              <ETA value={etaCover} />
            </div>
          </>
        )}

        <label>
          Lời bài hát (tuỳ chọn)
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={8}
            placeholder="Dán lời bài hát (không bắt buộc)"
          />
        </label>

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
