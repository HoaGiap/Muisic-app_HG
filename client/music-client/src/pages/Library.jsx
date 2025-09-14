// src/pages/Library.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import SongItem from "../components/SongItem.jsx";
import PlaylistSidebar from "../components/PlaylistSidebar.jsx";
import PlaylistThumb from "../components/PlaylistThumb.jsx";
import toast from "react-hot-toast";

/* ---------- helpers: cover 2×2 (canvas) ---------- */
async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
function drawCover(ctx, img, dx, dy, dw, dh) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let sx, sy, sw, sh;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}
async function makeMosaicBlob(urls, size = 800) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, size, size);

  const imgs = [];
  for (const u of urls.slice(0, 4)) {
    try {
      if (u) imgs.push(await loadImage(u));
    } catch {}
  }

  const cell = size / 2;
  if (imgs.length === 0) {
    ctx.fillStyle = "#ddd";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#888";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 48px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("No covers", size / 2, size / 2);
  } else {
    for (let i = 0; i < 4; i++) {
      const img = imgs[i];
      if (!img) continue;
      const x = (i % 2) * cell;
      const y = Math.floor(i / 2) * cell;
      drawCover(ctx, img, x, y, cell, cell);
    }
  }
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
  );
}
async function uploadBlobAsImage(blob, filename = "cover.jpg") {
  const f = new File([blob], filename, { type: "image/jpeg" });
  const form = new FormData();
  form.append("file", f);
  const { data } = await api.post("/upload?folder=playlist-covers", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}
/* -------------------------------------------------- */

export default function Library() {
  const [all, setAll] = useState([]); // danh sách playlist cho sidebar
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState(""); // ✅ tên playlist mới

  const selId = selected?._id;
  const songs = selected?.songs || [];

  // lấy tất cả playlist (đã populate bài)
  const loadAll = async () => {
    const r = await api.get("/playlists");
    setAll(r.data || []);
    setSelected((cur) => (cur ? cur : r.data?.[0] || null));
  };

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, []);

  const handleSelect = (p) => setSelected(p);

  // --- TẠO PLAYLIST MỚI ---
  const createPlaylist = async () => {
    const n = (newName || "").trim();
    if (!n) return toast.error("Nhập tên playlist");
    const dup = all.some(
      (p) => (p.name || "").trim().toLowerCase() === n.toLowerCase()
    );
    if (dup) return toast.error("Tên playlist đã tồn tại");

    try {
      const r = await api.post("/playlists", { name: n });
      // cập nhật local: đưa lên đầu, chọn ngay
      setAll((ls) => [r.data, ...ls]);
      setSelected(r.data);
      setNewName("");
      toast.success("Đã tạo playlist");
    } catch (e) {
      const s = e?.response?.status;
      if (s === 401) toast.error("Bạn cần đăng nhập.");
      else toast.error("Tạo playlist thất bại");
      console.error(e);
    }
  };

  // --- ĐỔI ẢNH BÌA THỦ CÔNG ---
  const changeCover = async (file) => {
    if (!file || !selId) return;
    try {
      const form = new FormData();
      form.append("file", file);
      const up = await api.post("/upload?folder=playlist-covers", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await api.patch(`/playlists/${selId}/meta`, { coverUrl: up.data?.url });
      setAll((ls) =>
        ls.map((p) => (p._id === selId ? { ...p, coverUrl: up.data?.url } : p))
      );
      setSelected((p) => (p ? { ...p, coverUrl: up.data?.url } : p));
      toast.success("Đã đổi ảnh bìa");
    } catch (e) {
      toast.error("Đổi ảnh bìa lỗi");
      console.error(e);
    }
  };

  // --- TỰ ĐỘNG 2×2 ---
  const autoCover = async () => {
    if (!selId) return;
    try {
      const covers = songs
        .map((s) => s?.coverUrl)
        .filter(Boolean)
        .slice(0, 4);
      const blob = await makeMosaicBlob(covers, 800);
      const url = await uploadBlobAsImage(blob, `auto-${selId}.jpg`);
      await api.patch(`/playlists/${selId}/meta`, { coverUrl: url });
      setAll((ls) =>
        ls.map((p) => (p._id === selId ? { ...p, coverUrl: url } : p))
      );
      setSelected((p) => (p ? { ...p, coverUrl: url } : p));
      toast.success("Đã tạo bìa tự động");
    } catch (e) {
      toast.error("Tạo bìa tự động thất bại");
      console.error(e);
    }
  };

  // --- XOÁ 1 BÀI KHỎI PLAYLIST ---
  const removeFromPlaylist = async (songId) => {
    if (!selId || !songId) return;
    await api.post("/playlists/remove", { playlistId: selId, songId });
    // cập nhật local thay vì fetch lại:
    setSelected((p) =>
      p ? { ...p, songs: p.songs.filter((s) => (s._id || s.id) !== songId) } : p
    );
    setAll((ls) =>
      ls.map((p) =>
        p._id === selId
          ? {
              ...p,
              songs: (p.songs || []).filter((s) => (s._id || s.id) !== songId),
            }
          : p
      )
    );
  };

  // --- ĐỔI TÊN PLAYLIST ---
  const renameCurrent = async () => {
    if (!selected?._id) return;
    const next = prompt("Tên playlist mới:", selected.name || "");
    if (next == null) return; // Cancel
    const n = next.trim();
    if (!n || n === selected.name) return;

    try {
      await api.patch(`/playlists/${selected._id}`, { name: n });
      setSelected((p) => ({ ...p, name: n }));
      setAll((ls) =>
        ls.map((p) => (p._id === selected._id ? { ...p, name: n } : p))
      );
      toast.success("Đã đổi tên playlist");
    } catch (e) {
      console.error(e);
      toast.error("Đổi tên thất bại");
    }
  };
  const deleteCurrent = async () => {
    if (!selected?._id) return;
    // (tuỳ bạn) chặn xoá Favorites
    if ((selected.name || "").trim().toLowerCase() === "favorites") {
      return toast.error("Playlist 'Favorites' không thể xoá.");
    }
    if (!confirm(`Xoá playlist "${selected.name}"?`)) return;
    try {
      await api.delete(`/playlists/${selected._id}`);
      toast.success("Đã xoá playlist");
      setSelected(null);
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Xoá playlist thất bại");
    }
  };

  const sidebarList = useMemo(() => {
    if (!all?.length) return [];
    return all;
  }, [all]);

  if (loading) return <p>Đang tải…</p>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 16,
        alignItems: "start",
      }}
    >
      {/* Sidebar */}
      <PlaylistSidebar
        selectedId={selId}
        onSelect={handleSelect}
        onCreated={(p) => {
          setSelected(p);
          loadAll();
        }}
        onDeleted={() => {
          // nếu đang xem playlist vừa xoá, clear selection
          // (loadAll sẽ đặt lại hoặc để trống)
          loadAll();
          if (selected && !all.find((x) => x._id === selected._id)) {
            setSelected(null);
          }
        }}
        width={300}
      />

      {/* Nội dung */}
      <div>
        {/* ✅ Thanh tạo playlist mới */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên playlist mới…"
            onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
            style={{ padding: 8, flex: 1, minWidth: 220 }}
          />
          <button onClick={createPlaylist}>Tạo</button>
        </div>

        {selected ? (
          <>
            {/* Header */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <PlaylistThumb
                coverUrl={selected.coverUrl}
                songs={selected.songs}
                size={136}
                radius={12}
              />
              <div style={{ alignSelf: "center" }}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Playlist</div>

                {/* Tiêu đề + nút Đổi tên */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <h2 style={{ margin: "4px 0 10px", fontSize: 28 }}>
                    {selected.name}
                  </h2>
                  <button onClick={renameCurrent}>Đổi tên</button>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button onClick={deleteCurrent} style={{ color: "#b00020" }}>
                    Xoá
                  </button>
                </div>

                <div style={{ opacity: 0.7 }}>{songs.length} bài</div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <label
                    style={{
                      border: "1px solid var(--border)",
                      padding: "6px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: "var(--card)", // ⬅️ thay #fff
                      color: "var(--text)", // ⬅️ thêm
                    }}
                  >
                    Đổi ảnh bìa
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => changeCover(e.target.files?.[0] || null)}
                    />
                  </label>
                  <button
                    onClick={autoCover}
                    style={{
                      background: "var(--card)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "6px 10px",
                    }}
                  >
                    Tự động 2×2
                  </button>
                </div>
              </div>
            </div>

            {/* Danh sách bài */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                gap: 12,
              }}
            >
              {(songs || []).map((s, i) => (
                <SongItem
                  key={s._id || s.id}
                  song={s}
                  list={songs}
                  index={i}
                  playlistId={selId}
                  onChanged={() => removeFromPlaylist(s._id || s.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.7 }}>Chọn một playlist ở bên trái.</div>
        )}
      </div>
    </div>
  );
}
