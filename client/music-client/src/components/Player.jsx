import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
  shuffleAtom,
  repeatAtom,
  // queueOpenAtom, // nếu dùng mini-queue panel, mở comment 2 dòng có queueOpenAtom
} from "./playerState";
import { api } from "../api";

// Lưu các bài đã tính lượt trong phiên (reload sẽ reset)
const countedSet = new Set();

export default function Player() {
  const [current, setCurrent] = useAtom(currentTrackAtom);
  const [playing, setPlaying] = useAtom(playingAtom);
  const [queue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);
  const [shuffle, setShuffle] = useAtom(shuffleAtom);
  const [repeat, setRepeat] = useAtom(repeatAtom);
  // const [, setQueueOpen] = useAtom(queueOpenAtom);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(() => {
    const v = Number(localStorage.getItem("vol"));
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
  });
  const [muted, setMuted] = useState(false);

  const audioRef = useRef(null);
  const repeatOnceRef = useRef(0);
  const countedThisTrackRef = useRef(false);

  // Khoá nhận diện bài hiện tại
  const trackKey = current?._id ?? current?.id;

  // Đổi bài -> reset progress, lặp 1 lần & cờ đếm
  useEffect(() => {
    if (queue[idx]) {
      setCurrent(queue[idx]);
      setProgress(0);
      repeatOnceRef.current = 0;
      countedThisTrackRef.current = false;
    }
  }, [idx, queue, setCurrent]);

  // Play/Pause theo state
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => {});
    else a.pause();
  }, [playing, current]);

  // Volume & mute
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = vol;
    localStorage.setItem("vol", String(vol));
  }, [vol]);
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.muted = muted;
  }, [muted]);

  // Cập nhật thời gian + đếm plays sau 5 giây
  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;

    const cur = a.currentTime || 0;
    const dur = a.duration || 0;
    setProgress(cur);
    setDuration(dur);

    // ✅ chỉ đếm khi đang phát & đã nghe >= 5s
    if (!playing) return;
    if (!trackKey) return;
    if (countedThisTrackRef.current) return;
    if (cur < 5) return;

    if (!countedSet.has(trackKey)) {
      countedThisTrackRef.current = true;
      countedSet.add(trackKey);
      api.post(`/songs/${trackKey}/plays`).catch(() => {});
    }
  };

  // Phím tắt
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key.toLowerCase() === "n") goNext(true);
      if (e.key.toLowerCase() === "p") goPrev(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- NEXT/PREV ----------
  const goNext = (manual = false) => {
    if (!queue.length) return;
    if (shuffle) {
      setIdx((i) => {
        if (queue.length === 1) return 0;
        let r = i;
        while (r === i) r = Math.floor(Math.random() * queue.length);
        return r;
      });
      setPlaying(true);
      return;
    }
    const last = queue.length - 1;
    if (manual) {
      setIdx((i) => (i < last ? i + 1 : 0));
      setPlaying(true);
      return;
    }
    // onEnded xử lý tự động
  };

  const goPrev = () => {
    if (!queue.length) return;
    setIdx((i) => (i > 0 ? i - 1 : Math.max(queue.length - 1, 0)));
    setPlaying(true);
  };

  // ---------- KẾT THÚC BÀI ----------
  const onEnded = () => {
    const a = audioRef.current;
    if (!a) return;

    if (repeat === "oneLoop") {
      a.currentTime = 0;
      a.play().catch(() => {});
      return;
    }
    if (repeat === "oneOnce") {
      if (repeatOnceRef.current === 0) {
        repeatOnceRef.current = 1;
        a.currentTime = 0;
        a.play().catch(() => {});
        return;
      }
    }

    if (!queue.length) {
      setPlaying(false);
      return;
    }

    if (shuffle) {
      setIdx((i) => {
        if (queue.length === 1) {
          setPlaying(false);
          return i;
        }
        let r = i;
        while (r === i) r = Math.floor(Math.random() * queue.length);
        return r;
      });
      setPlaying(true);
      return;
    }

    setIdx((i) => {
      const last = queue.length - 1;
      if (i < last) {
        setPlaying(true);
        return i + 1;
      }
      setPlaying(false); // dừng ở cuối
      return i;
    });
  };

  if (!current)
    return (
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: 12,
          background: "var(--card)",
        }}
      >
        Player sẵn sàng 🎧
        {/* <button style={{ marginLeft: 8 }} onClick={() => setQueueOpen(true)}>
          📃 Queue ({queue.length})
        </button> */}
      </div>
    );

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        padding: 12,
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: "var(--card)",
      }}
    >
      {current.coverUrl && (
        <img
          src={current.coverUrl}
          alt=""
          style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {current.title}
        </div>
        <div style={{ opacity: 0.7, fontSize: 14 }}>{current.artist}</div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step="1"
          value={progress}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (audioRef.current) audioRef.current.currentTime = val;
            setProgress(val);
          }}
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {fmt(progress)} / {fmt(duration)} | {idx + 1}/{queue.length}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* <button onClick={() => setQueueOpen(true)} title="Mở hàng đợi">
          📃 Queue ({queue.length})
        </button> */}

        <button onClick={() => setMuted((m) => !m)} title="Mute">
          {muted || vol === 0 ? "🔇" : vol < 0.5 ? "🔉" : "🔊"}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : vol}
          onChange={(e) => {
            setMuted(false);
            setVol(Number(e.target.value));
          }}
          style={{ width: 100 }}
          title="Volume"
        />

        <button onClick={() => setShuffle((s) => !s)} title="Shuffle">
          {shuffle ? "🔀 On" : "🔀 Off"}
        </button>
        <button onClick={goPrev} title="Prev">
          ⏮
        </button>
        <button onClick={() => setPlaying((p) => !p)} title="Play/Pause">
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={() => goNext(true)} title="Next">
          ⏭
        </button>
        <button
          onClick={() =>
            setRepeat((r) =>
              r === "list" ? "oneOnce" : r === "oneOnce" ? "oneLoop" : "list"
            )
          }
          title="Repeat mode"
        >
          {repeat === "list"
            ? "🔁 Hết DS"
            : repeat === "oneOnce"
            ? "🔁 Lặp 1x"
            : "🔂 Lặp mãi"}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={current.audioUrl}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={onEnded}
      />
    </div>
  );
}

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
