import { Outlet, Link, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function MainLayout() {
  const authed = localStorage.getItem("mpakt-auth") === "1";
  const { pathname } = useLocation();

  const onLoginPage = pathname === "/login";
  const showTopNav = authed && !onLoginPage;
  const showBottomNav = authed && !onLoginPage;

  return (
    <>
      <section className="section">
        <div className="container">
          {showTopNav && (
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

          <Outlet />
        </div>
      </section>

      {showBottomNav && <BottomNav />}
    </>
  );
}
