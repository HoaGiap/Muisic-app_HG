// src/pages/Search.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Search() {
  const [q, setQ] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get("/songs", { params: { q } })
        .then((r) => {
          if (!ignore) {
            const data = Array.isArray(r.data) ? r.data : r.data?.items || [];
            setSongs(data);
          }
        })
        .finally(() => !ignore && setLoading(false));
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div>
      <h2>Tìm kiếm</h2>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nhập tên bài hát hoặc ca sĩ…"
        style={{ padding: 8, width: "100%", maxWidth: 420, marginBottom: 12 }}
      />

      {loading && <p>Đang tìm…</p>}
      {!loading && q && songs.length === 0 && <p>Không tìm thấy kết quả.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        {songs.map((s, i) => (
          <SongItem
            key={s._id ?? s.id ?? s.audioUrl ?? `${s.title}-${i}`}
            song={s}
            list={songs}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
