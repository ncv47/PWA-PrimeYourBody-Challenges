import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const authed = localStorage.getItem("mpakt-auth") === "1";
  return authed ? <Outlet /> : <Navigate to="/login" replace />;
}
