// client/src/hooks/usePlayerQueue.js
import { useCallback } from "react";
import { useAtom } from "jotai";
import {
  queueAtom,
  queueIndexAtom,
  playingAtom,
} from "../components/playerState";

/**
 * Hook điều khiển hàng đợi phát nhạc.
 * Trả về: replaceQueue, enqueue, playOne, playListFrom
 */
export default function usePlayerQueue() {
  const [, setQueue] = useAtom(queueAtom);
  const [, setIdx] = useAtom(queueIndexAtom);
  const [, setPlaying] = useAtom(playingAtom);

  /** Thay toàn bộ queue – mặc định phát ngay từ index 0 */
  const replaceQueue = useCallback(
    (list, opts = {}) => {
      const { playNow = true, startIndex = 0 } = opts;
      const items = Array.isArray(list)
        ? list.filter(Boolean)
        : [list].filter(Boolean);
      if (!items.length) return;

      setQueue(items);
      const nextIdx = Math.min(
        Math.max(0, startIndex),
        Math.max(0, items.length - 1)
      );
      setIdx(nextIdx);
      if (playNow) setPlaying(true);
    },
    [setQueue, setIdx, setPlaying]
  );

  /** Thêm vào cuối queue. Nếu queue đang rỗng & playNow=true thì phát luôn */
  const enqueue = useCallback(
    (list, opts = {}) => {
      const { playNow = false } = opts;
      const items = Array.isArray(list)
        ? list.filter(Boolean)
        : [list].filter(Boolean);
      if (!items.length) return;

      setQueue((q) => {
        const empty = q.length === 0;
        const merged = [...q, ...items];
        if (empty && playNow) {
          // sau khi setQueue xong, chọn index 0 rồi play
          Promise.resolve().then(() => {
            setIdx(0);
            setPlaying(true);
          });
        }
        return merged;
      });
    },
    [setQueue, setIdx, setPlaying]
  );

  /** Phát một bài ngay lập tức (thay queue = chỉ 1 bài) */
  const playOne = useCallback(
    (song) => {
      if (!song) return;
      replaceQueue([song], { startIndex: 0, playNow: true });
    },
    [replaceQueue]
  );

  /** Phát list bắt đầu từ một index nào đó */
  const playListFrom = useCallback(
    (list, startIndex = 0) => {
      replaceQueue(list, { startIndex, playNow: true });
    },
    [replaceQueue]
  );

  return { replaceQueue, enqueue, playOne, playListFrom };
}
