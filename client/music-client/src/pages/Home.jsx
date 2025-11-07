import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";
import usePlayerQueue from "../hooks/usePlayerQueue";
import { Link } from "react-router-dom";

/**
 * Backend trả từ GET /home
 * {
 *   trending: { title, items: Song[] },
 *   artists:  { title, items: Artist[] },
 *   albums:   { title, items: Album[] },
 *   radios:   { title, items: Radio[] }
 * }
 */

const Section = ({ title, children, action }) => (
  <section style={{ margin: "24px 0" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const Grid = ({ children, min = 180 }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
      gap: 14,
    }}
  >
    {children}
  </div>
);

// Ô vuông (Album / Radio)
const Tile = ({ title, subtitle, image }) => (
  <div
    style={{
      borderRadius: 14,
      padding: 12,
      background: "var(--panel, #fff)",
      border: "1px solid var(--border, rgba(0,0,0,.08))",
      display: "grid",
      gap: 10,
      transition: "transform .12s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
  >
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: 12,
        background: "#ddd",
        backgroundImage: image ? `url(${image})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
      {subtitle ? (
        <div style={{ opacity: 0.7, fontSize: 13, lineHeight: 1.3 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  </div>
);

// Ô tròn (Nghệ sĩ)
const CircleTile = ({ title, image }) => (
  <div
    style={{
      borderRadius: 14,
      padding: 12,
      background: "var(--panel, #fff)",
      border: "1px solid var(--border, rgba(0,0,0,.08))",
      display: "grid",
      gap: 10,
      justifyItems: "center",
      transition: "transform .12s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
  >
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: "999px",
        background: "#ddd",
        backgroundImage: image ? `url(${image})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
    <div style={{ fontWeight: 700, textAlign: "center" }}>{title}</div>
  </div>
);

export default function Home() {
  const [data, setData] = useState({
    trending: { title: "Bài hát thịnh hành", items: [] },
    artists: { title: "Nghệ sĩ phổ biến", items: [] },
    albums: { title: "Album & Đĩa đơn nổi tiếng", items: [] },
    radios: { title: "Radio phổ biến", items: [] },
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Hook hàng đợi
  const { replaceQueue, playListFrom } = usePlayerQueue();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data: payload } = await api.get("/home");
        const safe = payload && typeof payload === "object" ? payload : {};
        const out = {
          trending: safe.trending ?? { title: "Bài hát thịnh hành", items: [] },
          artists: safe.artists ?? { title: "Nghệ sĩ phổ biến", items: [] },
          albums: safe.albums ?? {
            title: "Album & Đĩa đơn nổi tiếng",
            items: [],
          },
          radios: safe.radios ?? { title: "Radio phổ biến", items: [] },
        };
        if (mounted) setData(out);
      } catch (e) {
        console.error(e);
        if (mounted) {
          setErr(e?.response?.data?.error || e.message || "Lỗi tải dữ liệu");
          try {
            const { data: list } = await api.get("/songs", {
              params: { sort: "popular", page: 1, limit: 24 },
            });
            const items = Array.isArray(list) ? list : list.items ?? [];
            setData((d) => ({ ...d, trending: { ...d.trending, items } }));
          } catch {}
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { trending, artists, albums, radios } = data;

  // ▶ Phát tất cả Trending (thay queue và play từ 0)
  const playAllTrending = () => {
    const list = trending.items || [];
    if (!list.length) return;
    replaceQueue(list, { startIndex: 0, playNow: true });
  };

  // ▶ Phát list trending từ một index
  const playTrendingFrom = (startIndex) => {
    const list = trending.items || [];
    if (!list.length) return;
    playListFrom(list, startIndex);
  };

  return (
    <div style={{ display: "grid", gap: 28 }}>
      {/* Trending songs */}
      <Section
        title={trending.title || "Bài hát thịnh hành"}
        action={
          trending.items?.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ opacity: 0.7, fontSize: 13 }}>
                {trending.items.length} bài
              </span>
              <button
                onClick={playAllTrending}
                style={{
                  height: 32,
                  border: 0,
                  padding: "0 12px",
                  borderRadius: 10,
                  fontWeight: 800,
                  background: "var(--accent, #22c55e)",
                  color: "#000",
                  cursor: "pointer",
                }}
                title="Phát tất cả"
              >
                ▶ Phát tất cả
              </button>
            </div>
          ) : null
        }
      >
        {loading && <p>Đang tải…</p>}
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        {!loading && trending.items?.length === 0 && <p>(Chưa có dữ liệu)</p>}

        <Grid min={220}>
          {(trending.items || []).map((s, i) => (
            <SongItem
              key={s._id || s.id || i}
              song={s}
              list={trending.items}
              index={i}
              onPlayListFrom={() => playTrendingFrom(i)}
            />
          ))}
        </Grid>
      </Section>

      {/* Artists */}
      <Section title={artists.title || "Nghệ sĩ phổ biến"}>
        {loading && <p>Đang tải…</p>}
        {!loading && artists.items?.length === 0 && <p>(Chưa có dữ liệu)</p>}
        <Grid min={160}>
          {(artists.items || []).map((a, i) => {
            const href = a._id
              ? `/artist/${a._id}`
              : `/artist/${encodeURIComponent(a.name || a.title || "")}`;
            return (
              <Link
                key={a._id || a.id || i}
                to={href}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <CircleTile
                  title={a.name || a.title || "Nghệ sĩ"}
                  image={a.avatarUrl || a.image || ""}
                />
              </Link>
            );
          })}
        </Grid>
      </Section>

      {/* Albums */}
      <Section title={albums.title || "Album & Đĩa đơn nổi tiếng"}>
        {loading && <p>Đang tải…</p>}
        {!loading && albums.items?.length === 0 && <p>(Chưa có dữ liệu)</p>}
        <Grid min={180}>
          {(albums.items || []).map((al, i) => (
            <Link
              key={al._id || al.id || i}
              to={
                al._id
                  ? `/album/${al._id}`
                  : `/album/${encodeURIComponent(al.title || al.name || "")}`
              }
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <Tile
                title={al.title || al.name || "Album"}
                subtitle={al.artistName || al.artist || ""}
                image={al.coverUrl || al.image || ""}
              />
            </Link>
          ))}
        </Grid>
      </Section>

      {/* Radios */}
      <Section title={radios.title || "Radio phổ biến"}>
        {loading && <p>Đang tải…</p>}
        {!loading && radios.items?.length === 0 && <p>(Chưa có dữ liệu)</p>}
        <Grid min={180}>
          {(radios.items || []).map((r, i) => (
            <Tile
              key={r._id || r.id || i}
              title={r.title || "Radio"}
              subtitle={r.description || ""}
              image={r.coverUrl || r.image || ""}
            />
          ))}
        </Grid>
      </Section>
    </div>
  );
}
