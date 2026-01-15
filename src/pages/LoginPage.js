import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // DEMO: vervang dit later door echte auth (API/Supabase/etc.)
    if (username === "admin" && password === "admin") {
      localStorage.setItem("mpakt-auth", "1");
      navigate("/home", { replace: true });
    } else {
      setError("Foute gebruikersnaam of wachtwoord.");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1 className="title is-4">Login</h1>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Gebruiker</label>
          <div className="control">
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="label">Wachtwoord</label>
          <div className="control">
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
