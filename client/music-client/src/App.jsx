// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef, useState } from "react";

import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Library from "./pages/Library.jsx";
import MyUploads from "./pages/MyUploads.jsx";
import Upload from "./pages/Upload.jsx";
import SongDetail from "./pages/SongDetail.jsx";
import PlaylistDetail from "./pages/PlaylistDetail.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import Admin from "./pages/Admin.jsx";
import AdminAlbum from "./pages/AdminAlbum.jsx";
import AdminSong from "./pages/AdminSong.jsx";
import AdminArtist from "./pages/AdminArtist.jsx";

import QueuePanel from "./components/QueuePanel.jsx";
import Player from "./components/Player.jsx";
import usePlayerPersistence from "./hooks/usePlayerPersistence.js";
import useAuthClaims from "./auth/useAuthClaims.js";
import AdminRoute from "./routes/AdminRoute.jsx";
import { auth, logout } from "./auth/firebase";
import VerifyBanner from "./components/VerifyBanner.jsx";
import ArtistDetail from "./pages/ArtistDetail.jsx";
import AlbumDetail from "./pages/AlbumDetail.jsx";
import Profile from "./pages/Profile.jsx";

import ResizableSidebar from "./components/ResizableSidebar.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";

/* ---------------- AppLayout: layout CHÍNH (có header + sidebar) ---------------- */
function AppLayout({ user, isAdmin, theme, setTheme, doLogout }) {
  const displayName =
    (user?.displayName || "").trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "User";
  const avatarUrl = user?.photoURL || "";
  const avatarInitial = (displayName || "U").charAt(0).toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [menuOpen]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />

      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <header>
          <div
            style={{
              padding: "10px var(--page-x, 24px)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link to="/" className="header-brand" title="Trang chủ">
              <img
                src="/logosite.png"
                alt="Muizq"
                width={42}
                height={42}
                style={{ borderRadius: 6 }}
              />
              <span className="header-brand__title">Muizq</span>
            </Link>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {user ? (
                  <div className="header-user" ref={menuRef}>
                    <button
                      className="header-user__btn"
                      onClick={() => setMenuOpen((s) => !s)}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                    >
                      <div className="header-user__avatar">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" />
                        ) : (
                          <span className="-fallback">{avatarInitial}</span>
                        )}
                      </div>
                      <div className="header-user__info">
                        <div className="header-user__name">{displayName}</div>
                        {isAdmin ? (
                          <div className="header-user__meta">
                            <span className="header-user__badge">ADMIN</span>
                          </div>
                        ) : null}
                      </div>
                    </button>

                    {menuOpen ? (
                      <div className="header-user__menu" role="menu">
                        <Link
                          to="/profile"
                          className="header-user__menu-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          Chỉnh sửa Profile
                        </Link>
                        <button
                          className="header-user__menu-item -danger"
                          onClick={() => {
                            setMenuOpen(false);
                            doLogout();
                          }}
                          role="menuitem"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  // LƯU Ý: các route Login/Register sẽ KHÔNG dùng layout này nữa
                  <div style={{ display: "flex", gap: 10 }}>
                    <Link to="/login" className="icon-btn header-auth-btn">
                      Login
                    </Link>
                    <Link to="/register" className="icon-btn header-auth-btn">
                      Register
                    </Link>
                  </div>
                )}

                {/* <button
                  onClick={() =>
                    setTheme((t) => (t === "dark" ? "light" : "dark"))
                  }
                  className="icon-btn"
                  title="Đổi theme"
                >
                  {theme === "dark" ? "🌙" : "☀️"}
                </button> */}
              </div>
            </div>
          </div>
        </header>

        {/* Layout: Sidebar + Content */}
        <div className="app-layout">
          <ResizableSidebar isAdmin={isAdmin} />

          <main className="app-main">
            <VerifyBanner />
            {/* NHÉT CÁC TRANG CON Ở ĐÂY */}
            <Outlet />
          </main>
        </div>

        <QueuePanel />
        <Player />
      </div>
    </>
  );
}

/* ---------------- Shell: quản lý state + định tuyến ---------------- */
function AppShell() {
  usePlayerPersistence();
  const navigate = useNavigate();

  // Current user
  const [user, setUser] = useState(null);
  useEffect(() => auth.onIdTokenChanged(setUser), []);

  // Admin claim
  const { isAdmin } = useAuthClaims();

  // Theme
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

  const doLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Routes>
      {/* ====== NHÓM ROUTE DÙNG LAYOUT CHÍNH (có header + sidebar) ====== */}
      <Route
        element={
          <AppLayout
            user={user}
            isAdmin={isAdmin}
            theme={theme}
            setTheme={setTheme}
            doLogout={doLogout}
          />
        }
      >
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin-only */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
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
        <Route
          path="/admin/artist"
          element={
            <AdminRoute>
              <AdminArtist />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/album"
          element={
            <AdminRoute>
              <AdminAlbum />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/song"
          element={
            <AdminRoute>
              <AdminSong />
            </AdminRoute>
          }
        />

        {/* Details */}
        <Route path="/artist/:id" element={<ArtistDetail />} />
        <Route path="/album/:id" element={<AlbumDetail />} />
        <Route path="/song/:id" element={<SongDetail />} />
        <Route path="/playlist/:id" element={<PlaylistDetail />} />
      </Route>

      {/* ====== NHÓM ROUTE AUTH DÙNG AuthLayout (KHÔNG header/sidebar) ====== */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset" element={<ResetPassword />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

