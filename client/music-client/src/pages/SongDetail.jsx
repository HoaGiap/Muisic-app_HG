import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { useSetAtom } from "jotai";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
} from "../components/playerState";
import SongItem from "../components/SongItem.jsx";

export default function SongDetail() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [err, setErr] = useState("");

  const setCurrent = useSetAtom(currentTrackAtom);
  const setPlaying = useSetAtom(playingAtom);
  const setQueue = useSetAtom(queueAtom);
  const setQueueIndex = useSetAtom(queueIndexAtom);

  useEffect(() => {
    api
      .get(`/songs/${id}`)
      .then((r) => setSong(r.data))
      .catch(() => setErr("Không tìm thấy bài hát"));
  }, [id]);

  const playNow = () => {
    if (!song) return;
    setQueue([song]);
    setQueueIndex(0);
    setCurrent(song);
    setPlaying(true);
  };

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!song) return <p>Đang tải…</p>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 16 }}>
        {song.coverUrl && (
          <img
            src={song.coverUrl}
            alt={song.title}
            style={{
              width: 220,
              height: 220,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
        )}
        <div>
          <h2 style={{ margin: "0 0 8px" }}>{song.title}</h2>
          <div style={{ opacity: 0.7, marginBottom: 12 }}>{song.artist}</div>
          <button onClick={playNow}>▶ Phát bài này</button>
        </div>
      </div>

      {/* Gợi ý: hiển thị lại dạng thẻ để dùng chung nút +Favorites, v.v. */}
      <div>
        <h3>Thông tin</h3>
        <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 8 }}>
          {JSON.stringify({ duration: song.duration, _id: song._id }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
