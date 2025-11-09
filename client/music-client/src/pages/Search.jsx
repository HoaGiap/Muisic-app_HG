// client/src/pages/Search.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchSongs, searchArtists, searchAlbums } from "../api";
import SongItem from "../components/SongItem.jsx";

/* ======= Small UI helpers (reuse Home styles) ======= */
const Section = ({ title, count, children }) => (
  <section style={{ margin: "28px 0" }}>
    <h3
      style={{
        margin: "0 0 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 800 }}>{title}</span>
      {Number.isFinite(count) ? (
        <small style={{ opacity: 0.6 }}>({count})</small>
      ) : null}
    </h3>
    {children}
  </section>
);

/** Nghệ sĩ (tile tròn, click qua chi tiết) */
function ArtistTile({ artist }) {
  const href = artist?._id
    ? `/artist/${artist._id}`
    : `/artist/${encodeURIComponent(artist?.name || "")}`;

  return (
    <Link
      to={href}
      style={{ textDecoration: "none", color: "inherit" }}
      title={artist?.name}
    >
      <div className="card tile circle">
        <div
          className="tile-cover circle"
          style={{
            backgroundImage: `url(${artist?.avatarUrl || "/logosite.png"})`,
          }}
        />
        <div style={{ fontWeight: 700, textAlign: "center" }}>
          {artist?.name}
        </div>
      </div>
    </Link>
  );
}

/** Album (tile vuông, click qua chi tiết) */
function AlbumTile({ album }) {
  const href = album?._id
    ? `/album/${album._id}`
    : `/album/${encodeURIComponent(album?.title || "")}`;

  return (
    <Link
      to={href}
      style={{ textDecoration: "none", color: "inherit" }}
      title={album?.title}
    >
      <div className="card tile">
        <div
          className="tile-cover"
          style={{
            backgroundImage: `url(${album?.coverUrl || "/logosite.png"})`,
          }}
        />
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontWeight: 700, lineHeight: 1.25 }}>
            {album?.title}
          </div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            {album?.artistName || album?.artist || ""}
            {album?.releaseDate
              ? ` • ${new Date(album.releaseDate).getFullYear()}`
              : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = useMemo(() => searchParams.get("q") || "", [searchParams]);

  const [q, setQ] = useState(initialQ);
  const [loading, setLoading] = useState(false);

  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);

  // Đồng bộ khi điều hướng có ?q=
  useEffect(() => setQ(initialQ), [initialQ]);

  // Debounce tìm kiếm
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const s = q.trim();
      if (!s) {
        setSongs([]);
        setArtists([]);
        setAlbums([]);
        return;
      }
      setLoading(true);
      try {
        const [sRs, aRs, alRs] = await Promise.all([
          searchSongs({ q: s, limit: 30 }),
          searchArtists(s, 24),
          searchAlbums(s, 24),
        ]);
        if (!cancelled) {
          setSongs(Array.isArray(sRs) ? sRs : []);
          setArtists(Array.isArray(aRs) ? aRs : []);
          setAlbums(Array.isArray(alRs) ? alRs : []);
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

  const nothing =
    q.trim() && !loading && songs.length + artists.length + albums.length === 0;

  const commitToUrl = () => {
    const s = q.trim();
    setSearchParams(s ? { q: s } : {});
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800 }}>
        Tìm kiếm
      </h2>

      <div
        style={{
          display: "flex",
          gap: 8,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 10,
          maxWidth: 640,
          marginBottom: 24,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commitToUrl()}
          placeholder="Nhập tên bài hát, nghệ sĩ hoặc album…"
          aria-label="Tìm kiếm"
          style={{ flex: 1, borderRadius: 10 }}
        />
        <button className="icon-only" onClick={commitToUrl} title="Tìm">
          🔎
        </button>
      </div>

      {loading && <p>Đang tìm…</p>}
      {nothing && <p>Không tìm thấy kết quả.</p>}

      {/* Nghệ sĩ */}
      {artists.length > 0 && (
        <Section title="Nghệ sĩ" count={artists.length}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: 18,
            }}
          >
            {artists.map((a) => (
              <ArtistTile key={a._id || a.id} artist={a} />
            ))}
          </div>
        </Section>
      )}

      {/* Album */}
      {albums.length > 0 && (
        <Section title="Album" count={albums.length}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 18,
            }}
          >
            {albums.map((al) => (
              <AlbumTile key={al._id || al.id} album={al} />
            ))}
          </div>
        </Section>
      )}

      {/* Bài hát */}
      {songs.length > 0 && (
        <Section title="Bài hát" count={songs.length}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            {songs.map((s, i) => (
              <SongItem
                key={s._id ?? s.id ?? s.audioUrl ?? `${s.title}-${i}`}
                song={s}
                list={songs}
                index={i}
                compact
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
