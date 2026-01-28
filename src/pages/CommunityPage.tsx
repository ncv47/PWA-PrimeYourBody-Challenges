
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.ts';

const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    // Joining with users table for display_name and admin status
    const { data, error } = await supabase
      .from('posts')
      .select('*, users!inner(display_name, admin)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      setError(error.message);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: postError } = await supabase.from('posts').insert({
      user_id: user.id,
      text: newPost,
      is_admin_post: false
    });

    if (!postError) {
      setNewPost('');
      fetchPosts();
    } else {
      alert(postError.message);
    }
  };

  return (
    <div className="space-y-8 max-w-[600px] mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-black text-[#4B4B4B]">Community Feed</h1>
        <p className="font-bold text-[#AFAFAF] uppercase tracking-widest text-xs mt-1">Motiveer elkaar!</p>
      </div>

      {/* Post Form */}
      <form onSubmit={handlePost} className="duo-card p-6 bg-white space-y-4">
        <textarea
          placeholder="Deel je progressie of een bemoedigend woord..."
          className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl p-4 focus:outline-none focus:border-[#1CB0F6] font-bold text-[#4B4B4B] resize-none"
          rows={3}
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <div className="flex justify-end">
          <button type="submit" className="px-10 py-3 duo-btn-primary text-sm tracking-widest">
            DEEL BERICHT
          </button>
        </div>
      </form>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1CB0F6]"></div>
          </div>
        ) : posts.map((post) => (
          <div key={post.id} className={`duo-card p-6 bg-white transition-all hover:scale-[1.01] ${post.is_admin_post ? 'border-[#1CB0F6] bg-[#F1FBFF]' : ''}`}>
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl border-2 ${post.users?.admin ? 'bg-yellow-100 border-yellow-400' : 'bg-gray-100 border-gray-200'}`}>
                {post.users?.admin ? '⚡' : '👤'}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-black text-[#4B4B4B]">{post.users?.display_name || 'Sporter'}</h4>
                  {post.is_admin_post && (
                    <span className="text-[10px] font-black bg-[#1CB0F6] text-white px-2 py-0.5 rounded-lg uppercase tracking-widest">COACH</span>
                  )}
                </div>
                <p className="text-[#777777] font-bold leading-relaxed">{post.text}</p>
                <div className="mt-4 flex items-center justify-between border-t-2 border-gray-50 pt-3">
                  <span className="text-[10px] font-black text-[#AFAFAF] uppercase">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  <button className="text-[#AFAFAF] hover:text-red-400 font-black uppercase text-xs tracking-widest flex items-center gap-1 transition-colors">
                    <span>❤️</span> Like
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20 grayscale opacity-50">
            <span className="text-6xl block mb-4">📭</span>
            <p className="font-black text-[#AFAFAF] uppercase text-xs">Nog geen berichten...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
