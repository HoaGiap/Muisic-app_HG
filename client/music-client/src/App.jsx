import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Library from "./pages/Library.jsx";
import MyUploads from "./pages/MyUploads.jsx";
import Upload from "./pages/Upload.jsx";
import Player from "./components/Player.jsx";
import { auth, login, register, logout } from "./auth/firebase";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return unsub; // ✅ cleanup
  }, []);

  const doAuth = async () => {
    if (user) {
      await logout();
      return;
    }
    const email = prompt("Email:");
    if (!email) return;
    const pw = prompt("Mật khẩu (>=6 ký tự):");
    if (!pw) return;
    try {
      await login(email, pw);
      alert("Đăng nhập OK");
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        try {
          await register(email, pw);
          alert("Đăng ký & đăng nhập OK");
        } catch (e2) {
          alert("Đăng ký lỗi: " + (e2.message || e2.code));
        }
      } else {
        alert("Đăng nhập lỗi: " + (e.message || e.code));
      }
    }
  };

  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    padding: "4px 8px",
    borderRadius: 6,
    color: isActive ? "#0d6efd" : "#111",
    background: isActive ? "rgba(13,110,253,.08)" : "transparent",
  });

  const RequireAuth = ({ children }) =>
    user ? (
      children
    ) : (
      <p style={{ padding: 16 }}>Bạn cần đăng nhập để truy cập trang này.</p>
    );

  return (
    <BrowserRouter>
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            padding: 12,
            borderBottom: "1px solid #eee",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <NavLink to="/" style={linkStyle}>
            Home
          </NavLink>
          <NavLink to="/search" style={linkStyle}>
            Search
          </NavLink>
          <NavLink to="/library" style={linkStyle}>
            Library
          </NavLink>
          <NavLink to="/upload" style={linkStyle}>
            Upload
          </NavLink>
          <NavLink to="/me" style={linkStyle}>
            My Uploads
          </NavLink>

          <span style={{ marginLeft: "auto", opacity: 0.8 }}>
            {user ? user.email : "Chưa đăng nhập"}
          </span>
          <button onClick={doAuth}>
            {user ? "Logout" : "Login / Register"}
          </button>
        </header>

        <main style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<Library />} />
            <Route
              path="/upload"
              element={
                <RequireAuth>
                  <Upload />
                </RequireAuth>
              }
            />
            <Route
              path="/me"
              element={
                <RequireAuth>
                  <MyUploads />
                </RequireAuth>
              }
            />
          </Routes>
        </main>

        <Player />
      </div>
    </BrowserRouter>
  );
}
