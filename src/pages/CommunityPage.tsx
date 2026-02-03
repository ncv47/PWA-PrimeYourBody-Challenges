import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase.ts';

type PostWithMeta = {
  id: number;
  text: string;
  created_at: string;
  is_admin_post: boolean;
  user_id: string;
  users: {
    display_name: string | null;
    admin: boolean | null;
    avatar_url: string | null;
  } | null;
  like_count: number;
  liked_by_me: boolean;
};

const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    // ← avatar_url toegevoegd aan de query
    const { data, error } = await supabase
      .from('posts')
      .select('*, users!inner(display_name, admin, avatar_url)')  // ← avatar_url!
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      alert(error.message);
      setPosts([]);
      setLoading(false);
      return;
    }

    const postsRaw = (data || []) as any[];

    const postIds = postsRaw.map((p) => p.id);
    let likesByPost: Record<number, number> = {};
    let likedByMe: Record<number, boolean> = {};

    if (postIds.length > 0) {
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      (likesData || []).forEach((l: any) => {
        likesByPost[l.post_id] = (likesByPost[l.post_id] || 0) + 1;
        if (user && l.user_id === user.id) {
          likedByMe[l.post_id] = true;
        }
      });
    }

    const withMeta: PostWithMeta[] = postsRaw.map((p) => ({
      ...p,
      like_count: likesByPost[p.id] || 0,
      liked_by_me: likedByMe[p.id] || false,
    }));

    setPosts(withMeta);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ← avatar_url ook hier toevoegen
    const { data, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        text: newPost,
        is_admin_post: false,
      })
      .select('*, users(display_name, admin, avatar_url)')  // ← avatar_url!
      .maybeSingle();

    if (!postError && data) {
      setPosts((prev) => [
        {
          ...(data as any),
          like_count: 0,
          liked_by_me: false,
        },
        ...prev,
      ]);
      setNewPost('');
    } else if (postError) {
      alert(postError.message);
    }
  };

  const toggleLike = async (post: PostWithMeta) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              like_count: p.like_count + (p.liked_by_me ? -1 : 1),
            }
          : p
      )
    );

    if (post.liked_by_me) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      if (error) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  liked_by_me: true,
                  like_count: p.like_count + 1,
                }
              : p
          )
        );
      }
    } else {
      const { error } = await supabase.from('post_likes').insert({
        post_id: post.id,
        user_id: user.id,
      });

      if (error) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  liked_by_me: false,
                  like_count: p.like_count - 1,
                }
              : p
          )
        );
      }
    }
  };

  return (
    <div className="space-y-8 max-w-[750px] mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-black text-[#4B4B4B]">Community Feed</h1>
        <p className="font-bold text-[#AFAFAF] uppercase tracking-widest text-xs mt-1">
          Motiveer elkaar!
        </p>
      </div>

      <form onSubmit={handlePost} className="duo-card p-6 md:p-7 bg-white space-y-4">
        <textarea
          placeholder="Deel je progressie of een bemoedigend woord..."
          className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl p-4 focus:outline-none focus:border-[#1CB0F6] font-bold text-[#4B4B4B] resize-none"
          rows={3}
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-10 md:px-12 py-3 md:py-3.5 rounded-3xl font-black uppercase tracking-[0.18em] text-[11px] md:text-xs text-white bg-[#55CDFC] border-b-[4px] border-[#1C8ED9] shadow-md hover:bg-[#1C8ED9] active:translate-y-[2px] active:border-b-[2px] transition-all"
          >
            DEEL BERICHT
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1CB0F6]"></div>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className={`duo-card p-6 md:p-7 bg-white transition-all hover:scale-[1.01] ${
                post.is_admin_post ? 'border-[#1CB0F6] bg-[#F1FBFF]' : ''
              }`}
            >
              <div className="flex gap-4">
                {/* ← Profile picture ipv emoji */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 overflow-hidden">
                  {post.users?.avatar_url ? (
                    <img
                      src={post.users.avatar_url}
                      alt="Profiel"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center text-2xl ${
                        post.users?.admin
                          ? 'bg-yellow-100 border-yellow-400'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      {post.users?.admin ? '⚡' : '👤'}
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-[#4B4B4B]">
                      {post.users?.display_name || 'Sporter'}
                    </h4>
                    {post.is_admin_post && (
                      <span className="text-[10px] font-black bg-[#1C8ED9] text-white px-2 py-0.5 rounded-lg uppercase tracking-widest">
                        COACH
                      </span>
                    )}
                  </div>
                  <p className="text-[#777777] font-bold leading-relaxed">{post.text}</p>
                  <div className="mt-4 flex items-center justify-between border-t-2 border-gray-50 pt-3">
                    <span className="text-[10px] font-black text-[#AFAFAF] uppercase">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleLike(post)}
                      className={`font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-colors ${
                        post.liked_by_me ? 'text-red-500' : 'text-[#AFAFAF] hover:text-red-400'
                      }`}
                    >
                      <span className="text-sm">
                        {post.liked_by_me ? '❤️' : '🤍'}
                      </span>
                      <span>{post.like_count}</span>
                      <span>Likes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20 grayscale opacity-50">
            <span className="text-6xl block mb-4">📭</span>
            <p className="font-black text-[#AFAFAF] uppercase text-xs">
              Nog geen berichten...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
