import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { auth } from "../auth/firebase";
import { uploadImage } from "../api";
import { t } from "../ui/toast";

export default function Profile() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    setDisplayName(u.displayName || "");
    setAvatarPreview(u.photoURL || "");
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    }
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(auth.currentUser?.photoURL || "");
      return;
    }
    if (!file.type.startsWith("image/")) {
      t.err("Chỉ nhận file ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      t.err("Ảnh tối đa 5MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return navigate("/login");
    setSaving(true);
    try {
      let photoURL = avatarPreview || "";
      if (avatarFile) {
        const uploaded = await uploadImage(
          avatarFile,
          "music-app/user-avatars"
        );
        photoURL = uploaded?.url || "";
        if (!photoURL) throw new Error("Không lấy được ảnh đại diện.");
      }

      const name = displayName.trim() || user.email?.split("@")[0] || "User";
      await updateProfile(user, {
        displayName: name,
        photoURL,
      });
      await user.reload();
      await user.getIdToken(true);
      setDisplayName(auth.currentUser?.displayName || name);
      setAvatarPreview(auth.currentUser?.photoURL || photoURL);
      setAvatarFile(null);
      t.ok("Đã cập nhật profile.");
    } catch (err) {
      console.error(err);
      t.err("Cập nhật thất bại: " + (err?.message || "Lỗi không xác định"));
    } finally {
      setSaving(false);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="page" style={{ padding: "24px" }}>
        <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
          <p>Vui lòng đăng nhập để chỉnh sửa profile.</p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Tới trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: "24px" }}>
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Chỉnh sửa Profile</h2>
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          Cập nhật tên hiển thị và ảnh đại diện của bạn.
        </p>

        <form className="form" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label className="auth-label">
            Tên hiển thị
            <input
              className="auth-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên sẽ hiển thị trên giao diện"
              disabled={saving}
            />
          </label>

          <div className="avatar-picker">
            <p className="avatar-picker__label">Ảnh đại diện</p>
            <div className="avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
              ) : (
                <span className="-empty">Chưa chọn ảnh</span>
              )}
            </div>
            {avatarPreview ? (
              <div className="file-chip">
                <span>{avatarFile?.name || "Ảnh hiện tại"}</span>
                <button
                  type="button"
                  aria-label="Xóa ảnh"
                  onClick={clearAvatar}
                  disabled={saving}
                >
                  x
                </button>
              </div>
            ) : null}
            <input
              className="avatar-picker__file"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={saving}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              className="btn btn-muted"
              type="button"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
