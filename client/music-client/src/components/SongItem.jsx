import { useSetAtom } from "jotai";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
} from "./playerState";
import { api } from "../api";

// Tìm hoặc tạo playlist Favorites (server suy ra user từ token)
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

/**
 * props:
 *  - song: object bài hát
 *  - list, index: danh sách hiện tại & vị trí -> để phát liên tục
 *  - playlistId: nếu đang render trong 1 playlist -> hiện nút "− Remove"
 *  - onChanged: callback reload sau khi add/remove/delete
 *  - onDelete:  (tùy chọn)
 *      * boolean true -> hiện nút Xoá và tự gọi API DELETE
 *      * function (songId) -> tự xử lý xoá ở ngoài (ví dụ gọi load trang)
 */
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
      if (!sid) return alert("Không tìm thấy songId hợp lệ.");
      await api.post("/playlists/add", { playlistId: fav._id, songId: sid });
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
      if (!sid || !playlistId) return;
      await api.post("/playlists/remove", { playlistId, songId: sid });
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

  const deleteSongHere = async () => {
    try {
      if (!sid) return;
      if (!confirm("Xoá bài hát này?")) return;
      await api.delete(`/songs/${sid}`);
      onChanged && onChanged();
    } catch (err) {
      if (err?.response?.status === 401) {
        alert("Bạn cần đăng nhập.");
      } else if (err?.response?.status === 403) {
        alert("Bạn không phải chủ sở hữu bài hát này.");
      } else {
        console.error(err);
        alert("Xoá bài thất bại.");
      }
    }
  };

  // Quy tắc hiển thị nút phụ:
  // 1) Nếu truyền onDelete -> hiện nút 🗑 Xoá
  //    - nếu onDelete là function: gọi function(sid)
  //    - nếu onDelete === true: gọi deleteSongHere()
  // 2) Nếu có playlistId -> hiện nút − Remove
  // 3) Ngược lại -> hiện nút ＋ Favorites
  const renderSecondaryButton = () => {
    if (onDelete) {
      const handle =
        typeof onDelete === "function" ? () => onDelete(sid) : deleteSongHere;
      return <button onClick={handle}>🗑 Xoá</button>;
    }
    if (playlistId) {
      return <button onClick={removeFromPlaylist}>− Remove</button>;
    }
    return <button onClick={addToFavorites}>＋ Favorites</button>;
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
        {renderSecondaryButton()}
      </div>
    </div>
  );
}
