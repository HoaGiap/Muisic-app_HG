import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Search() {
  const [q, setQ] = useState("");
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get("/songs", { params: { q } }).then((r) => setSongs(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <h2>Tìm kiếm</h2>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nhập tên bài hát/ca sĩ…"
        style={{ padding: 8, width: "100%", marginBottom: 12 }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        {songs.map((s) => (
          <SongItem key={s._id || s.id} song={s} />
        ))}
      </div>
    </div>
  );
}
