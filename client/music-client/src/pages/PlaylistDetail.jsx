import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";

// DnD
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function PlaylistDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [pl, setPl] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/playlists/${id}`);
      setPl(r.data);
      setName(r.data.name || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveName = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const r = await api.patch(`/playlists/${id}`, { name: name.trim() });
      setPl(r.data);
      alert("Đã đổi tên playlist");
    } catch {
      alert("Đổi tên thất bại");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!confirm("Xoá playlist này?")) return;
    setBusy(true);
    try {
      await api.delete(`/playlists/${id}`);
      alert("Đã xoá playlist");
      nav("/library");
    } catch {
      alert("Xoá thất bại");
    } finally {
      setBusy(false);
    }
  };

  // ---- DnD: xử lý khi thả
  const onDragEnd = async (result) => {
    if (!result.destination || !pl) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    const arr = [...(pl.songs || [])];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setPl({ ...pl, songs: arr }); // cập nhật UI trước

    try {
      await api.patch(`/playlists/${id}/reorder`, {
        songIds: arr.map((s) => s._id || s.id),
      });
    } catch (e) {
      console.error(e);
      // rollback nếu lỗi
      load();
    }
  };

  if (loading) return <p>Đang tải…</p>;
  if (!pl) return <p>Không tìm thấy playlist.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link to="/library">← Trở về Library</Link>
      </div>

      <h2 style={{ margin: 0 }}>Playlist</h2>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên playlist"
        />
        <button disabled={busy} onClick={saveName}>
          Lưu tên
        </button>
        <button disabled={busy} onClick={del} style={{ color: "crimson" }}>
          Xoá playlist
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {pl.songs?.length || 0} bài — kéo thả để sắp xếp
      </div>

      {/* DnD grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="playlist" direction="horizontal">
          {(droppableProvided) => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                gap: 12,
              }}
            >
              {(pl.songs || []).map((s, i) => {
                const sid = s._id || s.id;
                return (
                  <Draggable draggableId={String(sid)} index={i} key={sid}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{
                          ...(dragProvided.draggableProps.style || {}),
                          transform:
                            dragProvided.draggableProps.style?.transform,
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          padding: 8,
                        }}
                      >
                        {/* tay nắm kéo */}
                        <div
                          {...dragProvided.dragHandleProps}
                          style={{
                            cursor: "grab",
                            opacity: 0.7,
                            fontSize: 12,
                            marginBottom: 6,
                          }}
                          title="Kéo để sắp xếp"
                        >
                          ⠿ Kéo
                        </div>

                        {/* Nội dung card */}
                        <SongItem
                          song={s}
                          list={pl.songs}
                          index={i}
                          playlistId={pl._id}
                          onChanged={load}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
