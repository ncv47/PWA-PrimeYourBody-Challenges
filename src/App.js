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
  const authed = localStorage.getItem("mpakt-auth") === "1";

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} /> {/* [web:12] */}

        {/* Alles in dezelfde layout */}
        <Route element={<MainLayout />}>
          <Route
            path="/login"
            element={authed ? <Navigate to="/home" replace /> : <LoginPage />}
          /> {/* [web:12] */}

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} /> {/* [web:12] */}
      </Routes>
    </Router>
  );
}

export default App;
