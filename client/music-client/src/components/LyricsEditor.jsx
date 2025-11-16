import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import toast from "react-hot-toast";

const modalBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 1001,
};

const modalBox = {
  width: "min(900px, 95vw)",
  background: "#fff",
  color: "#111",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

const textareaStyle = {
  width: "100%",
  minHeight: "360px",
  fontFamily: "inherit",
  fontSize: 14,
  padding: 12,
  border: "1px solid #ddd",
  borderRadius: 12,
  resize: "vertical",
};

const detectLrc = (text) =>
  /\[\d{1,2}:\d{2}(?:\.\d{1,3})?]/.test(text || "");

export default function LyricsEditor({ open, onClose, songId, onSaved }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !songId) return;
    setLoading(true);
    api
      .get(`/songs/${songId}/lyrics`)
      .then(({ data }) => {
        setContent(data?.lrc || data?.lyrics || "");
      })
      .catch(() => setContent(""))
      .finally(() => setLoading(false));
  }, [open, songId]);

  const isLrc = useMemo(() => detectLrc(content), [content]);

  if (!open) return null;

  const save = async () => {
    try {
      const body = isLrc
        ? { lrc: content, lyrics: "" }
        : { lrc: "", lyrics: content };
      await api.put(`/songs/${songId}/lyrics`, body);
      toast.success("Đã lưu lời bài hát");
      onSaved?.();
      onClose?.();
    } catch (e) {
      if (e?.response?.status === 403) {
        toast.error("Bạn không sở hữu bài hát này.");
      } else {
        toast.error("Lưu lời bài hát thất bại.");
      }
    }
  };

  return createPortal(
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0, flex: 1 }}>Sửa lời bài hát</h3>
          <button onClick={onClose} style={{ fontSize: 18, border: 0, background: "transparent", cursor: "pointer" }}>
            ×
          </button>
        </div>
        <p style={{ marginTop: 8, marginBottom: 12, color: "#4b5563" }}>
          Nhập lời vào một khung duy nhất. Hệ thống sẽ tự động nhận biết đây là lyric thường hay LRC (có time stamp).
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={textareaStyle}
          placeholder={
            loading
              ? "Đang tải..."
              : "Ví dụ LRC: [00:12.34] Dòng lyric\nHoặc lyric thường: Từng đêm dài..."
          }
          disabled={loading}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: isLrc ? "#059669" : "#2563eb",
              fontWeight: 600,
            }}
          >
            {isLrc ? "Đã nhận diện định dạng LRC" : "Đang lưu ở dạng lyric thường"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 16px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              onClick={save}
              disabled={loading}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                border: 0,
                background: "#7c3aed",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
