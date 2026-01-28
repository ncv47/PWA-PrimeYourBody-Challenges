import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function NavBar() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function refreshAdmin(userId) {
    setIsAdmin(false);
    if (!userId) return;

    const { data, error } = await supabase
      .from("users")
      .select("admin")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data?.admin === true) setIsAdmin(true);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      refreshAdmin(data.session?.user?.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
      refreshAdmin(newSession?.user?.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signedIn = !!session?.user;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <nav className="navbar is-light" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link className="navbar-item" to={signedIn ? "/home" : "/login"}>
          <strong>MPAKT Challenges</strong>
        </Link>
      </div>

      <div className="navbar-menu">
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
  );
}

export default NavBar;
