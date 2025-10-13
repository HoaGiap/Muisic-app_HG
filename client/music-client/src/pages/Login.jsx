import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { login, auth } from "../auth/firebase";
import { api } from "../api";
import { t } from "../ui/toast";
import "../styles/auth.css";

// Inline icons
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

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), pw);
      // Đồng bộ user vào DB (bỏ qua lỗi nếu có)
      await api.post("/me/sync").catch(() => {});
      t?.ok?.("Đăng nhập thành công!");
      navigate("/");
    } catch (err) {
      console.error(err);
      t?.err?.("Đăng nhập thất bại: " + (err?.message || "Lỗi không xác định"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng quay lại 👋</p>

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
            Mật khẩu
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                placeholder="••••••••"
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

          {/* Quên mật khẩu nằm giữa password và nút */}
          <div className="auth-forgot">
            <NavLink to="/reset">Quên mật khẩu?</NavLink>
          </div>

          <button className="auth-btn" disabled={busy}>
            {busy ? "Đang xử lý..." : "Đăng nhập"}
          </button>

          <div className="auth-foot">
            Chưa có tài khoản? <NavLink to="/register">Đăng ký</NavLink>
          </div>
        </form>
      </div>
    </div>
  );
}
