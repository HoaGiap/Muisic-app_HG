// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 12,
};

export default function Home() {
  const [data, setData] = useState({ items: [], total: 0, page: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/songs", { params: { page: 1, limit: 24 } })
      .then((r) => {
        // chấp nhận cả mảng cũ lẫn object mới
        const d = Array.isArray(r.data)
          ? { items: r.data, total: r.data.length, page: 1 }
          : r.data || { items: [], total: 0, page: 1 };
        setData(d);
      })
      .catch((e) => {
        console.error(e);
        setData({ items: [], total: 0, page: 1 });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Đang tải…</p>;

  return (
    <div>
      <h2>Danh sách bài hát</h2>
      {data.items.length === 0 && <p>(Chưa có bài — hãy upload!)</p>}
      <div style={grid}>
        {data.items.map((s, i) => (
          <SongItem key={s._id || s.id} song={s} list={data.items} index={i} />
        ))}
      </div>
    </div>
  );
}
