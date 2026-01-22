import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { humanizeSupabaseError } from "../lib/humanizeError";

function HomePage() {
  const [challenge, setChallenge] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("Standard");
  const [doneOnce, setDoneOnce] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [doneCountWeek, setDoneCountWeek] = useState(0);
  const [error, setError] = useState("");

  const [badges, setBadges] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const monthlyPercent = useMemo(() => Math.min(100, (monthlyTotal / 4) * 100), [monthlyTotal]);
  const monthBadgeEarned = useMemo(() => badges.some((b) => b.badge_name === "month_4x"), [badges]);

  async function load() {
    setError("");

    try {
      const { data: ch, error: chErr } = await supabase
        .from("challenges")
        .select("id, week, title, description, levels, video_url")
        .eq("active", true)
        .order("week", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (chErr) throw chErr;

      setChallenge(ch || null);
      if (ch?.levels?.length) setSelectedLevel(ch.levels.includes("Standard") ? "Standard" : ch.levels[0]);

      const { data: authData, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const user = authData.user;

      if (!user || !ch) return;

      const { data: row, error: selErr } = await supabase
        .from("challenge_checkins")
        .select("id")
        .eq("challenge_id", ch.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (selErr) throw selErr;

      const already = !!row;
      setDoneOnce(already);
      setDoneCountWeek(already ? 1 : 0);

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

      const { data: badgeRows, error: bErr } = await supabase
        .from("user_badges")
        .select("badge_name, points")
        .eq("user_id", user.id);

      if (bErr) throw bErr;

      setBadges(badgeRows || []);
      const pts = (badgeRows || []).reduce((sum, b) => sum + (b.points || 0), 0);
      setTotalPoints(pts);
    } catch (e) {
      console.error(e);
      setError(humanizeSupabaseError(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDoneClick() {
    setError("");

    try {
      if (!challenge) return;

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      const user = authData.user;
      if (!user) {
        setError("Je bent niet ingelogd. Log opnieuw in.");
        return;
      }

      const { error: insErr } = await supabase.from("challenge_checkins").insert({
        challenge_id: challenge.id,
        user_id: user.id,
        level: selectedLevel,
      });

      if (insErr) throw insErr;

      setDoneOnce(true);
      setDoneCountWeek(1);

      await load();
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
              <h2 className="title is-4 mb-5">Home</h2>
              <p className="subtitle is-6">Je challenge, progressie en motivatie.</p>
            </div>

            {error && <p className="notification is-danger is-light">{error}</p>}

            {!challenge && (
              <div className="box">
                <p className="has-text-grey">
                  Geen actieve challenge gevonden (admin moet er 1 activeren).
                </p>
              </div>
            )}

            {challenge && (
              <div className="card">
                <div className="card-content">
                  <p className="tag is-info is-light mb-3">Challenge van deze week · week {challenge.week}</p>
                  <p className="title is-4">{challenge.title}</p>
                  <p className="subtitle is-6">{challenge.description}</p>

                  <div className="box has-background-light mb-4">
                    {challenge.video_url ? (
                      <a href={challenge.video_url} target="_blank" rel="noreferrer">
                        Open video
                      </a>
                    ) : (
                      "Video placeholder"
                    )}
                  </div>

                  <div className="field mb-4">
                    <label className="label is-size-7">Kies je niveau</label>
                    <div className="buttons">
                      {(challenge.levels || ["Light", "Standard", "Pro"]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          className={"button " + (selectedLevel === level ? "is-primary" : "is-light")}
                          onClick={() => setSelectedLevel(level)}
                          disabled={doneOnce}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    className="button is-success is-fullwidth mb-2"
                    onClick={handleDoneClick}
                    disabled={doneOnce}
                  >
                    {doneOnce ? "Al afgevinkt" : "Markeer challenge als DONE"}
                  </button>

                  <p className="is-size-7 has-text-grey">
                    Je hebt deze challenge deze week <strong>{doneCountWeek}</strong>× afgevinkt.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="column is-4">
            <div className="sticky-side">
              {monthBadgeEarned && (
                <div className="box mb-4 has-background-warning-light">
                  <p className="heading has-text-centered">MAANDBADGE BEHAALD</p>
                  <p className="title is-5 has-text-centered">4/4 challenges</p>
                  <p className="subtitle is-7 has-text-centered">Sterk bezig. Volhouden!</p>
                </div>
              )}

              <div className="box mb-4">
                <p className="heading">Jouw maandprogressie</p>
                <p className="title is-3">{monthlyTotal}/4</p>
                <p className="subtitle is-7">Challenges voltooid deze maand</p>
                <progress className="progress is-success" value={monthlyPercent} max="100">
                  {monthlyPercent}%
                </progress>
                <p className="is-size-7 has-text-grey">Nog {Math.max(0, 4 - monthlyTotal)} tot je maandbadge.</p>
              </div>

              <div className="box mb-4">
                <p className="heading">Jouw punten</p>
                <p className="title is-3">{totalPoints}</p>
                <p className="subtitle is-7">Totale punten verdiend</p>
                <p className="is-size-7 has-text-grey">+100 punten per maandbadge.</p>
              </div>

              <div className="box">
                <p className="heading">Community</p>
                <p className="is-size-7">Deel je progressie en motiveer elkaar in de feed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
