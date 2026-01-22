import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { humanizeSupabaseError } from "../lib/humanizeError";

function ProfilePage() {
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null); // from public.users
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const [completedRows, setCompletedRows] = useState([]); // checkins joined to challenges
  const [totalPoints, setTotalPoints] = useState(0);
  const [badges, setBadges] = useState([]);

  const monthBadgeEarned = useMemo(() => badges.some((b) => b.badge_name === "month_4x"), [badges]);

  async function load() {
    setError("");

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData.user;
      if (!user) {
        setError("Je bent niet ingelogd.");
        return;
      }

      const { data: prof, error: pErr } = await supabase
        .from("users")
        .select("id, display_name, admin")
        .eq("id", user.id)
        .maybeSingle();

      if (pErr) throw pErr;
      setProfile(prof || null);

      // Monthly total (distinct challenges)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthRows, error: mErr } = await supabase
        .from("challenge_checkins")
        .select("challenge_id")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if (mErr) throw mErr;

      const distinct = new Set((monthRows || []).map((r) => r.challenge_id));
      setMonthlyTotal(Math.min(4, distinct.size));

      // Completed challenges list (latest first)
      const { data: checkins, error: cErr } = await supabase
        .from("challenge_checkins")
        .select("created_at, level, challenge_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cErr) throw cErr;

      const chIds = [...new Set((checkins || []).map((c) => c.challenge_id))];
      let chMap = {};
      if (chIds.length) {
        const { data: chs, error: chErr } = await supabase
          .from("challenges")
          .select("id, week, title")
          .in("id", chIds);

        if (chErr) throw chErr;

        chMap = {};
        (chs || []).forEach((c) => (chMap[c.id] = c));
      }

      setCompletedRows(
        (checkins || []).map((c) => ({
          week: chMap[c.challenge_id]?.week ?? "-",
          title: chMap[c.challenge_id]?.title ?? "Challenge",
          level: c.level || "-",
          lastCheckin: new Date(c.created_at).toLocaleString(),
        }))
      );

      // Badges + points
      const { data: badgeRows, error: bErr } = await supabase
        .from("user_badges")
        .select("badge_name, points, earned_at")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (bErr) throw bErr;

      setBadges(badgeRows || []);
      setTotalPoints((badgeRows || []).reduce((sum, b) => sum + (b.points || 0), 0));
    } catch (e) {
      console.error(e);
      setError(humanizeSupabaseError(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-inner">
        <div className="columns is-centered">
          <div className="column is-8">
            <div className="mb-4">
              <h2 className="title is-4 mb-5">Profiel</h2>
              <p className="subtitle is-6">Jouw progressie en badges.</p>
            </div>

            {error && <p className="notification is-danger is-light">{error}</p>}

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
                      <strong>{profile?.display_name || "Gebruiker"}</strong>
                      <br />
                      {profile?.admin ? "Coach/Admin" : "Member"}
                    </p>
                  </div>

                  <div className="tags">
                    <span className="tag is-success is-light">{monthlyTotal}/4 deze maand</span>
                    {monthBadgeEarned && <span className="tag is-warning is-light">Maandbadge</span>}
                    <span className="tag is-info is-light">{totalPoints} punten</span>
                  </div>
                </div>
              </article>
            </div>

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
                  <p className="heading">Badges</p>
                  <p className="title is-4">{badges.length}</p>
                  <p className="subtitle is-7">Behaald</p>
                </div>
              </div>
            </div>

            <h3 className="title is-5 mt-5">Afgewerkte challenges</h3>
            <div className="table-wrap">
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
                  {completedRows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.week}</td>
                      <td>{row.title}</td>
                      <td>{row.level}</td>
                      <td>{row.lastCheckin}</td>
                    </tr>
                  ))}
                  {completedRows.length === 0 && (
                    <tr>
                      <td colSpan="4" className="has-text-centered has-text-grey">
                        Nog geen check-ins. Start met je eerste challenge!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {badges.length > 0 && (
              <>
                <h3 className="title is-5 mt-5">Badges</h3>
                <div className="table-wrap">
                  <table className="table is-fullwidth is-narrow">
                    <thead>
                      <tr>
                        <th>Badge</th>
                        <th>Punten</th>
                        <th>Datum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {badges.map((b) => (
                        <tr key={b.badge_name + b.earned_at}>
                          <td>{b.badge_name}</td>
                          <td>{b.points || 0}</td>
                          <td>{new Date(b.earned_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
