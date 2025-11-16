// src/pages/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { t } from "../ui/toast";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";

function Badge({ children, color = "auto" }) {
  const bg =
    color === "green"
      ? "var(--accent, #4ade80)"
      : color === "red"
      ? "crimson"
      : "rgba(128,128,128,.2)";
  const fg = color === "green" ? "#000" : "inherit";
  return (
    <span
      style={{
        padding: "2px 6px",
        borderRadius: 6,
        background: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

export default function Admin() {
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState("lastLoginAt");
  const [sortDir, setSortDir] = useState("desc");
  const [menuUid, setMenuUid] = useState(null);

  const selfUid = getAuth().currentUser?.uid || null; // ✅ UID của chính mình

  const load = async (opts = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", {
        params: { limit: 50, next: opts.next || "", q },
      });
      setItems((old) => (opts.append ? [...old, ...data.users] : data.users));
      setNext(data.nextPageToken || null);
    } catch (e) {
      console.error(e);
      t.err("Không tải được danh sách user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const onDocClick = () => setMenuUid(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const onToggleAdmin = async (u) => {
    const newVal = !u.admin;
    try {
      await api.post(`/admin/users/${u.uid}/admin`, { isAdmin: newVal });
      setItems((arr) =>
        arr.map((x) => (x.uid === u.uid ? { ...x, admin: newVal } : x))
      );
      t.ok(`${newVal ? "Đã cấp" : "Đã bỏ"} admin cho ${u.email || u.uid}`);
    } catch (e) {
      console.error(e);
      t.err("Thao tác thất bại");
    }
  };

  const onToggleDisabled = async (u) => {
    const newVal = !u.disabled;
    try {
      await api.post(`/admin/users/${u.uid}/disabled`, { disabled: newVal });
      setItems((arr) =>
        arr.map((x) => (x.uid === u.uid ? { ...x, disabled: newVal } : x))
      );
      t.ok(`${newVal ? "Đã khóa" : "Đã mở khóa"} ${u.email || u.uid}`);
    } catch (e) {
      console.error(e);
      t.err("Thao tác thất bại");
    }
  };

  const onRevokeTokens = async (u) => {
    if (!confirm(`Thu hồi phiên đăng nhập của ${u.email || u.uid}?`)) return;
    try {
      await api.post(`/admin/users/${u.uid}/revoke`);
      t.ok("Đã thu hồi, người dùng sẽ phải đăng nhập lại.");
    } catch (e) {
      console.error(e);
      t.err("Thu hồi thất bại");
    }
  };

  // ✅ CHUYỂN QUYỀN DỮ LIỆU (bài hát/playlist)
  const onTransferOwnership = async (u) => {
    const toUid = prompt(
      `Nhập UID người nhận dữ liệu của ${u.email || u.uid}.\n` +
        `Toàn bộ bài hát & playlist sẽ chuyển sang UID này.`
    );
    if (!toUid) return;
    if (toUid === u.uid) return t.err("UID đích phải khác UID nguồn.");
    if (!confirm(`XÁC NHẬN chuyển dữ liệu từ ${u.uid} sang ${toUid}?`)) return;

    try {
      const { data } = await api.post("/admin/transfer", {
        fromUid: u.uid,
        toUid,
      });
      t.ok(
        `Đã chuyển: songs=${data.songsUpdated} • playlists=${data.playlistsUpdated}`
      );
    } catch (e) {
      console.error(e);
      t.err(e.response?.data?.error || "Transfer thất bại");
    }
  };

  // ❌ KHÔNG CHO XÓA CHÍNH MÌNH
  const onDeleteUser = async (u) => {
    if (u.uid === selfUid) {
      return t.err("Không thể tự xóa chính mình.");
    }
    if (
      !confirm(
        `XÓA vĩnh viễn user ${
          u.email || u.uid
        }?\nBạn nên "Transfer" dữ liệu trước khi xóa!`
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${u.uid}`);
      setItems((arr) => arr.filter((x) => x.uid !== u.uid));
      t.ok("Đã xóa user");
    } catch (e) {
      console.error(e);
      t.err("Xóa thất bại");
    }
  };

  const onSendReset = async (u) => {
    try {
      if (!u.email) return t.err("User này không có email.");
      await sendPasswordResetEmail(getAuth(), u.email);
      t.ok("Đã gửi email đặt lại mật khẩu.");
    } catch (e) {
      console.error(e);
      t.err("Gửi email thất bại");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...items];
    const getVal = (x) => {
      if (sortKey === "email") return (x.email || "").toLowerCase();
      if (sortKey === "createdAt") return new Date(x.createdAt || 0).getTime();
      if (sortKey === "lastLoginAt")
        return new Date(x.lastLoginAt || 0).getTime();
      return 0;
    };
    arr.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      return sortDir === "asc"
        ? va > vb
          ? 1
          : va < vb
          ? -1
          : 0
        : va < vb
        ? 1
        : va > vb
        ? -1
        : 0;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  return (
    <div>
      <h2>Quản trị người dùng</h2>

      {/* Toolbar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Sắp xếp:
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="lastLoginAt">Lần đăng nhập gần nhất</option>
            <option value="createdAt">Ngày tạo</option>
            <option value="email">Email</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="desc">↓ Giảm dần</option>
            <option value="asc">↑ Tăng dần</option>
          </select>
        </label>

        <input
          placeholder="Tìm theo email / tên / UID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%" }}
        />

        <button onClick={() => load({ append: false })} disabled={loading}>
          Tải lại
        </button>
        <button
          onClick={() => next && load({ append: true, next })}
          disabled={!next || loading}
        >
          Tải thêm
        </button>
      </div>

      {/* List */}
      <div className="admin-users-table-wrap">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th className="center-cell col-narrow">Quyền</th>
              <th className="center-cell col-narrow">Trạng thái</th>
              <th>Ngày tham gia</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.uid}>
                <td>
                  <div className="user-email">
                    {u.email || "(no email)"}
                    {u.providerIds?.length ? (
                      <span className="user-provider">
                        + {u.providerIds.join(", ")}
                      </span>
                    ) : null}
                  </div>
                  {u.displayName && (
                    <div className="user-sub">{u.displayName}</div>
                  )}
                  <div className="user-sub">UID: {u.uid}</div>
                  <div className="user-sub">
                    Tạo: {u.createdAt || "-"} · Đăng nhập: {u.lastLoginAt || "-"}
                  </div>
                </td>
                <td className="center-cell col-narrow">
                  {u.admin ? <Badge color="green">ADMIN</Badge> : <Badge>USER</Badge>}
                </td>
                <td className="center-cell col-narrow">
                  {u.disabled ? <Badge color="red">LOCKED</Badge> : <Badge>ACTIVE</Badge>}
                </td>
                <td className="user-sub">{u.createdAt || "-"}</td>
                <td>
                  <div className="user-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-ghost"
                      onClick={() => onToggleDisabled(u)}
                    >
                      {u.disabled ? "Mở khóa" : "Khóa"}
                    </button>
                    {u.uid !== selfUid && (
                      <button
                        className="btn-danger"
                        onClick={() => onDeleteUser(u)}
                      >
                        Xóa
                      </button>
                    )}
                    <div className="action-menu">
                      <button
                        className="btn-ghost kebab"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuUid((cur) => (cur === u.uid ? null : u.uid));
                        }}
                      >
                        ...
                      </button>
                      {menuUid === u.uid && (
                        <div className="action-menu__list">
                          <button
                            onClick={() => {
                              setMenuUid(null);
                              onToggleAdmin(u);
                            }}
                          >
                            {u.admin ? "Bỏ admin" : "Cấp admin"}
                          </button>
                          <button
                            onClick={() => {
                              setMenuUid(null);
                              onRevokeTokens(u);
                            }}
                          >
                            Thu hồi phiên
                          </button>
                          <button
                            onClick={() => {
                              setMenuUid(null);
                              onSendReset(u);
                            }}
                          >
                            Reset mật khẩu
                          </button>
                          <button
                            onClick={() => {
                              setMenuUid(null);
                              onTransferOwnership(u);
                            }}
                          >
                            Transfer data
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {loading && <p style={{ marginTop: 12, opacity: 0.8 }}>Đang tải…</p>}
      {!loading && !sorted.length && <p>(Chưa có user nào khớp bộ lọc)</p>}
    </div>
  );
}
