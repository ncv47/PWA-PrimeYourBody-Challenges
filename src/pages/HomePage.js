import { useEffect, useState } from "react";

const INITIAL_CHALLENGE = {
  week: 3,
  title: "10.000 stappen + 3× krachtblok",
  description: "Kies je niveau, kijk de video en vink af wanneer je klaar bent.",
  deadline: "Zondag 23:59",
  levels: ["Light", "Standard", "Pro"],
};

function HomePage() {
  const [selectedLevel, setSelectedLevel] = useState("Standard");
  const [doneCount, setDoneCount] = useState(0);       // aantal keer gedaan deze week
  const [monthlyTotal, setMonthlyTotal] = useState(3); // aantal challenges deze maand

  // Progress-bar percentage (max 4 challenges in maand)
  const monthlyPercent = Math.min(100, (monthlyTotal / 4) * 100);

  // Bij laden: haal state uit localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mpakt-home-progress");
    if (saved) {
      const data = JSON.parse(saved);
      if (data.selectedLevel) setSelectedLevel(data.selectedLevel);
      if (typeof data.doneCount === "number") setDoneCount(data.doneCount);
      if (typeof data.monthlyTotal === "number") setMonthlyTotal(data.monthlyTotal);
    }
  }, []);

  // Elke wijziging bewaren
  useEffect(() => {
    localStorage.setItem(
      "mpakt-home-progress",
      JSON.stringify({ selectedLevel, doneCount, monthlyTotal })
    );
  }, [selectedLevel, doneCount, monthlyTotal]);

  function handleDoneClick() {
    setDoneCount((c) => c + 1);
    // simpele versie: als je voor het eerst done klikt, telt hij mee voor maandtotaal
    if (doneCount === 0) {
      setMonthlyTotal((m) => Math.min(4, m + 1));
    }
  }

  return (
      <div className="columns is-variable is-5">
        {/* Challenge van de week */}
        <div className="column is-two-thirds">
          <div className="card">
            <div className="card-content">
              <p className="tag is-info is-light mb-3">
                Challenge van deze week · week {INITIAL_CHALLENGE.week}
              </p>
              <p className="title is-4">{INITIAL_CHALLENGE.title}</p>
              <p className="subtitle is-6">{INITIAL_CHALLENGE.description}</p>

              <div className="box has-background-light mb-4">
                Video placeholder (YouTube / upload)
              </div>

              {/* Niveau-keuze */}
              <div className="field mb-4">
                <label className="label is-size-7">Kies je niveau</label>
                <div className="buttons">
                  {INITIAL_CHALLENGE.levels.map((level) => (
                    <button
                      key={level}
                      className={
                        "button " +
                        (selectedLevel === level
                          ? "is-primary"
                          : "is-light")
                      }
                      onClick={() => setSelectedLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* DONE-knop + teller */}
              <button
                className="button is-success is-fullwidth mb-2"
                onClick={handleDoneClick}
              >
                Markeer challenge als DONE
              </button>
              <p className="is-size-7 has-text-grey">
                Je hebt deze challenge deze week <strong>{doneCount}</strong>×
                gemarkeerd als gedaan.
              </p>
              <p className="is-size-7 has-text-grey">
                Deadline: {INITIAL_CHALLENGE.deadline}
              </p>
            </div>
          </div>
        </div>

        {/* Progressie + community teaser */}
        <div className="column">
          <div className="box mb-4">
            <p className="heading">Jouw maandprogressie</p>
            <p className="title is-3">{monthlyTotal}/4</p>
            <p className="subtitle is-7">
              Challenges voltooid deze maand
            </p>
            <progress
              className="progress is-success"
              value={monthlyPercent}
              max="100"
            >
              {monthlyPercent}%
            </progress>
            <p className="is-size-7 has-text-grey">
              Nog {Math.max(0, 4 - monthlyTotal)} tot je maandbadge.
            </p>
          </div>

          <div className="box">
            <p className="heading">Community feed</p>
            <p className="is-size-7 mb-3">12 nieuwe posts vandaag</p>
            <p className="is-size-7">
              Sarah: “Light‑versie gedaan tussen meetings door.”
            </p>
            <p className="is-size-7">
              Jonas: Foto gepost van de Pro‑set in het park 🌳
            </p>
            <button className="button is-link is-light is-fullwidth mt-3">
              Open community feed
            </button>
          </div>
        </div>
      </div>
  );
}

export default HomePage;
