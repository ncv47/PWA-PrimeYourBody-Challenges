import { Outlet, Link, useLocation } from "react-router-dom";

export default function MainLayout() {
  const authed = localStorage.getItem("mpakt-auth") === "1";
  const location = useLocation();
  const hideNav = location.pathname === "/login"; // alleen login geen navbar [web:87]

  return (
    <section className="section">
      <div className="container">
        {!hideNav && authed && (
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

        <Outlet /> {/* hier komt de page content */} {/* [web:85] */}
      </div>
    </section>
  );
}
