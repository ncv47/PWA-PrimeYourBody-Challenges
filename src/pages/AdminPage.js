import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function AdminPage() {
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState({}); // challenge_id -> completed_users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [week, setWeek] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(""); // optional: "2026-01-31T23:59"
  const [levels, setLevels] = useState("Light,Standard,Pro");

  const levelsArray = useMemo(
    () =>
      levels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [levels]
  );

  async function loadAll() {
    setLoading(true);
    setError("");

    const { data: chData, error: chErr } = await supabase
      .from("challenges")
      .select("id, week, title, description, video_url, deadline, levels, active, created_at")
      .order("week", { ascending: false })
      .order("created_at", { ascending: false });

    if (chErr) {
      setError(chErr.message);
      setLoading(false);
      return;
    }

    const { data: stData, error: stErr } = await supabase
      .from("challenge_stats")
      .select("challenge_id, completed_users");

    if (stErr) {
      setError(stErr.message);
      setLoading(false);
      return;
    }

    const stMap = {};
    (stData || []).forEach((r) => (stMap[r.challenge_id] = r.completed_users));

    setChallenges(chData || []);
    setStats(stMap);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddChallenge(e) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !week) return;

    const payload = {
      week: Number(week),
      title: title.trim(),
      description: description.trim() || null,
      video_url: videoUrl.trim() || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      levels: levelsArray.length ? levelsArray : ["Light", "Standard", "Pro"],
      active: false,
    };

    const { data, error: insErr } = await supabase
      .from("challenges")
      .insert(payload)
      .select()
      .single(); // return inserted row [web:47]

    if (insErr) {
      setError(insErr.message);
      return;
    }

    setChallenges((prev) => [data, ...prev]);
    setTitle("");
    setWeek("");
    setVideoUrl("");
    setDescription("");
    setDeadline("");
    setLevels("Light,Standard,Pro");
  }

  async function toggleActive(ch) {
    setError("");
    const { data, error: updErr } = await supabase
      .from("challenges")
      .update({ active: !ch.active })
      .eq("id", ch.id)
      .select()
      .single();

    if (updErr) {
      setError(updErr.message);
      return;
    }

    setChallenges((prev) => prev.map((x) => (x.id === ch.id ? data : x)));
  }

  async function handleDelete(ch) {
    setError("");
    const { error: delErr } = await supabase.from("challenges").delete().eq("id", ch.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setChallenges((prev) => prev.filter((x) => x.id !== ch.id));
  }

  return (
    <div className="columns">
      <div className="column is-two-thirds">
        <h2 className="title is-4">Admin · Challenges beheren</h2>

        {error && <p className="notification is-danger is-light">{error}</p>}
        {loading && <p className="has-text-grey">Laden...</p>}

        <table className="table is-fullwidth is-hoverable is-narrow">
          <thead>
            <tr>
              <th>Week</th>
              <th>Titel</th>
              <th>Actief</th>
              <th>Voltooid door</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((ch) => (
              <tr key={ch.id}>
                <td>{ch.week}</td>
                <td>{ch.title}</td>
                <td>
                  <button
                    type="button"
                    className={
                      "button is-small " + (ch.active ? "is-success is-light" : "is-light")
                    }
                    onClick={() => toggleActive(ch)}
                  >
                    {ch.active ? "Actief" : "Inactief"}
                  </button>
                </td>
                <td>{stats[ch.id] ?? 0} gebruikers</td>
                <td className="has-text-right">
                  <button
                    type="button"
                    className="button is-small is-danger is-light"
                    onClick={() => handleDelete(ch)}
                  >
                    Verwijderen
                  </button>
                </td>
              </tr>
            ))}

            {!loading && challenges.length === 0 && (
              <tr>
                <td colSpan="5" className="has-text-centered has-text-grey">
                  Nog geen challenges aangemaakt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="column">
        <div className="box">
          <h3 className="title is-5">Nieuwe challenge</h3>

          <form onSubmit={handleAddChallenge}>
            <div className="field">
              <label className="label">Weeknummer</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  placeholder="Bijv. 4"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Titel</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titel van de challenge"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Korte beschrijving</label>
              <div className="control">
                <textarea
                  className="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Korte uitleg voor de sporters"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Video‑URL</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube of upload‑link (optioneel)"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Deadline (optioneel)</label>
              <div className="control">
                <input
                  className="input"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Levels (comma separated)</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={levels}
                  onChange={(e) => setLevels(e.target.value)}
                />
              </div>
            </div>

            <div className="field is-grouped is-grouped-right">
              <div className="control">
                <button type="submit" className="button is-primary">
                  Challenge opslaan
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="box">
          <p className="heading">Snelle stats</p>
          <p className="title is-4">
            {Object.values(stats).reduce((sum, n) => sum + (n || 0), 0)}
          </p>
          <p className="subtitle is-7">Totale unieke gebruikers-checkins (per challenge)</p>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
