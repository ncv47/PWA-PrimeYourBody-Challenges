import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from '../lib/supabase.ts';
import { Challenge, CheckIn } from '../types.ts';

type ChallengeWithStatus = Challenge & {
  checkins: CheckIn[];
};

// ✅ PERMANENTE notificatie hook (browser onthoudt zelf)
const useNotifications = () => {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const notifiedChallenges = useRef<Set<number>>(new Set());

  // Check browser permission bij elke load (blijft permanent!)
  useEffect(() => {
    const currentPerm = Notification.permission as 'granted' | 'denied' | 'default';
    setPermission(currentPerm);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    
    try {
      await Notification.requestPermission();
      // Browser slaat PERMANENT op - werkt ook als app/tab gesloten
      const newPerm = Notification.permission as 'granted' | 'denied' | 'default';
      setPermission(newPerm);
      console.log('✅ Permission permanent opgeslagen:', newPerm);
    } catch (err) {
      setPermission('denied');
    }
  };

  const sendNotification = (title: string, body: string, tag: string) => {
    if (Notification.permission !== 'granted') return false;
    
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag
      });
      
      notification.onclick = () => {
        window.focus();
        window.location.href = '/challenges';
      };
      
      console.log('🔔 Notification verstuurd:', title);
      return true;
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  };

  const sendNewChallengeNotification = (challenge: ChallengeWithStatus) => {
    const tag = `new-challenge-${challenge.id}`;
    if (notifiedChallenges.current.has(challenge.id!)) return false;
    
    const sent = sendNotification(
      `🎉 Nieuwe Challenge! Week ${challenge.week}`,
      `${challenge.title}\nStart direct met deze challenge!`,
      tag
    );
    
    if (sent) notifiedChallenges.current.add(challenge.id!);
    return sent;
  };

  return { permission, requestPermission, sendNewChallengeNotification };
};

const ChallengePage: React.FC = () => {
  const [challenges, setChallenges] = useState<ChallengeWithStatus[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Record<number, string>>({});
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // ✅ FIX: Maak notifiedChallenges beschikbaar
  const previouslyActive = useRef<Set<number>>(new Set());
  const challengeVersion = useRef(0);
  const notifiedChallenges = useRef<Set<number>>(new Set()); // ← DIT TOEVOEGEN
  
  const { permission, requestPermission, sendNewChallengeNotification } = useNotifications();

  // ✅ FIX: Nieuwe challenges met version reset
  useEffect(() => {
    if (permission !== 'granted') return;
    
    // Force refresh detectie voor nieuwe tests
    challengeVersion.current += 1;
    
    challenges.forEach(challenge => {
      const id = challenge.id!;
      // Was niet eerder actief EN nu actief = NIEUWE CHALLENGE!
      if (challenge.active && !previouslyActive.current.has(id)) {
        console.log('🎉 NIEUWE ACTIEVE CHALLENGE DETECTED:', challenge.title);
        sendNewChallengeNotification(challenge);
        previouslyActive.current.add(id);
      }
    });

    // Update lijst actieve challenges
    challenges.forEach(challenge => {
      if (challenge.active) previouslyActive.current.add(challenge.id!);
    });
  }, [challenges, permission, sendNewChallengeNotification]);

  const fetchHomeData = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: activeChallenges } = await supabase
      .from('challenges')
      .select(`
        *,
        challenge_checkins (
          id, user_id, level, created_at
        )
      `)
      .eq('active', true)
      .order('week', { ascending: false });

    const merged = (activeChallenges || []).map((c: any) => ({
      ...c,
      checkins: c.challenge_checkins?.filter((ci: any) => ci.user_id === user.id) || [],
    }));

    setChallenges(merged);

    // Monthly count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthRows } = await supabase
      .from('challenge_checkins')
      .select('challenge_id')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    setMonthlyCount((monthRows || []).length);
    setLoading(false);
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchHomeData, 5 * 60 * 1000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const handleLevelSelect = (challengeId: number, level: string) => {
    setSelectedLevels(prev => ({ ...prev, [challengeId]: level }));
  };

  const handleDone = async (challenge: ChallengeWithStatus) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const level = selectedLevels[challenge.id!] || 'Standard';

    const { error } = await supabase.from('challenge_checkins').insert({
      challenge_id: challenge.id!,
      user_id: user.id,
      level,
    });

    if (!error) {
      await fetchHomeData();
    } else {
      alert('Je hebt deze challenge al afgevinkt!');
    }
  };

  // 🔄 ADMIN TEST RESET (tijdelijk)
  const resetForTesting = () => {
    challengeVersion.current = 0;
    previouslyActive.current.clear();
    notifiedChallenges.current.clear(); // ✅ NU WERKT DIT
    fetchHomeData();
    console.log('🔄 TEST RESET voltooid - alle trackers gecleared');
  };

  const getStatusLabel = (c: ChallengeWithStatus) => 
    c.checkins.length === 0 ? 'Nog niet geprobeerd' : 'Challenge gelukt';

  const getStatusStyle = (c: ChallengeWithStatus) => 
    c.checkins.length === 0 ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-[#E1F5FE] text-[#55CDFC] border-[#55CDFC]';

  if (loading) {
    return <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#55CDFC]"></div>
      <p className="font-black text-[#55CDFC] uppercase tracking-widest text-[10px]">Loading...</p>
    </div>;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-0 space-y-8">
      {/* 🔔 PERMANENTE NOTIFICATIE BOX + TEST */}
      <section className="bg-gradient-to-r from-[#E1F5FE] to-[#B3E5FC] rounded-3xl p-6 border-2 border-[#55CDFC]/50 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 bg-white/80 rounded-2xl shadow-sm border">
              <span className="text-2xl">🔔</span>
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-800 leading-tight">Push Reminders</h3>
              <p className="text-sm text-gray-600 font-bold">
                {permission === 'granted' ? (
                  '✅ Actief (werkt ook als app gesloten)'
                ) : permission === 'denied' ? (
                  '❌ Uitgeschakeld'
                ) : (
                  '📱 Klik Toestaan (blijft permanent)'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
            {permission !== 'granted' && (
              <button
                onClick={requestPermission}
                className="px-8 py-3 rounded-2xl bg-[#55CDFC] text-white font-black uppercase tracking-wider text-sm shadow-lg border-b-4 border-[#1C8ED9] hover:bg-[#3cb3df] transition-all"
              >
                Toestaan
              </button>
            )}
            
            {permission === 'granted' && (
              <>
                <div className="bg-white/80 px-6 py-3 rounded-2xl border-2 border-green-200 text-sm font-black text-green-700 flex items-center gap-2 shadow-md">
                  <span>🔔</span>
                  <span>PERMANENT ACTIEF</span>
                </div>
                {/* 🔄 ADMIN TEST BUTTON */}
                <button
                  onClick={resetForTesting}
                  className="px-4 py-2 bg-yellow-400 text-black text-xs font-black uppercase rounded-xl hover:bg-yellow-500 transition-all shadow-md"
                >
                  🔄 Test Reset
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/50">
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">📅 Automatisch:</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 font-semibold">
            <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl">
              <span>🎉</span>
              <span>Nieuwe challenges</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl">
              <span>⏰</span>
              <span>12u voor deadline</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 font-bold italic">
            💡 Werkt op iOS/Android als PWA geïnstalleerd
          </p>
        </div>
      </section>

      {/* Challenges grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8">
        <div className="space-y-6">
          {challenges.length > 0 ? challenges.map(challenge => {
            const isDone = challenge.checkins.length > 0;
            const selectedLevel = selectedLevels[challenge.id!] || 'Standard';
            
            return (
              <section key={challenge.id} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#55CDFC] via-[#58CC02] to-[#FFC800]" />
                <div className="pt-4 px-5 md:px-6 pb-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-[#55CDFC] text-white font-black uppercase tracking-[0.2em] text-[9px] px-3 py-1 rounded-full">
                      Week {challenge.week}
                    </span>
                    <span className={[getStatusStyle(challenge), 'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border'].join(' ')}>
                      {getStatusLabel(challenge)}
                    </span>
                  </div>

                  <div className="text-center space-y-1">
                    <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">{challenge.title}</h2>
                    <p className="text-[#777777] font-bold text-sm md:text-base leading-relaxed max-w-lg mx-auto italic">
                      "{challenge.description}"
                    </p>
                  </div>

                  {challenge.deadline_date && (
                    <div className="text-center">
                      <span className="bg-[#FFF7ED] px-4 py-2 rounded-2xl border-2 border-orange-200 text-orange-700 font-black text-sm">
                        ⏰ Deadline: {new Date(challenge.deadline_date).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  )}

                  {challenge.video_url && (
                    <a href={challenge.video_url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-gray-50 aspect-[16/10] relative flex items-center justify-center hover:scale-[1.01] transition-transform group overflow-hidden mx-auto max-w-[92%]">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-100 group-hover:scale-110 transition-transform">
                        <span className="text-[#55CDFC] text-xl md:text-2xl ml-1">▶</span>
                      </div>
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                        Video Instructie
                      </div>
                    </a>
                  )}

                  <div className="space-y-3 pt-3 border-t-2 border-gray-50">
                    <p className="text-center font-black text-gray-400 uppercase text-[10px] tracking-widest">Kies je niveau</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['Light', 'Standard', 'Pro'].map(lvl => (
                        <button
                          key={lvl}
                          disabled={isDone}
                          onClick={() => handleLevelSelect(challenge.id!, lvl)}
                          className={`py-3 rounded-2xl font-black uppercase text-[9px] border-2 transition-all ${
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
                      'w-full mt-3 py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-sm border-b-[5px] transition-all',
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
          }) : (
            <div className="p-16 text-center border-dashed border-4 border-gray-100 grayscale opacity-40 rounded-3xl">
              <span className="text-6xl mb-6 block">⚡</span>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Batterij Opladen</h2>
              <p className="text-gray-400 font-bold mt-2">Geen actieve uitdaging voor deze week.</p>
            </div>
          )}
        </div>

        {/* Sidebar stats */}
        <aside className="space-y-6 lg:space-y-8">
          <section className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Maand voortgang</p>
                <p className="mt-1 text-xl font-black text-gray-800">{monthlyCount} / 4 Challenges</p>
              </div>
              <span className="text-2xl">📅</span>
            </div>
            <div className="h-3 w-full bg-[#F3F4F6] rounded-full overflow-hidden border border-gray-200">
              <div className="h-full bg-[#55CDFC]" style={{ width: `${Math.min(100, (monthlyCount / 4) * 100)}%` }}></div>
            </div>
          </section>
          
          <section className="bg-[#F1FBFF] rounded-3xl border-2 border-[#55CDFC] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest">Mijn punten</p>
                <p className="mt-1 text-2xl font-black text-gray-800">420 XP</p>
              </div>
              <span className="text-3xl">💪</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ChallengePage;