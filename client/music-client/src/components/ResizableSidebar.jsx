// src/components/ResizableSidebar.jsx
import { NavLink, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export default function ResizableSidebar({
  min = 200,
  max = 420,
  collapsedWidth = 72,
  defaultWidth = 260,
  isAdmin = false, // ⬅ nhận từ App.jsx để hiện nhóm QUẢN LÝ
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
    let next = Math.min(max, Math.max(min, startW.current + dx));
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
        {/* <Link to="/" className="rsb-brand">
          <img
            src="/logosite.png"
            width="20"
            height="20"
            alt=""
            style={{ borderRadius: 6 }}
          />
          <span className="rsb-brand-text">web nghe nhạc 02</span>
        </Link> */}

        <nav className="side-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `side-item ${isActive ? "is-active" : ""}`
            }
          >
            <span className="ico">🏠</span>
            <span className="txt">Home</span>
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `side-item ${isActive ? "is-active" : ""}`
            }
          >
            <span className="ico">🔎</span>
            <span className="txt">Search</span>
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `side-item ${isActive ? "is-active" : ""}`
            }
          >
            <span className="ico">🎵</span>
            <span className="txt">Library</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="side-section">QUẢN LÝ</div>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">📊</span>
                <span className="txt">Bảng quản trị</span>
              </NavLink>
              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">⤴️</span>
                <span className="txt">Upload</span>
              </NavLink>
              <NavLink
                to="/me"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">📁</span>
                <span className="txt">My Uploads</span>
              </NavLink>

              {/* QUẢN LÝ CHI TIẾT */}
              <NavLink
                to="/admin/artist"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">👤</span>
                <span className="txt">Quản lý nghệ sĩ</span>
              </NavLink>
              <NavLink
                to="/admin/album"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">💿</span>
                <span className="txt">Quản lý album</span>
              </NavLink>
              <NavLink
                to="/admin/song"
                className={({ isActive }) =>
                  `side-item ${isActive ? "is-active" : ""}`
                }
              >
                <span className="ico">🎧</span>
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
