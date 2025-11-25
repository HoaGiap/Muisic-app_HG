// src/components/ResizableSidebar.jsx
import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ---- Minimal icon set (24x24, stroke currentColor) ---- */
const Ico = ({ children, size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IHome = () => (
  <Ico>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9v11h14V9" />
    <path d="M9 21v-6h6v6" />
  </Ico>
);
const ISearch = () => (
  <Ico>
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-3.5-3.5" />
  </Ico>
);
const ILibrary = () => (
  <Ico>
    <rect x="3" y="4" width="6" height="16" rx="1" />
    <rect x="10" y="4" width="6" height="16" rx="1" />
    <path d="M21 20V4" />
  </Ico>
);
const IChart = () => (
  <Ico>
    <path d="M3 3v18h18" />
    <path d="m7 14 4-5 4 4 3-6" />
  </Ico>
);
const IDashboard = () => (
  <Ico>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="5" rx="2" />
    <rect x="13" y="10" width="8" height="11" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
  </Ico>
);
const IUpload = () => (
  <Ico>
    <path d="M12 16V4" />
    <path d="M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 20h16" />
  </Ico>
);
const IFolder = () => (
  <Ico>
    <path d="M3 7h5l2 2h11v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </Ico>
);
const IArtist = () => (
  <Ico>
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Ico>
);
const IAlbum = () => (
  <Ico>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2" />
  </Ico>
);
const ISong = () => (
  <Ico>
    <path d="M9 18a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    <path d="M15 4v13a3 3 0 1 0 2 2V6h4V4h-6Z" />
  </Ico>
);

export default function ResizableSidebar({
  min = 200,
  max = 420,
  collapsedWidth = 72,
  defaultWidth = 260,
  isAdmin = false,
}) {
  const saved = Number(localStorage.getItem("sidebar:w")) || defaultWidth;
  const [w, setW] = useState(saved);
  const [dragging, setDragging] = useState(false);

  const startX = useRef(0);
  const startW = useRef(saved);

  const isCollapsed = w <= collapsedWidth + 2;

  useEffect(() => {
    localStorage.setItem("sidebar:w", String(w));
  }, [w]);

  const onMouseDown = (e) => {
    setDragging(true);
    startX.current = e.clientX;
    startW.current = w;
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e) => {
    const dx = e.clientX - startX.current;
    const next = Math.min(max, Math.max(min, startW.current + dx));
    setW(next);
  };
  const onMouseUp = () => {
    setDragging(false);
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const toggleCollapse = () => {
    if (isCollapsed) {
      const last = Number(localStorage.getItem("sidebar:last")) || defaultWidth;
      setW(last);
    } else {
      localStorage.setItem("sidebar:last", String(w));
      setW(collapsedWidth);
    }
  };

  return (
    <aside
      className={`rsb ${isCollapsed ? "collapsed" : ""}`}
      style={{ "--sidebar-w": `${w}px` }}
    >
      <div className="rsb-inner">
        <nav className="side-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `side-item ${isActive ? "is-active" : ""}`
            }
          >
            <span className="ico">
              <IHome />
            </span>
            <span className="txt">Home</span>
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) =>
              `side-item ${isActive ? "is-active" : ""}`
            }
          >
            <span className="ico">
              <ISearch />
            </span>
            <span className="txt">Search</span>
          </NavLink>

          <NavLink
            to="/library"
            className={({ isActive }) =>
              `side-item ${isActive ? "is-active" : ""}`
            }
          >
            <span className="ico">
              <ILibrary />
            </span>
            <span className="txt">Library</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="side-section">QUẢN LÝ</div>

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">
                  <IChart />
                </span>
                <span className="txt">Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">
                  <IDashboard />
                </span>
                <span className="txt">Bảng quản trị</span>
              </NavLink>

              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">
                  <IUpload />
                </span>
                <span className="txt">Upload</span>
              </NavLink>

              <NavLink
                to="/me"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">
                  <IFolder />
                </span>
                <span className="txt">My Uploads</span>
              </NavLink>

              <NavLink
                to="/admin/artist"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">
                  <IArtist />
                </span>
                <span className="txt">Quản lý nghệ sĩ</span>
              </NavLink>

              <NavLink
                to="/admin/album"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">
                  <IAlbum />
                </span>
                <span className="txt">Quản lý album</span>
              </NavLink>

              <NavLink
                to="/admin/song"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">
                  <ISong />
                </span>
                <span className="txt">Quản lý bài hát</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <div
        className={`rsb-handle ${dragging ? "dragging" : ""}`}
        onMouseDown={onMouseDown}
        onDoubleClick={toggleCollapse}
        title="Kéo để đổi kích thước • Double-click để thu gọn/mở rộng"
      />
    </aside>
  );
}
