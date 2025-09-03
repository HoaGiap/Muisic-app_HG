// src/components/AddToPlaylistButton.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

export default function AddToPlaylistButton({ songId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/playlists")
      .then((r) => setLists(Array.isArray(r.data) ? r.data : []))
      .catch((e) => {
        if (e?.response?.status === 401) {
          alert("Bạn cần đăng nhập để thêm vào playlist.");
          setOpen(false);
        } else {
          alert("Không tải được danh sách playlist.");
        }
      })
      .finally(() => setLoading(false));
  }, [open]);

  const add = async () => {
    if (!selected) return;
    try {
      await api.post("/playlists/add", { playlistId: selected, songId });
      onAdded && onAdded(selected);
      alert("Đã thêm vào playlist!");
      setOpen(false);
      setSelected("");
    } catch (e) {
      alert("Thêm vào playlist thất bại.");
      console.error(e);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} disabled={!songId}>
        ＋ Playlist…
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? "Đang tải…" : "Chọn playlist"}</option>
        {lists.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name} ({p.songs?.length || 0})
          </option>
        ))}
      </select>
      <button onClick={add} disabled={!selected || loading}>
        Thêm
      </button>
      <button onClick={() => setOpen(false)} disabled={loading}>
        Hủy
      </button>
    </div>
  );
}
