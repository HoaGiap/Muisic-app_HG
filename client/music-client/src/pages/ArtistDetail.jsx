// src/pages/ArtistDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getArtistDetail as fetchArtistDetail,
  getMyFollowingArtists,
  followArtist,
  unfollowArtist,
} from "../api";
import usePlayerQueue from "../hooks/usePlayerQueue";
import { HorizontalScroller } from "../components/HorizontalScroller.jsx";
import { getAuth } from "firebase/auth";

export default function ArtistDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const { replaceQueue } = usePlayerQueue();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    setError("");
    setData(null);

    (async () => {
      try {
        const raw = await fetchArtistDetail(id); // kỳ vọng { artist, albums, songs }
        if (!alive) return;

        const artist = raw?.artist || raw || {};
        const albums = raw?.albums || [];
        const songs = raw?.songs || [];

        setData({ artist, albums, songs });
        setFollowers(artist?.followerCount ?? 0);

        // Chỉ gọi /me/following/artists nếu có user đăng nhập
        const u = getAuth().currentUser;
        if (u && artist?._id) {
          const ids = await getMyFollowingArtists().catch(() => []);
          if (!alive) return;
          setFollowing(ids.includes(String(artist._id)));
        } else {
          setFollowing(false);
        }
      } catch (e) {
        if (alive)
          setError(
            e?.response?.data?.message || e.message || "Lỗi tải nghệ sĩ"
          );
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const artist = data?.artist || {};
  const albums = data?.albums || [];
  const songs = data?.songs || [];

  const topSongs = useMemo(
    () => (showAll ? songs : songs.slice(0, 10)),
    [songs, showAll]
  );

  if (error)
    return <div style={{ color: "crimson", padding: 24 }}>{error}</div>;
  if (!data) return <div style={{ padding: 24 }}>Đang tải…</div>;

  const banner =
    artist.bannerUrl || artist.coverUrl || artist.avatarUrl || "/logosite.png";

  const handlePlayAll = () => {
    if (!songs.length) return;
    replaceQueue(songs, { startIndex: 0, playNow: true });
  };

  const toggleFollow = async () => {
    try {
      if (following) {
        setFollowing(false);
        setFollowers((v) => Math.max(0, v - 1));
        await unfollowArtist(artist._id);
      } else {
        setFollowing(true);
        setFollowers((v) => v + 1);
        await followArtist(artist._id);
      }
    } catch (e) {
      console.error(e);
      // rollback
      setFollowing((v) => !v);
      setFollowers((v) => (following ? v + 1 : Math.max(0, v - 1)));
    }
  };

  const playFromIndex = (idx) => {
    if (!songs.length) return;
    replaceQueue(songs, { startIndex: idx, playNow: true });
  };

  // bước cuộn cho album (responsive)
  const step =
    typeof window !== "undefined"
      ? Math.round(Math.min(900, Math.max(480, window.innerWidth * 0.7)))
      : 600;

  return (
    <div style={{ padding: "0 var(--page-x)" }}>
      {/* ===== HERO ===== */}
      <section className="artist-hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${banner})` }}
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <img
            className="hero-avatar"
            src={artist.avatarUrl || "/logosite.png"}
            alt={artist.name}
          />
          <div className="hero-meta">
            <h1 className="hero-name">{artist.name || "Nghệ sĩ"}</h1>
            <div className="hero-sub">
              {Number(followers).toLocaleString()} người theo dõi
            </div>
            <div className="hero-actions">
              <button className="pill-strong" onClick={handlePlayAll}>
                ▶ Phát tất cả
              </button>
              <button
                className={`pill${following ? " is-following" : ""}`}
                onClick={toggleFollow}
                title={following ? "Bỏ theo dõi" : "Theo dõi"}
                style={{ marginLeft: 8 }}
              >
                {following ? "Đang theo dõi" : "Theo dõi"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== POPULAR SONGS (TABLE) ===== */}
      <section style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 10 }}>Bài hát nổi bật</h2>

        {topSongs.length ? (
          <div className="songs-table-wrap">
            <table className="songs-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "right" }}>#</th>
                  <th>Tiêu đề</th>
                  <th style={{ minWidth: 160 }}>Album</th>
                  <th style={{ width: 80, textAlign: "right" }}>🕓</th>
                </tr>
              </thead>
              <tbody>
                {topSongs.map((s, idx) => (
                  <tr
                    key={s._id || s.id || idx}
                    className="song-row"
                    onDoubleClick={() => playFromIndex(idx)}
                  >
                    <td className="c" style={{ textAlign: "right" }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div className="cell-title">
                        <img
                          src={s.coverUrl || "/logosite.png"}
                          alt=""
                          className="cell-cover"
                        />
                        <div className="cell-txt">
                          <div className="t">{s.title}</div>
                          <div className="a">{artist.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="cell-album">
                      {s.albumId ? (
                        <Link to={`/album/${s.albumId}`}>
                          {s.albumTitle || "Album"}
                        </Link>
                      ) : (
                        <span style={{ opacity: 0.7 }}>—</span>
                      )}
                    </td>
                    <td className="c" style={{ textAlign: "right" }}>
                      {formatDuration(s.duration || s.durationSec)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {songs.length > 10 && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  className="pill"
                  onClick={() => setShowAll((v) => !v)}
                  style={{ marginTop: 10 }}
                >
                  {showAll ? "Thu gọn" : "Xem thêm"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ opacity: 0.7 }}>(Chưa có bài hát)</div>
        )}
      </section>

      {/* ===== ALBUMS (SCROLLER) ===== */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ marginBottom: 10 }}>Album</h2>

        {albums.length ? (
          <HorizontalScroller className="row-scroller" step={step}>
            {albums.map((a, i) => (
              <Link
                key={a._id || a.id || i}
                to={`/album/${a._id || a.id}`}
                className="al-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="al-cover">
                  <img
                    src={a.coverUrl || "/logosite.png"}
                    alt={a.title}
                    loading="lazy"
                  />
                </div>
                <div className="al-meta">
                  <div className="al-title">{a.title}</div>
                  <div className="al-sub">
                    {a.releaseDate ? new Date(a.releaseDate).getFullYear() : ""}
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalScroller>
        ) : (
          <div style={{ opacity: 0.7 }}>(Chưa có album)</div>
        )}
      </section>
    </div>
  );
}

function formatDuration(sec) {
  if (!sec && sec !== 0) return "";
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}
