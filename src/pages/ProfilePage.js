function ProfilePage() {
  return (
    <div className="columns is-centered">
      <div className="column is-two-thirds">
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
                <span className="tag is-success is-light">3/4 challenges deze maand</span>
                <span className="tag is-info is-light">Badge: Consistent 4 weken</span>
              </div>
            </div>
          </article>
        </div>

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
            <tr>
              <td>Week 1</td>
              <td>Core stability basics</td>
              <td>Standard</td>
              <td>3 dagen geleden</td>
            </tr>
            <tr>
              <td>Week 2</td>
              <td>Mobility morning flow</td>
              <td>Light</td>
              <td>5 dagen geleden</td>
            </tr>
            <tr>
              <td>Week 3</td>
              <td>10.000 stappen + krachtblok</td>
              <td>Standard</td>
              <td>Vandaag</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfilePage;
