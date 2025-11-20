import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  searchArtists,
  updateArtist,
  createArtist,
  deleteArtist,
  uploadImage,
} from "../api";
import { t } from "../ui/toast";

const panelStyle = {
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 20,
  background: "var(--card)",
  color: "var(--text)",
};

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 140,
  resize: "vertical",
};

const formatNumber = (val) =>
  typeof val === "number" ? val.toLocaleString("vi-VN") : "0";

function AvatarPicker({
  label,
  avatarUrl,
  fileLabel,
  uploading,
  onPick,
  onClear,
}) {
  return (
    <div className="avatar-picker">
      <p className="avatar-picker__label">{label}</p>
      <div className="avatar-preview">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar preview" />
        ) : (
          <span className="-empty">Chưa có ảnh</span>
        )}
      </div>
      {avatarUrl ? (
        <div className="file-chip">
          <span>{fileLabel || "Đang dùng ảnh hiện tại"}</span>
          <button
            type="button"
            aria-label="Xóa ảnh"
            onClick={(e) => {
              e.preventDefault();
              onClear?.();
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      <input
        className="avatar-picker__file"
        type="file"
        accept="image/*"
        onChange={onPick}
      />
      {uploading ? (
        <small style={{ opacity: 0.8 }}>Đang tải ảnh lên...</small>
      ) : null}
      {/* <small style={{ opacity: 0.6 }}>
        Nên dùng ảnh vuông ≥ 600px để đảm bảo chất lượng.
      </small> */}
    </div>
  );
}

function ArtistSearch({
  activeId,
  onPick,
  onAddNew,
  addingActive,
  refreshKey,
  onDeleted,
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuArtistId, setMenuArtistId] = useState(null);
  const [menuArtist, setMenuArtist] = useState(null);
  const [menuCoords, setMenuCoords] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    searchArtists(q, 30)
      .then((res) => {
        if (!ignore) setItems(res);
      })
      .catch((err) => {
        console.error(err);
        if (!ignore) {
          setItems([]);
          t.err("Không thể tải danh sách nghệ sĩ");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [q, refreshKey]);

  const closeMenu = (resetId = true) => {
    if (resetId) setMenuArtistId(null);
    setMenuArtist(null);
    setMenuCoords(null);
    menuRef.current = null;
  };

  const toggleMenu = (artist, anchorEl) => {
    const artistId = artist?._id;
    setMenuArtistId((prev) => {
      if (prev === artistId) {
        closeMenu(false);
        return null;
      }
      setMenuArtist(artist || null);
      if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const width = 220;
        const padding = 16;
        const top = rect.bottom + 8;
        const maxLeft = window.innerWidth - width - padding;
        const left = Math.min(
          Math.max(rect.right - width, padding),
          maxLeft
        );
        setMenuCoords({ top, left, width });
      } else {
        setMenuCoords(null);
      }
      return artistId;
    });
  };

  const handleDelete = async (artist) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${artist.name}?`)) {
      return;
    }
    setDeletingId(artist._id);
    try {
      await deleteArtist(artist._id);
      setItems((prev) => prev.filter((item) => item._id !== artist._id));
      onDeleted?.(artist._id);
      t.ok("Đã xoá nghệ sĩ");
    } catch (err) {
      console.error(err);
      t.err("Xoá nghệ sĩ thất bại");
    } finally {
      setDeletingId(null);
      closeMenu();
    }
  };

  return (
    <div style={{ ...panelStyle, display: "grid", gap: 12 }}>
      <div className="artist-search-head">
        <div>
          <p className="artist-eyebrow">Tìm nghệ sĩ</p>
          <h3 style={{ margin: 0 }}>Danh sách nghệ sĩ</h3>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAddNew}>
          {addingActive ? "Đóng form" : "+ Thêm nghệ sĩ"}
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm nghệ sĩ theo tên..."
        style={inputStyle}
      />
      {loading ? <div style={{ opacity: 0.75 }}>Đang tải...</div> : null}

      {items.length ? (
        <div className="artist-chip-scroll">
          <div className="artist-chip-row">
            {items.map((artist) => {
              const isActive = activeId === artist._id;
              const stats = [];
              if (typeof artist.albumCount === "number") stats.push(`${artist.albumCount} album`);
              if (typeof artist.songCount === "number") stats.push(`${artist.songCount} bài hát`);
              return (
                <div
                  key={artist._id}
                  className={`admin-artist-card${isActive ? " is-active" : ""}`}
                  onClick={() => onPick(artist)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPick(artist);
                    }
                  }}
                >
                  <img
                    src={artist.avatarUrl || "/logosite.png"}
                    alt={artist.name}
                    width={56}
                    height={56}
                    loading="lazy"
                  />
                  <div className="artist-card-meta">
                    <strong>{artist.name}</strong>
                    <small>{formatNumber(artist.followerCount)} người theo dõi</small>
                    {stats.length ? <small>{stats.join(" · ")}</small> : null}
                  </div>
                  <button
                    type="button"
                    className="artist-card-menu"
                    aria-label={`Mở menu cho ${artist.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(artist, e.currentTarget);
                    }}
                    aria-pressed={menuArtistId === artist?._id}
                  >
                    ⋮
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : !loading ? (
        <div className="artist-empty-state">
          <p>Chưa có nghệ sĩ nào. Hãy thêm nghệ sĩ đầu tiên của bạn!</p>
        </div>
      ) : null}

      {menuArtist && menuCoords
        ? createPortal(
            <>
              <div
                className="artist-menu-overlay"
                onClick={() => closeMenu()}
                aria-hidden="true"
              />
              <div
                className="artist-card-menu-popover"
                style={{
                  position: "fixed",
                  top: menuCoords.top,
                  left: menuCoords.left,
                  right: "auto",
                  bottom: "auto",
                  minWidth: menuCoords.width,
                  zIndex: 200,
                }}
                ref={(node) => {
                  if (node) menuRef.current = node;
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onPick(menuArtist);
                    closeMenu();
                  }}
                >
                  Chỉnh sửa
                </button>
                <Link
                  to={`/artist/${menuArtist._id}`}
                  className="artist-menu-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => closeMenu()}
                >
                  Xem trang nghệ sĩ
                </Link>
                <button
                  type="button"
                  className="artist-menu-item danger"
                  onClick={() => handleDelete(menuArtist)}
                  disabled={deletingId === menuArtist._id}
                >
                  {deletingId === menuArtist._id ? "Đang xoá..." : "Xóa nghệ sĩ"}
                </button>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}

function ArtistEditor({ artist, onSaved, onDeleted }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(artist?.name || "");
    setBio(artist?.bio || "");
    setAvatarUrl(artist?.avatarUrl || "");
    setAvatarFileName("");
  }, [artist?._id]);

  if (!artist) return null;

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const up = await uploadImage(file, "music-app/avatars");
      setAvatarUrl(up.url);
      setAvatarFileName(file.name);
      t.ok("Đã tải ảnh lên");
    } catch (err) {
      console.error(err);
      t.err("Tải ảnh thất bại");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const clearAvatar = () => {
    setAvatarUrl("");
    setAvatarFileName("");
  };

  const save = async () => {
    if (!name.trim()) {
      return t.err("Tên nghệ sĩ không được bỏ trống");
    }
    setSaving(true);
    try {
      const updated = await updateArtist(artist._id, {
        name: name.trim(),
        bio,
        avatarUrl,
      });
      t.ok("Đã lưu nghệ sĩ");
      onSaved?.(updated);
    } catch (err) {
      console.error(err);
      t.err("Lưu nghệ sĩ thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${artist.name}?`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteArtist(artist._id);
      t.ok("Đã xoá nghệ sĩ");
      onDeleted?.();
    } catch (err) {
      console.error(err);
      t.err("Xoá nghệ sĩ thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ ...panelStyle, display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ margin: 0 }}>Chỉnh sửa nghệ sĩ</h3>
        {/* <p style={{ opacity: 0.7, marginTop: 4 }}>
          Các thay đổi sẽ áp dụng ngay lập tức trên toàn bộ ứng dụng.
        </p> */}
      </div>

      <div className="artist-editor-layout">
        <div className="artist-editor-left">
          <AvatarPicker
            label="Avatar"
            avatarUrl={avatarUrl}
            fileLabel={avatarFileName}
            uploading={avatarUploading}
            onPick={pickAvatar}
            onClear={clearAvatar}
          />
          <button
            type="button"
            className="btn btn-danger-outline btn-ghost"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Đang xoá..." : "Xóa nghệ sĩ"}
          </button>
        </div>
        <div className="artist-editor-right">
          <label>
            Tên nghệ sĩ
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Ví dụ: Heki"
            />
          </label>

          <label>
            Tiểu sử
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={textareaStyle}
            />
          </label>

          <div className="artist-editor-right-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu nghệ sĩ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateArtist({ onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const up = await uploadImage(file, "music-app/avatars");
      setAvatarUrl(up.url);
      setAvatarFileName(file.name);
      t.ok("Đã tải ảnh lên");
    } catch (err) {
      console.error(err);
      t.err("Tải ảnh thất bại");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const clearAvatar = () => {
    setAvatarUrl("");
    setAvatarFileName("");
  };

  const create = async () => {
    if (!name.trim()) {
      return t.err("Tên nghệ sĩ không được bỏ trống");
    }
    setCreating(true);
    try {
      const artist = await createArtist({
        name: name.trim(),
        bio,
        avatarUrl,
      });
      t.ok("Đã tạo nghệ sĩ mới");
      onCreated?.(artist);
      setName("");
      setBio("");
      setAvatarUrl("");
      setAvatarFileName("");
    } catch (err) {
      console.error(err);
      t.err(err?.response?.data?.message || "Tạo nghệ sĩ thất bại");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ ...panelStyle, display: "grid", gap: 12 }}>
      <div className="artist-search-head">
        <div>
          <h3 style={{ margin: 0 }}>Thêm nghệ sĩ mới</h3>
          <p style={{ opacity: 0.7, marginTop: 4 }}>
            Điền thông tin cơ bản. Bạn có thể chỉnh sửa chi tiết sau.
          </p>
        </div>
        <button type="button" className="btn btn-muted" onClick={onCancel}>
          Đóng
        </button>
      </div>

      <div className="artist-editor-layout">
        <div className="artist-editor-left">
          <AvatarPicker
            label="Avatar"
            avatarUrl={avatarUrl}
            fileLabel={avatarFileName}
            uploading={avatarUploading}
            onPick={pickAvatar}
            onClear={clearAvatar}
          />
        </div>
        <div className="artist-editor-right">
          <label>
            Tên nghệ sĩ
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Heki"
              style={inputStyle}
            />
          </label>

          <label>
            Tiểu sử
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={textareaStyle}
            />
          </label>

          <div className="artist-editor-right-actions">
            <button
              type="button"
              className="btn btn-muted"
              onClick={() => {
                setName("");
                setBio("");
                clearAvatar();
              }}
            >
              Xoá nội dung
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={create}
              disabled={creating}
            >
              {creating ? "Đang tạo..." : "Lưu nghệ sĩ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminArtist() {
  const [picked, setPicked] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = (artist) => {
    setPicked(artist);
    setShowCreate(false);
    setRefreshKey((n) => n + 1);
  };

  const handleDeleted = (id) => {
    if (!id || picked?._id === id) {
      setPicked(null);
    }
    setRefreshKey((n) => n + 1);
  };

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Quản trị Nghệ sĩ</h2>
        <span style={{ marginLeft: "auto", fontSize: 14 }}>
          Muốn quản lý album? &nbsp;
          <Link to="/admin/album" style={{ fontWeight: 700 }}>
            Đến trang Album
          </Link>
        </span>
      </div>

      <ArtistSearch
        activeId={picked?._id}
        onPick={(artist) => {
          setPicked(artist);
        }}
        onAddNew={() => setShowCreate((v) => !v)}
        addingActive={showCreate}
        refreshKey={refreshKey}
        onDeleted={handleDeleted}
      />

      {showCreate ? (
        <CreateArtist
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      ) : null}

      {picked ? (
        <ArtistEditor
          artist={picked}
          onSaved={(artist) => setPicked(artist)}
          onDeleted={() => handleDeleted(picked._id)}
        />
      ) : (
        <div style={{ ...panelStyle, opacity: 0.8 }}>
          Chọn một nghệ sĩ từ danh sách để chỉnh sửa hoặc bấm “+ Thêm nghệ sĩ”
          để tạo mới.
        </div>
      )}
    </div>
  );
}