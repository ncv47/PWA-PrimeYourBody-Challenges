import { useEffect, useState } from "react";

const INITIAL_POSTS = [
  {
    id: 1,
    user: "Sarah",
    text: "Light-versie gedaan tussen meetings door. Voelt goed!",
    likes: 6,
    createdAt: "2u geleden",
  },
  {
    id: 2,
    user: "Jonas",
    text: "Foto gepost van de Pro-set in het park 🌳",
    likes: 4,
    createdAt: "5u geleden",
  },
];

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState("");

  // init vanuit localStorage of fallback naar INITIAL_POSTS
  useEffect(() => {
    const saved = localStorage.getItem("mpakt-community-posts");
    if (saved) {
      setPosts(JSON.parse(saved));
    } else {
      setPosts(INITIAL_POSTS);
    }
  }, []);

  // bij elke wijziging opslaan
  useEffect(() => {
    localStorage.setItem("mpakt-community-posts", JSON.stringify(posts));
  }, [posts]);

  function handleAddPost(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    const newPost = {
      id: Date.now(),
      user: "Jij",          // later vervangen door echte gebruiker
      text: newText.trim(),
      likes: 0,
      createdAt: "zojuist",
    };
    setPosts([newPost, ...posts]);
    setNewText("");
  }

  function handleLike(id) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, likes: p.likes + 1 } : p
      )
    );
  }

  return (
    <div className="columns is-centered">
        <h2 className="title is-4">Community feed</h2>
        <p className="subtitle is-6">
          Deel je foto, vertel hoe het ging en motiveer elkaar.
        </p>

        {/* nieuwe post */}
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
              <button type="button" className="button is-link is-light">
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

        {/* bestaande posts */}
        {posts.map((post) => (
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
                    <strong>{post.user}</strong>{" "}
                    <small>{post.createdAt}</small>
                    <br />
                    {post.text}
                  </p>
                </div>
                <nav className="level is-mobile">
                  <div className="level-left">
                    <button
                      type="button"
                      className="level-item button is-small is-white"
                      onClick={() => handleLike(post.id)}
                    >
                      👍 {post.likes}
                    </button>
                  </div>
                </nav>
              </div>
            </article>
          </div>
        ))}
    </div>
  );
}

export default CommunityPage;
