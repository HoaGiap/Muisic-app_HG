// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";
import usePlayerQueue from "../hooks/usePlayerQueue";
import { Link, useNavigate } from "react-router-dom";
import { HorizontalScroller } from "../components/HorizontalScroller.jsx";

/* ---------- Section & Grid ---------- */
const Section = ({ title, children, action }) => (
  <section style={{ margin: "36px 0" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const Grid = ({ children, min = 200, gap = 16 }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
      gap,
    }}
  >
    {children}
  </div>
);

/* ---------- Tiles ---------- */
const Tile = ({ title, subtitle, image }) => (
  <div className="card tile">
    <div
      className="tile-cover"
      style={{ backgroundImage: image ? `url(${image})` : "none" }}
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

const CircleTile = ({ title, image }) => (
  <div className="card tile circle">
    <div
      className="tile-cover circle"
      style={{ backgroundImage: image ? `url(${image})` : "none" }}
    />
    <div style={{ fontWeight: 700, textAlign: "center" }}>{title}</div>
  </div>
);

/* ---------- Page ---------- */
export default function Home() {
  const [data, setData] = useState({
    trending: { title: "Bài hát thịnh hành", items: [] },
    artists: { title: "Nghệ sĩ phổ biến", items: [] },
    albums: { title: "Album & Đĩa đơn nổi tiếng", items: [] },
    radios: { title: "Radio phổ biến", items: [] },
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const { replaceQueue, playListFrom } = usePlayerQueue();
  const navigate = useNavigate();

  // Search state
  const [q, setQ] = useState("");
  const goSearch = () => {
    const s = q.trim();
    if (!s) return;
    navigate(`/search?q=${encodeURIComponent(s)}`);
  };

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
        if (mounted) {
          setErr(e?.response?.data?.error || e.message || "Lỗi tải dữ liệu");
          // Fallback phần Trending
          try {
            const { data: list } = await api.get("/songs", {
              params: { sort: "popular", page: 1, limit: 24 },
            });
            const items = Array.isArray(list) ? list : list.items ?? [];
            setData((d) => ({ ...d, trending: { ...d.trending, items } }));
          } catch {}
        }
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { trending, artists, albums, radios } = data;

  const playAllTrending = () => {
    const list = trending.items || [];
    if (!list.length) return;
    replaceQueue(list, { startIndex: 0, playNow: true });
  };
  const playTrendingFrom = (startIndex) => {
    const list = trending.items || [];
    if (!list.length) return;
    playListFrom(list, startIndex);
  };

  // Bước cuộn mỗi lần (~70% chiều rộng viewport, min 480, max 900)
  const scrollStep =
    typeof window !== "undefined"
      ? Math.round(Math.min(900, Math.max(480, window.innerWidth * 0.7)))
      : 600;

  return (
    <div
      className="home-container"
      style={{ padding: "24px clamp(16px,4vw,40px) 36px" }}
    >
      {/* 🔎 Thanh tìm kiếm tối giản */}
      <div
        style={{
          display: "flex",
          gap: 8,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 10,
          maxWidth: 640,
          marginBottom: 32,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && goSearch()}
          placeholder="Tìm bài hát, nghệ sĩ, album…"
          style={{ flex: 1, borderRadius: 10 }}
          aria-label="Tìm kiếm"
        />
        <button
          onClick={goSearch}
          className="icon-only"
          aria-label="Tìm kiếm"
          title="Tìm kiếm"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <circle
              cx="11"
              cy="11"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Trending */}
      <Section
        title={trending.title || "Bài hát thịnh hành"}
        action={
          trending.items?.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ opacity: 0.7, fontSize: 13 }}>
                {trending.items.length} bài
              </span>
              <button
                onClick={playAllTrending}
                className="pill-strong"
                title="Phát tất cả"
              >
                ▶ Phát tất cả
              </button>
            </div>
          ) : null
        }
      >
        {loading && <p>Đang tải…</p>}
        {err && <p className="text-warn">{err}</p>}
        {!loading && trending.items?.length === 0 && <p>(Chưa có dữ liệu)</p>}

        {/* 2 hàng + cuộn ngang bằng nút */}
        <HorizontalScroller className="row-scroller" step={scrollStep}>
          {(trending.items || []).map((s, i) => (
            <SongItem
              key={s._id || s.id || i}
              song={s}
              list={trending.items}
              index={i}
              compact
            />
          ))}
        </HorizontalScroller>
      </Section>

      {/* Artists */}
      <Section title={artists.title || "Nghệ sĩ phổ biến"}>
        {loading && <p>Đang tải…</p>}
        {!loading && artists.items?.length === 0 && <p>(Chưa có dữ liệu)</p>}

        {/* 2 hàng + cuộn ngang với thẻ Nghệ sĩ (tròn) */}
        <HorizontalScroller className="row-scroller" step={scrollStep}>
          {(artists.items || []).map((a, i) => {
            const href = a._id
              ? `/artist/${a._id}`
              : `/artist/${encodeURIComponent(a.name || a.title || "")}`;
            return (
              <Link
                key={a._id || a.id || i}
                to={href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <CircleTile
                  title={a.name || a.title || "Nghệ sĩ"}
                  image={a.avatarUrl || a.image || ""}
                />
              </Link>
            );
          })}
        </HorizontalScroller>
      </Section>

      {/* Albums */}
      <Section title={albums.title || "Album & Đĩa đơn nổi tiếng"}>
        {loading && <p>Đang tải…</p>}
        {!loading && albums.items?.length === 0 && <p>(Chưa có dữ liệu)</p>}

        {/* 2 hàng + cuộn ngang với thẻ Album (vuông) */}
        <HorizontalScroller className="row-scroller" step={scrollStep}>
          {(albums.items || []).map((al, i) => (
            <Link
              key={al._id || al.id || i}
              to={
                al._id
                  ? `/album/${al._id}`
                  : `/album/${encodeURIComponent(al.title || al.name || "")}`
              }
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Tile
                title={al.title || al.name || "Album"}
                subtitle={al.artistName || al.artist || ""}
                image={al.coverUrl || al.image || ""}
              />
            </Link>
          ))}
        </HorizontalScroller>
      </Section>

      {/* Radios (giữ dạng lưới cũ hoặc bạn có thể chuyển qua scroller tương tự nếu muốn) */}
      <Section title={radios.title || "Radio phổ biến"}>
        {loading && <p>Đang tải…</p>}
        {!loading && radios.items?.length === 0 && <p>(Chưa có dữ liệu)</p>}
        <Grid min={200} gap={18}>
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
