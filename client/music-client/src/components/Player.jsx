// src/components/Player.jsx
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
  shuffleAtom,
  repeatAtom,
  queueOpenAtom,
  volumeAtom,
  mutedAtom,
} from "./playerState";
import QueuePanel from "./QueuePanel";
import { api } from "../api";
import useMediaSession from "../hooks/useMediaSession";

// Ghi nhớ các bài đã tính lượt nghe (trong phiên/tab hiện tại)
const countedSet = new Set();

export default function Player() {
  const [current, setCurrent] = useAtom(currentTrackAtom);
  const [playing, setPlaying] = useAtom(playingAtom);
  const [queue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);
  const [shuffle, setShuffle] = useAtom(shuffleAtom);
  const [repeat, setRepeat] = useAtom(repeatAtom);
  const [open, setOpen] = useAtom(queueOpenAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [muted, setMuted] = useAtom(mutedAtom);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const repeatOnceRef = useRef(0);
  const countedThisTrackRef = useRef(false); // chỉ post /plays 1 lần cho bài hiện tại

  // Khi đổi index hoặc queue -> set current, reset cờ
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

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    try {
      localStorage.setItem("vol", String(volume));
    } catch {}
  }, [volume]);

  // Mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    try {
      localStorage.setItem("muted", muted ? "1" : "0");
    } catch {}
  }, [muted]);

  // Phím tắt
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key.toLowerCase() === "n") goNext(true);
      if (e.key.toLowerCase() === "p") goPrev(true);
      if (e.key.toLowerCase() === "m") setMuted((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật tiến trình + lưu resume + đếm plays (>=5s)
  const onTimeUpdate = () => {
    const a = audioRef.current;
    const cur = a?.currentTime || 0;
    const dur = a?.duration || 0;
    setProgress(cur);
    setDuration(dur);

    const trackId = current?._id || current?.id;

    // Nhớ vị trí cho từng bài
    try {
      if (trackId)
        localStorage.setItem(`resume:${trackId}`, String(Math.floor(cur)));
    } catch {}

    // Đếm plays: chỉ sau 5s, 1 lần/phiên
    if (trackId && !countedThisTrackRef.current && cur >= 5) {
      if (!countedSet.has(trackId)) {
        countedThisTrackRef.current = true;
        countedSet.add(trackId);
        api.post(`/songs/${trackId}/plays`).catch(() => {});
      }
    }
  };

  // Khôi phục vị trí đã nghe khi metadata sẵn sàng
  const restoreResume = () => {
    const a = audioRef.current;
    if (!a) return;
    const trackId = current?._id || current?.id;
    if (!trackId) return;
    try {
      const saved = Number(localStorage.getItem(`resume:${trackId}`) || 0);
      if (saved > 0 && saved < (a.duration || 0) - 3) {
        a.currentTime = saved;
        setProgress(saved);
      }
    } catch {}
  };

  const handleLoadedMeta = () => {
    onTimeUpdate(); // cập nhật duration ngay
    restoreResume(); // nhảy tới vị trí đã nghe
  };

  // Next/Prev
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
    }
  };

  const goPrev = () => {
    if (!queue.length) return;
    setIdx((i) => (i > 0 ? i - 1 : Math.max(queue.length - 1, 0)));
    setPlaying(true);
  };

  // Kết thúc bài
  const onEnded = () => {
    const a = audioRef.current;

    if (repeat === "oneLoop") {
      if (a) {
        a.currentTime = 0;
        a.play();
      }
      return;
    }

    if (repeat === "oneOnce") {
      if (repeatOnceRef.current === 0) {
        repeatOnceRef.current = 1;
        if (a) {
          a.currentTime = 0;
          a.play();
        }
        return;
      }
      // đã lặp 1 lần => tiếp tục sang bài
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

  const seekTo = (t) => {
    const a = audioRef.current;
    if (!a) return;
    const d = a.duration || duration || 0;
    const clamped = Math.min(Math.max(0, t), d > 3 ? d - 0.01 : d);
    a.currentTime = clamped;
    setProgress(clamped);
  };
  const seekBy = (delta) => {
    const a = audioRef.current;
    if (!a) return;
    seekTo((a.currentTime || 0) + delta);
  };

  useMediaSession({
    track: current,
    playing,
    progress,
    duration,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onNext: () => goNext(true),
    onPrev: () => goPrev(true),
    onSeekTo: (t) => seekTo(t),
    onSeekBackward: (sec) => seekBy(-Math.abs(sec || 10)),
    onSeekForward: (sec) => seekBy(+Math.abs(sec || 10)),
  });

  if (!current) {
    return (
      <>
        <div style={{ borderTop: "1px solid #eee", padding: 12 }}>
          Player sẵn sàng 🎧
        </div>
        <QueuePanel />
      </>
    );
  }

  return (
    <>
      <div
        style={{
          borderTop: "1px solid #eee",
          padding: 12,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Trái: thông tin + Queue */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {current.coverUrl && (
            <img
              src={current.coverUrl}
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                objectFit: "cover",
              }}
            />
          )}
          <div>
            <div
              style={{
                fontWeight: 600,
                maxWidth: 260,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {current.title}
            </div>
            <div style={{ opacity: 0.7, fontSize: 14 }}>{current.artist}</div>
          </div>
          <button onClick={() => setOpen(true)} style={{ marginLeft: 8 }}>
            Queue ({queue.length})
          </button>
        </div>

        {/* Giữa: tiến trình */}
        <div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="1"
            value={progress}
            onChange={(e) => {
              if (audioRef.current) {
                const v = Number(e.target.value);
                audioRef.current.currentTime = v;
                setProgress(v);
              }
            }}
            style={{ width: "100%" }}
          />
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {fmt(progress)} / {fmt(duration)} &nbsp;|&nbsp; {idx + 1}/
            {queue.length}
          </div>
        </div>

        {/* Phải: điều khiển + Mute + Volume */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShuffle((s) => !s)} title="Shuffle">
            {shuffle ? "🔀 On" : "🔀 Off"}
          </button>
          <button onClick={() => goPrev(true)} title="Prev">
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

          {/* Mute + Volume */}
          <button
            onClick={() => setMuted((m) => !m)}
            title={muted ? "Unmute (M)" : "Mute (M)"}
          >
            {muted || volume === 0 ? "🔇" : "🔊"}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>

        <audio
          ref={audioRef}
          src={current.audioUrl}
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={handleLoadedMeta}
          onEnded={onEnded}
          muted={muted}
        />
      </div>

      <QueuePanel />
    </>
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
