import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { currentTrackAtom } from "./playerState";
import { progressAtom, lyricsOpenAtom } from "./playerState";
import { api } from "../api";

export default function LyricsPanel() {
  const [open, setOpen] = useAtom(lyricsOpenAtom);
  const [track] = useAtom(currentTrackAtom);
  const [progress] = useAtom(progressAtom);

  const [cues, setCues] = useState([]); // [{t,l}]
  const [plain, setPlain] = useState(""); // fallback khi không có LRC
  const wrapRef = useRef(null);

  // tải lyrics khi mở panel hoặc đổi bài
  useEffect(() => {
    if (!open || (!track?._id && !track?.id)) return;
    const id = track._id || track.id;
    api
      .get(`/songs/${id}/lyrics`)
      .then(({ data }) => {
        setCues(Array.isArray(data?.cues) ? data.cues : []);
        setPlain(String(data?.lyrics || ""));
      })
      .catch(() => {
        setCues([]);
        setPlain("");
      });
  }, [open, track?._id, track?.id]);

  // index hiện tại theo progress
  const activeIdx = useMemo(() => {
    if (!cues.length) return -1;
    // tìm cue có t <= progress gần nhất (binary search ngắn gọn)
    let lo = 0,
      hi = cues.length - 1,
      ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (cues[mid].t <= progress + 0.05) {
        ans = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return ans;
  }, [cues, progress]);

  // auto-scroll theo active line
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current.querySelector(`[data-i="${activeIdx}"]`);
    if (el) {
      const { top: ct, height: ch } = wrapRef.current.getBoundingClientRect();
      const { top: et, height: eh } = el.getBoundingClientRect();
      if (et < ct + 80 || et + eh > ct + ch - 80) {
        wrapRef.current.scrollTo({
          top: wrapRef.current.scrollTop + (et - ct) - ch / 2 + eh,
          behavior: "smooth",
        });
      }
    }
  }, [activeIdx]);

  if (!open) return null;

  return (
    <div style={backdrop} onClick={() => setOpen(false)}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <b style={{ fontSize: 16 }}>🎤 Lời bài hát</b>
          <button onClick={() => setOpen(false)} style={{ marginLeft: "auto" }}>
            ✕
          </button>
        </div>

        {cues.length === 0 ? (
          <div
            style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, opacity: 0.9 }}
          >
            {plain || "Chưa có lời bài hát."}
          </div>
        ) : (
          <div ref={wrapRef} style={scrollArea}>
            {cues.map((c, i) => (
              <div
                key={i}
                data-i={i}
                style={{
                  padding: "6px 4px",
                  lineHeight: 1.6,
                  textAlign: "center",
                  opacity: i === activeIdx ? 1 : 0.5,
                  fontWeight: i === activeIdx ? 700 : 400,
                  fontSize: i === activeIdx ? 18 : 16,
                }}
              >
                {c.l}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const panel = {
  width: "min(720px, 92vw)",
  height: "min(70vh, 520px)",
  background: "var(--bg, #fff)",
  color: "var(--fg, #111)",
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
};
const scrollArea = {
  overflow: "auto",
  flex: 1,
  padding: "6px 4px",
  border: "1px solid #eee",
  borderRadius: 8,
  background: "rgba(0,0,0,0.03)",
};
