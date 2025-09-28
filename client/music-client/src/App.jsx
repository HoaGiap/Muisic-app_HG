import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Library from "./pages/Library.jsx";
import MyUploads from "./pages/MyUploads.jsx";
import Player from "./components/Player.jsx";
import { auth, login, register, logout } from "./auth/firebase";
import { useEffect, useState } from "react";
import Upload from "./pages/Upload.jsx";
import SongDetail from "./pages/SongDetail.jsx";
import PlaylistDetail from "./pages/PlaylistDetail.jsx";
import QueuePanel from "./components/QueuePanel.jsx";
import usePlayerPersistence from "./hooks/usePlayerPersistence.js";
import { t } from "./ui/toast.js";
import DebugAdmin from "./DebugAdmin.jsx";

// ✅ mới:
import useAuthClaims from "./auth/useAuthClaims.js";
import AdminRoute from "./routes/AdminRoute.jsx";

export default function App() {
  usePlayerPersistence();

  // vẫn giữ state user để hiển thị email nhanh
  const [user, setUser] = useState(null);
  useEffect(() => auth.onAuthStateChanged(setUser), []);

  // ✅ lấy claims
  const { isAdmin } = useAuthClaims();

  // THEME
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || (prefersDark ? "dark" : "light")
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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
      await login(email, pw).catch(async () => {
        await register(email, pw);
      });
      t.ok("Đăng nhập OK");
    } catch (e) {
      t.err("Auth lỗi: " + e.message);
    }
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
      {/* (tuỳ chọn) bật lên để xem log isAdmin ở Console */}
      <DebugAdmin />

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
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <NavLink to="/">Home</NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/library">Library</NavLink>

          {/* ✅ chỉ admin mới thấy */}
          {isAdmin && <NavLink to="/upload">Upload</NavLink>}
          {isAdmin && <NavLink to="/me">My Uploads</NavLink>}

          <span style={{ marginLeft: "auto", opacity: 0.8 }}>
            {user ? (
              <>
                {user.email}
                {isAdmin && (
                  <span
                    style={{
                      marginLeft: 8,
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: "var(--accent, #4ade80)",
                      color: "#000",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </>
            ) : (
              "Chưa đăng nhập"
            )}
          </span>

          <button onClick={doAuth}>
            {user ? "Logout" : "Login / Register"}
          </button>

          {/* Toggle theme */}
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </header>

        <main style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<Library />} />

            {/* ✅ route admin-only */}
            <Route
              path="/upload"
              element={
                <AdminRoute>
                  <Upload />
                </AdminRoute>
              }
            />
            <Route
              path="/me"
              element={
                <AdminRoute>
                  <MyUploads />
                </AdminRoute>
              }
            />

            <Route path="/song/:id" element={<SongDetail />} />
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
          </Routes>
        </main>

        <QueuePanel />
        <Player />
      </div>
    </BrowserRouter>
  );
}
