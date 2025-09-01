import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

export default function Search() {
  const [q, setQ] = useState("");
  const [data, setData] = useState({ items: [], total: 0, page: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const t = setTimeout(() => {
      setLoading(true);

      api
        .get("/songs", {
          params: {
            q: q.trim(), // để rỗng cũng OK => backend có thể trả tất cả
            page: 1,
            limit: 48,
          },
        })
        .then((r) => {
          if (ignore) return;
          // chấp nhận cả mảng cũ lẫn object mới
          const d = Array.isArray(r.data)
            ? { items: r.data, total: r.data.length, page: 1 }
            : r.data || { items: [], total: 0, page: 1 };
          setData(d);
        })
        .catch((err) => {
          if (ignore) return;
          console.error(err);
          setData({ items: [], total: 0, page: 1 });
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }, 300); // debounce 300ms

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
      {!loading && q && data.items.length === 0 && (
        <p>Không tìm thấy kết quả.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        {data.items.map((s, i) => (
          <SongItem key={s._id || s.id} song={s} list={data.items} index={i} />
        ))}
      </div>
    </div>
  );
}
