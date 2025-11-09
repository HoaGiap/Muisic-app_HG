// src/pages/Library.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
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
    ctx.fillText("Playlist", size / 2, size / 2);
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

/* ===== Modal tạo playlist (Tên + ảnh tuỳ chọn) ===== */
function CreatePlaylistModal({ open, onClose, onCreated, sampleCovers = [] }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setFile(null);
      setSaving(false);
    }
  }, [open]);

  const submit = useCallback(async () => {
    const n = name.trim();
    if (!n) return toast.error("Nhập tên playlist");
    try {
      setSaving(true);
      // 1) tạo playlist
      const { data: created } = await api.post("/playlists", { name: n });

      // 2) xử lý cover (file hoặc auto 2x2)
      let coverUrl = "";
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const up = await api.post("/upload?folder=playlist-covers", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        coverUrl = up.data?.url || "";
      } else {
        const blob = await makeMosaicBlob(sampleCovers, 800);
        coverUrl = await uploadBlobAsImage(blob, `auto-${created._id}.jpg`);
      }

      if (coverUrl) {
        // cập nhật cover cho playlist vừa tạo
        await api.put(`/playlists/${created._id}`, { coverUrl });
        created.coverUrl = coverUrl;
      }

      toast.success("Đã tạo playlist");
      onCreated?.(created);
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error("Tạo playlist thất bại");
    } finally {
      setSaving(false);
    }
  }, [name, file, onCreated, onClose, sampleCovers]);

  // ESC để đóng, ENTER để lưu
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submit, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px,95vw)",
          background: "var(--bg,#fff)",
          color: "var(--fg,#111)",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <b style={{ fontSize: 18 }}>Tạo playlist</b>
          <button onClick={onClose} style={{ marginLeft: "auto" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <label>
            Tên playlist
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên…"
              style={{
                display: "block",
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
                marginTop: 6,
              }}
            />
          </label>

          <label>
            Ảnh bìa (tuỳ chọn)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "block", marginTop: 6 }}
            />
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                background: "transparent",
                color: "var(--fg,#111)",
                border: "1px solid #d0d0d0",
                borderRadius: 999,
                padding: "8px 16px",
                cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              Huỷ
            </button>
            <button
              onClick={submit}
              disabled={saving}
              style={{
                background: "#1ed760",
                color: "#000",
                fontWeight: 700,
                border: 0,
                borderRadius: 999,
                padding: "8px 18px",
                cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Đang lưu…" : "Lưu"}
            </button>
          </div>

          <small style={{ opacity: 0.7 }}>
            Không chọn ảnh? Mình sẽ tự tạo ảnh bìa 2×2.
          </small>
        </div>
      </div>
    </div>
  );
}

/* =========================== Page =========================== */
export default function Library() {
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);

  const selId = selected?._id;
  const songs = selected?.songs || [];

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

  // Đổi ảnh bìa (PUT /playlists/:id)
  const changeCover = async (file) => {
    if (!file || !selId) return;
    try {
      const form = new FormData();
      form.append("file", file);
      const up = await api.post("/upload?folder=playlist-covers", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = up.data?.url;
      await api.put(`/playlists/${selId}`, { coverUrl: url });
      setAll((ls) =>
        ls.map((p) => (p._id === selId ? { ...p, coverUrl: url } : p))
      );
      setSelected((p) => (p ? { ...p, coverUrl: url } : p));
      toast.success("Đã đổi ảnh bìa");
    } catch (e) {
      toast.error("Đổi ảnh bìa lỗi");
      console.error(e);
    }
  };

  // Tự động 2×2
  const autoCover = async () => {
    if (!selId) return;
    try {
      const covers = songs
        .map((s) => s?.coverUrl)
        .filter(Boolean)
        .slice(0, 4);
      const blob = await makeMosaicBlob(covers, 800);
      const url = await uploadBlobAsImage(blob, `auto-${selId}.jpg`);
      await api.put(`/playlists/${selId}`, { coverUrl: url });
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

  const removeFromPlaylist = async (songId) => {
    if (!selId || !songId) return;
    await api.post("/playlists/remove", { playlistId: selId, songId });
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

  const renameCurrent = async () => {
    if (!selected?._id) return;
    const next = prompt("Tên playlist mới:", selected.name || "");
    if (next == null) return;
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

  const sidebarList = useMemo(() => all || [], [all]);

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
        selectedId={selected?._id}
        onSelect={handleSelect}
        onCreated={(p) => {
          setSelected(p);
          loadAll();
        }}
        onDeleted={() => {
          loadAll();
          if (selected && !sidebarList.find((x) => x._id === selected._id)) {
            setSelected(null);
          }
        }}
        width={300}
      />

      {/* Content */}
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setShowCreate(true)}>Tạo playlist</button>
        </div>

        {selected ? (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <PlaylistThumb
                coverUrl={selected.coverUrl}
                songs={selected.songs}
                size={136}
                radius={12}
              />
              <div style={{ alignSelf: "center" }}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Playlist</div>

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

                <div style={{ opacity: 0.7 }}>
                  {(selected.songs || []).length} bài
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <label
                    style={{
                      border: "1px solid var(--border)",
                      padding: "6px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: "var(--card)",
                      color: "var(--text)",
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

            {/* ==== SONG GRID (compact như Home) ==== */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                gap: 18,
              }}
            >
              {(selected.songs || []).map((s, i) => (
                <SongItem
                  key={s._id || s.id}
                  song={s}
                  list={selected.songs}
                  index={i}
                  playlistId={selected._id}
                  onChanged={() => removeFromPlaylist(s._id || s.id)}
                  compact
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.7 }}>Chọn một playlist ở bên trái.</div>
        )}
      </div>

      {/* Modal tạo playlist */}
      <CreatePlaylistModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        sampleCovers={
          selected?.songs
            ?.map((s) => s.coverUrl)
            .filter(Boolean)
            .slice(0, 4) || []
        }
        onCreated={(p) => {
          setAll((ls) => [p, ...ls]);
          setSelected(p);
        }}
      />
    </div>
  );
}
