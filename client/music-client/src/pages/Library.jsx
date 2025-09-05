// src/pages/Library.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";
import { Link } from "react-router-dom";

export default function Library() {
  const [playlists, setPlaylists] = useState([]);

  const [loading, setLoading] = useState(true);
  const [authErr, setAuthErr] = useState("");

  const load = () =>
    api
      .get("/playlists")
      .then((r) => {
        setPlaylists(r.data || []);
        setAuthErr("");
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setAuthErr("Bạn cần đăng nhập để xem playlist.");
        } else {
          alert(
            "Lỗi tải playlist: " + (err.response?.data?.error || err.message)
          );
        }
      });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const exists = playlists.some(
      (p) => (p.name || "").trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return alert("Playlist đã tồn tại");

    try {
      await api.post("/playlists", { name: trimmed });
      setName("");
      load();
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthErr("Bạn cần đăng nhập để tạo playlist.");
      } else {
        alert(
          "Tạo playlist lỗi: " + (err.response?.data?.error || err.message)
        );
      }
    }
  };

  if (loading) return <p>Đang tải…</p>;

  if (authErr) {
    return (
      <div>
        <h2>Playlist của tôi</h2>
        <p style={{ color: "crimson" }}>{authErr}</p>
        <p>
          Hãy bấm nút <b>Login / Register</b> ở góc phải trên để đăng nhập.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Playlist của tôi</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên playlist"
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button onClick={create}>Tạo</button>
      </div>

      {playlists.length === 0 && <p>(Chưa có playlist)</p>}

      {playlists.map((p) => {
        const count = p.songs?.length || 0;
        const preview =
          Array.isArray(p.songs) && typeof p.songs[0] === "object"
            ? p.songs.slice(0, 6)
            : [];

        return (
          <div key={p._id} className="card" style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontWeight: 700,
              }}
            >
              <span>
                {p.name} — {count} bài
              </span>
              <Link to={`/playlist/${p._id}`} style={{ marginLeft: "auto" }}>
                Xem chi tiết →
              </Link>
            </div>

            {preview.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                {preview.map((s, i) => (
                  <SongItem
                    key={s._id || s.id}
                    song={s}
                    list={preview}
                    index={i}
                    playlistId={p._id}
                    onChanged={load}
                  />
                ))}
              </div>
            ) : count > 0 ? (
              <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
                (Mở <i>Xem chi tiết</i> để xem toàn bộ bài trong playlist)
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
