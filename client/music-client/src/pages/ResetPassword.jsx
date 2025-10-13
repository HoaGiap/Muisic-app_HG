import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../auth/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { t } from "../ui/toast";

export default function ResetPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const target = email.trim();
    if (!target) return t.err("Nhập email để khôi phục.");
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, target);
      setSent(true);
      t.ok("Đã gửi email khôi phục mật khẩu.");
    } catch (e) {
      t.err("Không thể gửi email: " + (e?.message || "Lỗi"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.title}>Khôi phục mật khẩu</h2>
        {sent ? (
          <div style={{ display: "grid", gap: 12 }}>
            <p>
              Hãy kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật
              khẩu.
            </p>
            <div style={styles.row}>
              <button onClick={() => nav("/login")} style={styles.primaryBtn}>
                Về trang đăng nhập
              </button>
              <Link to="/" style={styles.linkA}>
                Về trang chủ
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={styles.form}>
            <label style={styles.label}>
              Email
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </label>

            <div style={styles.row}>
              <button disabled={busy} style={styles.primaryBtn}>
                {busy ? "Đang gửi..." : "Gửi email khôi phục"}
              </button>
              <Link to="/login" style={styles.linkA}>
                Huỷ
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: "grid", placeItems: "start", padding: "24px 16px" },
  card: {
    width: "min(520px, 100%)",
    background: "var(--panel, #fff)",
    border: "1px solid var(--border, rgba(0,0,0,.1))",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 6px 20px rgba(0,0,0,.05)",
  },
  title: { margin: 0, marginBottom: 12, fontSize: 22 },
  form: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontWeight: 600, fontSize: 14 },
  input: {
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--border, rgba(0,0,0,.12))",
    background: "var(--input, #fff)",
    outline: "none",
  },
  row: { display: "flex", gap: 12, alignItems: "center" },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "var(--accent, #22c55e)",
    color: "#000",
    fontWeight: 700,
    cursor: "pointer",
  },
  linkA: {
    color: "var(--link, #2563eb)",
    textDecoration: "none",
    fontWeight: 600,
  },
};
