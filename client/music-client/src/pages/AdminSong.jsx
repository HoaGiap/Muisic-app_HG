// client/src/pages/AdminSong.jsx
import { useEffect, useState } from "react";
import {
  searchSongs,
  getSongDetail,
  updateSong,
  searchArtists,
  uploadImage,
  uploadAudio,
  deleteSongById,
} from "../api";
import LyricsEditor from "../components/LyricsEditor.jsx";

/* ---------------- Search list ---------------- */
function SongSearch({ onPick }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await searchSongs({ q, limit: 30 });
      setItems(res);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm bài hát theo tên/nghệ sĩ…"
        style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          gap: 8,
        }}
      >
        {items.map((s) => (
          <button
            key={s._id || s.id}
            onClick={() => onPick(s)}
            style={{
              textAlign: "left",
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 10,
              padding: 10,
              display: "flex",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <img
              src={s.coverUrl || "/logosite.png"}
              alt=""
              width={52}
              height={52}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
            <div>
              <strong>{s.title}</strong>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{s.artist}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Tab Thông tin ---------------- */
function InfoTab({ state, onSave, onDelete }) {
  const {
    title,
    setTitle,
    artistName,
    setArtistName,
    artistId,
    setArtistId,
    coverUrl,
    setCoverUrl,
    audioUrl,
    setAudioUrl,
    duration,
    setDuration,
    isPublic,
    setIsPublic,
    popularity,
    setPopularity,
    artistQuery,
    setArtistQuery,
    artistResults,
    setArtistResults,
  } = state;

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!artistQuery.trim()) return setArtistResults([]);
      const rs = await searchArtists(artistQuery, 10);
      setArtistResults(rs);
    }, 300);
    return () => clearTimeout(t);
  }, [artistQuery]);

  const pickCover = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const up = await uploadImage(f, "music-app/covers");
    setCoverUrl(up.url);
  };
  const pickAudio = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const up = await uploadAudio(f, "music-app/audios");
    setAudioUrl(up.url);
    if (up.duration) setDuration(Math.round(up.duration));
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Thông tin bài hát</h3>
      <div style={{ display: "flex", gap: 16 }}>
        <img
          src={coverUrl || "/logosite.png"}
          alt=""
          width={140}
          height={140}
          style={{ borderRadius: 12, objectFit: "cover" }}
        />
        <div style={{ display: "grid", gap: 8, flex: 1 }}>
          <label>
            Tiêu đề
            <br />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>

          <label>
            Nghệ sĩ (hiển thị)
            <br />
            <input
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>

          <label>
            Gán nghệ sĩ (artistId)
            <br />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                placeholder="Tìm nghệ sĩ để gán…"
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
              <input
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                placeholder="hoặc dán artistId"
                style={{
                  width: 260,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
            </div>
            {!!artistResults.length && (
              <div
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 6,
                }}
              >
                {artistResults.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => {
                      setArtistName(a.name);
                      setArtistId(a._id);
                      setArtistResults([]);
                      setArtistQuery("");
                    }}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      border: 0,
                      background: "transparent",
                      cursor: "pointer",
                      padding: 6,
                    }}
                  >
                    <img
                      src={a.avatarUrl || "/logosite.png"}
                      width={28}
                      height={28}
                      style={{ borderRadius: 6, objectFit: "cover" }}
                    />
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            )}
          </label>

          <div
            style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}
          >
            <label>
              Ảnh bìa
              <br />
              <input type="file" accept="image/*" onChange={pickCover} />
            </label>
            <label>
              Audio
              <br />
              <input type="file" accept="audio/*" onChange={pickAudio} />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
              gridTemplateColumns: "1fr 1fr 1fr",
            }}
          >
            <label>
              Thời lượng (s)
              <br />
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
            </label>
            <label>
              Popularity
              <br />
              <input
                type="number"
                value={
                  Number.isFinite(+state.popularity) ? state.popularity : 0
                }
                onChange={(e) => setPopularity(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "end", gap: 8 }}>
              <input
                type="checkbox"
                checked={state.isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Public</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onSave}>Lưu bài hát</button>
            <button
              onClick={onDelete}
              style={{ background: "#fee2e2", color: "#991b1b" }}
            >
              Xoá
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function AdminSong() {
  const [picked, setPicked] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState("info");
  const [showLyrics, setShowLyrics] = useState(false);

  // info state
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [artistId, setArtistId] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [popularity, setPopularity] = useState(0);
  const [artistQuery, setArtistQuery] = useState("");
  const [artistResults, setArtistResults] = useState([]);

  useEffect(() => {
    if (!picked?._id) {
      setDetail(null);
      return;
    }
    (async () => {
      const d = await getSongDetail(picked._id);
      setDetail(d);
      const s = d.song;
      setTitle(s.title || "");
      setArtistName(s.artist || "");
      setArtistId(s.artistId || "");
      setCoverUrl(s.coverUrl || "");
      setAudioUrl(s.audioUrl || "");
      setDuration(Number(s.duration || 0));
      setIsPublic(Boolean(s.isPublic !== false));
      setPopularity(Number(s.popularity || 0));
      setTab("info");
    })();
  }, [picked?._id]);

  const saveInfo = async () => {
    if (!detail) return;
    const payload = {
      title: title.trim(),
      artist: artistName.trim(),
      coverUrl,
      audioUrl,
      duration: Number(duration) || 0,
      isPublic,
      popularity: Number(popularity) || 0,
    };
    if (artistId) payload.artistId = artistId;
    const updated = await updateSong(detail.song._id, payload);
    setDetail((d) => (d ? { ...d, song: updated } : d));
    alert("Đã lưu bài hát");
  };

  const handleDelete = async () => {
    if (!detail?.song?._id) return;
    const ok = confirm(
      `Xoá bài: "${detail.song.title}"? Hành động không thể hoàn tác.`
    );
    if (!ok) return;
    try {
      await deleteSongById(detail.song._id);
      alert("Đã xoá bài hát");
      setShowLyrics(false);
      setDetail(null);
      setPicked(null);
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Xoá thất bại");
    }
  };

  const infoState = {
    title,
    setTitle,
    artistName,
    setArtistName,
    artistId,
    setArtistId,
    coverUrl,
    setCoverUrl,
    audioUrl,
    setAudioUrl,
    duration,
    setDuration,
    isPublic,
    setIsPublic,
    popularity,
    setPopularity,
    artistQuery,
    setArtistQuery,
    artistResults,
    setArtistResults,
  };

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <h2>Quản trị Bài hát</h2>
      <SongSearch onPick={setPicked} />

      {!detail ? (
        <div style={{ opacity: 0.7 }}>(Chọn một bài để chỉnh sửa)</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setTab("info")}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: tab === "info" ? "rgba(0,0,0,.06)" : "#fff",
              }}
            >
              Thông tin
            </button>
            <button
              onClick={() => setShowLyrics(true)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "rgba(0,0,0,.06)",
              }}
            >
              Lời bài hát
            </button>
          </div>

          {tab === "info" && (
            <InfoTab
              state={infoState}
              onSave={saveInfo}
              onDelete={handleDelete}
            />
          )}

          {/* Modal sửa lời */}
          <LyricsEditor
            open={showLyrics}
            onClose={() => setShowLyrics(false)}
            songId={detail?.song?._id}
            onSaved={async () => {
              try {
                const d = await getSongDetail(detail.song._id);
                setDetail(d);
              } catch {}
            }}
          />
        </>
      )}
    </div>
  );
}
