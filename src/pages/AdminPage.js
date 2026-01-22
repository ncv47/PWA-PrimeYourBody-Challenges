import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { humanizeSupabaseError } from "../lib/humanizeError";

function isoWeek(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

const LEVELS = ["Light", "Standard", "Pro"];

function AdminPage() {
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("Standard");

  const computedWeek = useMemo(() => isoWeek(startDate), [startDate]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const { data: chData, error: chErr } = await supabase
        .from("challenges")
        .select("id, week, title, description, video_url, start_date, levels, active, created_at")
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
        start_date: startDate,
        levels: [selectedLevel],
        active: false,
      };

      const { data, error: insErr } = await supabase.from("challenges").insert(payload).select().single();
      if (insErr) throw insErr;

      setChallenges((prev) => [data, ...prev]);
      setTitle("");
      setStartDate("");
      setVideoUrl("");
      setDescription("");
      setSelectedLevel("Standard");
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
    <div className="page">
      <div className="page-inner">
        <div className="columns is-variable is-6">
          <div className="column is-8">
            <div className="mb-4">
              <h2 className="title is-4 mb-5">Admin</h2>
              <p className="subtitle is-6">Challenges beheren en activeren.</p>
            </div>

            {error && <p className="notification is-danger is-light">{error}</p>}
            {loading && <p className="has-text-grey">Laden...</p>}

            <div className="table-wrap">
              <table className="table is-fullwidth is-hoverable is-narrow">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Titel</th>
                    <th>Actief</th>
                    <th>Voltooid door</th>
                    <th className="has-text-right"></th>
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
          </div>

          <div className="column is-4">
            <div className="sticky-side">
              <div className="box">
                <h3 className="title is-5 mb-4">Nieuwe challenge</h3>

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
                    {startDate && <p className="help">Weeknummer (automatisch): {computedWeek}</p>}
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
                    <label className="label">Level</label>
                    <div className="buttons">
                      {LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          className={"button " + (selectedLevel === lvl ? "is-primary" : "is-light")}
                          onClick={() => setSelectedLevel(lvl)}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <p className="help">Je kiest één level voor deze challenge.</p>
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
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
