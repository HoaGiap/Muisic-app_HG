import { useEffect, useState } from "react";
import { api } from "../api";
import PlaylistThumb from "./PlaylistThumb";
import toast from "react-hot-toast";

export default function PlaylistSidebar({
  selectedId,
  onSelect,
  onDeleted,
  onCreateClick,
  refreshKey = 0,
  width = 300,
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .get("/playlists")
      .then((r) => setList(r.data || []))
      .catch(() => setList([]));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [refreshKey]);

  const removeOne = async (e, p) => {
    e.stopPropagation();
    if ((p.name || "").trim().toLowerCase() === "favorites") {
      toast.error("Playlist 'Favorites' không thể xoá.");
      return;
    }
    if (!confirm(`Xoá playlist "${p.name}"?`)) return;

    try {
      await api.delete(`/playlists/${p._id}`);
      toast.success("Đã xoá playlist");
      await load();
      if (selectedId === p._id) {
        const first = list.filter((x) => x._id !== p._id)[0];
        onSelect && onSelect(first || null);
      }
      onDeleted && onDeleted(p);
    } catch (e2) {
      console.error(e2);
      toast.error("Xoá playlist thất bại");
    }
  };

  const triggerCreate = () => {
    if (onCreateClick) onCreateClick();
  };

  return (
    <aside
      style={{
        width,
        borderRight: "1px solid var(--border)",
        paddingRight: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>Playlist của tôi</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Tạo playlist</div>
        </div>
        <button
          onClick={triggerCreate}
          title="Tạo playlist"
          aria-label="Tạo playlist"
          style={{
            background: "var(--card)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "4px 12px",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Danh sách */}
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingRight: 4,
            overflowY: "auto",
            maxHeight: "calc(100vh - 220px)",
          }}
        >
          {list.map((p) => (
            <div
              key={p._id}
              style={{
                position: "relative",
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: 8,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background:
                  p._id === selectedId ? "var(--accent-soft)" : "var(--card)",
              }}
            >
              <button
                onClick={() => onSelect && onSelect(p)}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flex: 1,
                  textAlign: "left",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                  color: "var(--text)",
                }}
                title={p.name}
              >
                <PlaylistThumb
                  coverUrl={p.coverUrl}
                  songs={p.songs}
                  size={44}
                  radius={8}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: width - 44 - 58,
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>Me</div>
                </div>
              </button>

              <button
                onClick={(e) => removeOne(e, p)}
                title="Xoá playlist"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {list.length === 0 && (
            <div style={{ opacity: 0.6 }}>Chưa có playlist</div>
          )}
        </div>
      )}
    </aside>
  );
}
