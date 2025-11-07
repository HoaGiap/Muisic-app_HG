// client/src/components/LyricsModal.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

// Nhận diện dòng LRC có timestamp
const LRC_TAG = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?]/;

// Loại timestamp để hiển thị như lời thường
function stripLrc(lrc = "") {
  if (!lrc) return "";
  return lrc
    .split(/\r?\n/)
    .map((line) => line.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,2})?]/g, "").trim())
    .filter(Boolean)
    .join("\n");
}

// Lấy dữ liệu lyrics từ nhiều format backend có thể trả về
function normalizeLyricsPayload(payload) {
  // Ưu tiên có trường riêng
  const lrc =
    payload?.lrc ||
    (typeof payload?.lyrics === "string" && LRC_TAG.test(payload.lyrics)
      ? payload.lyrics
      : "");

  // Lời thường
  const plain =
    (payload?.lyrics && typeof payload.lyrics === "object"
      ? payload.lyrics.text || ""
      : typeof payload?.lyrics === "string" && !LRC_TAG.test(payload.lyrics)
      ? payload.lyrics
      : "") || "";

  return { lrc, plain };
}

export default function LyricsModal({ open, onClose, song }) {
  const songId = song?._id || song?.id;

  // state dữ liệu
  const [lrc, setLrc] = useState("");
  const [plain, setPlain] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!open || !songId) return;
    setLoading(true);
    api
      .get(`/songs/${songId}/lyrics`)
      .then(({ data }) => {
        const { lrc: lrcIn, plain: plainIn } = normalizeLyricsPayload(
          data || {}
        );
        setLrc(lrcIn || "");
        setPlain(plainIn || "");
      })
      .catch(() => {
        setLrc("");
        setPlain("");
      })
      .finally(() => setLoading(false));
  }, [open, songId]);

  const displayText = useMemo(() => {
    // Ưu tiên hiển thị lời thường; nếu không có thì strip LRC
    if (plain && plain.trim()) return plain;
    if (lrc && lrc.trim()) return stripLrc(lrc);
    return "";
  }, [lrc, plain]);

  const save = async () => {
    if (!songId) return;
    try {
      // Gửi cả 2 để server nào cũng nhận được
      await api.put(`/songs/${songId}/lyrics`, {
        lrc,
        lyrics: plain, // lời thường
      });
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          <button onClick={onClose}>✖</button>
        </div>

        <div style={{ marginTop: 12, maxHeight: "60vh", overflow: "auto" }}>
          {loading ? (
            <p>Đang tải…</p>
          ) : editing ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
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
          ) : displayText ? (
            <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {displayText}
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

const ta = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: 14,
  padding: 8,
  border: "1px solid #ddd",
  borderRadius: 8,
};
