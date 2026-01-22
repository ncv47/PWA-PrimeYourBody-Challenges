import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { humanizeSupabaseError } from "../lib/humanizeError";

// ISO week number helper (frontend display)
// DB berekent ook week uit start_date, maar dit is voor directe feedback in UI.
function isoWeek(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function AdminPage() {
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [deadlineDate, setDeadlineDate] = useState(""); // YYYY-MM-DD
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [levels, setLevels] = useState("Light,Standard,Pro");

  const computedWeek = useMemo(() => isoWeek(startDate), [startDate]);

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

    try {
      const { data: chData, error: chErr } = await supabase
        .from("challenges")
        .select("id, week, title, description, video_url, start_date, deadline_date, levels, active, created_at")
        .order("week", { ascending: false })
        .order("created_at", { ascending: false });

      if (chErr) throw chErr;

      const { data: stData, error: stErr } = await supabase
        .from("challenge_stats")
        .select("challenge_id, completed_users");

      if (stErr) throw stErr;

      const stMap = {};
      (stData || []).forEach((r) => (stMap[r.challenge_id] = r.completed_users));

      setChallenges(chData || []);
      setStats(stMap);
    } catch (e) {
      console.error(e);
      setError(humanizeSupabaseError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddChallenge(e) {
    e.preventDefault();
    setError("");

    try {
      if (!title.trim() || !startDate) {
        setError("Vul minstens een titel en startdatum in.");
        return;
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoUrl.trim() || null,
        start_date: startDate, // date-only; browser gives YYYY-MM-DD [web:291]
        deadline_date: deadlineDate || null,
        levels: levelsArray.length ? levelsArray : ["Light", "Standard", "Pro"],
        active: false,
        // week wordt in DB gezet via trigger op start_date
      };

      const { data, error: insErr } = await supabase
        .from("challenges")
        .insert(payload)
        .select()
        .single();

      if (insErr) throw insErr;

      setChallenges((prev) => [data, ...prev]);
      setTitle("");
      setStartDate("");
      setDeadlineDate("");
      setVideoUrl("");
      setDescription("");
      setLevels("Light,Standard,Pro");
    } catch (e) {
      console.error(e);
      setError(humanizeSupabaseError(e));
    }
  }

  async function toggleActive(ch) {
    setError("");
    try {
      const { data, error: updErr } = await supabase
        .from("challenges")
        .update({ active: !ch.active })
        .eq("id", ch.id)
        .select()
        .single();

      if (updErr) throw updErr;

      setChallenges((prev) => prev.map((x) => (x.id === ch.id ? data : x)));
    } catch (e) {
      console.error(e);
      setError(humanizeSupabaseError(e));
    }
  }

  async function handleDelete(ch) {
    setError("");
    try {
      const { error: delErr } = await supabase.from("challenges").delete().eq("id", ch.id);
      if (delErr) throw delErr;
      setChallenges((prev) => prev.filter((x) => x.id !== ch.id));
    } catch (e) {
      console.error(e);
      setError(humanizeSupabaseError(e));
    }
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
                    className={"button is-small " + (ch.active ? "is-success is-light" : "is-light")}
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
              <label className="label">Startdatum</label>
              <div className="control">
                <input
                  className="input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              {startDate && (
                <p className="help">Weeknummer (automatisch): {computedWeek}</p>
              )}
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
                  placeholder="YouTube link (optioneel)"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Deadline (optioneel)</label>
              <div className="control">
                <input
                  className="input"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
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
