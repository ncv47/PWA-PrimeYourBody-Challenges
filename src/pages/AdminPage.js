function AdminPage() {
  return (
    <div className="columns">
      <div className="column is-two-thirds">
        <h2 className="title is-4">Admin · Challenges beheren</h2>

        <table className="table is-fullwidth is-hoverable">
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
            <tr>
              <td>3</td>
              <td>10.000 stappen + krachtblok</td>
              <td>Ja</td>
              <td>24 gebruikers</td>
              <td>
                <button className="button is-small is-light">Bewerken</button>
              </td>
            </tr>
            <tr>
              <td>2</td>
              <td>Mobility morning flow</td>
              <td>Nee</td>
              <td>31 gebruikers</td>
              <td>
                <button className="button is-small is-light">Bewerken</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="column">
        <div className="box">
          <h3 className="title is-5">Nieuwe challenge</h3>

          <div className="field">
            <label className="label">Titel</label>
            <div className="control">
              <input className="input" type="text" placeholder="Titel van de challenge" />
            </div>
          </div>

          <div className="field">
            <label className="label">Beschrijving</label>
            <div className="control">
              <textarea className="textarea" placeholder="Korte uitleg"></textarea>
            </div>
          </div>

          <div className="field">
            <label className="label">Video‑URL</label>
            <div className="control">
              <input className="input" type="text" placeholder="YouTube of upload‑link" />
            </div>
          </div>

          <div className="field is-grouped">
            <div className="control">
              <button className="button is-primary">Challenge opslaan</button>
            </div>
          </div>
        </div>

        <div className="box">
          <p className="heading">Snelle stats</p>
          <p className="title is-4">24</p>
          <p className="subtitle is-7">Gebruikers die deze week hebben ingecheckt</p>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
