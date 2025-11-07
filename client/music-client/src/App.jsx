// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

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
import Admin from "./pages/Admin.jsx"; // ✅ thêm
import AdminAlbum from "./pages/AdminAlbum.jsx";
import AdminSong from "./pages/AdminSong.jsx";
import QueuePanel from "./components/QueuePanel.jsx";
import Player from "./components/Player.jsx";
import usePlayerPersistence from "./hooks/usePlayerPersistence.js";
import useAuthClaims from "./auth/useAuthClaims.js";
import AdminRoute from "./routes/AdminRoute.jsx";
import { auth, logout } from "./auth/firebase";
import VerifyBanner from "./components/VerifyBanner.jsx";
import ArtistDetail from "./pages/ArtistDetail.jsx";
import AlbumDetail from "./pages/AlbumDetail.jsx";

import AdminArtist from "./pages/AdminArtist.jsx";

function AppShell() {
  usePlayerPersistence();
  const navigate = useNavigate();

  // Hiển thị email nhanh
  const [user, setUser] = useState(null);
  useEffect(() => auth.onAuthStateChanged(setUser), []);

  // Claim admin
  const { isAdmin } = useAuthClaims();

  // THEME
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches; // ✅ .matches đúng

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

  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    padding: "6px 8px",
    borderRadius: 6,
    fontWeight: 600,
    color: "inherit",
    background: isActive
      ? "var(--btn-bg, rgba(128,128,128,.2))"
      : "transparent",
  });

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
        <header
          style={{
            padding: 12,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <NavLink to="/" style={linkStyle} end>
            Home
          </NavLink>
          <NavLink to="/search" style={linkStyle}>
            Search
          </NavLink>
          <NavLink to="/library" style={linkStyle}>
            Library
          </NavLink>
          {/* Admin-only links */}
          {isAdmin && (
            <NavLink to="/upload" style={linkStyle}>
              Upload
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/me" style={linkStyle}>
              My Uploads
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/artist" style={linkStyle}>
              Manage Artists
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/album" style={linkStyle}>
              Manage Albums
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/song" style={linkStyle}>
              Manage Songs
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" style={linkStyle}>
              Admin
            </NavLink>
          )}{" "}
          {/* ✅ mới */}
          <span
            style={{
              marginLeft: "auto",
              opacity: 0.9,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {user ? (
              <>
                <span>{user.email}</span>
                {isAdmin && (
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: "var(--accent, #4ade80)",
                      color: "#000",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ADMIN
                  </span>
                )}
                <button onClick={doLogout}>Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login" style={linkStyle}>
                  Login
                </NavLink>
                <NavLink to="/register" style={linkStyle}>
                  Register
                </NavLink>
              </>
            )}
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          </span>
        </header>

        <main style={{ padding: 16 }}>
          <VerifyBanner />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<Library />} />

            {/* Auth pages */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset" element={<ResetPassword />} />

            {/* Admin-only routes */}
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

            {/* ✅ KHÔNG lồng <Routes> ở đây nữa */}
            <Route
              path="/admin/artist"
              element={
                <AdminRoute>
                  <AdminArtist />
                </AdminRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
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
          </Routes>
        </main>

        <QueuePanel />
        <Player />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
