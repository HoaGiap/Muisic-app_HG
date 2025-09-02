import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Search() {
  const [q, setQ] = useState("");
  const [songs, setSongs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const [sort, setSort] = useState("newest");

  const fetchPage = async (keyword, p, s = sort) => {
    setBusy(true);
    try {
      const params = { q: keyword, page: p, limit: 12 };
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

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (!q) {
        setSongs([]);
        setHasMore(false);
        setPage(1);
      } else {
        fetchPage(q, 1, sort);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort]);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Tìm kiếm</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Mới nhất</option>
          <option value="popular">Phổ biến</option>
        </select>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nhập tên bài hát hoặc ca sĩ…"
        style={{ padding: 8, width: "100%", maxWidth: 420, margin: "12px 0" }}
      />

      {q && songs.length === 0 && !busy && <p>Không tìm thấy kết quả.</p>}

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

      {q && (
        <div style={{ marginTop: 16 }}>
          <button
            disabled={!hasMore || busy}
            onClick={() => fetchPage(q, page + 1)}
          >
            {busy ? "Đang tải..." : hasMore ? "Tải thêm" : "Hết dữ liệu"}
          </button>
        </div>
      )}
    </div>
  );
}
