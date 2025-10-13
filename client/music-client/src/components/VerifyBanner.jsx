// client/src/components/VerifyBanner.jsx
import { getAuth } from "firebase/auth";

export default function VerifyBanner() {
  const user = getAuth().currentUser;
  if (!user || user.emailVerified) return null;
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        background: "rgba(250,204,21,.15)",
        border: "1px solid rgba(250,204,21,.5)",
      }}
    >
      <b>Email chưa xác thực.</b> Vui lòng kiểm tra hộp thư để xác nhận tài
      khoản.
    </div>
  );
}
