import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function MainLayout({ session }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  const signedIn = !!session?.user;

  useEffect(() => {
    let mounted = true;

    async function loadAdmin() {
      setIsAdmin(false);
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("users")
        .select("admin")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!mounted) return;
      if (!error && data?.admin === true) setIsAdmin(true);
    }

    loadAdmin();
    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <>
      {/* NAVBAR: altijd renderen */}
      <nav className="navbar is-light" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item" to={signedIn ? "/home" : "/login"}>
            <strong>MPAKT Challenges</strong>
          </Link>
        </div>

        <div className="navbar-menu is-active">
          <div className="navbar-start">
            {signedIn && (
              <>
                <Link className="navbar-item" to="/home">Home</Link>
                <Link className="navbar-item" to="/community">Community</Link>
                <Link className="navbar-item" to="/profile">Profiel</Link>
                {isAdmin && <Link className="navbar-item" to="/admin">Admin</Link>}
              </>
            )}
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              {signedIn ? (
                <button className="button is-light" onClick={handleLogout}>
                  Uitloggen
                </button>
              ) : (
                <Link className="button is-link" to="/login">
                  Inloggen
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENT van routes */}
      <Outlet />
    </>
  );
}

export default MainLayout;
