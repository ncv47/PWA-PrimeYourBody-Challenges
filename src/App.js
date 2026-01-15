import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  const authed = localStorage.getItem("mpakt-auth") === "1";

  return (
    <Router>
      <section className="section">
        <div className="container">
          {/* Navbar verbergen op login-scherm */}
          {authed && (
            <nav className="navbar" role="navigation" aria-label="main navigation">
              <div className="navbar-brand">
                <Link className="navbar-item" to="/home">
                  <strong>MPAKT Challenges</strong>
                </Link>
              </div>
              <div className="navbar-menu">
                <div className="navbar-start">
                  <Link className="navbar-item" to="/home">Home</Link>
                  <Link className="navbar-item" to="/community">Community</Link>
                  <Link className="navbar-item" to="/profile">Profiel</Link>
                  <Link className="navbar-item" to="/admin">Admin</Link>
                </div>
              </div>
            </nav>
          )}

          <Routes>
            {/* Default route: start altijd op login */}
            <Route path="/" element={<Navigate to="/login" replace />} /> {/* [web:12] */}

            {/* Login (als je al ingelogd bent: stuur door naar home) */}
            <Route
              path="/login"
              element={authed ? <Navigate to="/home" replace /> : <LoginPage />}
            /> {/* [web:12] */}

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route> {/* [web:25] */}

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} /> {/* [web:12] */}
          </Routes>
        </div>
      </section>
    </Router>
  );
}

export default App;
