import { useEffect, useState } from "react";

function ProfilePage() {
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("mpakt-home-progress");
    if (saved) {
      const data = JSON.parse(saved);
      if (typeof data.monthlyTotal === "number") setMonthlyTotal(data.monthlyTotal);
      if (typeof data.doneCount === "number") setDoneCount(data.doneCount);
    }
  }, []);

  const completedChallenges = [
    {
      week: 1,
      title: "Core stability basics",
      level: "Standard",
      lastCheckin: "3 dagen geleden",
    },
    {
      week: 2,
      title: "Mobility morning flow",
      level: "Light",
      lastCheckin: "5 dagen geleden",
    },
    {
      week: 3,
      title: "10.000 stappen + 3× krachtblok",
      level: "Standard",
      lastCheckin: doneCount > 0 ? "Vandaag" : "Nog niet voltooid",
    },
  ];

  return (
    <div className="columns is-centered">
      <div className="column is-two-thirds">
        {/* Profiel header */}
        <div className="box">
          <article className="media">
            <figure className="media-left">
              <p className="image is-96x96">
                <img src="https://via.placeholder.com/192" alt="profiel" />
              </p>
            </figure>
            <div className="media-content">
              <div className="content">
                <p>
                  <strong>Jouw naam</strong>
                  <br />
                  Recreatieve sporter · MPAKT pilootgebruiker
                </p>
              </div>
              <div className="tags">
                <span className="tag is-success is-light">
                  {monthlyTotal}/4 challenges deze maand
                </span>
                {monthlyTotal >= 4 && (
                  <span className="tag is-info is-light">
                    Badge: Consistent 4 weken
                  </span>
                )}
              </div>
            </div>
          </article>
        </div>

        {/* Stats blok */}
        <div className="columns is-variable is-2 mb-4">
          <div className="column">
            <div className="box has-text-centered">
              <p className="heading">Deze maand</p>
              <p className="title is-4">{monthlyTotal}</p>
              <p className="subtitle is-7">Voltooide challenges</p>
            </div>
          </div>
          <div className="column">
            <div className="box has-text-centered">
              <p className="heading">Deze week</p>
              <p className="title is-4">{doneCount}</p>
              <p className="subtitle is-7">Keer op DONE gedrukt</p>
            </div>
          </div>
        </div>

        {/* Tabel met afgewerkte challenges */}
        <h2 className="title is-5 mt-4">Afgewerkte challenges</h2>
        <table className="table is-fullwidth is-striped is-narrow">
          <thead>
            <tr>
              <th>Week</th>
              <th>Titel</th>
              <th>Niveau</th>
              <th>Laatste check‑in</th>
            </tr>
          </thead>
          <tbody>
            {completedChallenges.map((ch) => (
              <tr key={ch.week}>
                <td>{ch.week}</td>
                <td>{ch.title}</td>
                <td>{ch.level}</td>
                <td>{ch.lastCheckin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfilePage;
