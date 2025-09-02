import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Library from "./pages/Library.jsx";
import MyUploads from "./pages/MyUploads.jsx";
import Player from "./components/Player.jsx";
import { auth, login, register, logout } from "./auth/firebase";
import { useEffect, useState } from "react";
import Upload from "./pages/Upload.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => auth.onAuthStateChanged(setUser), []);

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
      alert("Đăng nhập OK");
    } catch (e) {
      alert("Auth lỗi: " + e.message);
    }
  };

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
          <NavLink to="/">Home</NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/library">Library</NavLink>
          {user && <NavLink to="/upload">Upload</NavLink>}
          {user && <NavLink to="/me">My Uploads</NavLink>}

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
            <Route path="/upload" element={<Upload />} />
            <Route path="/me" element={<MyUploads />} />
          </Routes>
        </main>

        <Player />
      </div>
    </BrowserRouter>
  );
}
