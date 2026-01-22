import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";

import { supabase } from "./lib/supabase";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error(error);
      setSession(data?.session || null);
      setLoadingSession(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
      setLoadingSession(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Zorg dat app niet “flikkert” op start
  if (loadingSession) {
    return <div style={{ padding: 24 }}>Laden...</div>;
  }

  const authed = !!session;

  return (
    <Router>
      <Routes>
        {/* Layout staat altijd rond alle pagina’s => navbar kan altijd renderen */}
        <Route element={<MainLayout session={session} />}>
          {/* Default route */}
          <Route path="/" element={<Navigate to={authed ? "/home" : "/login"} replace />} />

          {/* Login */}
          <Route
            path="/login"
            element={authed ? <Navigate to="/home" replace /> : <LoginPage />}
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute session={session} />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={authed ? "/home" : "/login"} replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
