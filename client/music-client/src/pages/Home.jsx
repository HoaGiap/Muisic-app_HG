import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/songs")
      .then((r) => setSongs(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Đang tải…</p>;

  return (
    <div>
      <h2>Danh sách bài hát</h2>
      {songs.length === 0 && <p>(Chưa có bài — hãy thêm bằng Postman)</p>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        {songs.map((s, i) => (
          <SongItem key={s._id || s.id} song={s} list={songs} index={i} />
        ))}
      </div>
    </div>
  );
}
