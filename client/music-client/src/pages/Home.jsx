// client/src/pages/Home.jsx
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

const LIMIT = 24; // số bài mỗi trang bạn muốn gọi

export default function Home() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest"); // newest | popular | az
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dùng seq để hủy kết quả của request cũ (tránh race)
  const reqSeq = useRef(0);

  useEffect(() => {
    let alive = true;
    const seq = ++reqSeq.current; // chỉ giữ kết quả của lần gọi mới nhất
    setLoading(true);

    (async () => {
      try {
        let page = 1;
        const out = [];

        while (true) {
          const { data } = await api.get("/songs", {
            params: { q, sort, page, limit: LIMIT },
          });

          // Nếu đã có lượt gọi mới hơn → bỏ qua kết quả này
          if (!alive || seq !== reqSeq.current) return;

          // Chuẩn hoá dữ liệu từ server
          const items = Array.isArray(data) ? data : data.items || [];
          const total = Array.isArray(data)
            ? items.length
            : Number(data.total ?? 0);

          out.push(...items);

          // Điều kiện dừng:
          // - Trang hiện tại nhận ít hơn LIMIT, hoặc
          // - Đã đủ tổng số (page * LIMIT >= total)
          if (items.length < LIMIT || page * LIMIT >= total) break;

          page += 1;
        }

        if (alive && seq === reqSeq.current) {
          setSongs(out);
        }
      } catch (e) {
        console.error(e);
        if (alive && seq === reqSeq.current) setSongs([]);
      } finally {
        if (alive && seq === reqSeq.current) setLoading(false);
      }
    })();

    return () => {
      alive = false; // hủy effect cũ khi q/sort thay đổi hoặc unmount
    };
  }, [q, sort]);

  return (
    <div>
      <h2>Danh sách bài hát</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên bài / ca sĩ…"
          style={{ flex: 1, maxWidth: 420 }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: 6 }}
          >
            <option value="newest">Mới nhất</option>
            <option value="popular">Nghe nhiều</option>
            <option value="az">A–Z</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: 8, opacity: 0.7 }}>{songs.length} bài</div>

      {loading && <p style={{ textAlign: "center", margin: 24 }}>Đang tải…</p>}
      {!loading && songs.length === 0 && (
        <p style={{ textAlign: "center", margin: 24 }}>Hết DS</p>
      )}

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
    </div>
  );
}
