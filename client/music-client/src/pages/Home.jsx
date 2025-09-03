// src/pages/Home.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";
import useInfiniteScroll from "../hooks/useInfiniteScroll.js";

const normalize = (res) =>
  Array.isArray(res)
    ? { items: res, total: res.length, page: 1 }
    : res || { items: [], total: 0, page: 1 };

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);

  // sort: 'new' | 'popular'
  const [sort, setSort] = useState("new");

  // Chống gọi 2 lần cùng 1 trang (race / double fire)
  const loadingPageRef = useRef(0);

  const load = useCallback(
    async (p = 1, s = sort) => {
      if (busy) return;
      if (loadingPageRef.current === p) return;
      loadingPageRef.current = p;

      setBusy(true);
      try {
        const params = { page: p, limit: 12 };
        if (s === "popular") {
          params.sort = "plays";
          params.order = "desc";
        }
        const r = await api.get("/songs", { params });
        const data = normalize(r.data);
        const items = data.items || [];

        setSongs((prev) => (p === 1 ? items : [...prev, ...items]));
        setHasMore(items.length > 0);
        setPage(p);
      } catch (e) {
        console.error(e);
      } finally {
        loadingPageRef.current = 0;
        setBusy(false);
      }
    },
    [busy, sort]
  );

  // Đổi sort -> reset & load lại từ trang 1
  useEffect(() => {
    setSongs([]);
    setPage(1);
    setHasMore(true);
    load(1, sort);
  }, [sort]); // eslint-disable-line

  // Sentinel: chỉ hoạt động khi còn trang và không bận
  const sentinelRef = useInfiniteScroll({
    disabled: busy || !hasMore,
    onLoadMore: () => load(page + 1, sort),
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Danh sách bài hát</h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ marginLeft: "auto" }}
        >
          <option value="new">Mới nhất</option>
          <option value="popular">Nghe nhiều</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 12,
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

      {/* tải trang đầu */}
      {busy && page === 1 && (
        <p style={{ marginTop: 12, opacity: 0.7 }}>Đang tải…</p>
      )}

      {/* Sentinel: đặt ngoài grid để tránh “ô trắng” nháy */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {/* trạng thái cuối danh sách */}
      {!hasMore && songs.length > 0 && (
        <p style={{ textAlign: "center", opacity: 0.6, marginTop: 12 }}>
          Hết DS
        </p>
      )}
    </div>
  );
}
