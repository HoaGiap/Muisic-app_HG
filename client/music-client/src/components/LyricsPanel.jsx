import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  currentTrackAtom,
  progressAtom,
  lyricsOpenAtom,
  seekRequestAtom,
} from "./playerState";
import { api } from "../api";
import "./lyrics-panel.css";

const LRC_TAG = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?]/;

function stripLrc(lrc = "") {
  if (!lrc) return "";
  return lrc
    .split(/\r?\n/)
    .map((line) => line.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,2})?]/g, "").trim())
    .filter(Boolean)
    .join("\n");
}

function parseLrc(lrc = "") {
  if (!lrc) return [];
  const lines = lrc.split(/\r?\n/);
  const cues = [];
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const tags = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?]/g)];
    if (!tags.length) continue;
    const lyric = raw
      .replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?]/g, "")
      .trim();
    if (!lyric) continue;
    for (const m of tags) {
      const mm = parseInt(m[1], 10) || 0;
      const ss = parseInt(m[2], 10) || 0;
      const xx = parseInt(m[3] || "0", 10) || 0;
      const t = mm * 60 + ss + xx / 100;
      cues.push({ t, l: lyric });
    }
  }
  cues.sort((a, b) => a.t - b.t);
  return cues;
}

function normalizeLyricsPayload(payload) {
  let lrc = payload?.lrc || "";
  let plain = "";

  if (payload?.lyrics && typeof payload.lyrics === "object") {
    plain = payload.lyrics.text || "";
  } else if (typeof payload?.lyrics === "string") {
    if (LRC_TAG.test(payload.lyrics)) lrc = lrc || payload.lyrics;
    else plain = payload.lyrics;
  }
  if (!plain && lrc) plain = stripLrc(lrc);
  return { lrc, plain };
}

function formatArtistList(list) {
  if (!Array.isArray(list) || !list.length) return "";
  return list
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      return item.name || item.title || "";
    })
    .filter(Boolean)
    .join(", ");
}

export default function LyricsPanel() {
  const [open, setOpen] = useAtom(lyricsOpenAtom);
  const [track] = useAtom(currentTrackAtom);
  const [progress] = useAtom(progressAtom);
  const [, requestSeek] = useAtom(seekRequestAtom);

  const [cues, setCues] = useState([]);
  const [plain, setPlain] = useState("");
  const wrapRef = useRef(null);

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

  const activeIdx = useMemo(() => {
    if (!cues.length) return -1;
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

  useEffect(() => {
    if (!wrapRef.current || activeIdx < 0) return;
    const target = wrapRef.current.querySelector(`[data-i="${activeIdx}"]`);
    if (!target) return;
    const containerRect = wrapRef.current.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const delta =
      targetRect.top -
      containerRect.top -
      containerRect.height / 2 +
      targetRect.height / 2;
    wrapRef.current.scrollTo({
      top: wrapRef.current.scrollTop + delta,
      behavior: "smooth",
    });
  }, [activeIdx]);

  const coverImage = useMemo(() => {
    if (!track) return "";
    return (
      track.lyricsBackdrop ||
      track.coverUrl ||
      track.cover ||
      track.image ||
      track.artwork ||
      track.thumbnail ||
      track?.album?.coverUrl ||
      track?.album?.cover ||
      ""
    );
  }, [track]);

  const artistLine = useMemo(() => {
    if (!track) return "";
    if (Array.isArray(track.artists) && track.artists.length) {
      return formatArtistList(track.artists);
    }
    const albumArtist = track?.album?.artist;
    const normalizedAlbumArtist =
      typeof albumArtist === "string"
        ? albumArtist
        : albumArtist?.name || albumArtist?.title || "";
    return (
      track.artist ||
      track.artistName ||
      track?.album?.artistName ||
      normalizedAlbumArtist ||
      ""
    );
  }, [track]);

  const handleSeek = (seconds) => {
    if (typeof seconds !== "number" || Number.isNaN(seconds)) return;
    requestSeek({ time: seconds, key: Date.now() });
  };

  if (!open) return null;

  return (
    <div
      className="lyrics-overlay"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Lyrics overlay"
    >
      <div
        className="lyrics-overlay__background"
        style={
          coverImage ? { backgroundImage: `url(${coverImage})` } : undefined
        }
      />
      <div className="lyrics-overlay__scrim" />
      <div className="lyrics-panel" onClick={(e) => e.stopPropagation()}>
        <header className="lyrics-panel__head">
          <div>
            <p className="lyrics-panel__eyebrow">Lời bài hát</p>
            <h2>{track?.title || "Bài hát"}</h2>
            {artistLine && (
              <p className="lyrics-panel__artist">{artistLine}</p>
            )}
          </div>
          <button
            className="lyrics-close"
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Đóng lời bài hát"
          >
            Đóng
          </button>
        </header>

        {cues.length === 0 ? (
          <div className="lyrics-plain">
            <pre>{plain || "Chưa có lời bài hát."}</pre>
          </div>
        ) : (
          <div ref={wrapRef} className="lyrics-scroll">
            {cues.map((c, i) => (
              <button
                key={`${i}-${c.t}`}
                data-i={i}
                type="button"
                className={`lyrics-line${i === activeIdx ? " is-active" : ""}`}
                onClick={() => handleSeek(c.t)}
                aria-current={i === activeIdx ? "true" : undefined}
              >
                <span>{c.l}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
