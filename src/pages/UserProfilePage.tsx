import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabase } from '../lib/supabase.ts';

type UserBadge = {
  id: number;
  badge_key: string;
  earned_at: string;
};

const BADGE_META: Record<string, { title: string; icon: string }> = {
  challenge_completed_key: { title: 'Challenge Voltooid', icon: '🏅' },
  lifetime_10: { title: '10 Challenges', icon: '🥉' },
  lifetime_100: { title: '100 Challenges', icon: '🏆' },
};

const UserProfilePage: React.FC = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabase();

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: badgeData } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      setProfile(userProfile);
      setBadges(badgeData || []);
      setLoading(false);
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-20 font-black text-[#55CDFC] uppercase">
        Profiel laden...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 font-black text-gray-600">
        Gebruiker niet gevonden
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-[800px] mx-auto">
      <section className="bg-white rounded-3xl p-10 duo-card flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-blue-100 mb-6">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              👤
            </div>
          )}
        </div>

        <h1 className="text-4xl font-black text-gray-800">
          {profile.display_name || 'Sporter'}
        </h1>

        <p className="text-[#55CDFC] font-black uppercase tracking-widest text-xs mt-2">
          {profile.admin ? 'Coach' : 'Atleet'}
        </p>

        <div className="mt-6 text-center">
          <p className="text-3xl font-black">{badges.length}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Badges
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
          🏅 Badges
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {badges.length > 0 ? (
            badges.map((badge) => {
              const meta =
                BADGE_META[badge.badge_key] ?? {
                  title: badge.badge_key,
                  icon: '🎖️',
                };

              return (
                <div
                  key={badge.id}
                  className="bg-white rounded-3xl p-8 duo-card flex flex-col items-center text-center"
                >
                  <div className="text-5xl mb-4">{meta.icon}</div>
                  <h4 className="font-black text-sm uppercase">
                    {meta.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(badge.earned_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400 font-black uppercase text-xs">
              Nog geen badges
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserProfilePage;
