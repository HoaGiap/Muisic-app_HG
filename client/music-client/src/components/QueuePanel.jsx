import { useAtom } from "jotai";
import { useMemo } from "react";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
  queueOpenAtom,
} from "./playerState";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const getId = (s) => s?._id ?? s?.id ?? null;

export default function QueuePanel() {
  const [open, setOpen] = useAtom(queueOpenAtom);
  const [queue, setQueue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);
  const [current, setCurrent] = useAtom(currentTrackAtom);
  const [, setPlaying] = useAtom(playingAtom);

  if (!open) return null;

  const onClose = () => setOpen(false);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    const items = [...queue];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);

    // tính index mới của bài đang phát
    const curId = getId(current);
    const newIndex = items.findIndex((x) => getId(x) === curId);

    setQueue(items);
    if (newIndex >= 0) setIdx(newIndex);
  };

  const playAt = (i) => {
    if (!queue[i]) return;
    setIdx(i);
    setCurrent(queue[i]);
    setPlaying(true);
  };

  const removeAt = (i) => {
    const items = queue.filter((_, k) => k !== i);
    if (items.length === 0) {
      setQueue([]);
      setIdx(0);
      setCurrent(null);
      setPlaying(false);
      return;
    }
    // điều chỉnh index khi xoá
    if (i < idx) setIdx(idx - 1);
    else if (i === idx) {
      const ni = Math.min(i, items.length - 1);
      setIdx(ni);
      setCurrent(items[ni]);
    }
    setQueue(items);
  };

  const clearAll = () => {
    if (!confirm("Xoá toàn bộ hàng đợi?")) return;
    setQueue([]);
    setIdx(0);
    setCurrent(null);
    setPlaying(false);
  };

  const count = queue.length;

  return (
    <>
      <div className="queue-overlay" onClick={onClose} />
      <aside className="queue-drawer">
        <div className="queue-head">
          <strong>Hàng đợi</strong>
          <span className="badge">{count} bài</span>
          <span style={{ marginLeft: "auto" }} />
          <button onClick={clearAll} disabled={!count}>
            Xoá hết
          </button>
          <button onClick={onClose}>Đóng</button>
        </div>

        <div className="queue-body">
          {count === 0 ? (
            <p style={{ opacity: 0.7 }}>
              Hàng đợi trống. Hãy bấm “▶ Phát” ở một bài bất kỳ.
            </p>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="queue" direction="vertical">
                {(dp) => (
                  <div
                    ref={dp.innerRef}
                    {...dp.droppableProps}
                    style={{ display: "grid", gap: 8 }}
                  >
                    {queue.map((s, i) => {
                      const sid = String(getId(s) ?? `idx-${i}`);
                      const active = i === idx;
                      return (
                        <Draggable key={sid} draggableId={sid} index={i}>
                          {(drag) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              className="queue-item"
                              style={{
                                ...drag.draggableProps.style,
                                outline: active
                                  ? "2px solid var(--link)"
                                  : "none",
                              }}
                            >
                              <div
                                {...drag.dragHandleProps}
                                className="handle"
                                title="Kéo để sắp xếp"
                              >
                                ⠿
                              </div>
                              {s.coverUrl ? (
                                <img
                                  src={s.coverUrl}
                                  alt=""
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 8,
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 8,
                                    background: "var(--border)",
                                  }}
                                />
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {s.title}
                                </div>
                                <div style={{ opacity: 0.7, fontSize: 12 }}>
                                  {s.artist || "—"}
                                </div>
                              </div>
                              <button onClick={() => playAt(i)} title="Phát">
                                ▶
                              </button>
                              <button onClick={() => removeAt(i)} title="Xoá">
                                🗑
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {dp.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </aside>
    </>
  );
}
