import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import "./App.css";

function App() {
  return (
    <Router>
      <section className="section">
        <div className="container">
          <nav className="navbar" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
              <Link className="navbar-item" to="/">
                <strong>MPAKT Challenges</strong>
              </Link>
            </div>
            <div className="navbar-menu">
              <div className="navbar-start">
                <Link className="navbar-item" to="/">Home</Link>
                <Link className="navbar-item" to="/community">Community</Link>
                <Link className="navbar-item" to="/profile">Profiel</Link>
                <Link className="navbar-item" to="/admin">Admin</Link>
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </section>
    </Router>
  );
}

export default App;