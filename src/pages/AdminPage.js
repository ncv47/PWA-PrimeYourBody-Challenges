import { useEffect, useState } from "react";

const INITIAL_CHALLENGES = [
  {
    id: 1,
    week: 3,
    title: "10.000 stappen + 3× krachtblok",
    active: true,
    completedCount: 24,
  },
  {
    id: 2,
    week: 2,
    title: "Mobility morning flow",
    active: false,
    completedCount: 31,
  },
];

function AdminPage() {
  const [challenges, setChallenges] = useState([]);
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");

  // init vanuit localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mpakt-admin-challenges");
    if (saved) {
      setChallenges(JSON.parse(saved));
    } else {
      setChallenges(INITIAL_CHALLENGES);
    }
  }, []);

  // opslaan bij wijziging
  useEffect(() => {
    localStorage.setItem("mpakt-admin-challenges", JSON.stringify(challenges));
  }, [challenges]);

  function handleAddChallenge(e) {
    e.preventDefault();
    if (!title.trim() || !week) return;

    const newChallenge = {
      id: Date.now(),
      week: Number(week),
      title: title.trim(),
      active: false,
      completedCount: 0,
      videoUrl: videoUrl.trim(),
      description: description.trim(),
    };

    setChallenges((prev) => [...prev, newChallenge]);
    setTitle("");
    setWeek("");
    setVideoUrl("");
    setDescription("");
  }

  function toggleActive(id) {
    setChallenges((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, active: !ch.active } : ch
      )
    );
  }

  function handleDelete(id) {
    setChallenges((prev) => prev.filter((ch) => ch.id !== id));
  }

  return (
    <div className="columns">
      {/* Overzicht challenges */}
      <div className="column is-two-thirds">
        <h2 className="title is-4">Admin · Challenges beheren</h2>

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
                      "button is-small " +
                      (ch.active ? "is-success is-light" : "is-light")
                    }
                    onClick={() => toggleActive(ch.id)}
                  >
                    {ch.active ? "Actief" : "Inactief"}
                  </button>
                </td>
                <td>{ch.completedCount} gebruikers</td>
                <td className="has-text-right">
                  <button
                    type="button"
                    className="button is-small is-danger is-light"
                    onClick={() => handleDelete(ch.id)}
                  >
                    Verwijderen
                  </button>
                </td>
              </tr>
            ))}
            {challenges.length === 0 && (
              <tr>
                <td colSpan="5" className="has-text-centered has-text-grey">
                  Nog geen challenges aangemaakt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Formulier nieuwe challenge */}
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
          <p className="heading">Snelle stats (dummy)</p>
          <p className="title is-4">
            {challenges.reduce((sum, ch) => sum + ch.completedCount, 0)}
          </p>
          <p className="subtitle is-7">
            Totale aantal voltooide challenges (alle weken samen)
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
