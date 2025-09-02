import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);

  // sort state: newest | popular
  const [sort, setSort] = useState("newest");

  const load = async (p = 1, s = sort) => {
    if (busy) return;
    setBusy(true);
    try {
      const params = { page: p, limit: 12 };
      if (s === "popular") {
        params.sort = "plays";
        params.order = "desc";
      }
      const r = await api.get("/songs", { params });
      setSongs(p === 1 ? r.data.items : (prev) => [...prev, ...r.data.items]);
      setHasMore(r.data.items.length > 0);
      setPage(p);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load(1, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Danh sách bài hát</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Mới nhất</option>
          <option value="popular">Phổ biến</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 12,
          marginTop: 12,
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
