// src/components/Player.jsx
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
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

// ghi nhớ các bài đã tính plays trong 1 phiên
const countedSet = new Set();

/* ==== Thin-stroke SVG icons (cùng phong cách icon tìm kiếm ở Home) ==== */
function Svg({ children, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const IShuffle = () => (
  <Svg>
    <path d="M16 3h5v5M3 7h5l10 10h3M3 17h5l3-3" />
    <path d="M21 16v5h-5" />
  </Svg>
);
const IPrev = () => (
  <Svg>
    <path d="M6 5v14M18 6l-9 6 9 6V6z" />
  </Svg>
);
const INext = () => (
  <Svg>
    <path d="M18 5v14M6 6l9 6-9 6V6z" />
  </Svg>
);
const IRepeat = () => (
  <Svg>
    <path d="M17 1l3 3-3 3" />
    <path d="M20 4H7a4 4 0 0 0-4 4v1" />
    <path d="M7 23l-3-3 3-3" />
    <path d="M4 20h13a4 4 0 0 0 4-4v-1" />
  </Svg>
);
const IPlay = () => (
  <Svg>
    <path d="M8 5l11 7-11 7V5z" />
  </Svg>
);
const IPause = () => (
  <Svg>
    <path d="M10 5v14M16 5v14" />
  </Svg>
);
const IQueue = () => (
  <Svg>
    <path d="M3 6h18M3 12h12M3 18h8" />
  </Svg>
);
const IMic = () => (
  <Svg>
    <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z" />
    <path d="M19 10a7 7 0 0 1-14 0" />
    <path d="M12 17v4" />
  </Svg>
);
const IVol = () => (
  <Svg>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    <path d="M15 9a4 4 0 0 1 0 6" />
  </Svg>
);
const IMute = () => (
  <Svg>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    <path d="M16 9l6 6M22 9l-6 6" />
  </Svg>
);
/* nút + (add) */
const IPlus = () => (
  <Svg>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export default function Player() {
  const [current, setCurrent] = useAtom(currentTrackAtom);
  const [playing, setPlaying] = useAtom(playingAtom);

  // CHỈ đọc queue, không set ở Player nữa
  const [queue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);

  const [shuffle, setShuffle] = useAtom(shuffleAtom);
  const [repeat, setRepeat] = useAtom(repeatAtom);
  const [, setOpen] = useAtom(queueOpenAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [muted, setMuted] = useAtom(mutedAtom);

  const [progress, setProgress] = useAtom(progressAtom);
  const [duration, setDuration] = useAtom(durationAtom);
  const [, setLyricsOpen] = useAtom(lyricsOpenAtom);

  const audioRef = useRef(null);
  const repeatOnceRef = useRef(0);
  const countedThisTrackRef = useRef(false);

  // ----- Playlist picker (cho nút +) -----
  const [showPicker, setShowPicker] = useState(false);
  const [loadingPL, setLoadingPL] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const addBtnRef = useRef(null);

  const openPicker = async () => {
    setShowPicker((v) => !v);
    if (playlists.length || loadingPL) return;
    try {
      setLoadingPL(true);
      const { data } = await api.get("/playlists").catch(() => ({ data: [] }));
      const items = Array.isArray(data) ? data : data.items || [];
      setPlaylists(items);
    } finally {
      setLoadingPL(false);
    }
  };

  const addCurrentTo = async (pl) => {
    if (!current?._id && !current?.id) return;
    const songId = current._id || current.id;
    try {
      await api.post(`/playlists/add`, {
        playlistId: pl._id || pl.id,
        songId,
      });
      setShowPicker(false);
    } catch (e) {
      console.error(e);
      // có thể thêm toast nếu bạn có t.ui/toast
      alert("Không thể thêm vào playlist đã chọn.");
    }
  };

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

  // Cập nhật tiến trình + resume + đếm plays (>=5s)
  const onTimeUpdate = () => {
    const a = audioRef.current;
    const cur = a?.currentTime || 0;
    const dur = a?.duration || 0;
    setProgress(cur);
    setDuration(dur);

    const trackId = current?._id || current?.id;

    // nhớ vị trí cho từng bài
    try {
      if (trackId)
        localStorage.setItem(`resume:${trackId}`, String(Math.floor(cur)));
    } catch {}

    // đếm plays
    if (trackId && !countedThisTrackRef.current && cur >= 5) {
      if (!countedSet.has(trackId)) {
        countedThisTrackRef.current = true;
        countedSet.add(trackId);
        api.post(`/songs/${trackId}/plays`).catch(() => {});
      }
    }
  };

  // khôi phục vị trí đã nghe
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

  const normalize = (val, max = 1) =>
    Math.min(Math.max(val / (max || 1), 0), 1);
  const progressPct = duration ? normalize(progress, duration) : 0;
  const volumePct = Number.isFinite(volume) ? normalize(volume, 1) : 0;

  // v��< trA- picker (th��� n��i) tA-nh theo nA�t +
  const pickerStyle = useMemo(() => {
    const r = addBtnRef.current?.getBoundingClientRect();
    if (!r) return { display: "none" };
    return {
      position: "fixed",
      left: r.left,
      top: r.top - 8,
      transform: "translateY(-100%)",
      zIndex: 60,
      minWidth: 220,
      background: "var(--card)",
      color: "var(--text)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      boxShadow: "0 10px 24px rgba(0,0,0,.25)",
      padding: 8,
    };
  }, [showPicker]); // re-calc khi m��Y/�`A3ng

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
      <div className="player-shell">
        <div className="player">
          {/* LEFT: meta + nút Add (+) */}
          <div className="meta">
            {current.coverUrl && <img src={current.coverUrl} alt="" />}
            <div style={{ minWidth: 0 }}>
              <div className="t">{current.title}</div>
              <div className="a">{current.artist}</div>
            </div>

            {/* nút + (thêm vào playlist) */}
            <button
              ref={addBtnRef}
              className="icon"
              onClick={openPicker}
              aria-label="Thêm vào playlist"
              title="Thêm vào playlist"
            >
              <IPlus />
            </button>
          </div>

          {/* CENTER: controls + progress */}
          <div className="center">
            <div className="buttons">
              <button
                className={"icon" + (shuffle ? " is-active" : "")}
                title={shuffle ? "Shuffle: On" : "Shuffle: Off"}
                aria-pressed={shuffle}
                onClick={() => setShuffle((s) => !s)}
              >
                <IShuffle />
              </button>

              <button
                className="icon"
                title="Prev"
                onClick={() => goPrev(true)}
              >
                <IPrev />
              </button>

              <button
                className="icon play solid"
                title={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((p) => !p)}
                aria-pressed={playing}
              >
                {playing ? <IPause /> : <IPlay />}
              </button>

              <button
                className="icon"
                title="Next"
                onClick={() => goNext(true)}
              >
                <INext />
              </button>

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
                <IRepeat />
              </button>
            </div>

            <div className="progress">
              <span>{fmt(progress)}</span>
              <div
                className="range -progress"
                style={{ "--pct": progressPct }}
              >
                <div className="range-track" />
                <div className="range-fill" />
                <div className="range-knob" />
                <input
                  className="range-input"
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
              </div>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* RIGHT: Lyrics + Queue + Mute + Volume */}
          <div className="right">
            <button
              className="icon"
              onClick={() => setLyricsOpen(true)}
              title="Lời bài hát"
              aria-label="Lời bài hát"
            >
              <IMic />
            </button>

            <button
              className="icon"
              onClick={() => setOpen(true)}
              aria-label="Mở hàng đợi"
              title="Hàng đợi"
            >
              <IQueue />
            </button>

            <button
              className={"icon" + (muted || volume === 0 ? " is-active" : "")}
              onClick={() => setMuted((m) => !m)}
              title={muted || volume === 0 ? "Unmute (M)" : "Mute (M)"}
              aria-pressed={muted || volume === 0}
            >
              {muted || volume === 0 ? <IMute /> : <IVol />}
            </button>

            <div className="range -volume" style={{ "--pct": volumePct }}>
              <div className="range-track" />
              <div className="range-fill" />
              <div className="range-knob" />
              <input
                className="range-input"
                type="range"
                min={0}
                max={1}
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
              />
            </div>
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

      {/* Picker thả nổi để chọn playlist */}
      {showPicker && (
        <div style={pickerStyle} onMouseLeave={() => setShowPicker(false)}>
          <div style={{ fontWeight: 700, margin: "4px 6px 6px" }}>
            Thêm vào playlist
          </div>
          {loadingPL ? (
            <div style={{ opacity: 0.8, padding: "6px 6px 8px" }}>
              Đang tải…
            </div>
          ) : playlists.length ? (
            <div style={{ display: "grid", gap: 6 }}>
              {playlists.map((pl) => (
                <button
                  key={pl._id || pl.id}
                  onClick={() => addCurrentTo(pl)}
                  style={{
                    textAlign: "left",
                    border: 0,
                    background: "transparent",
                    color: "inherit",
                    padding: "8px 10px",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  title={pl.title || pl.name}
                >
                  {pl.title || pl.name || "Playlist"}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.8, padding: "6px 6px 8px" }}>
              Bạn chưa có playlist.
            </div>
          )}
        </div>
      )}

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
