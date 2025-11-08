// client/src/components/VerifyBanner.jsx
import { useEffect, useState } from "react";
import {
  getAuth,
  sendEmailVerification,
  onAuthStateChanged,
} from "firebase/auth";
import toast from "react-hot-toast";

export default function VerifyBanner() {
  const auth = getAuth();
  const [user, setUser] = useState(auth.currentUser);
  const [sending, setSending] = useState(false);
  // 1. THAY ĐỔI: Thêm state để theo dõi trạng thái đóng/mở
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, [auth]);

  // 2. THAY ĐỔI: Thêm `!isVisible` vào điều kiện.
  // Nếu user chưa xác thực HOẶC đã bị đóng, return null.
  if (!user || user.emailVerified || !isVisible) return null;

  const resend = async () => {
    try {
      setSending(true);
      await sendEmailVerification(user);
      toast.success("Đã gửi lại email xác thực.");
    } catch (e) {
      console.error(e);
      toast.error("Gửi email thất bại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
        background: "rgba(250,204,21,.12)",
        border: "1px solid rgba(250,204,21,.4)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span>
        <b>Email chưa xác thực.</b> Vui lòng kiểm tra hộp thư để xác nhận tài
        khoản.
      </span>
      <button className="pill" onClick={resend} disabled={sending}>
        {sending ? "Đang gửi…" : "Gửi lại"}
      </button>

      {/* 3. THAY ĐỔI: Thêm nút đóng (Close Button) */}
      <button
        onClick={() => setIsVisible(false)}
        title="Đóng"
        style={{
          marginLeft: "auto", // Quan trọng: đẩy nút sang hết bên phải
          border: "none",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          fontSize: "18px", // Làm cho dấu "X" to hơn một chút
          lineHeight: 1,
          padding: "4px",
          opacity: 0.7,
        }}
      >
        &times; {/* Đây là ký tự dấu "X" */}
      </button>
    </div>
  );
}
