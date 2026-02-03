import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase.ts';
import { Challenge, CheckIn } from '../types.ts';

type ChallengeWithStatus = Challenge & {
  checkins: CheckIn[];
};

const useNotifications = () => {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');

  const requestPermission = async () => {
    console.log('🔔 Requesting permission...');
    
    if (!('Notification' in window)) {
      alert('Notifications niet ondersteund');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      console.log('Permission result:', perm);
      
      // ✅ FORCE UPDATE - direct browser state lezen
      const currentPerm = Notification.permission as 'granted' | 'denied' | 'default';
      setPermission(currentPerm);
      
      return currentPerm;
    } catch (err) {
      console.error('Permission error:', err);
      setPermission('denied');
    }
  };

  const showTestNotification = () => {
    // ✅ DIRECT BROWSER CHECK - geen state afhankelijkheid!
    const currentPermission = Notification.permission as 'granted' | 'denied' | 'default';
    console.log('🔔 Current browser permission:', currentPermission);
    
    if (currentPermission !== 'granted') {
      alert(`Toestemming nodig! Status: ${currentPermission}`);
      requestPermission(); // Auto-request als nog geen permission
      return;
    }

    console.log('✅ Creating notification...');
    
    try {
      const notification = new Notification('🔔 Test Reminder!', {
        body: 'Dit is een test notificatie!',
        icon: '/favicon.ico',
        tag: `reminder-${Date.now()}`
      });
      
      console.log('✅ Notification created!');
      
      notification.onclick = () => {
        console.log('Notification clicked!');
        window.focus();
      };
      
    } catch (error) {
      console.error('Notification creation failed:', error);
      alert('Kon notificatie niet maken');
    }
  };

  return { permission, requestPermission, showTestNotification };
};

const ChallengePage: React.FC = () => {
  const [challenges, setChallenges] = useState<ChallengeWithStatus[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Record<number, string>>({});
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Notifications
  const { permission, requestPermission, showTestNotification } = useNotifications();

  const fetchHomeData = async () => {
    setLoading(true);

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: activeChallenges, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('active', true)
      .order('week', { ascending: false });

    if (challengeError || !activeChallenges) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    const challengeIds = activeChallenges.map((c) => c.id);

    const { data: checkinsData } = await supabase
      .from('challenge_checkins')
      .select('*')
      .eq('user_id', user.id)
      .in('challenge_id', challengeIds.length ? challengeIds : [-1]);

    const checkinsByChallenge: Record<number, CheckIn[]> = {};
    (checkinsData || []).forEach((ci: any) => {
      if (!checkinsByChallenge[ci.challenge_id]) {
        checkinsByChallenge[ci.challenge_id] = [];
      }
      checkinsByChallenge[ci.challenge_id].push(ci as CheckIn);
    });

    const merged: ChallengeWithStatus[] = activeChallenges.map((c: any) => ({
      ...(c as Challenge),
      checkins: checkinsByChallenge[c.id] || [],
    }));

    setChallenges(merged);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthRows } = await supabase
      .from('challenge_checkins')
      .select('challenge_id')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const distinct = new Set((monthRows || []).map((r: any) => r.challenge_id));
    setMonthlyCount(distinct.size);

    setLoading(false);
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleLevelSelect = (challengeId: number, level: string) => {
    setSelectedLevels((prev) => ({
      ...prev,
      [challengeId]: level,
    }));
  };

  const handleDone = async (challenge: ChallengeWithStatus) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const level = selectedLevels[challenge.id] || 'Standard';

    const { error } = await supabase.from('challenge_checkins').insert({
      challenge_id: challenge.id,
      user_id: user.id,
      level,
    });

    if (error) {
      alert('Je hebt deze challenge al afgevinkt!');
    } else {
      await fetchHomeData();
    }
  };

  const getStatusLabel = (c: ChallengeWithStatus) => {
    if (c.checkins.length === 0) return 'Nog niet geprobeerd';
    return 'Challenge gelukt';
  };

  const getStatusStyle = (c: ChallengeWithStatus) => {
    if (c.checkins.length === 0) {
      return 'bg-gray-100 text-gray-500 border-gray-200';
    }
    if (c.checkins.length === 1) {
      return 'bg-yellow-50 text-yellow-600 border-yellow-300';
    }
    return 'bg-[#E1F5FE] text-[#55CDFC] border-[#55CDFC]';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#55CDFC]"></div>
        <p className="font-black text-[#55CDFC] uppercase tracking-widest text-[10px]">
          Loading Stage...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-0 space-y-8">
      {/* NOTIFICATION TEST BUTTONS - NIEUW */}
      <section className="bg-white rounded-3xl p-8 duo-card shadow-sm border-2 border-gray-100">
        <h3 className="text-xl font-black text-gray-800 mb-4 uppercase tracking-tight flex items-center gap-3">
          🔔 Reminder Test
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={requestPermission}
            className="px-6 py-3 rounded-2xl bg-gray-200 text-gray-800 font-black uppercase tracking-wider text-sm hover:bg-gray-300 transition-all border border-gray-300"
          >
            {permission === 'default' && 'Vraag toestemming'}
            {permission === 'granted' && '✅ Toestemming OK'}
            {permission === 'denied' && '❌ Toestemming geweigerd'}
          </button>
          
          {permission === 'granted' && (
            <button
              onClick={showTestNotification}
              className="px-8 py-3 rounded-2xl bg-[#55CDFC] text-white font-black uppercase tracking-wider text-sm hover:bg-[#3cb3df] transition-all shadow-md border-b-4 border-[#1C8ED9] active:border-b-2 active:translate-y-[1px]"
            >
              🚀 Test Notificatie
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3 font-bold">
          Werkt op Android/iOS Chrome/Safari (PWA mode)
        </p>
      </section>

      {/* Challenges layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8">
        {/* LINKERKANT – Challenges */}
        <div className="space-y-6">
          {challenges.length > 0 ? (
            challenges.map((challenge) => {
              const isDone = challenge.checkins.length > 0;
              const selectedLevel = selectedLevels[challenge.id] || 'Standard';

              return (
                <section
                  key={challenge.id}
                  className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#55CDFC] via-[#58CC02] to-[#FFC800]" />

                  <div className="pt-4 px-5 md:px-6 pb-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-[#55CDFC] text-white font-black uppercase tracking-[0.2em] text-[9px] px-3 py-1 rounded-full">
                          Week {challenge.week}
                        </span>
                        <span
                          className={[
                            'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border',
                            getStatusStyle(challenge),
                          ].join(' ')}
                        >
                          {getStatusLabel(challenge)}
                        </span>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
                        {challenge.title}
                      </h2>
                      <p className="text-[#777777] font-bold text-sm md:text-base leading-relaxed max-w-lg mx-auto italic">
                        "{challenge.description}"
                      </p>
                    </div>

                    {challenge.video_url && (
                      <a
                        href={challenge.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl bg-gray-50 aspect-[16/10] md:aspect-[16/9] relative flex items-center justify-center hover:scale-[1.01] transition-transform group overflow-hidden mx-auto max-w-[92%]"
                      >
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-100 group-hover:scale-110 transition-transform">
                          <span className="text-[#55CDFC] text-xl md:text-2xl ml-1">▶</span>
                        </div>
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Video Instructie
                        </div>
                      </a>
                    )}

                    <div className="space-y-3 pt-3 border-t-2 border-gray-50">
                      <p className="text-center font-black text-gray-400 uppercase text-[10px] tracking-widest">
                        Kies je niveau
                      </p>
                      <div className="grid grid-cols-3 gap-2 md:gap-3">
                        {['Light', 'Standard', 'Pro'].map((lvl) => (
                          <button
                            key={lvl}
                            disabled={isDone}
                            onClick={() => handleLevelSelect(challenge.id, lvl)}
                            className={`py-3 md:py-4 rounded-2xl font-black uppercase text-[9px] md:text-[10px] border-2 transition-all ${
                              selectedLevel === lvl
                                ? 'bg-[#E1F5FE] border-[#55CDFC] text-[#55CDFC] shadow-[0_3px_0_#55CDFC]'
                                : 'bg-white border-gray-200 text-gray-400 border-b-4 active:translate-y-1 active:border-b-2'
                            } ${isDone ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDone(challenge)}
                      disabled={isDone}
                      className={[
                        'w-full mt-3 py-4 md:py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs md:text-sm border-b-[5px] transition-all',
                        isDone
                          ? 'bg-[#58CC02] border-[#46A302] text-white cursor-default'
                          : 'bg-[#55CDFC] border-[#1C8ED9] text-white hover:bg-[#1C8ED9] active:translate-y-[2px] active:border-b-[3px]',
                      ].join(' ')}
                    >
                      {isDone ? '✓ CHALLENGE GELUKT' : 'MARKEER CHALLENGE ALS DONE'}
                    </button>
                  </div>
                </section>
              );
            })
          ) : (
            <div className="duo-card p-16 text-center border-dashed border-4 border-gray-100 grayscale opacity-40">
              <span className="text-6xl mb-6 block">⚡</span>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Batterij Opladen</h2>
              <p className="text-gray-400 font-bold mt-2">Geen actieve uitdaging voor deze week.</p>
            </div>
          )}
        </div>

        {/* RECHTERKANT – voortgang */}
        <aside className="space-y-6 lg:space-y-8">
          <section className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Maand voortgang
                </p>
                <p className="mt-1 text-xl font-black text-gray-800">
                  {monthlyCount} / 4 Challenges
                </p>
              </div>
              <span className="text-2xl">📅</span>
            </div>
            <div className="h-3 w-full bg-[#F3F4F6] rounded-full overflow-hidden border border-gray-200">
              <div
                className="h-full bg-[#55CDFC] transition-all duration-1000"
                style={{ width: `${Math.min(100, (monthlyCount / 4) * 100)}%` }}
              ></div>
            </div>
            <p className="mt-3 text-[11px] font-bold text-gray-500">
              Nog <span className="font-black text-[#55CDFC]">{Math.max(0, 4 - monthlyCount)}</span> challenges
              deze maand voor een bonus badge.
            </p>
          </section>

          <section className="bg-[#F1FBFF] rounded-3xl border-2 border-[#55CDFC] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest">
                  Mijn punten
                </p>
                <p className="mt-1 text-2xl font-black text-gray-800">420 XP</p>
              </div>
              <span className="text-3xl">💪</span>
            </div>

            <div className="pt-4 border-t border-[#E0F3FF] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest">
                  Groepsdoel
                </p>
                <span className="text-[11px] font-bold text-[#55CDFC]">18 / 25 challenges</span>
              </div>
              <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-[#D0EAFE]">
                <div
                  className="h-full bg-[#58CC02] transition-all duration-1000"
                  style={{ width: '72%' }}
                ></div>
              </div>
              <p className="text-[11px] font-bold text-[#55CDFC]">
                Nog <span className="font-black">7</span> challenges nodig om het groepsdoel te halen!
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ChallengePage;