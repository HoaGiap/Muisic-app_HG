import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
  shuffleAtom,
  repeatAtom,
} from "./playerState";

export default function Player() {
  const [current, setCurrent] = useAtom(currentTrackAtom);
  const [playing, setPlaying] = useAtom(playingAtom);
  const [queue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);
  const [shuffle, setShuffle] = useAtom(shuffleAtom);
  const [repeat, setRepeat] = useAtom(repeatAtom);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Cờ dùng cho chế độ "lặp 1 lần"
  const repeatOnceRef = useRef(0); // 0 = chưa lặp, 1 = đã lặp 1 lần

  // Khi đổi bài -> cập nhật current + reset progress và reset cờ "lặp 1 lần"
  useEffect(() => {
    if (queue[idx]) {
      setCurrent(queue[idx]);
      setProgress(0);
      repeatOnceRef.current = 0;
    }
  }, [idx, queue, setCurrent]);

  // Play/Pause theo state
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => {});
    else a.pause();
  }, [playing, current]);

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    setProgress(a?.currentTime || 0);
    setDuration(a?.duration || 0);
  };

  // ---------- NEXT/PREV ----------
  // manual = true nếu do người dùng bấm nút
  const goNext = (manual = false) => {
    if (!queue.length) return;

    // Nếu đang repeat 1 bài vô hạn -> Next thủ công vẫn phải chuyển bài
    // (hành vi thường thấy trên các app). Tức là chỉ onEnded mới giữ nguyên.
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
      // Bấm Next: luôn chuyển, quấn về đầu khi ở cuối
      setIdx((i) => (i < last ? i + 1 : 0));
      setPlaying(true);
      return;
    }

    // Tự hết bài (onEnded) sẽ được xử lý ở hàm onEnded theo repeat-mode
  };

  const goPrev = () => {
    if (!queue.length) return;
    setIdx((i) => (i > 0 ? i - 1 : Math.max(queue.length - 1, 0)));
    setPlaying(true);
  };

  // ---------- KẾT THÚC BÀI ----------
  const onEnded = () => {
    const a = audioRef.current;

    // 3 chế độ repeat theo yêu cầu:
    if (repeat === "oneLoop") {
      // Lặp vô hạn 1 bài
      if (a) {
        a.currentTime = 0;
        a.play();
      }
      return;
    }

    if (repeat === "oneOnce") {
      if (repeatOnceRef.current === 0) {
        // Lặp lại đúng 1 lần
        repeatOnceRef.current = 1;
        if (a) {
          a.currentTime = 0;
          a.play();
        }
        return;
      }
      // Đã lặp 1 lần rồi -> tiếp tục sang bài kế
      // (không ảnh hưởng tới shuffle: nếu bật shuffle, chọn ngẫu nhiên)
    }

    // "list" hoặc đã qua lặp 1 lần:
    if (!queue.length) {
      setPlaying(false);
      return;
    }

    if (shuffle) {
      // Nếu bật shuffle trong "list": chọn bài ngẫu nhiên mới
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

    // tuần tự tới hết danh sách: dừng ở cuối
    setIdx((i) => {
      const last = queue.length - 1;
      if (i < last) {
        setPlaying(true);
        return i + 1;
      }
      setPlaying(false); // dừng tại bài cuối
      return i; // giữ index
    });
  };

  if (!current)
    return (
      <div style={{ borderTop: "1px solid #eee", padding: 12 }}>
        Player sẵn sàng 🎧
      </div>
    );

  return (
    <div
      style={{
        borderTop: "1px solid #eee",
        padding: 12,
        display: "flex",
        gap: 12,
        alignItems: "center",
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
            if (audioRef.current) {
              audioRef.current.currentTime = Number(e.target.value);
              setProgress(Number(e.target.value));
            }
          }}
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {fmt(progress)} / {fmt(duration)} | {idx + 1}/{queue.length}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
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
          onClick={() => {
            // Chu kỳ: list -> oneOnce -> oneLoop -> list
            setRepeat((r) =>
              r === "list" ? "oneOnce" : r === "oneOnce" ? "oneLoop" : "list"
            );
          }}
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
        onLoadedMetadata={onTimeUpdate}
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
