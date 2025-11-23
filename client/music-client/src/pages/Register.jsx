import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { register as registerUser } from "../auth/firebase";
import { api, uploadImage } from "../api";
import { t } from "../ui/toast";
import "../styles/auth.css";

// Icons
const Eye = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M1.5 12s3.75-7.5 10.5-7.5S22.5 12 22.5 12s-3.75 7.5-10.5 7.5S1.5 12 1.5 12Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const EyeOff = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M9.88 9.88A3.5 3.5 0 0012 15.5c1.93 0 3.5-1.57 3.5-3.5 0-.57-.14-1.12-.38-1.6"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M2 12s3.75-7.5 10.5-7.5c2.22 0 4.1.66 5.68 1.57M22 12s-3.75 7.5-10.5 7.5c-2.22 0-4.1-.66-5.68-1.57"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      t?.err?.("Chi nhan file anh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      t?.err?.("Anh toi da 5MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      let avatarUrl = "";
      if (avatarFile) {
        setUploading(true);
        const uploaded = await uploadImage(
          avatarFile,
          "music-app/user-avatars"
        );
        avatarUrl = uploaded?.url || "";
        if (!avatarUrl) throw new Error("Khong lay duoc anh dai dien.");
      }

      await registerUser(email.trim(), pw, {
        displayName: displayName.trim() || undefined,
        photoURL: avatarUrl || undefined,
      });
      // Đồng bộ user vào DB (bỏ qua lỗi nếu có)
      await api.post("/me/sync").catch(() => {});
      t?.ok?.("Đăng ký thành công!");
      navigate("/");
    } catch (err) {
      console.error(err);
      t?.err?.("Đăng ký thất bại: " + (err?.message || "Lỗi không xác định"));
    } finally {
      setUploading(false);
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Đăng ký</h1>
        {/* <p className="auth-subtitle">Tạo tài khoản mới để bắt đầu 🎧</p> */}

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-label">
            Ten hien thi
            <input
              className="auth-input"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ten se hien tren giao dien"
            />
          </label>

          {/* <div className="avatar-picker">
            <p className="avatar-picker__label">Anh dai dien (tuy chon)</p>
            <div className="avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
              ) : (
                <span className="-empty">Chua chon anh</span>
              )}
            </div>
            {avatarFile ? (
              <div className="file-chip">
                <span>{avatarFile.name}</span>
                <button
                  type="button"
                  aria-label="Xoa anh"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview("");
                  }}
                >
                  x
                </button>
              </div>
            ) : null} */}
          {/* <input
              className="avatar-picker__file"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={busy}
            />
            {uploading ? (
              <small style={{ opacity: 0.8 }}>Dang tai anh len...</small>
            ) : null}
          </div> */}

          <label className="auth-label">
            Mật khẩu (≥6)
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                minLength={6}
                placeholder="Ít nhất 6 ký tự"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                title={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>

          <button className="auth-btn" disabled={busy}>
            {busy ? "Đang xử lý..." : "Đăng ký"}
          </button>

          <div className="auth-foot">
            Đã có tài khoản? <NavLink to="/login">Đăng nhập</NavLink>
          </div>
        </form>
      </div>
    </div>
  );
}
