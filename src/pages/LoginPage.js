import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


function LoginPage() {
    
    localStorage.removeItem("mpakt-auth");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userRef = useRef(null);
  const passRef = useRef(null);

  // iOS PWA: focus moet “user initiated” zijn, anders geen keyboard. [web:229]
  function safeFocus(ref) {
    // focus synchronously; no useEffect autofocus
    ref.current?.focus();
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // tijdelijk: login ok als beide leeg zijn
    if (username === "admin" && password === "admin") {
      localStorage.setItem("mpakt-auth", "1");
      navigate("/home", { replace: true });
      return;
    }

    setError("Foute gebruikersnaam of wachtwoord.");
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1 className="title is-4">Login</h1>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Gebruiker</label>
          <div className="control">
            <input
              ref={userRef}
              className="input"
              type="text"
              name="username"
              autoComplete="username"
              inputMode="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onTouchStart={() => safeFocus(userRef)}
              onMouseDown={() => safeFocus(userRef)}
              onKeyDown={(e) => {
                if (e.key === "Enter") passRef.current?.focus();
              }}
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Wachtwoord</label>
          <div className="control">
            <input
              ref={passRef}
              className="input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onTouchStart={() => safeFocus(passRef)}
              onMouseDown={() => safeFocus(passRef)}
            />
          </div>
        </div>

        {error && <p className="help is-danger">{error}</p>}

        <button className="button is-primary is-fullwidth" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
