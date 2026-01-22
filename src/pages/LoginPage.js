import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function LoginPage() {
  const [mode, setMode] = useState("login"); // login | register
  const [username, setUsername] = useState(""); // this is an email
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(""); // optional profile field
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userRef = useRef(null);
  const passRef = useRef(null);

  function safeFocus(ref) {
    ref.current?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const email = username.trim(); // treat "username" as email

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate("/home", { replace: true });
        return;
      }

      // register
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      // optional: store display name in public.users (profile table)
      const userId = data.user?.id;
      if (userId && displayName.trim()) {
        const { error: updErr } = await supabase
          .from("users")
          .update({ display_name: displayName.trim() })
          .eq("id", userId);
        if (updErr) throw updErr;
      }

      navigate("/home", { replace: true });
    } catch (err) {
      setError(err?.message || "Login/registratie mislukt.");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1 className="title is-4">{mode === "login" ? "Login" : "Registreren"}</h1>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Username (email)</label>
          <div className="control">
            <input
              ref={userRef}
              className="input"
              type="email"
              autoComplete="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onTouchStart={() => safeFocus(userRef)}
              onMouseDown={() => safeFocus(userRef)}
              onKeyDown={(e) => e.key === "Enter" && passRef.current?.focus()}
              required
            />
          </div>
        </div>

        {mode === "register" && (
          <div className="field">
            <label className="label">Naam (optioneel)</label>
            <div className="control">
              <input
                className="input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="field">
          <label className="label">Wachtwoord</label>
          <div className="control">
            <input
              ref={passRef}
              className="input"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onTouchStart={() => safeFocus(passRef)}
              onMouseDown={() => safeFocus(passRef)}
              required
            />
          </div>
        </div>

        {error && <p className="help is-danger">{error}</p>}

        <button className="button is-primary is-fullwidth" type="submit">
          {mode === "login" ? "Login" : "Account aanmaken"}
        </button>

        <button
          type="button"
          className="button is-text is-fullwidth mt-2"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Nog geen account? Registreren" : "Al een account? Inloggen"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
