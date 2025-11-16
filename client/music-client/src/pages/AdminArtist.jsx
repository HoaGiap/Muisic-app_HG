import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  searchArtists,
  updateArtist,
  createArtist,
  deleteArtist,
  uploadImage,
} from "../api";

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

const dangerButtonStyle = {
  background: "rgba(248,113,113,0.15)",
  color: "#fca5a5",
};

/* =============== Search =============== */
function ArtistSearch({ onPick }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchArtists(q, 20);
        setItems(res);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ ...panelStyle, display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 600 }}>Tìm nghệ sĩ</div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm nghệ sĩ theo tên..."
        style={inputStyle}
      />
      {loading ? <div style={{ opacity: 0.7 }}>Đang tìm...</div> : null}
      <div
        className="admin-entity-grid"
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
            className="admin-entity-card"
            style={{ textAlign: "left" }}
          >
            <img
              src={a.avatarUrl || "/logosite.png"}
              alt=""
              width={52}
              height={52}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
            <div style={{ display: "grid" }}>
              <strong>{a.name}</strong>
              <small style={{ opacity: 0.7 }}>
                {(a.followerCount ?? 0).toLocaleString()} người theo dõi
              </small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =============== Editor (update + delete) =============== */
function ArtistEditor({ artist, onSaved, onDeleted }) {
  const [name, setName] = useState(artist?.name || "");
  const [bio, setBio] = useState(artist?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(artist?.avatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(artist?.name || "");
    setBio(artist?.bio || "");
    setAvatarUrl(artist?.avatarUrl || "");
  }, [artist?._id]);

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const up = await uploadImage(file, "music-app/avatars");
    setAvatarUrl(up.url);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateArtist(artist._id, { name, bio, avatarUrl });
      onSaved?.(updated);
      alert("Đã lưu nghệ sĩ");
    } catch (e) {
      console.error(e);
      alert("Lưu nghệ sĩ thất bại");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Xóa nghệ sĩ "${artist?.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteArtist(artist._id);
      alert("Đã xóa nghệ sĩ");
      onDeleted?.();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Xóa nghệ sĩ thất bại");
    } finally {
      setDeleting(false);
    }
  };

  if (!artist) return null;
  return (
    <div style={{ ...panelStyle, display: "grid", gap: 16 }}>
      <h3 style={{ margin: 0 }}>Chỉnh sửa nghệ sĩ</h3>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <img
          src={avatarUrl || "/logosite.png"}
          alt=""
          width={120}
          height={120}
          style={{
            borderRadius: 12,
            objectFit: "cover",
            background: "var(--bg)",
          }}
        />
        <div style={{ display: "grid", gap: 12, flex: 1, minWidth: 220 }}>
          <label>
            Tên
            <br />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label>
            Tiểu sử
            <br />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              style={{ ...inputStyle, minHeight: 140 }}
            />
          </label>
          <label>
            Avatar
            <br />
            <input type="file" accept="image/*" onChange={onPickImage} />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu nghệ sĩ"}
            </button>
            <button
              onClick={remove}
              disabled={deleting}
              style={dangerButtonStyle}
            >
              {deleting ? "Đang xóa..." : "Xóa nghệ sĩ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============== Create Artist =============== */
function CreateArtist({ onCreated }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const pickAvatar = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const up = await uploadImage(f, "music-app/avatars");
    setAvatarUrl(up.url);
  };

  const create = async () => {
    if (!name.trim()) return alert("Nhập tên nghệ sĩ");
    setCreating(true);
    try {
      const artist = await createArtist({ name: name.trim(), bio, avatarUrl });
      alert("Đã tạo nghệ sĩ");
      onCreated?.(artist);
      setName("");
      setBio("");
      setAvatarUrl("");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Tạo nghệ sĩ thất bại");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ ...panelStyle, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>Thêm nghệ sĩ mới</h3>
      <label>
        Tên nghệ sĩ
        <br />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Heki"
          style={inputStyle}
        />
      </label>
      <label>
        Tiểu sử
        <br />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          style={{ ...inputStyle, minHeight: 140 }}
        />
      </label>
      <label>
        Avatar
        <br />
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            width={120}
            style={{
              borderRadius: 8,
              display: "block",
              marginBottom: 8,
              objectFit: "cover",
            }}
          />
        ) : null}
        <input type="file" accept="image/*" onChange={pickAvatar} />
      </label>
      <div>
        <button onClick={create} disabled={creating}>
          {creating ? "Đang tạo..." : "Tạo nghệ sĩ"}
        </button>
      </div>
    </div>
  );
}

/* =============== Page =============== */
export default function AdminArtist() {
  const [picked, setPicked] = useState(null);

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

      <ArtistSearch onPick={setPicked} />

      <CreateArtist onCreated={setPicked} />

      {picked ? (
        <ArtistEditor
          artist={picked}
          onSaved={setPicked}
          onDeleted={() => setPicked(null)}
        />
      ) : (
        <div style={{ ...panelStyle, opacity: 0.7 }}>
          Chọn một nghệ sĩ từ danh sách để chỉnh sửa hoặc dùng form bên trên để
          thêm nghệ sĩ mới.
        </div>
      )}
    </div>
  );
}
