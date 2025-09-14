// PlaylistThumb.jsx
export default function PlaylistThumb({
  coverUrl,
  songs = [],
  size = 48,
  radius = 8,
}) {
  const box = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: "hidden",
    background: "var(--bg-300, #f2f2f2)",
  };

  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt=""
        style={{ ...box, objectFit: "cover", display: "block" }}
      />
    );
  }

  // fallback lưới 2×2 từ cover của 4 bài đầu
  const covers = (songs || [])
    .slice(0, 4)
    .map((s) => s?.coverUrl)
    .filter(Boolean);
  return (
    <div
      style={{
        ...box,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
      }}
    >
      {[0, 1, 2, 3].map((i) =>
        covers[i] ? (
          <img
            key={i}
            src={covers[i]}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div key={i} style={{ background: "var(--bg-200, #e8e8e8)" }} />
        )
      )}
    </div>
  );
}
