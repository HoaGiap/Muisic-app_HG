import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Search() {
  const [q, setQ] = useState("");
  const [songs, setSongs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchPage = async (keyword, p) => {
    setBusy(true);
    try {
      const r = await api.get("/songs", {
        params: { q: keyword, page: p, limit: 12 },
      });
      setSongs(p === 1 ? r.data.items : (prev) => [...prev, ...r.data.items]);
      setHasMore(r.data.items.length > 0);
      setPage(p);
    } finally {
      setBusy(false);
    }
  };

  // debounce tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => {
      if (!q) {
        setSongs([]);
        setHasMore(false);
        setPage(1);
      } else {
        fetchPage(q, 1);
      }
    }, 300);
    return () => clearTimeout(t);
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
