import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import "./App.css";

function App() {
  const [authed, setAuthed] = useState(localStorage.getItem("mpakt-auth") === "1");

  // update als login/logout in dezelfde tab gebeurt
  useEffect(() => {
    const onStorage = () => setAuthed(localStorage.getItem("mpakt-auth") === "1");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* login NIET in MainLayout steken */}
        <Route
          path="/login"
          element={authed ? <Navigate to="/home" replace /> : <LoginPage />}
        />

        {/* alles met layout */}
        <Route element={<MainLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
