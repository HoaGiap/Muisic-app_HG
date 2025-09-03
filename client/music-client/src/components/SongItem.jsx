// src/components/SongItem.jsx
import { useSetAtom } from "jotai";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
} from "./playerState";
import { api } from "../api";
import { Link } from "react-router-dom";
import AddToPlaylistButton from "./AddToPlaylistButton.jsx";

// Tìm hoặc tạo playlist Favorites (server dùng uid trong token)
async function getOrCreateFavorites() {
  const { data } = await api.get("/playlists");
  let fav = data.find(
    (p) => (p.name || "").trim().toLowerCase() === "favorites"
  );
  if (!fav) {
    const res = await api.post("/playlists", { name: "Favorites" });
    fav = res.data;
  }
  return fav;
}

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
  const setQueue = useSetAtom(queueAtom);
  const setQueueIndex = useSetAtom(queueIndexAtom);

  const sid = song?._id ?? song?.id;

  const playNow = () => {
    const q = Array.isArray(list) && list.length ? list : [song];
    const i = Number.isInteger(index) ? index : 0;
    setQueue(q);
    setQueueIndex(i);
    setCurrent(q[i]);
    setPlaying(true);
  };

  const addToFavorites = async () => {
    try {
      const fav = await getOrCreateFavorites();
      const songId = sid;
      if (!songId) return alert("Không tìm thấy songId hợp lệ.");
      await api.post("/playlists/add", { playlistId: fav._id, songId });
      alert("Đã thêm vào Favorites!");
    } catch (err) {
      if (err?.response?.status === 401) alert("Bạn cần đăng nhập trước.");
      else {
        console.error(err);
        alert("Thêm vào Favorites thất bại.");
      }
    }
  };

  const removeFromPlaylist = async () => {
    try {
      const songId = sid;
      if (!songId || !playlistId) return;
      await api.post("/playlists/remove", { playlistId, songId });
      onChanged && onChanged();
    } catch (err) {
      if (err?.response?.status === 401) alert("Bạn cần đăng nhập trước.");
      else {
        console.error(err);
        alert("Xoá khỏi playlist thất bại.");
      }
    }
  };

  // Ảnh (nếu có id thì bọc Link; nếu không thì chỉ <img>)
  const Cover = () =>
    song.coverUrl ? (
      sid ? (
        <Link to={`/song/${sid}`} style={{ display: "block" }}>
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
        </Link>
      ) : (
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
      )
    ) : null;

  return (
    <div className="card">
      <Cover />

      <div style={{ marginTop: 8, fontWeight: 600, lineHeight: 1.3 }}>
        {sid ? (
          <Link
            to={`/song/${sid}`}
            style={{ color: "inherit", textDecoration: "none" }}
            title={song.title}
          >
            {song.title}
          </Link>
        ) : (
          song.title
        )}
      </div>

      <div style={{ opacity: 0.7 }}>{song.artist}</div>

      {/* (tuỳ chọn) hiện lượt nghe nếu có */}
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        ▶ {Number(song.plays || 0)} lượt nghe
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button onClick={playNow}>▶ Phát</button>

        {/* Xoá tại trang MyUploads */}
        {onDelete && (
          <button onClick={() => onDelete(sid)} disabled={!sid}>
            🗑️ Xoá
          </button>
        )}

        {/* Xoá khỏi playlist khi đang render trong 1 playlist */}
        {!onDelete && playlistId ? (
          <button onClick={removeFromPlaylist} disabled={!sid}>
            − Remove
          </button>
        ) : null}

        {/* Thêm Favorites ở trang Home/Search */}
        {!onDelete && !playlistId && (
          <>
            <button onClick={addToFavorites} disabled={!sid}>
              ＋ Favorites
            </button>
            <AddToPlaylistButton songId={sid} />
          </>
        )}
      </div>
    </div>
  );
}
