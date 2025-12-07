function CommunityPage() {
  return (
    <div className="columns is-centered">
      <div className="column is-two-thirds">
        <h2 className="title is-4">Community feed</h2>
        <p className="subtitle is-6">
          Deel je foto, vertel hoe het ging en motiveer elkaar.
        </p>

        <div className="box">
          <div className="field">
            <label className="label is-size-7">Nieuwe post</label>
            <div className="control">
              <textarea className="textarea" placeholder="Hoe ging jouw challenge vandaag?"></textarea>
            </div>
          </div>
          <div className="field is-grouped is-grouped-right">
            <p className="control">
              <button className="button is-link is-light">Foto uploaden</button>
            </p>
            <p className="control">
              <button className="button is-link">Posten</button>
            </p>
          </div>
        </div>

        {[1, 2, 3].map((id) => (
          <div className="box" key={id}>
            <article className="media">
              <figure className="media-left">
                <p className="image is-48x48">
                  <img src="https://via.placeholder.com/96" alt="avatar" />
                </p>
              </figure>
              <div className="media-content">
                <div className="content">
                  <p>
                    <strong>Gebruiker {id}</strong>{" "}
                    <small>· 2u geleden</small>
                    <br />
                    Vandaag de Standard‑challenge gedaan. Voelt goed!
                  </p>
                </div>
                <nav className="level is-mobile">
                  <div className="level-left">
                    <a className="level-item">👍 6</a>
                    <a className="level-item">Reageren</a>
                  </div>
                </nav>
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommunityPage;
