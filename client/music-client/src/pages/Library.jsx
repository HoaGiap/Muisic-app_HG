import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Library() {
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState("Favorites");
  const [loading, setLoading] = useState(true);
  const [authErr, setAuthErr] = useState("");

  const load = () =>
    api
      .get("/playlists") // ✅ không gửi userId nữa
      .then((r) => {
        setPlaylists(r.data);
        setAuthErr("");
      })
      .catch((err) => {
        if (err.response?.status === 401)
          setAuthErr("Bạn cần đăng nhập để xem playlist.");
        else alert("Lỗi tải playlist: " + err.message);
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
      await api.post("/playlists", { name: trimmed }); // ✅ không gửi userId
      setName("");
      load();
    } catch (err) {
      if (err.response?.status === 401)
        setAuthErr("Bạn cần đăng nhập để tạo playlist.");
      else alert("Tạo playlist lỗi: " + err.message);
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
        />
        <button onClick={create}>Tạo</button>
      </div>

      {playlists.length === 0 && <p>(Chưa có playlist)</p>}

      {playlists.map((p) => (
        <div
          key={p._id}
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {p.name} — {p.songs?.length || 0} bài
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 12,
              marginTop: 8,
            }}
          >
            {(p.songs || []).map((s, i) => (
              <SongItem
                key={s._id || s.id}
                song={s}
                list={p.songs}
                index={i}
                playlistId={p._id}
                onChanged={load}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
