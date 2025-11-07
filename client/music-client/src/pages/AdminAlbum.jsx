// client/src/pages/AdminAlbum.jsx
import { useEffect, useState } from "react";
import {
  searchAlbums,
  getAlbumAdminDetail,
  updateAlbum,
  createAlbum,
  deleteAlbum,
  uploadImage,
  searchArtists,
  // ⬇️ mới
  searchSongs,
  assignSongToAlbum,
  removeSongFromAlbum,
} from "../api";

/* =============== Search =============== */
function AlbumSearch({ onPick }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await searchAlbums(q, 24);
      setItems(res);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm album theo tiêu đề…"
        style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 8,
        }}
      >
        {items.map((a) => (
          <button
            key={a._id}
            onClick={() => onPick(a)}
            style={{
              textAlign: "left",
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 10,
              padding: 10,
              display: "flex",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <img
              src={a.coverUrl || "/logosite.png"}
              alt=""
              width={52}
              height={52}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
            <div style={{ display: "grid" }}>
              <strong>{a.title}</strong>
              <small style={{ opacity: 0.7 }}>
                {a.releaseDate ? new Date(a.releaseDate).getFullYear() : ""}
              </small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =============== Create =============== */
function CreateAlbum({ onCreated }) {
  const [title, setTitle] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [artistId, setArtistId] = useState("");
  const [artistResults, setArtistResults] = useState([]);
  const [releaseDate, setReleaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [coverUrl, setCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!artistQuery.trim()) return setArtistResults([]);
      const rs = await searchArtists(artistQuery, 10);
      setArtistResults(rs);
    }, 300);
    return () => clearTimeout(t);
  }, [artistQuery]);

  const pickCover = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const up = await uploadImage(f, "music-app/albums");
    setCoverUrl(up.url);
  };

  const create = async () => {
    if (!title.trim()) return alert("Nhập tiêu đề album");
    if (!artistId) return alert("Chọn artistId");
    setSaving(true);
    try {
      const album = await createAlbum({
        artistId,
        title: title.trim(),
        coverUrl,
        releaseDate,
      });
      alert("Đã tạo album: " + album.title);
      setTitle("");
      setArtistId("");
      setArtistQuery("");
      setArtistResults([]);
      setCoverUrl("");
      onCreated?.(album);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Tạo album thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Thêm album</h3>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Tiêu đề
          <br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>
        <label>
          Gán nghệ sĩ (artistId)
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={artistQuery}
              onChange={(e) => setArtistQuery(e.target.value)}
              placeholder="Tìm nghệ sĩ…"
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
            <input
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              placeholder="hoặc dán artistId"
              style={{
                width: 260,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </div>
          {!!artistResults.length && (
            <div
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 8,
                marginTop: 6,
              }}
            >
              {artistResults.map((a) => (
                <button
                  key={a._id}
                  onClick={() => {
                    setArtistId(a._id);
                    setArtistQuery(a.name);
                    setArtistResults([]);
                  }}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    border: 0,
                    background: "transparent",
                    padding: 6,
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={a.avatarUrl || "/logosite.png"}
                    width={28}
                    height={28}
                    style={{ borderRadius: 6, objectFit: "cover" }}
                  />
                  <span>{a.name}</span>
                </button>
              ))}
            </div>
          )}
        </label>
        <label>
          Ngày phát hành
          <br />
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </label>
        <label>
          Ảnh bìa
          <br />
          {coverUrl ? (
            <img
              src={coverUrl}
              width={140}
              style={{ display: "block", borderRadius: 8, marginBottom: 8 }}
            />
          ) : null}
          <input type="file" accept="image/*" onChange={pickCover} />
        </label>
        <div>
          <button onClick={create} disabled={saving}>
            {saving ? "Đang tạo…" : "Tạo album"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============== Edit =============== */
function AlbumEditor({ album, onSaved, onDeleted }) {
  const [title, setTitle] = useState(album?.title || "");
  const [artistQuery, setArtistQuery] = useState("");
  const [artistId, setArtistId] = useState(album?.artistId || "");
  const [artistResults, setArtistResults] = useState([]);
  const [releaseDate, setReleaseDate] = useState(
    album?.releaseDate
      ? new Date(album.releaseDate).toISOString().slice(0, 10)
      : ""
  );
  const [coverUrl, setCoverUrl] = useState(album?.coverUrl || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(album?.title || "");
    setArtistId(album?.artistId || "");
    setReleaseDate(
      album?.releaseDate
        ? new Date(album.releaseDate).toISOString().slice(0, 10)
        : ""
    );
    setCoverUrl(album?.coverUrl || "");
    setArtistQuery("");
    setArtistResults([]);
  }, [album?._id]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!artistQuery.trim()) return setArtistResults([]);
      const rs = await searchArtists(artistQuery, 10);
      setArtistResults(rs);
    }, 300);
    return () => clearTimeout(t);
  }, [artistQuery]);

  const pickCover = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const up = await uploadImage(f, "music-app/albums");
    setCoverUrl(up.url);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateAlbum(album._id, {
        title: title.trim(),
        coverUrl,
        releaseDate,
        artistId: artistId || undefined,
      });
      onSaved?.(updated);
      alert("Đã lưu album");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Xoá album "${album?.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteAlbum(album._id);
      alert("Đã xoá album");
      onDeleted?.();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  };

  if (!album) return null;
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Sửa album</h3>
      <div style={{ display: "flex", gap: 16 }}>
        <img
          src={coverUrl || "/logosite.png"}
          width={140}
          height={140}
          style={{ borderRadius: 12, objectFit: "cover" }}
        />
        <div style={{ display: "grid", gap: 8, flex: 1 }}>
          <label>
            Tiêu đề
            <br />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>

          <label>
            Gán nghệ sĩ (artistId)
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                placeholder="Tìm nghệ sĩ…"
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
              <input
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                placeholder="hoặc dán artistId"
                style={{
                  width: 260,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
            </div>
            {!!artistResults.length && (
              <div
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 6,
                }}
              >
                {artistResults.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => {
                      setArtistId(a._id);
                      setArtistQuery(a.name);
                      setArtistResults([]);
                    }}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      border: 0,
                      background: "transparent",
                      padding: 6,
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={a.avatarUrl || "/logosite.png"}
                      width={28}
                      height={28}
                      style={{ borderRadius: 6, objectFit: "cover" }}
                    />
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            )}
          </label>

          <label>
            Ngày phát hành
            <br />
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
            />
          </label>

          <label>
            Ảnh bìa
            <br />
            <input type="file" accept="image/*" onChange={pickCover} />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu album"}
            </button>
            <button
              onClick={remove}
              disabled={deleting}
              style={{ background: "#fee2e2", color: "#991b1b" }}
            >
              {deleting ? "Đang xoá…" : "Xoá album"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============== Tracks Manager =============== */
function TracksManager({ albumId, currentSongs, onChanged }) {
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState([]);

  // tìm bài – mặc định bài chưa gán album
  useEffect(() => {
    const t = setTimeout(async () => {
      const items = await searchSongs({
        q,
        limit: 20,
        withoutAlbum: 1,
      });
      setCandidates(items);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const addSong = async (songId) => {
    await assignSongToAlbum(songId, albumId);
    onChanged && onChanged();
  };

  const removeSong = async (songId) => {
    await removeSongFromAlbum(songId);
    onChanged && onChanged();
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Bài hát trong album</h3>

      {/* đang ở album */}
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {!currentSongs?.length ? (
          <div style={{ opacity: 0.7 }}>(Chưa có bài nào)</div>
        ) : (
          currentSongs.map((s) => (
            <div
              key={s._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 8,
                background: "#fff",
              }}
            >
              <img
                src={s.coverUrl || "/logosite.png"}
                width={42}
                height={42}
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{s.title}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{s.artist}</div>
              </div>
              <button
                onClick={() => removeSong(s._id)}
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                Gỡ khỏi album
              </button>
            </div>
          ))
        )}
      </div>

      {/* thêm bài */}
      <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Thêm bài hát</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm bài chưa thuộc album…"
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
        <div
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: 8,
          }}
        >
          {candidates.map((s) => (
            <div
              key={s._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 8,
                background: "#fff",
              }}
            >
              <img
                src={s.coverUrl || "/logosite.png"}
                width={42}
                height={42}
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{s.title}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{s.artist}</div>
              </div>
              <button onClick={() => addSong(s._id)}>Thêm</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =============== Page =============== */
export default function AdminAlbum() {
  const [picked, setPicked] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailSongs, setDetailSongs] = useState([]);

  // load detail + songs
  useEffect(() => {
    if (!picked?._id) {
      setDetail(null);
      setDetailSongs([]);
      return;
    }
    (async () => {
      const d = await getAlbumAdminDetail(picked._id);
      setDetail(d.album);
      setDetailSongs(d.songs || []);
    })();
  }, [picked?._id]);

  const refreshDetail = async () => {
    if (!detail?._id) return;
    const d = await getAlbumAdminDetail(detail._id);
    setDetail(d.album);
    setDetailSongs(d.songs || []);
  };

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <h2>Quản trị Album</h2>
      <AlbumSearch onPick={setPicked} />
      <CreateAlbum onCreated={setPicked} />

      {!detail ? (
        <div style={{ opacity: 0.7 }}>(Chọn một album để chỉnh sửa)</div>
      ) : (
        <>
          <AlbumEditor
            album={detail}
            onSaved={(a) => setDetail(a)}
            onDeleted={() => {
              setPicked(null);
              setDetail(null);
              setDetailSongs([]);
            }}
          />

          <TracksManager
            albumId={detail._id}
            currentSongs={detailSongs}
            onChanged={refreshDetail}
          />
        </>
      )}
    </div>
  );
}
