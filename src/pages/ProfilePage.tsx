import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase.ts';
import { UserProfile, Badge } from '../types.ts';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = getSupabase();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: prof } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile((prof || null) as UserProfile | null);

      const { data: b } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      const badgeList = (b || []) as Badge[];
      setBadges(badgeList);
      setTotalPoints(badgeList.reduce((sum, item) => sum + (item.points || 0), 0));

      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="text-center py-20 font-black text-[#55CDFC] uppercase">Profiel laden...</div>;
  }

  return (
    <div className="space-y-10 max-w-[800px] mx-auto">
      <section className="bg-white rounded-3xl p-10 duo-card flex flex-col items-center text-center">
        <div className="w-32 h-32 bg-blue-50 rounded-3xl flex items-center justify-center border-4 border-blue-100 mb-6 shadow-sm">
          <span className="text-6xl">👤</span>
        </div>
        <h1 className="text-4xl font-black text-gray-800 tracking-tight">
          {profile?.display_name || 'Sporter'}
        </h1>
        <p className="text-[#55CDFC] font-black uppercase tracking-[0.2em] text-xs mt-2">
          {profile?.admin ? 'Coach Status' : 'Atleet'}
        </p>

        <div className="mt-8 flex gap-12">
          <div className="text-center">
            <p className="text-3xl font-black text-gray-800">{totalPoints}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Punten</p>
          </div>
          <div className="w-px bg-gray-100 self-stretch"></div>
          <div className="text-center">
            <p className="text-3xl font-black text-gray-800">{badges.length}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Badges</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <span className="text-2xl">🏅</span>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Mijn Badges</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {badges.length > 0 ? (
            badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-3xl p-8 duo-card flex flex-col items-center text-center group hover:scale-[1.05] transition-all"
              >
                <div className="text-5xl mb-4 transform group-hover:rotate-12 transition-transform">💎</div>
                <h4 className="font-black text-gray-800 text-sm leading-tight uppercase tracking-tighter">
                  {badge.badge_name === 'month_4x' ? 'Maand Kampioen' : badge.badge_name}
                </h4>
                <p className="text-[10px] font-black text-[#55CDFC] uppercase mt-3 tracking-widest">
                  +{badge.points} XP
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">
                Begin een challenge om je
                <br />
                eerste badge te verdienen!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
