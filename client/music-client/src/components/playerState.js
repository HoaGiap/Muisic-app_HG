// src/components/playerState.js
import { atomWithStorage } from "jotai/utils";

// Bài đang phát
export const currentTrackAtom = atomWithStorage("player.current", null);

// Trạng thái phát/tạm dừng
export const playingAtom = atomWithStorage("player.playing", false);

// Hàng đợi & vị trí hiện tại trong hàng đợi
export const queueAtom = atomWithStorage("player.queue", []);
export const queueIndexAtom = atomWithStorage("player.index", 0);

// Shuffle & Repeat mode: 'list' | 'oneOnce' | 'oneLoop'
export const shuffleAtom = atomWithStorage("player.shuffle", false);
export const repeatAtom = atomWithStorage("player.repeat", "list");

// 👇 NEW: mở/đóng panel hàng đợi
export const queueOpenAtom = atomWithStorage("player.queueOpen", false);
