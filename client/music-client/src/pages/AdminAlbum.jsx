import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  searchAlbums,
  getAlbumAdminDetail,
  updateAlbum,
  createAlbum,
  deleteAlbum,
  uploadImage,
  searchArtists,
  searchSongs,
  assignSongToAlbum,
  removeSongFromAlbum,
} from "../api";
import { t } from "../ui/toast";

const panelStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 16,
  background: "var(--card)",
  color: "var(--text)",
};

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
};

const accentButtonStyle = {
  background: "var(--accent)",
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 600,
  cursor: "pointer",
};

const ghostButtonStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "9px 14px",
  color: "var(--text)",
  cursor: "pointer",
};

const dangerButtonStyle = {
  background: "rgba(248,113,113,0.15)",
  color: "#fca5a5",
  border: 0,
  borderRadius: 10,
  padding: "9px 14px",
  cursor: "pointer",
};

const artistResultListStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 6,
  marginTop: 6,
  display: "grid",
  gap: 2,
  background: "var(--card)",
  maxHeight: 220,
  overflowY: "auto",
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "-";
  }
};

function ArtistMatches({ results, onPick }) {
  if (!results?.length) return null;
  return (
    <div style={artistResultListStyle}>
      {results.map((a) => (
        <button
          key={a._id}
          onClick={() => onPick(a)}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            border: 0,
            background: "transparent",
            padding: 8,
            borderRadius: 10,
            textAlign: "left",
            cursor: "pointer",
            color: "var(--text)",
          }}
        >
          <img
            src={a.avatarUrl || "/logosite.png"}
            width={32}
            height={32}
            alt=""
            style={{ borderRadius: 8, objectFit: "cover" }}
          />
          <span style={{ fontWeight: 600 }}>{a.name}</span>
        </button>
      ))}
    </div>
  );
}

function ToolbarTable({
  albums,
  meta,
  loading,
  query,
  onQueryChange,
  onRefresh,
  onAddClick,
  selectedId,
  onSelect,
  onDelete,
}) {
  const [menuFor, setMenuFor] = useState(null);
  const [menuAlbum, setMenuAlbum] = useState(null);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const close = () => setMenuFor(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const openMenu = (e, album) => {
    e.stopPropagation();
    const id = album._id;
    if (menuFor === id) {
      setMenuFor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 150;
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const left = Math.max(
      12,
      Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 12)
    );
    setMenuPos({ left, top: rect.bottom + 8 });
    setMenuAlbum(album);
    setMenuFor(id);
  };

  const renderRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} style={{ padding: 24, textAlign: "center" }}>
            Đang tải danh sách album...
          </td>
        </tr>
      );
    }
    if (!albums.length) {
      return (
        <tr>
          <td colSpan={6} style={{ padding: 24, textAlign: "center" }}>
            Chưa có album nào. Hãy thêm album đầu tiên của bạn!
          </td>
        </tr>
      );
    }
    return albums.map((album) => {
      const info = meta[album._id] || {};
      return (
        <tr
          key={album._id}
          className={selectedId === album._id ? "selected" : ""}
          onClick={() => onSelect(album)}
          style={{ cursor: "pointer" }}
        >
          <td style={{ width: 72 }}>
            <img
              src={album.coverUrl || "/logosite.png"}
              alt=""
              width={48}
              height={48}
              style={{ borderRadius: 10, objectFit: "cover" }}
            />
          </td>
          <td>
            <div style={{ fontWeight: 600 }}>{album.title}</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>ID: {album._id}</div>
          </td>
          <td>
            {info.artistId ? (
              <Link
                to={`/admin/artists?focus=${info.artistId}`}
                style={{ color: "var(--link)", fontWeight: 600 }}
                onClick={(e) => e.stopPropagation()}
              >
                {info.artistName || "Nghệ sĩ"}
              </Link>
            ) : (
              <span style={{ opacity: 0.7 }}>Chưa gán</span>
            )}
          </td>
          <td style={{ width: 80 }}>{info.songCount ?? "-"}</td>
          <td style={{ width: 140 }}>{formatDate(info.releaseDate)}</td>
          <td style={{ width: 60, textAlign: "right" }}>
            <button
              className="song-card-menu-trigger"
              onClick={(e) => openMenu(e, album)}
            >
              ⋮
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="admin-table-card" style={{ ...panelStyle, padding: 0 }}>
      <div className="admin-table-toolbar">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Tìm album theo tiêu đề..."
          style={{ flex: 1, minWidth: 220 }}
        />
        <div className="admin-table-toolbar-actions">
          <button style={ghostButtonStyle} onClick={onRefresh}>
            Tải lại
          </button>
          <button style={accentButtonStyle} onClick={onAddClick}>
            + Thêm album mới
          </button>
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tiêu đề album</th>
              <th>Nghệ sĩ</th>
              <th>Số bài</th>
              <th>Ngày phát hành</th>
              <th />
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>

      {menuFor && menuAlbum ? (
        <div
          className="song-card-menu"
          style={{ left: menuPos.left, top: menuPos.top }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onSelect(menuAlbum);
              setMenuFor(null);
            }}
          >
            Chỉnh sửa
          </button>
          <button
            className="danger"
            onClick={() => {
              setMenuFor(null);
              onDelete(menuAlbum);
            }}
          >
            Xóa
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CreateAlbumPanel({ open, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [artistId, setArtistId] = useState("");
  const [artistResults, setArtistResults] = useState([]);
  const [releaseDate, setReleaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [coverUrl, setCoverUrl] = useState("");
  const [coverName, setCoverName] = useState("");
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
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadImage(file, "music-app/albums");
    setCoverUrl(uploaded.url);
    setCoverName(file.name);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      return t.err("Vui lòng nhập tiêu đề album");
    }
    if (!artistId) {
      return t.err("Vui lòng chọn nghệ sĩ");
    }
    setSaving(true);
    try {
      const album = await createAlbum({
        artistId,
        title: title.trim(),
        coverUrl,
        releaseDate,
      });
      t.ok(`Đã tạo album: ${album.title}`);
      setTitle("");
      setArtistId("");
      setArtistQuery("");
      setArtistResults([]);
      setCoverUrl("");
      setCoverName("");
      onCreated?.(album);
    } catch (e) {
      console.error(e);
      t.err(e?.response?.data?.message || "Tạo album thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ ...panelStyle, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h3 style={{ margin: 0, flex: 1 }}>Thêm album mới</h3>
        <button style={ghostButtonStyle} onClick={onClose}>
          Đóng
        </button>
      </div>
      <label>
        Tiêu đề
        <br />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label>
        Gán nghệ sĩ
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={artistQuery}
            onChange={(e) => setArtistQuery(e.target.value)}
            placeholder="Tìm nghệ sĩ..."
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />
          <input
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
            placeholder="hoặc dán artistId"
            style={{ ...inputStyle, maxWidth: 240 }}
          />
        </div>
        <ArtistMatches
          results={artistResults}
          onPick={(artist) => {
            setArtistId(artist._id);
            setArtistQuery(artist.name);
            setArtistResults([]);
          }}
        />
      </label>
      <label>
        Ngày phát hành
        <br />
        <input
          type="date"
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label>
        Ảnh bìa
        <br />
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            width={140}
            style={{ borderRadius: 12, display: "block", marginBottom: 8 }}
          />
        ) : null}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="file" accept="image/*" onChange={pickCover} />
          {coverName ? (
            <>
              <span style={{ opacity: 0.8, fontSize: 13 }}>{coverName}</span>
              <button
                style={ghostButtonStyle}
                onClick={() => {
                  setCoverUrl("");
                  setCoverName("");
                }}
              >
                Xóa ảnh
              </button>
            </>
          ) : null}
        </div>
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={handleCreate}
          style={accentButtonStyle}
          disabled={saving}
        >
          {saving ? "Đang tạo..." : "Tạo album"}
        </button>
      </div>
    </div>
  );
}

function AlbumEditorPanel({ album, onSaved, onDeleted }) {
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
  const [coverName, setCoverName] = useState("");
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
    setCoverName("");
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
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadImage(file, "music-app/albums");
    setCoverUrl(uploaded.url);
    setCoverName(file.name);
  };

  const save = async () => {
    if (!album) return;
    setSaving(true);
    try {
      const updated = await updateAlbum(album._id, {
        artistId: artistId || undefined,
        title: title.trim(),
        coverUrl,
        releaseDate,
      });
      t.ok("Đã lưu album");
      onSaved?.(updated);
    } catch (e) {
      console.error(e);
      t.err(e?.response?.data?.message || "Lưu album thất bại");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!album) return;
    if (!confirm(`Xóa album "${album.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteAlbum(album._id);
      t.ok("Đã xóa album");
      onDeleted?.();
    } catch (e) {
      console.error(e);
      t.err(e?.response?.data?.message || "Xóa album thất bại");
    } finally {
      setDeleting(false);
    }
  };

  if (!album) return null;

  return (
    <div style={{ ...panelStyle, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>Chỉnh sửa album</h3>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <img
          src={coverUrl || "/logosite.png"}
          alt=""
          width={160}
          height={160}
          style={{ borderRadius: 16, objectFit: "cover" }}
        />
        <div
          style={{
            display: "grid",
            gap: 10,
            flex: 1,
            minWidth: 260,
            maxWidth: 1200,
          }}
        >
          <label>
            Tiêu đề
            <br />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            />
          </label>
          <label>
            Gán nghệ sĩ
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                placeholder="Tìm nghệ sĩ..."
                style={{ ...inputStyle, flex: 1, minWidth: 200 }}
              />
              {/* <input
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                placeholder="hoặc dán artistId"
                style={{ ...inputStyle, maxWidth: 240 }}
              /> */}
            </div>
            <ArtistMatches
              results={artistResults}
              onPick={(artist) => {
                setArtistId(artist._id);
                setArtistQuery(artist.name);
                setArtistResults([]);
              }}
            />
          </label>
          <label>
            Ngày phát hành
            <br />
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              style={{ display: "grid", gap: 10, flex: 1, minWidth: 300 }}
            />
          </label>
          <label>
            Ảnh bìa
            <br />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="file" accept="image/*" onChange={pickCover} />
              {coverName ? (
                <span style={{ opacity: 0.8, fontSize: 13 }}>{coverName}</span>
              ) : null}
            </div>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} style={accentButtonStyle} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu album"}
            </button>
            <button
              onClick={remove}
              style={dangerButtonStyle}
              disabled={deleting}
            >
              {deleting ? "Đang xóa..." : "Xóa album"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TracksManagerPanel({ albumId, songs, onChanged }) {
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoadingCandidates(true);
      try {
        const items = await searchSongs({
          q,
          limit: 20,
          withoutAlbum: 1,
        });
        setCandidates(items);
      } finally {
        setLoadingCandidates(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const addSong = async (songId) => {
    await assignSongToAlbum(songId, albumId);
    t.ok("Đã thêm bài hát vào album");
    onChanged && onChanged();
  };

  const removeSong = async (songId) => {
    await removeSongFromAlbum(songId);
    t.ok("Đã gỡ bài hát khỏi album");
    onChanged && onChanged();
  };

  return (
    <div style={{ ...panelStyle, display: "grid", gap: 16 }}>
      <h3 style={{ margin: 0 }}>Bài hát trong album</h3>

      {!songs?.length ? (
        <div style={{ opacity: 0.7 }}>(Chưa có bài nào trong album này)</div>
      ) : (
        <div className="admin-song-grid" style={{ display: "grid", gap: 8 }}>
          {songs.map((song) => (
            <div
              key={song._id}
              className="admin-song-card"
              style={{ alignItems: "center" }}
            >
              <img
                src={song.coverUrl || "/logosite.png"}
                width={42}
                height={42}
                alt=""
                style={{ borderRadius: 8, objectFit: "cover" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{song.title}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{song.artist}</div>
              </div>
              <button
                onClick={() => removeSong(song._id)}
                style={{ ...dangerButtonStyle, padding: "6px 12px" }}
              >
                Gỡ khỏi album
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Thêm bài hát</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm bài chưa thuộc album..."
          style={inputStyle}
        />
        <div
          className="admin-song-grid"
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: 10,
          }}
        >
          {loadingCandidates ? (
            <div style={{ opacity: 0.7 }}>Đang tìm bài hát...</div>
          ) : (
            candidates.map((song) => (
              <div
                key={song._id}
                className="admin-song-card"
                style={{ alignItems: "center" }}
              >
                <img
                  src={song.coverUrl || "/logosite.png"}
                  width={42}
                  height={42}
                  alt=""
                  style={{ borderRadius: 8, objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{song.title}</div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {song.artist}
                  </div>
                </div>
                <button onClick={() => addSong(song._id)}>Thêm</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAlbum() {
  const [query, setQuery] = useState("");
  const [albums, setAlbums] = useState([]);
  const [albumMeta, setAlbumMeta] = useState({});
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [picked, setPicked] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailSongs, setDetailSongs] = useState([]);
  const fetchRef = useRef(0);

  const loadAlbums = async (keyword) => {
    const requestId = ++fetchRef.current;
    setLoadingAlbums(true);
    try {
      const items = await searchAlbums(keyword, 30);
      if (requestId === fetchRef.current) {
        setAlbums(items);
      }
      if (!items.length) {
        if (requestId === fetchRef.current) {
          setAlbumMeta({});
          setPicked(null);
        }
        return;
      }
      const entries = await Promise.all(
        items.map(async (item) => {
          try {
            const detail = await getAlbumAdminDetail(item._id);
            return [
              item._id,
              {
                artistName: detail.artist?.name || "Chưa rõ",
                artistId: detail.artist?._id || "",
                songCount: detail.songs?.length ?? 0,
                releaseDate: detail.album?.releaseDate || item.releaseDate,
              },
            ];
          } catch (e) {
            console.error(e);
            return [
              item._id,
              {
                artistName: "Không xác định",
                artistId: "",
                songCount: undefined,
                releaseDate: item.releaseDate,
              },
            ];
          }
        })
      );
      if (requestId === fetchRef.current) {
        setAlbumMeta(Object.fromEntries(entries));
        if (!items.find((al) => al._id === picked?._id)) {
          setPicked(items[0]);
        }
      }
    } finally {
      if (requestId === fetchRef.current) {
        setLoadingAlbums(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAlbums(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    loadAlbums("");
  }, []);

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

  const handleDeleteAlbum = async (album) => {
    if (!confirm(`Xóa album "${album.title}"?`)) return;
    try {
      await deleteAlbum(album._id);
      t.ok("Đã xóa album");
      if (picked?._id === album._id) {
        setPicked(null);
        setDetail(null);
        setDetailSongs([]);
      }
      loadAlbums(query);
    } catch (e) {
      console.error(e);
      t.err(e?.response?.data?.message || "Xóa album thất bại");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <h2>Quản trị Album</h2>

      <ToolbarTable
        albums={albums}
        meta={albumMeta}
        loading={loadingAlbums}
        query={query}
        onQueryChange={setQuery}
        onRefresh={() => loadAlbums(query)}
        onAddClick={() => setShowCreate(true)}
        selectedId={picked?._id}
        onSelect={(album) => {
          setPicked(album);
          setShowCreate(false);
        }}
        onDelete={handleDeleteAlbum}
      />

      {showCreate ? (
        <CreateAlbumPanel
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={(album) => {
            setShowCreate(false);
            setPicked(album);
            loadAlbums(query);
          }}
        />
      ) : null}

      {!detail ? (
        <div style={{ ...panelStyle, opacity: 0.8 }}>
          Vui lòng chọn hoặc tạo một album để chỉnh sửa thông tin và quản lý bài
          hát.
        </div>
      ) : (
        <>
          <AlbumEditorPanel
            album={detail}
            onSaved={(updated) => {
              setDetail(updated);
              loadAlbums(query);
            }}
            onDeleted={() => {
              setDetail(null);
              setDetailSongs([]);
              setPicked(null);
              loadAlbums(query);
            }}
          />
          <TracksManagerPanel
            albumId={detail._id}
            songs={detailSongs}
            onChanged={refreshDetail}
          />
        </>
      )}
    </div>
  );
}
