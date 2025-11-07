import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getArtistDetail as fetchArtistDetail,
  getMyFollowingArtists,
  followArtist,
  unfollowArtist,
} from "../api"; // dùng alias + các API follow
import usePlayerQueue from "../hooks/usePlayerQueue";

export default function ArtistDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const { replaceQueue, playListFrom } = usePlayerQueue();

  useEffect(() => {
    let alive = true;
    setError("");
    setData(null);

    (async () => {
      const d = await fetchArtistDetail(id);
      if (!alive) return;
      setData(d);
      setFollowers(d?.artist?.followerCount ?? 0);

      // đồng bộ trạng thái đang theo dõi (nếu đăng nhập và API có token)
      try {
        const ids = await getMyFollowingArtists();
        if (!alive) return;
        setFollowing(ids.includes(String(d.artist._id)));
      } catch {
        // không đăng nhập hoặc thiếu token -> bỏ qua
      }
    })().catch((e) => {
      console.error(e);
      if (alive)
        setError(e?.response?.data?.message || e.message || "Lỗi tải nghệ sĩ");
    });

    return () => {
      alive = false;
    };
  }, [id]);

  if (error)
    return <div style={{ color: "crimson", padding: 24 }}>{error}</div>;
  if (!data) return <div style={{ padding: 24 }}>Đang tải…</div>;

  const { artist, albums, songs } = data;

  const handlePlayAll = () => {
    if (!songs?.length) return;
    replaceQueue(songs);
    playListFrom(0);
  };

  const toggleFollow = async () => {
    try {
      if (following) {
        // optimistic update
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
      // rollback nếu cần
      setFollowing((v) => !v);
      setFollowers((v) => (following ? v + 1 : Math.max(0, v - 1)));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <img
          src={artist.avatarUrl || "/logosite.png"}
          alt={artist.name}
          width={140}
          height={140}
          style={{ objectFit: "cover", borderRadius: 12 }}
        />
        <div>
          <h1 style={{ margin: 0 }}>{artist.name}</h1>
          <div style={{ opacity: 0.7, margin: "6px 0" }}>
            {followers.toLocaleString()} người theo dõi
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePlayAll}>Phát tất cả</button>
            <button onClick={toggleFollow}>
              {following ? "Đang theo dõi" : "Theo dõi"}
            </button>
          </div>
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <h2>Album</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {albums?.length ? (
            albums.map((a) => (
              <Link
                key={a._id}
                to={`/album/${a._id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <img
                  src={a.coverUrl || "/logosite.png"}
                  alt={a.title}
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <div style={{ marginTop: 8, fontWeight: 600 }}>{a.title}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>
                  {a.releaseDate ? new Date(a.releaseDate).getFullYear() : ""}
                </div>
              </Link>
            ))
          ) : (
            <div style={{ opacity: 0.7 }}>(Chưa có album)</div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Bài hát</h2>
        {songs?.length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {songs.map((s, idx) => (
              <li
                key={s._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <img
                  src={s.coverUrl || "/logosite.png"}
                  alt=""
                  width={44}
                  height={44}
                  style={{ borderRadius: 6, objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{s.title}</div>
                  <div style={{ opacity: 0.7 }}>{artist.name}</div>
                </div>
                <button
                  onClick={() => {
                    replaceQueue(songs);
                    playListFrom(idx);
                  }}
                >
                  ▶
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ opacity: 0.7 }}>(Chưa có bài hát)</div>
        )}
      </section>
    </div>
  );
}
