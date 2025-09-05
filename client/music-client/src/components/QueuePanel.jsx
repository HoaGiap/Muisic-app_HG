import { useAtom } from "jotai";
import {
  queueAtom,
  queueIndexAtom,
  playingAtom,
  queueOpenAtom,
} from "./playerState";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { t } from "../ui/toast";

export default function QueuePanel() {
  const [open, setOpen] = useAtom(queueOpenAtom);
  const [queue, setQueue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);
  const [, setPlaying] = useAtom(playingAtom);

  if (!open) return null;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    setQueue((q) => {
      const arr = [...q];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });

    // cập nhật index đang phát
    if (idx === from) setIdx(to);
    else if (from < idx && to >= idx) setIdx((i) => i - 1);
    else if (from > idx && to <= idx) setIdx((i) => i + 1);
  };

  const removeAt = (i) => {
    setQueue((q) => {
      const arr = [...q];
      arr.splice(i, 1);
      return arr;
    });
    if (i < idx) setIdx((x) => Math.max(0, x - 1));
    if (i === idx) {
      // nếu xoá đúng bài đang phát -> giữ nguyên idx (mục ngay sau đó sẽ lấp vào vị trí)
      setPlaying(false);
    }
  };

  const clearAll = () => {
    setQueue([]);
    setIdx(0);
    setPlaying(false);
    t.ok("Đã xoá queue");
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 72,
        width: 360,
        maxHeight: "60vh",
        background: "var(--card, #fff)",
        border: "1px solid #eee",
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,.1)",
        overflow: "hidden",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #eee",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <b>Queue ({queue.length})</b>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={clearAll}>Clear</button>
          <button onClick={() => setOpen(false)}>Đóng</button>
        </div>
      </div>

      <div style={{ overflow: "auto" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="q" direction="vertical">
            {(ps) => (
              <div ref={ps.innerRef} {...ps.droppableProps}>
                {queue.map((s, i) => (
                  <Draggable
                    key={(s._id || s.id) + "_" + i}
                    draggableId={(s._id || s.id) + "_" + i}
                    index={i}
                  >
                    {(hs) => (
                      <div
                        ref={hs.innerRef}
                        {...hs.draggableProps}
                        {...hs.dragHandleProps}
                        onDoubleClick={() => {
                          setIdx(i);
                          setPlaying(true);
                        }}
                        style={{
                          padding: 8,
                          display: "grid",
                          gridTemplateColumns: "32px 1fr auto",
                          gap: 8,
                          alignItems: "center",
                          borderBottom: "1px solid #f2f2f2",
                          background:
                            i === idx ? "rgba(0,0,0,.04)" : "transparent",
                          ...hs.draggableProps.style,
                        }}
                      >
                        {s.coverUrl ? (
                          <img
                            src={s.coverUrl}
                            alt=""
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: "#eee",
                            }}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontWeight: 600,
                              fontSize: 14,
                            }}
                          >
                            {s.title}
                          </div>
                          <div style={{ opacity: 0.7, fontSize: 12 }}>
                            {s.artist}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAt(i);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {ps.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div
        style={{ padding: 8, textAlign: "center", fontSize: 12, opacity: 0.7 }}
      >
        Kéo để sắp xếp • Double-click để phát
      </div>
    </div>
  );
}
