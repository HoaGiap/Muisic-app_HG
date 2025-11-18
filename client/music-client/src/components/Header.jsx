// client/src/components/Header.jsx
import { NavLink, Link } from "react-router-dom";
// Lấy cờ isAdmin từ nơi bạn đang lưu (Firebase claims, store…)
import { getAuth } from "firebase/auth";

function useIsAdmin() {
  try {
    const u = getAuth().currentUser;
   
    return !!(u && (u.admin || u.isAdmin || u?.stsTokenManager));
  } catch {
    return false;
  }
}

export default function Header() {
  const isAdmin = useIsAdmin();

  return (
    <header>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px var(--page-x)",
        }}
      >
        <Link to="/" style={{ fontWeight: 800, color: "inherit" }}>
          Muziq
        </Link>

        {/* Điều hướng chính cho người nghe */}
        <nav className="header-nav" style={{ display: "flex", gap: 6 }}>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/library">Library</NavLink>
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {/* Nhóm Quản lý (chỉ hiện khi có quyền) */}
          {isAdmin && (
            <details className="header-manage">
              <summary
                style={{
                  listStyle: "none",
                  cursor: "pointer",
                  padding: "6px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  background: "var(--card)",
                }}
              >
                ⚙️ Quản lý
              </summary>
              <div className="menu">
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  <li>
                    <Link to="/upload">Upload</Link>
                  </li>
                  <li>
                    <Link to="/admin/artist">Manage Artists</Link>
                  </li>
                  <li>
                    <Link to="/admin/album">Manage Albums</Link>
                  </li>
                  <li>
                    <Link to="/admin/song">Manage Songs</Link>
                  </li>
                  <li>
                    <Link to="/admin">Admin</Link>
                  </li>
                </ul>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}
