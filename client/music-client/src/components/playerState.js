import { atom } from "jotai";
export const currentTrackAtom = atom(null);
export const playingAtom = atom(false);

export const queueAtom = atom([]); // mảng các bài hiện có trên màn
export const queueIndexAtom = atom(0); // index đang phát trong queue
export const shuffleAtom = atom(false); // bật/tắt shuffle
// "list"     = phát tới hết danh sách (dừng ở bài cuối)
// "oneOnce"  = lặp lại bài hiện tại đúng 1 lần rồi tiếp tục
// "oneLoop"  = lặp vô hạn 1 bài
export const repeatAtom = atom("list");
