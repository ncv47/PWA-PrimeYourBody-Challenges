import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase.ts';

type ChallengeCommentWithMeta = {
  id: number;
  challenge_id: number;
  user_id: string;
  text: string | null;
  proof_url: string | null;
  visibility: 'public' | 'coach';
  created_at: string;
  parent_id: string | null;
  users: Array<{
    display_name: string | null;
    admin: boolean;
    avatar_url: string | null;
  }>;
  challenge: Array<{
    id: number;
    week: number;
    title: string;
  }>;
};

const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<ChallengeCommentWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyWinners, setMonthlyWinners] = useState<any[]>([]);

  const fetchPosts = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    const isAdmin = user?.user_metadata?.admin || false;

    const monthKey =
      'monthly_' +
      new Date().toISOString().slice(0, 7).replace('-', '_');

    const { data: winners } = await supabase
      .from('user_badges')
      .select(`
        user_id,
        earned_at,
        users:users(display_name, avatar_url)
      `)
      .eq('badge_key', monthKey);

setMonthlyWinners(winners || []);


    const { data, error } = await supabase
      .from('challenge_comments')
      .select(`
        id, challenge_id, user_id, text, proof_url, visibility, 
        created_at, parent_id,
        users:users!inner(display_name, admin, avatar_url),
        challenge:challenges!inner(id, week, title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      setPosts([]);
      setLoading(false);
      return;
    }

    const visiblePosts = (data || [])
      .filter((post: any) => 
        post.visibility === 'public' || (post.visibility === 'coach' && isAdmin)
      )
      .map((post: any): ChallengeCommentWithMeta => ({
        ...post,
        users: Array.isArray(post.users) ? post.users : [post.users || {}],
        challenge: Array.isArray(post.challenge) ? post.challenge : [post.challenge || {}]
      }));

    setPosts(visiblePosts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#55CDFC]"></div>
        <p className="font-black text-[#55CDFC] uppercase tracking-widest text-[10px]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 md:px-0 space-y-16">
      <div className="text-center space-y-6 pt-12">
        <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">
          Community Challenges
        </h1>
        <p className="text-[#777777] font-bold text-xl italic max-w-lg mx-auto leading-relaxed">
          "Lees ervaringen van anderen en laat je motiveren!"
        </p>
      </div>

      <div className="space-y-12">
        {posts.length === 0 ? (
          <div className="p-20 text-center border-dashed border-4 border-gray-100 rounded-3xl opacity-40">
            <span className="text-6xl mb-8 block">📭</span>
            <h2 className="text-3xl font-black text-gray-800 mb-4">Nog geen berichten</h2>
            <p className="text-gray-500 font-bold text-xl">Check later voor nieuwe challenges!</p>
          </div>
        ) : (
          posts.map((post) => {
            const user = post.users[0] || { display_name: 'Sporter', admin: false, avatar_url: null };
            const challenge = post.challenge[0] || { id: 0, week: 0, title: 'Onbekende Challenge' };

            return (
              <section key={post.id} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-xl overflow-hidden max-w-2xl mx-auto">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#55CDFC] via-[#58CC02] to-[#FFC800]" />
                <div className="pt-8 px-8 pb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#55CDFC] text-white font-black uppercase tracking-[0.2em] text-[11px] px-3 py-1.5 rounded-full">
                        Week {challenge.week}
                      </span>
                      <h3 className="font-black text-xl text-gray-800 truncate">
                        {challenge.title}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      post.visibility === 'coach' 
                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                        : 'bg-green-100 text-green-800 border-2 border-green-300'
                    }`}>
                      {post.visibility === 'coach' ? 'Coach only' : 'Publiek'}
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                    <div className="flex justify-center lg:justify-start flex-shrink-0 mx-auto lg:mx-0">
                      <div className="w-20 h-20 rounded-3xl border-3 border-gray-200 overflow-hidden shadow-lg">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                            👤
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-grow space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h4 className="font-black text-xl md:text-2xl text-gray-800">
                          {user.display_name}
                        </h4>
                        {user.admin && (
                          <span className="text-[11px] font-black bg-[#55CDFC] text-white px-3 py-1 rounded-full uppercase tracking-widest self-start sm:self-auto">
                            COACH
                          </span>
                        )}
                      </div>

                      {post.text && (
                        <p className="text-gray-700 font-semibold leading-relaxed text-lg md:text-xl">
                          "{post.text}"
                        </p>
                      )}

                      {post.proof_url && (
                        <div className="flex justify-center">
                          <div className="w-full max-w-sm md:max-w-md">
                            <img 
                              src={post.proof_url} 
                              alt="Bewijs"
                              className="w-full h-56 md:h-64 object-cover rounded-2xl shadow-xl"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                        <span className="text-base font-bold text-gray-500">
                          {new Date(post.created_at).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
