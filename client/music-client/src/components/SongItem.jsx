import { useAtom, useSetAtom } from "jotai";
import {
  currentTrackAtom,
  playingAtom,
  queueAtom,
  queueIndexAtom,
} from "./playerState";
import { api } from "../api";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import PlaylistPicker from "./PlaylistPicker";
import LyricsModal from "./LyricsModal";
import LyricsEditor from "./LyricsEditor";

export default function SongItem({
  song,
  list,
  index,
  playlistId,
  onChanged,
  onDelete,
  compact = false, // 👉 true = UI gọn theo góp ý
}) {
  const setCurrent = useSetAtom(currentTrackAtom);
  const setPlaying = useSetAtom(playingAtom);
  const [queue, setQueue] = useAtom(queueAtom);
  const setQueueIndex = useSetAtom(queueIndexAtom);

  const [openPicker, setOpenPicker] = useState(false);
  const [openLyrics, setOpenLyrics] = useState(false);
  const [openLyricsEditor, setOpenLyricsEditor] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const playNow = () => {
    const q = Array.isArray(list) && list.length ? list : [song];
    const i = Number.isInteger(index) ? index : 0;
    setQueue(q);
    setQueueIndex(i);
    setCurrent(q[i]);
    setPlaying(true);
  };

  const addToQueue = () => {
    if (!song) return;
    setQueue([...queue, song]);
    toast.success("Đã thêm vào hàng đợi");
  };

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

  // === CARD UI ===
  if (compact) {
    return (
      <div className="song-card">
        <div className="cover-wrap" onClick={playNow}>
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} />
          ) : (
            <div className="cover-fallback" />
          )}

          {/* Play overlay (hover) */}
          <button className="play-overlay" title="Phát">
            ▶
          </button>

          {/* Kebab menu (hover) */}
          <div
            className="kebab"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            ⋯
          </div>

          {menuOpen && (
            <div
              className="menu"
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={addToQueue}>＋ Thêm vào queue</button>
              <button onClick={() => setOpenPicker(true)}>
                ＋ Thêm vào playlist…
              </button>
              <button onClick={() => setOpenLyrics(true)}>🎼 Xem lời</button>
              <button onClick={() => setOpenLyricsEditor(true)}>
                📝 Sửa lời…
              </button>
              {onDelete && (
                <button onClick={() => onDelete(song._id || song.id)}>
                  🗑️ Xoá
                </button>
              )}
              {!onDelete && playlistId ? (
                <button onClick={removeFromPlaylist}>− Gỡ khỏi playlist</button>
              ) : null}
            </div>
          )}
        </div>

        <div className="meta">
          <div className="title" title={song.title}>
            {song.title}
          </div>
          <div className="artist" title={song.artist}>
            {song.artist}
          </div>
          {/* {Number.isFinite(+song.plays) && (
            <div className="plays">{song.plays} lượt nghe</div>
          )} */}
        </div>

        {/* Popups */}
        <PlaylistPicker
          open={openPicker}
          onClose={() => setOpenPicker(false)}
          songId={song?._id || song?.id}
          onDone={onChanged}
        />
        <LyricsModal
          open={openLyrics}
          onClose={() => setOpenLyrics(false)}
          song={song}
        />
        <LyricsEditor
          open={openLyricsEditor}
          onClose={() => setOpenLyricsEditor(false)}
          songId={song?._id || song?.id}
          onSaved={onChanged}
        />
      </div>
    );
  }

  // === phiên bản cũ (nếu cần dùng nơi khác) ===
  return (
    <div className="card" style={{ borderRadius: 12, padding: 12 }}>
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
      <div style={{ marginTop: 8, fontWeight: 700 }}>{song.title}</div>
      <div style={{ opacity: 0.7 }}>{song.artist}</div>
      {/* {Number.isFinite(+song.plays) && (
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
          {song.plays} lượt nghe
        </div>
      )} */}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button onClick={playNow}>▶ Phát</button>
        <button onClick={addToQueue}>＋ Queue</button>
        <button onClick={() => setOpenPicker(true)}>＋ Playlist…</button>
        <button onClick={() => setOpenLyrics(true)}>🎼 Lyrics</button>
        <button onClick={() => setOpenLyricsEditor(true)}>📝 Lời…</button>
        {onDelete && (
          <button onClick={() => onDelete(song._id || song.id)}>🗑️ Xoá</button>
        )}
        {!onDelete && playlistId ? (
          <button onClick={removeFromPlaylist}>− Remove</button>
        ) : null}
      </div>

      <PlaylistPicker
        open={openPicker}
        onClose={() => setOpenPicker(false)}
        songId={song?._id || song?.id}
        onDone={onChanged}
      />
      <LyricsModal
        open={openLyrics}
        onClose={() => setOpenLyrics(false)}
        song={song}
      />
      <LyricsEditor
        open={openLyricsEditor}
        onClose={() => setOpenLyricsEditor(false)}
        songId={song?._id || song?.id}
        onSaved={onChanged}
      />
    </div>
  );
}
