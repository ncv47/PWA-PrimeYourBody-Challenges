function HomePage() {
  return (
        <div className="columns is-variable is-5">
        <div className="column is-two-thirds">
            <div className="card">
            <div className="card-content">
                <p className="tag is-info is-light mb-3">
                Challenge van deze week
                </p>
                <p className="title is-4">
                10.000 stappen + 3× krachtblok
                </p>
                <p className="subtitle is-6">
                Kies je niveau, kijk de video en vink af wanneer je klaar bent.
                </p>

                <div className="box has-background-light mb-4">
                Video placeholder (YouTube / upload)
                </div>

                <div className="buttons mb-4">
                <button className="button is-light">Light</button>
                <button className="button is-primary is-light">Standard</button>
                <button className="button is-light">Pro</button>
                </div>

                <button className="button is-success is-fullwidth">
                Markeer challenge als DONE
                </button>
            </div>
            </div>
        </div>

        <div className="column">
            <div className="box mb-4">
            <p className="heading">Jouw maandprogressie</p>
            <p className="title is-3">3/4</p>
            <p className="subtitle is-7">
                Challenges voltooid deze maand
            </p>
            <progress className="progress is-success" value="75" max="100">
                75%
            </progress>
            <button className="button is-small is-fullwidth mt-2">
                Bekijk mijn profiel
            </button>
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