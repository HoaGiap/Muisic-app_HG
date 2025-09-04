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
  mutedAtom, // ✅ thêm
} from "./playerState";
import QueuePanel from "./QueuePanel";
import { api } from "../api";

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
  const [muted, setMuted] = useAtom(mutedAtom); // ✅ thêm

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const repeatOnceRef = useRef(0);
  const countedThisTrackRef = useRef(false);

  useEffect(() => {
    if (queue[idx]) {
      setCurrent(queue[idx]);
      setProgress(0);
      repeatOnceRef.current = 0;
      countedThisTrackRef.current = false;
    }
  }, [idx, queue, setCurrent]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => {});
    else a.pause();
  }, [playing, current]);

  // ✅ Volume & Mute áp vào <audio> + lưu localStorage
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (typeof window !== "undefined")
      localStorage.setItem("vol", String(volume));
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    if (typeof window !== "undefined")
      localStorage.setItem("muted", muted ? "1" : "0");
  }, [muted]);

  // phím tắt
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
      if (e.key.toLowerCase() === "m") setMuted((m) => !m); // ✅ Mute toggle
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, []);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    const cur = a?.currentTime || 0;
    const dur = a?.duration || 0;
    setProgress(cur);
    setDuration(dur);

    const trackId = current?._id || current?.id;
    if (trackId && !countedThisTrackRef.current && cur >= 5) {
      if (!countedSet.has(trackId)) {
        countedThisTrackRef.current = true;
        countedSet.add(trackId);
        api.post(`/songs/${trackId}/plays`).catch(() => {});
      }
    }
  };

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
      setPlaying(false);
      return i;
    });
  };

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
        {/* trái: thông tin + Queue */}
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

        {/* giữa: tiến trình */}
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

        {/* phải: điều khiển + Mute + Volume */}
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

          {/* ✅ Mute + Volume */}
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
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onTimeUpdate}
          onEnded={onEnded}
          muted={muted} // ✅
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
