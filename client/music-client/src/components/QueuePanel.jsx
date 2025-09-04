// src/components/QueuePanel.jsx
import { useAtom } from "jotai";
import {
  queueAtom,
  queueIndexAtom,
  playingAtom,
  queueOpenAtom,
} from "./playerState";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function reorder(list, start, end) {
  const res = Array.from(list);
  const [moved] = res.splice(start, 1);
  res.splice(end, 0, moved);
  return res;
}

export default function QueuePanel() {
  const [queue, setQueue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);
  const [, setPlaying] = useAtom(playingAtom);
  const [open, setOpen] = useAtom(queueOpenAtom);

  if (!open) return null;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const newQ = reorder(queue, source.index, destination.index);

    // tính lại index hiện tại sau khi reorder
    const mapIndex = (i) => {
      const s = source.index,
        d = destination.index;
      if (s === d) return i;
      if (i === s) return d;
      if (s < d) {
        if (i > s && i <= d) return i - 1;
      } else {
        if (i >= d && i < s) return i + 1;
      }
      return i;
    };

    setQueue(newQ);
    setIdx((i) => mapIndex(i));
  };

  const removeAt = (i) => {
    setQueue((q) => q.filter((_, k) => k !== i));
    setIdx((i0) => (i <= i0 ? Math.max(i0 - 1, 0) : i0));
  };

  const clearAll = () => {
    setQueue([]);
    setIdx(0);
  };

  return (
    <div style={styles.backdrop} onClick={() => setOpen(false)}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <b>Hàng đợi</b>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={clearAll} disabled={queue.length === 0}>
              Xoá hết
            </button>
            <button onClick={() => setOpen(false)}>Đóng</button>
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          {queue.length} bài — kéo để sắp xếp, click để phát
        </div>

        <div style={{ maxHeight: 360, overflow: "auto" }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="q">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {queue.map((s, i) => (
                    <Draggable
                      key={(s._id || s.id) + "_" + i}
                      draggableId={(s._id || s.id) + "_" + i}
                      index={i}
                    >
                      {(p) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          style={{
                            ...styles.row,
                            ...(i === idx ? styles.active : {}),
                            ...p.draggableProps.style,
                          }}
                        >
                          {s.coverUrl && (
                            <img
                              src={s.coverUrl}
                              alt=""
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "cover",
                                borderRadius: 6,
                              }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                            <div style={styles.title} title={s.title}>
                              {s.title}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                              {s.artist}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => {
                                setIdx(i);
                                setPlaying(true);
                              }}
                            >
                              Phát
                            </button>
                            <button onClick={() => removeAt(i)}>Xoá</button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    display: "flex",
    alignItems: "flex-end",
    zIndex: 60,
  },
  panel: {
    background: "var(--bg, #fff)",
    color: "var(--fg, #111)",
    width: "min(640px, 100%)",
    margin: "0 auto",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 12,
    boxShadow: "0 -8px 24px rgba(0,0,0,.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    border: "1px solid #eee",
    marginBottom: 8,
    background: "var(--card, #fff)",
  },
  active: {
    outline: "2px solid #4f46e5",
  },
  title: {
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
