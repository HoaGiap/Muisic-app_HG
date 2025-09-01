import { useSetAtom } from "jotai";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
} from "./playerState";
import { api } from "../api";

// Tìm hoặc tạo playlist Favorites (server dùng uid từ token)
async function getOrCreateFavorites() {
  // KHÔNG gửi userId nữa
  const { data } = await api.get("/playlists");
  let fav = data.find(
    (p) => (p.name || "").trim().toLowerCase() === "favorites"
  );
  if (!fav) {
    const res = await api.post("/playlists", { name: "Favorites" }); // KHÔNG gửi userId
    fav = res.data;
  }
  return fav;
}

// props: song, list (mảng hiện có trên màn), index (vị trí trong list),
//        playlistId (nếu đang render trong 1 playlist), onChanged (reload)
export default function SongItem({ song, list, index, playlistId, onChanged }) {
  const setCurrent = useSetAtom(currentTrackAtom);
  const setPlaying = useSetAtom(playingAtom);
  const setQueue = useSetAtom(queueAtom);
  const setQueueIndex = useSetAtom(queueIndexAtom);

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
      const songId = song?._id ?? song?.id;
      if (!songId) return alert("Không tìm thấy songId hợp lệ.");
      await api.post("/playlists/add", { playlistId: fav._id, songId });
      alert("Đã thêm vào Favorites!");
    } catch (err) {
      if (err?.response?.status === 401) {
        alert(
          "Bạn cần đăng nhập trước (nút Login / Register ở góc phải trên)."
        );
      } else {
        console.error(err);
        alert("Thêm vào Favorites thất bại.");
      }
    }
  };

  const removeFromPlaylist = async () => {
    try {
      const songId = song?._id ?? song?.id;
      if (!songId || !playlistId) return;
      await api.post("/playlists/remove", { playlistId, songId });
      onChanged && onChanged();
    } catch (err) {
      if (err?.response?.status === 401) {
        alert("Bạn cần đăng nhập trước.");
      } else {
        console.error(err);
        alert("Xoá khỏi playlist thất bại.");
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
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={playNow}>▶ Phát</button>
        {playlistId ? (
          <button onClick={removeFromPlaylist}>− Remove</button>
        ) : (
          <button onClick={addToFavorites}>＋ Favorites</button>
        )}
      </div>
    </div>
  );
}
