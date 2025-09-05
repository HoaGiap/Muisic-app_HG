// src/hooks/useMediaSession.js
import { useEffect } from "react";

/**
 * Media Session for lockscreen/media keys.
 * @param {{
 *   track: { title?: string, artist?: string, coverUrl?: string, id?: string, _id?: string } | null,
 *   playing: boolean,
 *   progress: number,
 *   duration: number,
 *   onPlay: () => void,
 *   onPause: () => void,
 *   onNext: () => void,
 *   onPrev: () => void,
 *   onSeekTo: (t: number) => void,
 *   onSeekBackward: (sec: number) => void,
 *   onSeekForward: (sec: number) => void,
 * }} params
 */
export default function useMediaSession(params) {
  const {
    track,
    playing,
    progress,
    duration,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onSeekTo,
    onSeekBackward,
    onSeekForward,
  } = params || {};

  // Cập nhật metadata + handlers khi đổi bài / trạng thái
  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator) ||
      !track
    )
      return;
    const ms = navigator.mediaSession;

    // Artwork đa kích cỡ (có thể cùng 1 URL, hệ thống tự chọn)
    const sizes = [96, 128, 192, 256, 384, 512];
    const artwork = track.coverUrl
      ? sizes.map((s) => ({
          src: track.coverUrl,
          sizes: `${s}x${s}`,
          type: "image/jpeg",
        }))
      : [];

    ms.metadata = new window.MediaMetadata({
      title: track.title || "",
      artist: track.artist || "",
      album: "",
      artwork,
    });

    try {
      ms.playbackState = playing ? "playing" : "paused";
    } catch {}

    // Action handlers
    try {
      ms.setActionHandler("play", onPlay || null);
      ms.setActionHandler("pause", onPause || null);
      ms.setActionHandler("previoustrack", onPrev || null);
      ms.setActionHandler("nexttrack", onNext || null);
      ms.setActionHandler("seekbackward", (details) => {
        const off = details?.seekOffset ?? 10;
        onSeekBackward && onSeekBackward(off);
      });
      ms.setActionHandler("seekforward", (details) => {
        const off = details?.seekOffset ?? 10;
        onSeekForward && onSeekForward(off);
      });
      ms.setActionHandler("seekto", (details) => {
        if (details?.seekTime != null) {
          onSeekTo && onSeekTo(details.seekTime);
        }
      });
      ms.setActionHandler("stop", onPause || null);
    } catch {}

    // Cleanup handlers khi track đổi
    return () => {
      try {
        [
          "play",
          "pause",
          "previoustrack",
          "nexttrack",
          "seekbackward",
          "seekforward",
          "seekto",
          "stop",
        ].forEach((a) => ms.setActionHandler(a, null));
      } catch {}
    };
  }, [
    track?._id,
    track?.id,
    track?.title,
    track?.artist,
    track?.coverUrl,
    playing,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onSeekTo,
    onSeekBackward,
    onSeekForward,
  ]);

  // Cập nhật position state để scrubber hệ thống biết tiến độ
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    try {
      navigator.mediaSession.setPositionState({
        duration: duration || 0,
        playbackRate: 1,
        position: progress || 0,
      });
    } catch {}
  }, [progress, duration]);
}
