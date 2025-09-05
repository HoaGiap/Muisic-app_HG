import { useEffect, useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

export default function PlaylistPicker({ open, onClose, songId, onDone }) {
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState({});
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await api.get("/playlists");
        setItems(data || []);
        setSel({});
        setName("");
      } catch {
        toast.error("Không tải được playlist");
      }
    })();
  }, [open]);

  const toggle = (id) => setSel((s) => ({ ...s, [id]: !s[id] }));

  const submit = async () => {
    if (!songId) return;
    let ids = Object.keys(sel).filter((k) => sel[k]);

    // tạo playlist mới (nếu có nhập)
    const newName = name.trim();
    if (newName) {
      try {
        const res = await api.post("/playlists", { name: newName });
        ids.push(res.data._id);
      } catch {
        toast.error("Tạo playlist mới thất bại");
        return;
      }
    }

    if (ids.length === 0) {
      toast("Chưa chọn playlist nào");
      return;
    }

    setBusy(true);
    try {
      await Promise.all(
        ids.map((pid) =>
          api.post("/playlists/add", { playlistId: pid, songId })
        )
      );
      toast.success("Đã thêm vào playlist");
      onDone && onDone();
      onClose && onClose();
    } catch (err) {
      const s = err?.response?.status;
      if (s === 401) toast.error("Bạn cần đăng nhập");
      else toast.error("Thao tác thất bại");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3>Chọn playlist</h3>

        <div style={{ maxHeight: 260, overflow: "auto", margin: "8px 0" }}>
          {items.length === 0 && (
            <p style={{ opacity: 0.7 }}>(Chưa có playlist)</p>
          )}
          {items.map((p) => (
            <label
              key={p._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0",
              }}
            >
              <input
                type="checkbox"
                checked={!!sel[p._id]}
                onChange={() => toggle(p._id)}
              />
              <span>
                {p.name}{" "}
                <span style={{ opacity: 0.6 }}>({p.songs?.length || 0})</span>
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tạo playlist mới (tuỳ chọn)"
            style={{ flex: 1 }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 12,
          }}
        >
          <button onClick={onClose}>Huỷ</button>
          <button onClick={submit} disabled={busy}>
            {busy ? "Đang lưu..." : "Thêm"}
          </button>
        </div>
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000000,
};

const modal = {
  width: 420,
  maxWidth: "92vw",
  background: "var(--bg, #fff)",
  color: "var(--fg, #111)",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,.2)",
};
