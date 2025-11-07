import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAlbumDetail as fetchAlbumDetail } from "../api"; // ⬅️ alias để tránh trùng
import usePlayerQueue from "../hooks/usePlayerQueue";

export default function AlbumDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const { replaceQueue, playListFrom } = usePlayerQueue();

  useEffect(() => {
    let mounted = true;
    fetchAlbumDetail(id)
      .then((d) => mounted && setData(d))
      .catch(console.error);
    return () => (mounted = false);
  }, [id]);

  if (!data) return <div>Đang tải…</div>;
  const { album, artist, songs } = data;

  const handlePlayAll = () => {
    if (!songs?.length) return;
    replaceQueue(songs);
    playListFrom(0);
  };

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <img
          src={album.coverUrl || "/logosite.png"}
          alt={album.title}
          width={140}
          height={140}
          style={{ objectFit: "cover", borderRadius: 12 }}
        />
        <div>
          <h1 style={{ margin: 0 }}>{album.title}</h1>
          <div style={{ opacity: 0.7, margin: "6px 0" }}>
            Bởi{" "}
            {artist ? (
              <Link to={`/artist/${artist._id}`}>{artist.name}</Link>
            ) : (
              "Không rõ"
            )}
            {album.releaseDate
              ? ` • ${new Date(album.releaseDate).getFullYear()}`
              : ""}
          </div>
          <button onClick={handlePlayAll}>Phát tất cả</button>
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <h2>Danh sách bài hát</h2>
        <ol style={{ padding: 0, margin: 0 }}>
          {songs?.map((s, idx) => (
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
              <span style={{ width: 24, textAlign: "right" }}>{idx + 1}</span>
              <img
                src={s.coverUrl || "/logosite.png"}
                alt=""
                width={44}
                height={44}
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{s.title}</div>
                <div style={{ opacity: 0.7 }}>{artist?.name}</div>
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
        </ol>
      </section>
    </div>
  );
}
