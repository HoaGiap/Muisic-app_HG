import { Outlet } from "react-router-dom";
export default function AuthLayout() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#0b0d12",
        padding: 24,
      }}
    >
      <Outlet />
    </div>
  );
}
