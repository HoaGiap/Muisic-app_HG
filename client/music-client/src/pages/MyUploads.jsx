import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";
import { t } from "../ui/toast";
import useAuthClaims from "../auth/useAuthClaims";

const normalize = (res) =>
  Array.isArray(res)
    ? { items: res, total: res.length, page: 1 }
    : res || { items: [], total: 0, page: 1 };

export default function MyUploads() {
  const { isAdmin } = useAuthClaims(); // ✅ biết user có phải admin không

  const [data, setData] = useState({ items: [], total: 0, page: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState("me"); // me | all | uid
  const [ownerUid, setOwnerUid] = useState("");

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 24 };
      if (ownerFilter === "me") params.owner = "me";
      else if (ownerFilter === "uid" && ownerUid) params.ownerUid = ownerUid;
      else if (ownerFilter === "all") params.owner = "all";

      const r = await api.get("/songs", { params });
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
  }, [isAdmin]);

  const deleteOne = async (id) => {
    if (!id) return;
    if (!confirm("Xoá bài hát này?")) return;
    try {
      await api.delete(`/songs/${id}`);
      await load(page);
      t.ok("Đã xoá!");
    } catch (e) {
      const s = e?.response?.status;
      if (s === 401) t.err("Bạn cần đăng nhập.");
      else if (s === 403) t.err("Bạn không có quyền xoá bài hát này.");
      else t.err("Xoá thất bại.");
      console.error(e);
    }
  };

  if (loading) return <p>Đang tải…</p>;

  return (
    <div>
      <h2>{isAdmin ? "Tất cả bài hát" : "Bài hát của tôi"}</h2>
      {data.items.length === 0 && <p>(Không có bài nào)</p>}

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
            onDelete={(sid) => deleteOne(sid)} // ✅ admin xoá được tất
          />
        ))}
      </div>
    </div>
  );
}
