import { useEffect, useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

export default function LyricsEditor({ open, onClose, songId, onSaved }) {
  const [lrc, setLrc] = useState("");
  const [plain, setPlain] = useState("");

  useEffect(() => {
    if (!open || !songId) return;
    api
      .get(`/songs/${songId}/lyrics`)
      .then(({ data }) => {
        setLrc(data?.lrc || "");
        setPlain(data?.lyrics || "");
      })
      .catch(() => {
        setLrc("");
        setPlain("");
      });
  }, [open, songId]);

  if (!open) return null;

  return (
    <div style={bk} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <b>📝 Sửa lời bài hát</b>
          <button style={{ marginLeft: "auto" }} onClick={onClose}>
            ✕
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            margin: "10px 0",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              LRC (có time)
            </div>
            <textarea
              value={lrc}
              onChange={(e) => setLrc(e.target.value)}
              rows={16}
              style={ta}
              placeholder="[00:12.34] First line"
            />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Lời thường (không time)
            </div>
            <textarea
              value={plain}
              onChange={(e) => setPlain(e.target.value)}
              rows={16}
              style={ta}
              placeholder="Nếu không có LRC, bạn nhập lời thường tại đây"
            />
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              await api.put(`/songs/${songId}/lyrics`, { lrc, lyrics: plain });
              toast.success("Đã lưu lời bài hát");
              onSaved && onSaved();
              onClose();
            } catch (e) {
              if (e?.response?.status === 403)
                toast.error("Bạn không phải chủ bài hát này.");
              else toast.error("Lưu thất bại!");
            }
          }}
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
const bk = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1001,
};
const box = {
  width: "min(900px,95vw)",
  background: "#fff",
  color: "#111",
  borderRadius: 12,
  padding: 12,
};
const ta = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: 14,
  padding: 8,
  border: "1px solid #ddd",
  borderRadius: 8,
};
