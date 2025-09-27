// src/components/Player.jsx
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
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
  progressAtom,
  durationAtom,
  lyricsOpenAtom,
} from "./playerState";
import QueuePanel from "./QueuePanel";
import LyricsPanel from "./LyricsPanel";
import { api } from "../api";
import useMediaSession from "../hooks/useMediaSession";

// ICONS (Font Awesome 6 via react-icons)
import {
  FaPlay,
  FaPause,
  FaBackwardStep,
  FaForwardStep,
  FaShuffle,
  FaRepeat,
  FaVolumeHigh,
  FaVolumeXmark,
} from "react-icons/fa6";

// Ghi nhớ các bài đã tính lượt nghe trong phiên
const countedSet = new Set();

export default function Player() {
  const [current, setCurrent] = useAtom(currentTrackAtom);
  const [playing, setPlaying] = useAtom(playingAtom);
  const [queue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);
  const [shuffle, setShuffle] = useAtom(shuffleAtom);
  const [repeat, setRepeat] = useAtom(repeatAtom);
  const [, setOpen] = useAtom(queueOpenAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [muted, setMuted] = useAtom(mutedAtom);

  const [progress, setProgress] = useAtom(progressAtom);
  const [duration, setDuration] = useAtom(durationAtom);
  const [, setLyricsOpen] = useAtom(lyricsOpenAtom); // chỉ cần mở panel

  const audioRef = useRef(null);
  const repeatOnceRef = useRef(0);
  const countedThisTrackRef = useRef(false);

  // Khi đổi index hoặc queue -> set current, reset cờ
  useEffect(() => {
    if (queue[idx]) {
      setCurrent(queue[idx]);
      setProgress(0);
      repeatOnceRef.current = 0;
      countedThisTrackRef.current = false;
    }
  }, [idx, queue, setCurrent, setProgress]);

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
    onTimeUpdate();
    restoreResume();
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
      a.currentTime = 0;
      a.play();
      return;
    }

    if (repeat === "oneOnce") {
      if (repeatOnceRef.current === 0) {
        repeatOnceRef.current = 1;
        a.currentTime = 0;
        a.play();
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

  // ===== Render =====
  if (!current) {
    return (
      <>
        <div className="player-shell">
          <div className="player" style={{ justifyContent: "center" }}>
            Player sẵn sàng 🎧
          </div>
        </div>
        <QueuePanel />
        <LyricsPanel />
      </>
    );
  }

  return (
    <>
      {/* SHELL fixed đáy */}
      <div className="player-shell">
        <div className="player">
          {/* LEFT: meta + mở Queue */}
          <div className="meta">
            {current.coverUrl && <img src={current.coverUrl} alt="" />}
            <div style={{ minWidth: 0 }}>
              <div className="t">{current.title}</div>
              <div className="a">{current.artist}</div>
            </div>
            <button className="pill" onClick={() => setOpen(true)}>
              Queue ({queue.length})
            </button>
          </div>

          {/* CENTER: controls + progress */}
          <div className="center">
            <div className="buttons">
              {/* Shuffle */}
              <button
                className={"icon" + (shuffle ? " is-active" : "")}
                title={shuffle ? "Shuffle: On" : "Shuffle: Off"}
                aria-pressed={shuffle}
                onClick={() => setShuffle((s) => !s)}
              >
                <FaShuffle size={18} />
              </button>

              {/* Prev */}
              <button
                className="icon"
                title="Prev"
                onClick={() => goPrev(true)}
              >
                <FaBackwardStep size={18} />
              </button>

              {/* Play / Pause */}
              <button
                className="icon play"
                title={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((p) => !p)}
                aria-pressed={playing}
              >
                {playing ? <FaPause size={18} /> : <FaPlay size={18} />}
              </button>

              {/* Next */}
              <button
                className="icon"
                title="Next"
                onClick={() => goNext(true)}
              >
                <FaForwardStep size={18} />
              </button>

              {/* Repeat */}
              <button
                className={"icon" + (repeat !== "list" ? " is-active" : "")}
                title={
                  repeat === "list"
                    ? "Repeat: Off"
                    : repeat === "oneOnce"
                    ? "Repeat: One (1x)"
                    : "Repeat: One (loop)"
                }
                aria-pressed={repeat !== "list"}
                onClick={() =>
                  setRepeat((r) =>
                    r === "list"
                      ? "oneOnce"
                      : r === "oneOnce"
                      ? "oneLoop"
                      : "list"
                  )
                }
              >
                <FaRepeat size={18} />
                {repeat === "oneOnce" && (
                  <span style={{ fontSize: 10, marginLeft: 4 }}>1x</span>
                )}
              </button>
            </div>

            <div className="progress">
              <span>{fmt(progress)}</span>
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
              />
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* RIGHT: Lyrics + Mute + Volume */}
          <div className="right">
            <button
              className="pill"
              onClick={() => setLyricsOpen(true)}
              title="Lời bài hát"
            >
              🎤 Lời
            </button>

            <button
              className={"icon" + (muted || volume === 0 ? " is-active" : "")}
              onClick={() => setMuted((m) => !m)}
              title={muted || volume === 0 ? "Unmute (M)" : "Mute (M)"}
              aria-pressed={muted || volume === 0}
            >
              {muted || volume === 0 ? (
                <FaVolumeXmark size={18} />
              ) : (
                <FaVolumeHigh size={18} />
              )}
            </button>

            <input
              className="vol"
              type="range"
              min={0}
              max={1}
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>

          {/* audio tag */}
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
      </div>

      {/* overlays */}
      <QueuePanel />
      <LyricsPanel />
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
