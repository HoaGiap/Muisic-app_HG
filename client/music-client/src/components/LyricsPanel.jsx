// client/src/components/LyricsPanel.jsx
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { currentTrackAtom, progressAtom, lyricsOpenAtom } from "./playerState";
import { api } from "../api";

/** Regex nhận diện tag LRC [mm:ss.xx] */
const LRC_TAG = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?]/;

/** Bỏ timestamp để hiện như lời thường */
function stripLrc(lrc = "") {
  if (!lrc) return "";
  return lrc
    .split(/\r?\n/)
    .map((line) => line.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,2})?]/g, "").trim())
    .filter(Boolean)
    .join("\n");
}

/** Parse LRC -> mảng cues { t: seconds, l: line } */
function parseLrc(lrc = "") {
  if (!lrc) return [];
  const lines = lrc.split(/\r?\n/);
  const cues = [];
  for (const raw of lines) {
    if (!raw.trim()) continue;
    // Một dòng LRC có thể có nhiều tag thời gian
    const tags = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?]/g)];
    if (!tags.length) continue;
    // Nội dung sau tag cuối cùng
    const lyric = raw
      .replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?]/g, "")
      .trim();
    if (!lyric) continue;
    for (const m of tags) {
      const mm = parseInt(m[1], 10) || 0;
      const ss = parseInt(m[2], 10) || 0;
      const xx = parseInt(m[3] || "0", 10) || 0;
      const t = mm * 60 + ss + xx / 100; // xx là centiseconds (2 chữ số) -> /100
      cues.push({ t, l: lyric });
    }
  }
  // sắp xếp theo thời gian
  cues.sort((a, b) => a.t - b.t);
  return cues;
}

/** Chuẩn hoá payload từ server về { lrc, plain } */
function normalizeLyricsPayload(payload) {
  let lrc = payload?.lrc || "";
  let plain = "";

  if (payload?.lyrics && typeof payload.lyrics === "object") {
    // { lyrics: { text, language, ... } }
    plain = payload.lyrics.text || "";
  } else if (typeof payload?.lyrics === "string") {
    // { lyrics: "..." } -> có thể là LRC hoặc plain
    if (LRC_TAG.test(payload.lyrics)) lrc = lrc || payload.lyrics;
    else plain = payload.lyrics;
  }
  if (!plain && lrc) plain = stripLrc(lrc);
  return { lrc, plain };
}

export default function LyricsPanel() {
  const [open, setOpen] = useAtom(lyricsOpenAtom);
  const [track] = useAtom(currentTrackAtom);
  const [progress] = useAtom(progressAtom);

  const [cues, setCues] = useState([]); // [{ t, l }]
  const [plain, setPlain] = useState(""); // fallback khi không có LRC
  const wrapRef = useRef(null);

  // tải lyrics khi mở panel hoặc đổi bài
  useEffect(() => {
    if (!open || (!track?._id && !track?.id)) return;
    const id = track._id || track.id;

    api
      .get(`/songs/${id}/lyrics`)
      .then(({ data }) => {
        const { lrc, plain } = normalizeLyricsPayload(data || {});
        setCues(lrc ? parseLrc(lrc) : []);
        setPlain(plain || "");
      })
      .catch(() => {
        setCues([]);
        setPlain("");
      });
  }, [open, track?._id, track?.id]);

  // index hiện tại theo progress
  const activeIdx = useMemo(() => {
    if (!cues.length) return -1;
    // tìm cue có t <= progress gần nhất (binary search)
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
                key={`${i}-${c.t}`}
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
