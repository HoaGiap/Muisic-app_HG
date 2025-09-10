import { useEffect, useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

export default function LyricsModal({ open, onClose, song }) {
  const songId = song?._id || song?.id;
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!open || !songId) return;
    setLoading(true);
    api
      .get(`/songs/${songId}/lyrics`)
      .then((r) => setText(r.data?.lyrics || ""))
      .catch(() => setText(""))
      .finally(() => setLoading(false));
  }, [open, songId]);

  const save = async () => {
    if (!songId) return;
    try {
      await api.put(`/songs/${songId}/lyrics`, { lyrics: text });
      toast.success("Đã lưu lời bài hát");
      setEditing(false);
    } catch (e) {
      if (e?.response?.status === 403)
        toast.error("Bạn không phải chủ bài này.");
      else if (e?.response?.status === 401) toast.error("Bạn cần đăng nhập.");
      else toast.error("Lưu thất bại.");
    }
  };

  if (!open) return null;

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h3 style={{ margin: 0, flex: 1 }}>
            Lời bài hát — {song?.title || ""}
          </h3>
          {!editing ? (
            <button onClick={() => setEditing(true)}>✏️ Sửa</button>
          ) : (
            <>
              <button onClick={save}>💾 Lưu</button>
              <button onClick={() => setEditing(false)}>Hủy</button>
            </>
          )}
          <button onClick={onClose} style={{ marginLeft: 8 }}>
            ✖
          </button>
        </div>

        <div style={{ marginTop: 12, maxHeight: "60vh", overflow: "auto" }}>
          {loading ? (
            <p>Đang tải…</p>
          ) : editing ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={18}
              style={{ width: "100%", fontFamily: "inherit", lineHeight: 1.6 }}
              placeholder="Nhập lời bài hát…"
            />
          ) : text ? (
            <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {text}
            </pre>
          ) : (
            <p style={{ opacity: 0.7 }}>(Chưa có lời bài hát)</p>
          )}
        </div>
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.4)",
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const panel = {
  background: "var(--bg,#fff)",
  color: "var(--fg,#111)",
  width: "min(820px, 100%)",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,.25)",
};
