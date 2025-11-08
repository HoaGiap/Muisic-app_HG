// client/src/pages/Search.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom"; // ⬅️ thêm
import { searchSongs, searchArtists, searchAlbums } from "../api";
import SongItem from "../components/SongItem.jsx";

function ArtistCard({ artist }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 10,
        background: "#fff",
      }}
    >
      <img
        src={artist.avatarUrl || "/logosite.png"}
        alt=""
        width={48}
        height={48}
        style={{ borderRadius: 8, objectFit: "cover" }}
      />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontWeight: 700 }}>{artist.name}</div>
        <small style={{ opacity: 0.7 }}>
          {(artist.followerCount ?? 0).toLocaleString()} theo dõi
        </small>
      </div>
    </div>
  );
}

function AlbumCard({ album }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 10,
        background: "#fff",
      }}
    >
      <img
        src={album.coverUrl || "/logosite.png"}
        alt=""
        width={48}
        height={48}
        style={{ borderRadius: 8, objectFit: "cover" }}
      />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontWeight: 700 }}>{album.title}</div>
        <small style={{ opacity: 0.7 }}>
          {album.artist || album.artistName || ""}{" "}
          {album.releaseDate
            ? `• ${new Date(album.releaseDate).getFullYear()}`
            : ""}
        </small>
      </div>
    </div>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams(); // ⬅️ thêm
  const initialQ = useMemo(() => searchParams.get("q") || "", [searchParams]); // ⬅️ thêm

  const [q, setQ] = useState(initialQ);
  const [loading, setLoading] = useState(false);

  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);

  // đồng bộ khi URL ?q= thay đổi (đi từ Home sang)
  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  // Debounce & fetch 3 nguồn dữ liệu
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setSongs([]);
        setArtists([]);
        setAlbums([]);
        return;
      }
      setLoading(true);
      try {
        const [sRs, aRs, alRs] = await Promise.all([
          searchSongs({ q, limit: 30 }),
          searchArtists(q, 12),
          searchAlbums(q, 18),
        ]);
        if (!cancelled) {
          setSongs(sRs || []);
          setArtists(aRs || []);
          setAlbums(alRs || []);
        }
      } finally {
        !cancelled && setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const nothing = useMemo(
    () => q && !loading && songs.length + artists.length + albums.length === 0,
    [q, loading, songs.length, artists.length, albums.length]
  );

  // Tuỳ chọn: nhấn Enter để cập nhật lại URL (?q=…) cho đồng nhất
  const commitToUrl = () => {
    const s = q.trim();
    setSearchParams(s ? { q: s } : {});
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Tìm kiếm</h2>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commitToUrl()} // ⬅️ giữ UI, thêm Enter sync URL
        placeholder="Nhập tên bài hát, nghệ sĩ hoặc album…"
        style={{
          padding: 8,
          width: "100%",
          maxWidth: 520,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      />

      {loading && <p>Đang tìm…</p>}
      {nothing && <p>Không tìm thấy kết quả.</p>}

      {/* Nghệ sĩ */}
      {artists.length > 0 && (
        <section>
          <h3 style={{ margin: "4px 0 10px" }}>
            Nghệ sĩ <small style={{ opacity: 0.6 }}>({artists.length})</small>
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 12,
            }}
          >
            {artists.map((a) => (
              <ArtistCard key={a._id} artist={a} />
            ))}
          </div>
        </section>
      )}

      {/* Album */}
      {albums.length > 0 && (
        <section>
          <h3 style={{ margin: "14px 0 10px" }}>
            Album <small style={{ opacity: 0.6 }}>({albums.length})</small>
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 12,
            }}
          >
            {albums.map((al) => (
              <AlbumCard key={al._id} album={al} />
            ))}
          </div>
        </section>
      )}

      {/* Bài hát */}
      {songs.length > 0 && (
        <section>
          <h3 style={{ margin: "14px 0 10px" }}>
            Bài hát <small style={{ opacity: 0.6 }}>({songs.length})</small>
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 12,
            }}
          >
            {songs.map((s, i) => (
              <SongItem
                key={s._id ?? s.id ?? s.audioUrl ?? `${s.title}-${i}`}
                song={s}
                list={songs}
                index={i}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
