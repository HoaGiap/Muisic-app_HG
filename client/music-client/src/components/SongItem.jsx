import { useAtom, useSetAtom } from "jotai";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
} from "./playerState";
import { api } from "../api";
import toast from "react-hot-toast";
import { useState } from "react";
import PlaylistPicker from "./PlaylistPicker";

export default function SongItem({
  song,
  list,
  index,
  playlistId,
  onChanged,
  onDelete,
}) {
  const setCurrent = useSetAtom(currentTrackAtom);
  const setPlaying = useSetAtom(playingAtom);
  const [queue, setQueue] = useAtom(queueAtom);
  const setQueueIndex = useSetAtom(queueIndexAtom);

  const [openPicker, setOpenPicker] = useState(false);

  const playNow = () => {
    const q = Array.isArray(list) && list.length ? list : [song];
    const i = Number.isInteger(index) ? index : 0;
    setQueue(q);
    setQueueIndex(i);
    setCurrent(q[i]);
    setPlaying(true);
  };

  // ➕ thêm vào queue (cuối hàng đợi)
  const addToQueue = () => {
    if (!song) return;
    setQueue([...queue, song]);
    toast.success("Đã thêm vào hàng đợi");
  };

  // Remove khỏi 1 playlist (nếu đang ở trang playlist)
  const removeFromPlaylist = async () => {
    try {
      const songId = song?._id ?? song?.id;
      if (!songId || !playlistId) return;
      await api.post("/playlists/remove", { playlistId, songId });
      onChanged && onChanged();
    } catch (err) {
      if (err?.response?.status === 401)
        toast.error("Bạn cần đăng nhập trước.");
      else {
        console.error(err);
        toast.error("Xoá khỏi playlist thất bại.");
      }
    }
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      {song.coverUrl && (
        <img
          src={song.coverUrl}
          alt={song.title}
          style={{
            width: "100%",
            aspectRatio: "1/1",
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      )}
      <div style={{ marginTop: 8, fontWeight: 600 }}>{song.title}</div>
      <div style={{ opacity: 0.7 }}>{song.artist}</div>
      {/* nếu có số lượt nghe thì hiển thị */}
      {Number.isFinite(+song.plays) && (
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
          {song.plays} lượt nghe
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button onClick={playNow}>▶ Phát</button>
        <button onClick={addToQueue}>＋ Queue</button>
        <button onClick={() => setOpenPicker(true)}>＋ Playlist…</button>

        {onDelete && (
          <button onClick={() => onDelete(song._id || song.id)}>🗑️ Xoá</button>
        )}

        {!onDelete && playlistId ? (
          <button onClick={removeFromPlaylist}>− Remove</button>
        ) : null}
      </div>

      {/* Pop-up chọn playlist, cho phép tick nhiều lựa chọn */}
      <PlaylistPicker
        open={openPicker}
        onClose={() => setOpenPicker(false)}
        songId={song?._id || song?.id}
        onDone={onChanged}
      />
    </div>
  );
}
