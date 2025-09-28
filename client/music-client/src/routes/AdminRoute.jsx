// src/routes/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import useAuthClaims from "../auth/useAuthClaims";

export default function AdminRoute({ children }) {
  const { loading, isAdmin } = useAuthClaims();
  if (loading) return null; // có thể thay bằng spinner
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
