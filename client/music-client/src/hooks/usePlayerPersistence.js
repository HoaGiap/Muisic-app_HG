import { useEffect } from "react";
import { useAtom } from "jotai";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
  shuffleAtom,
  repeatAtom,
  volumeAtom,
  mutedAtom,
} from "../components/playerState";

const KEY = "player_state_v1";

export default function usePlayerPersistence() {
  const [current, setCurrent] = useAtom(currentTrackAtom);
  const [, setPlaying] = useAtom(playingAtom);
  const [queue, setQueue] = useAtom(queueAtom);
  const [idx, setIdx] = useAtom(queueIndexAtom);
  const [shuffle, setShuffle] = useAtom(shuffleAtom);
  const [repeat, setRepeat] = useAtom(repeatAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [muted, setMuted] = useAtom(mutedAtom);

  // KHÔI PHỤC khi app mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (Array.isArray(s.queue)) setQueue(s.queue);
      if (Number.isInteger(s.idx)) setIdx(s.idx);
      if (s.current) setCurrent(s.current);
      if (s.shuffle != null) setShuffle(!!s.shuffle);
      if (s.repeat) setRepeat(s.repeat); // 'list' | 'oneOnce' | 'oneLoop'
      if (typeof s.volume === "number")
        setVolume(Math.min(1, Math.max(0, s.volume)));
      if (typeof s.muted === "boolean") setMuted(s.muted);

      // an toàn: không tự play sau khi refresh
      setPlaying(false);
    } catch (_e) {}
    // eslint-disable-next-line
  }, []);

  // LƯU mỗi khi các giá trị đổi
  useEffect(() => {
    const snapshot = {
      current,
      queue,
      idx,
      shuffle,
      repeat,
      volume,
      muted,
      // resumeAt sẽ được Player cập nhật riêng (theo thời gian nghe)
      // để tránh ghi quá dày tại đây
      resumeAt: Number(localStorage.getItem("player_resume_at") || 0),
      currentId: current?._id || current?.id || null,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot));
    } catch (_e) {}
  }, [current, queue, idx, shuffle, repeat, volume, muted]);
}
