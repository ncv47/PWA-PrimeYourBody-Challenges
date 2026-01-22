import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [likeCounts, setLikeCounts] = useState({}); // post_id -> count
  const [likedByMe, setLikedByMe] = useState(new Set()); // post_ids
  const [userMap, setUserMap] = useState({}); // user_id -> display_name
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const likedByMeMemo = useMemo(() => likedByMe, [likedByMe]);

  async function loadFeed() {
    setLoading(true);
    setError("");

    const { data: authData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      setError(userErr.message);
      setLoading(false);
      return;
    }
    const me = authData.user;

    // 1) posts
    const { data: postRows, error: postErr } = await supabase
      .from("posts")
      .select("id, user_id, text, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (postErr) {
      setError(postErr.message);
      setLoading(false);
      return;
    }

    const rows = postRows || [];
    setPosts(rows);

    // 2) usernames (display_name) from public.users
    const authorIds = [...new Set(rows.map((p) => p.user_id))].filter(Boolean);

    if (authorIds.length) {
      const { data: usersRows, error: uErr } = await supabase
        .from("users")
        .select("id, display_name")
        .in("id", authorIds);

      if (uErr) {
        setError(uErr.message);
        setLoading(false);
        return;
      }

      const map = {};
      (usersRows || []).forEach((u) => {
        map[u.id] = u.display_name || "Gebruiker";
      });
      setUserMap(map);
    } else {
      setUserMap({});
    }

    // 3) like counts (view)
    const postIds = rows.map((p) => p.id);
    if (postIds.length) {
      const { data: likeRows, error: lErr } = await supabase
        .from("post_like_counts")
        .select("post_id, like_count")
        .in("post_id", postIds);

      if (lErr) {
        setError(lErr.message);
        setLoading(false);
        return;
      }

      const lc = {};
      (likeRows || []).forEach((r) => (lc[r.post_id] = r.like_count));
      setLikeCounts(lc);
    } else {
      setLikeCounts({});
    }

    // 4) which posts did I like?
    if (me && postIds.length) {
      const { data: myLikes, error: mlErr } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", me.id)
        .in("post_id", postIds);

      if (mlErr) {
        setError(mlErr.message);
        setLoading(false);
        return;
      }

      setLikedByMe(new Set((myLikes || []).map((r) => r.post_id)));
    } else {
      setLikedByMe(new Set());
    }

    setLoading(false);
  }

  useEffect(() => {
    loadFeed();
  }, []);

  async function handleAddPost(e) {
    e.preventDefault();
    setError("");

    const text = newText.trim();
    if (!text) return;

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) return setError(authErr.message);
    if (!authData.user) return setError("Niet ingelogd.");

    const { data: inserted, error: insErr } = await supabase
      .from("posts")
      .insert({
        user_id: authData.user.id,
        text,
        image_url: null, // later: Supabase Storage
      })
      .select()
      .single(); // return inserted row [web:47]

    if (insErr) return setError(insErr.message);

    setPosts((prev) => [inserted, ...prev]);
    setLikeCounts((prev) => ({ ...prev, [inserted.id]: 0 }));
    setNewText("");
  }

  async function toggleLike(postId) {
    setError("");

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) return setError(authErr.message);
    const me = authData.user;
    if (!me) return setError("Niet ingelogd.");

    const isLiked = likedByMeMemo.has(postId);

    if (isLiked) {
      const { error: delErr } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", me.id);

      if (delErr) return setError(delErr.message);

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

    if (insErr) return setError(insErr.message);

    setLikedByMe((prev) => new Set([...prev, postId]));
    setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
  }

  return (
    <div className="columns is-centered">
      <div className="column is-two-thirds">
        <h2 className="title is-4">Community feed</h2>
        <p className="subtitle is-6">Deel je feedback en motiveer elkaar.</p>

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
              <button type="submit" className="button is-link">
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

        {!loading && posts.length === 0 && (
          <p className="has-text-grey">Nog geen posts. Zet de eerste!</p>
        )}
      </div>
    </div>
  );
}

export default CommunityPage;
