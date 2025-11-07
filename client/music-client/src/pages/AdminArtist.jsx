import { useEffect, useMemo, useState } from "react";
import {
  searchArtists,
  updateArtist,
  createArtist,
  deleteArtist,
  uploadImage,
} from "../api";
// client/src/pages/AdminArtist.jsx

import { Link } from "react-router-dom";

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
    <div style={{ display: "grid", gap: 8 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm nghệ sĩ theo tên…"
        style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
      />
      {loading ? <div>Đang tìm…</div> : null}
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
              src={a.avatarUrl || "/logosite.png"}
              alt=""
              width={52}
              height={52}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
            <div style={{ display: "grid" }}>
              <strong>{a.name}</strong>
              <small style={{ opacity: 0.7 }}>
                {(a.followerCount ?? 0).toLocaleString()} theo dõi
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
      alert("Lỗi lưu nghệ sĩ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Xoá nghệ sĩ "${artist?.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteArtist(artist._id);
      alert("Đã xoá nghệ sĩ");
      onDeleted?.();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  };

  if (!artist) return null;
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Sửa nghệ sĩ</h3>
      <div style={{ display: "flex", gap: 16 }}>
        <img
          src={avatarUrl || "/logosite.png"}
          alt=""
          width={120}
          height={120}
          style={{ borderRadius: 12, objectFit: "cover", background: "#eee" }}
        />
        <div style={{ display: "grid", gap: 8, flex: 1 }}>
          <label>
            Tên
            <br />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>
          <label>
            Bio
            <br />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>
          <label>
            Avatar
            <br />
            <input type="file" accept="image/*" onChange={onPickImage} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu nghệ sĩ"}
            </button>
            <button
              onClick={remove}
              disabled={deleting}
              style={{ background: "#fee2e2", color: "#991b1b" }}
            >
              {deleting ? "Đang xoá…" : "Xoá nghệ sĩ"}
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
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Thêm nghệ sĩ</h3>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Tên nghệ sĩ
          <br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Heki"
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />
        </label>
        <label>
          Bio
          <br />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
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
              style={{ borderRadius: 8, display: "block", marginBottom: 8 }}
            />
          ) : null}
          <input type="file" accept="image/*" onChange={pickAvatar} />
        </label>
        <div>
          <button onClick={create} disabled={creating}>
            {creating ? "Đang tạo…" : "Tạo nghệ sĩ"}
          </button>
        </div>
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
        <span style={{ marginLeft: "auto" }}>
          👉 Quản lý album? Vào{" "}
          <Link to="/admin/album" style={{ fontWeight: 700 }}>
            Manage Albums
          </Link>
        </span>
      </div>

      <ArtistSearch onPick={setPicked} />

      {/* Form tạo nghệ sĩ mới */}
      <CreateArtist onCreated={setPicked} />

      {/* Editor sửa / xoá nghệ sĩ */}
      {picked ? (
        <ArtistEditor
          artist={picked}
          onSaved={setPicked}
          onDeleted={() => setPicked(null)}
        />
      ) : (
        <div style={{ opacity: 0.7 }}>
          (Chọn một nghệ sĩ để chỉnh sửa hoặc dùng form “Thêm nghệ sĩ” ở trên)
        </div>
      )}
    </div>
  );
}
