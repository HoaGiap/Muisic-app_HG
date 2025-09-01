import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

const normalize = (res) =>
  Array.isArray(res)
    ? { items: res, total: res.length, page: 1 }
    : res || { items: [], total: 0, page: 1 };

export default function MyUploads() {
  const [data, setData] = useState({ items: [], total: 0, page: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      // server lọc bài của chính bạn theo token
      const r = await api.get("/songs", {
        params: { owner: "me", page: p, limit: 24 },
      });
      setData(normalize(r.data));
      setPage(p);
    } catch (e) {
      console.error(e);
      setData({ items: [], total: 0, page: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const deleteOne = async (id) => {
    if (!id) return;
    if (!confirm("Xoá bài hát này?")) return;
    try {
      await api.delete(`/songs/${id}`);
      await load(page); // ✅ reload đúng trang hiện tại
      alert("Đã xoá!");
    } catch (e) {
      const s = e?.response?.status;
      if (s === 401) alert("Bạn cần đăng nhập.");
      else if (s === 403) alert("Bạn không phải chủ sở hữu bài hát này.");
      else alert("Xoá thất bại.");
      console.error(e);
    }
  };

  if (loading) return <p>Đang tải…</p>;

  return (
    <div>
      <h2>Bài hát của tôi</h2>
      {data.items.length === 0 && <p>(Chưa có bài nào bạn upload)</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        {data.items.map((s, i) => (
          <SongItem
            key={s._id || s.id}
            song={s}
            list={data.items}
            index={i}
            onDelete={(sid) => deleteOne(sid)} // ✅ truyền function để tự reload
          />
        ))}
      </div>
    </div>
  );
}
