import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { auth } from "../auth/firebase";
import { t } from "../ui/toast";

const MAX_AUDIO = 20 * 1024 * 1024; // 20MB
const MAX_IMAGE = 5 * 1024 * 1024; // 5MB

function formatBytes(n) {
  if (!n && n !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let value = n;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  return value.toFixed(value < 10 && idx > 0 ? 1 : 0) + " " + units[idx];
}

export default function Upload() {
  const [user, setUser] = useState(null);
  useEffect(() => auth?.onAuthStateChanged(setUser), []);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [artistOptions, setArtistOptions] = useState([]);
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [pAudio, setPAudio] = useState(0);
  const [pCover, setPCover] = useState(0);
  const [speedAudio, setSpeedAudio] = useState(null);
  const [speedCover, setSpeedCover] = useState(null);
  const [etaAudio, setEtaAudio] = useState(null);
  const [etaCover, setEtaCover] = useState(null);

  const abortAudio = useRef(null);
  const abortCover = useRef(null);
  const artistFieldRef = useRef(null);

  useEffect(() => {
    api
      .get("/artists", { params: { limit: 200 } })
      .then((res) => {
        const items = Array.isArray(res.data?.items)
          ? res.data.items
          : res.data || [];
        setArtistOptions(
          items
            .map((a) => a.name || a.title || "")
            .filter(Boolean)
            .slice(0, 200)
        );
      })
      .catch(() => setArtistOptions([]));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!artistFieldRef.current) return;
      if (!artistFieldRef.current.contains(e.target)) {
        setArtistDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredArtists = artistOptions.filter((name) =>
    name.toLowerCase().includes(artist.toLowerCase())
  );

  const pageStyle = {
    minHeight: "calc(80vh - var(--player-h) - 120px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "20px 0 40px",
    gap: 12,
  };

  const cardStyle = {
    background: "var(--card, #111821)",
    border: "1px solid var(--border, #1f2833)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    maxWidth: 760,
    width: "100%",
  };

  const formGrid = {
    display: "grid",
    gap: 18,
  };

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 600,
  };

  if (!user) {
    return (
      <div>
        <h2>Upload bài hát</h2>
        <p style={{ color: "crimson" }}>Bạn cần đăng nhập để upload.</p>
      </div>
    );
  }

  const validateFile = (file, type) => {
    if (!file) throw new Error("Chưa chọn file");
    if (type === "audio") {
      if (!file.type.startsWith("audio/"))
        throw new Error("File audio không hợp lệ");
      if (file.size > MAX_AUDIO) throw new Error("Audio vượt quá 20MB");
    } else {
      if (!file.type.startsWith("image/"))
        throw new Error("File ảnh không hợp lệ");
      if (file.size > MAX_IMAGE) throw new Error("Ảnh vượt quá 5MB");
    }
  };

  const uploadFile = async (file, setProgress, abortRef, setSpeed, setEta) => {
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
          const sp = dBytes / dt;
          setSpeed(sp);
          const remain = e.total - e.loaded;
          setEta(remain / sp);
        }
        lastLoaded = e.loaded;
        lastTime = now;
        setProgress(Math.round((e.loaded * 100) / e.total));
      },
    });

    abortRef.current = null;
    setSpeed(null);
    setEta(null);
    setProgress(100);
    return data;
  };

  const cancelAll = () => {
    abortAudio.current?.abort();
    abortCover.current?.abort();
  };

  const handleSubmit = async (e) => {
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
      setMsg(err.message);
      return;
    }

    try {
      setBusy(true);
      const audio = await uploadFile(
        audioFile,
        setPAudio,
        abortAudio,
        setSpeedAudio,
        setEtaAudio
      );
      const cover = coverFile
        ? await uploadFile(
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
        lyrics: { text: lyrics.trim() },
      };

      await api.post("/songs", body);
      t.ok("Đã tạo bài hát thành công!");

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
        setMsg("Đã huỷ upload.");
      } else {
        console.error(err);
        t.err("Có lỗi: " + (err.response?.data?.error || err.message));
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
      <span style={{ opacity: 0.8 }}> · còn {Math.max(0, value | 0)}s</span>
    ) : null;

  return (
    <div style={pageStyle}>
      <h2 style={{ alignSelf: "flex-start" }}>Upload bài hát (Admin)</h2>
      <p style={{ opacity: 0.75 }}></p>
      <div style={cardStyle}>
        <form onSubmit={handleSubmit} style={formGrid}>
          <label style={labelStyle}>
            <span>Tiêu đề</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Love Story"
              required
            />
          </label>

          <label style={labelStyle}>
            <span>Ca sĩ</span>
            <div className="artist-field" ref={artistFieldRef}>
              <input
                value={artist}
                onChange={(e) => {
                  setArtist(e.target.value);
                  setArtistDropdownOpen(true);
                }}
                onFocus={() => setArtistDropdownOpen(true)}
                placeholder="Chọn hoặc nhập tên ca sĩ"
                required
              />
              <button
                type="button"
                className="artist-toggle"
                aria-label="Chọn nghệ sĩ"
                onClick={() => setArtistDropdownOpen((v) => !v)}
              >
                ▾
              </button>
              {artistDropdownOpen && filteredArtists.length > 0 && (
                <div className="artist-dropdown">
                  {filteredArtists.slice(0, 80).map((name) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => {
                        setArtist(name);
                        setArtistDropdownOpen(false);
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 16,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label style={labelStyle}>
                <span>Audio *</span>
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  ⚠ mp3/wav ≤ {Math.round(MAX_AUDIO / 1024 / 1024)}MB
                </div>
                <input
                  id="audio-input"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  required
                />
              </label>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {audioFile
                  ? `${audioFile.name} · ${formatBytes(audioFile.size)}`
                  : "Chưa chọn file audio"}
              </div>
              {audioFile && (
                <>
                  <progress
                    max="100"
                    value={pAudio}
                    style={{ width: "100%" }}
                    className="upload-progress"
                  />
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {pAudio}%
                    {speedAudio ? ` · ${formatBytes(speedAudio)}/s` : ""}
                    <ETA value={etaAudio} />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={labelStyle}>
                <span>Ảnh bìa (tùy chọn)</span>
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  ℹ PNG/JPG ≤ {Math.round(MAX_IMAGE / 1024 / 1024)}MB
                </div>
                <input
                  id="cover-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </label>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {coverFile
                  ? `${coverFile.name} · ${formatBytes(coverFile.size)}`
                  : "Chưa chọn ảnh bìa"}
              </div>
              {coverFile && (
                <>
                  <progress
                    max="100"
                    value={pCover}
                    style={{ width: "100%" }}
                    className="upload-progress"
                  />
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {pCover}%
                    {speedCover ? ` · ${formatBytes(speedCover)}/s` : ""}
                    <ETA value={etaCover} />
                  </div>
                </>
              )}
            </div>
          </div>

          <label style={labelStyle}>
            <span>Lời bài hát (tùy chọn)</span>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={8}
              placeholder="Dán lời bài hát vào đây..."
            />
          </label>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={cancelAll}
              disabled={!busy}
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                borderRadius: 999,
                padding: "10px 22px",
                opacity: busy ? 1 : 0.6,
              }}
            >
              Huỷ upload
            </button>
            <button
              disabled={busy}
              aria-busy={busy}
              style={{
                background: "var(--accent, #8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "10px 26px",
                fontWeight: 600,
                minWidth: 190,
                opacity: busy ? 0.8 : 1,
              }}
            >
              {busy ? "Đang tải..." : "Tải lên & Tạo bài"}
            </button>
          </div>
        </form>
        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </div>
  );
}
