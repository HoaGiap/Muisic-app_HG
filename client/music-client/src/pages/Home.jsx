import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async (p = 1) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.get("/songs", { params: { page: p, limit: 12 } });
      setSongs(p === 1 ? r.data.items : (prev) => [...prev, ...r.data.items]);
      setHasMore(r.data.items.length > 0);
      setPage(p);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div>
      <h2>Danh sách bài hát</h2>
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

      <div style={{ marginTop: 16 }}>
        <button disabled={!hasMore || busy} onClick={() => load(page + 1)}>
          {busy ? "Đang tải..." : hasMore ? "Tải thêm" : "Hết dữ liệu"}
        </button>
      </div>
    </div>
  );
}
