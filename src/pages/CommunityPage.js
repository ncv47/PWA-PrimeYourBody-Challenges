import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { humanizeSupabaseError } from "../lib/humanizeError";

function CommunityPage() {
  const [activeChallenge, setActiveChallenge] = useState(null);

  const [posts, setPosts] = useState([]);
  const [likeCounts, setLikeCounts] = useState({});
  const [likedByMe, setLikedByMe] = useState(new Set());
  const [userMap, setUserMap] = useState({});

  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const { data: ch, error: chErr } = await supabase
        .from("challenges")
        .select("id, week, title")
        .eq("active", true)
        .order("week", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (chErr) throw chErr;

      setActiveChallenge(ch || null);
      if (!ch) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const me = authData.user;

      const { data: postRows, error: postErr } = await supabase
        .from("posts")
        .select("id, user_id, text, image_url, created_at, challenge_id")
        .eq("challenge_id", ch.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (postErr) throw postErr;

      const rows = postRows || [];
      setPosts(rows);

      const authorIds = [...new Set(rows.map((p) => p.user_id))].filter(Boolean);
      if (authorIds.length) {
        const { data: usersRows, error: uErr } = await supabase
          .from("users")
          .select("id, display_name")
          .in("id", authorIds);
        if (uErr) throw uErr;

        const map = {};
        (usersRows || []).forEach((u) => (map[u.id] = u.display_name || "Gebruiker"));
        setUserMap(map);
      } else {
        setUserMap({});
      }

      const postIds = rows.map((p) => p.id);
      if (postIds.length) {
        const { data: likeRows, error: lErr } = await supabase
          .from("post_like_counts")
          .select("post_id, like_count")
          .in("post_id", postIds);
        if (lErr) throw lErr;

        const lc = {};
        (likeRows || []).forEach((r) => (lc[r.post_id] = r.like_count));
        setLikeCounts(lc);
      } else {
        setLikeCounts({});
      }

      if (me && postIds.length) {
        const { data: myLikes, error: mlErr } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", me.id)
          .in("post_id", postIds);
        if (mlErr) throw mlErr;

        setLikedByMe(new Set((myLikes || []).map((r) => r.post_id)));
      } else {
        setLikedByMe(new Set());
      }
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

  async function handleAddPost(e) {
    e.preventDefault();
    setError("");

    try {
      if (!activeChallenge) {
        setError("Geen actieve challenge om aan te koppelen.");
        return;
      }

      const text = newText.trim();
      if (!text) return;

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!authData.user) {
        setError("Je bent niet ingelogd. Log opnieuw in.");
        return;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("posts")
        .insert({
          user_id: authData.user.id,
          challenge_id: activeChallenge.id,
          text,
          image_url: null,
        })
        .select()
        .single();

      if (insErr) throw insErr;

      setPosts((prev) => [inserted, ...prev]);
      setLikeCounts((prev) => ({ ...prev, [inserted.id]: 0 }));
      setNewText("");
    } catch (e) {
      console.error(e);
      setError(humanizeSupabaseError(e));
    }
  }

  async function toggleLike(postId) {
    setError("");

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const me = authData.user;
      if (!me) {
        setError("Je bent niet ingelogd. Log opnieuw in.");
        return;
      }

      const isLiked = likedByMe.has(postId);

      if (isLiked) {
        const { error: delErr } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", me.id);
        if (delErr) throw delErr;

        setLikedByMe((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setLikeCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) - 1) }));
        return;
      }

      const { error: insErr } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: me.id,
      });
      if (insErr) throw insErr;

      setLikedByMe((prev) => new Set([...prev, postId]));
      setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    } catch (e) {
      console.error(e);
      setError(humanizeSupabaseError(e));
    }
  }

  return (
    <div className="columns is-centered">
      <div className="column is-two-thirds">
        <h2 className="title is-4">Community feed</h2>

        {activeChallenge ? (
          <p className="subtitle is-6">
            Voor challenge week {activeChallenge.week}: {activeChallenge.title}
          </p>
        ) : (
          <p className="subtitle is-6">Geen actieve challenge.</p>
        )}

        {error && <p className="notification is-danger is-light">{error}</p>}
        {loading && <p className="has-text-grey">Laden...</p>}

        <form className="box mb-5" onSubmit={handleAddPost}>
          <div className="field">
            <label className="label is-size-7">Nieuwe post</label>
            <div className="control">
              <textarea
                className="textarea"
                placeholder="Hoe ging jouw challenge vandaag?"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
            </div>
          </div>

          <div className="field is-grouped is-grouped-right">
            <p className="control">
              <button type="button" className="button is-link is-light" disabled>
                Foto uploaden (later)
              </button>
            </p>
            <p className="control">
              <button type="submit" className="button is-link" disabled={!activeChallenge}>
                Posten
              </button>
            </p>
          </div>
        </form>

        {posts.map((post) => {
          const name = userMap[post.user_id] || "Gebruiker";
          const liked = likedByMe.has(post.id);
          const likes = likeCounts[post.id] ?? 0;

          return (
            <div className="box" key={post.id}>
              <article className="media">
                <figure className="media-left">
                  <p className="image is-48x48">
                    <img src="https://via.placeholder.com/96" alt="avatar" />
                  </p>
                </figure>

                <div className="media-content">
                  <div className="content">
                    <p>
                      <strong>{name}</strong>{" "}
                      <small>{new Date(post.created_at).toLocaleString()}</small>
                      <br />
                      {post.text}
                    </p>
                  </div>

                  <nav className="level is-mobile">
                    <div className="level-left">
                      <button
                        type="button"
                        className={"level-item button is-small " + (liked ? "is-link" : "is-white")}
                        onClick={() => toggleLike(post.id)}
                      >
                        👍 {likes}
                      </button>
                    </div>
                  </nav>
                </div>
              </article>
            </div>
          );
        })}

        {!loading && activeChallenge && posts.length === 0 && (
          <p className="has-text-grey">Nog geen posts voor deze challenge. Zet de eerste!</p>
        )}
      </div>
    </div>
  );
}

export default CommunityPage;
