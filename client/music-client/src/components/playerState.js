// src/components/playerState.js
import { atom } from "jotai";

export const currentTrackAtom = atom(null);
export const playingAtom = atom(false);
export const queueAtom = atom([]); // [{_id|id,title,artist,audioUrl,coverUrl},...]
export const queueIndexAtom = atom(0);
export const shuffleAtom = atom(false);
export const repeatAtom = atom("list"); // 'list' | 'oneOnce' | 'oneLoop'

// mở/đóng panel queue mini
export const queueOpenAtom = atom(false);
//lyric lrc
export const progressAtom = atom(0); // ⏱️ giây hiện tại
export const durationAtom = atom(0); // ⏱️ tổng
export const lyricsOpenAtom = atom(false);
export const seekRequestAtom = atom(null);
// âm lượng (0..1) – đọc/lưu localStorage
const v =
  typeof window !== "undefined" ? Number(localStorage.getItem("vol")) : 1;
const initialVol = isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
export const volumeAtom = atom(initialVol);

// ✅ Trạng thái Mute + lưu localStorage
const m = typeof window !== "undefined" ? localStorage.getItem("muted") : "0";
export const mutedAtom = atom(m === "1");
