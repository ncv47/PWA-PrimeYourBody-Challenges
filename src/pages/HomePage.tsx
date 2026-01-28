
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Challenge, CheckIn } from '../types.ts';

const HomePage: React.FC = () => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('Standard');
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchHomeData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: activeChallenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('active', true)
      .order('week', { ascending: false })
      .limit(1)
      .maybeSingle();

    setChallenge(activeChallenge);

    if (activeChallenge) {
      const { data: currentCheckins } = await supabase
        .from('challenge_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', activeChallenge.id);
      setCheckins(currentCheckins || []);
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const { data: monthRows } = await supabase
      .from('challenge_checkins')
      .select('challenge_id')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());
    
    const distinct = new Set((monthRows || []).map(r => r.challenge_id));
    setMonthlyCount(distinct.size);
    setLoading(false);
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleDone = async () => {
    if (!challenge) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('challenge_checkins').insert({
      challenge_id: challenge.id,
      user_id: user.id,
      level: selectedLevel
    });

    if (error) {
      alert("Je hebt deze challenge al afgevinkt!");
    } else {
      fetchHomeData();
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#55CDFC]"></div>
      <p className="font-black text-[#55CDFC] uppercase tracking-widest text-[10px]">Loading Stage...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-[800px] mx-auto">
      {/* Refined Header with Progress */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#F7F8FA] p-4 rounded-3xl border-2 border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏆</span>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Maand voortgang</p>
            <p className="font-black text-gray-800 text-sm">{monthlyCount} / 4 Challenges</p>
          </div>
        </div>
        <div className="h-3 w-48 bg-white rounded-full overflow-hidden border border-gray-200">
          <div 
            className="h-full bg-[#55CDFC] transition-all duration-1000" 
            style={{ width: `${Math.min(100, (monthlyCount / 4) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Challenge Card */}
      {challenge ? (
        <div className="space-y-6">
          <div className="text-center">
            <span className="bg-[#55CDFC] text-white font-black uppercase tracking-[0.2em] text-[9px] px-4 py-1.5 rounded-full mb-2 inline-block">Huidige Week</span>
            <h1 className="text-4xl font-black text-gray-800 tracking-tight leading-none mt-1">Week {challenge.week}</h1>
          </div>

          <div className="duo-card p-8 md:p-10 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{challenge.title}</h2>
              <p className="text-[#777777] font-bold text-base leading-relaxed max-w-lg mx-auto italic">"{challenge.description}"</p>
            </div>

            {challenge.video_url && (
              <a 
                href={challenge.video_url} 
                target="_blank" 
                rel="noreferrer"
                className="block duo-card bg-gray-50 aspect-video relative flex items-center justify-center hover:scale-[1.01] transition-transform group overflow-hidden"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-100 group-hover:scale-110 transition-transform">
                  <span className="text-[#55CDFC] text-2xl ml-1">▶</span>
                </div>
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Video Instructie</div>
              </a>
            )}

            <div className="space-y-4 pt-4 border-t-2 border-gray-50">
              <p className="text-center font-black text-gray-400 uppercase text-[10px] tracking-widest">Kies je niveau</p>
              <div className="grid grid-cols-3 gap-3">
                {['Light', 'Standard', 'Pro'].map((lvl) => (
                  <button
                    key={lvl}
                    disabled={checkins.length > 0}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`py-4 rounded-2xl font-black uppercase text-[10px] border-2 transition-all ${
                      selectedLevel === lvl 
                        ? 'bg-[#E1F5FE] border-[#55CDFC] text-[#55CDFC] shadow-[0_3px_0_#55CDFC]' 
                        : 'bg-white border-gray-200 text-gray-400 border-b-4 active:translate-y-1 active:border-b-2'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDone}
              disabled={checkins.length > 0}
              className={`w-full py-5 duo-btn-primary text-xl tracking-widest ${
                checkins.length > 0 ? 'bg-[#58CC02] border-b-[5px] border-[#46A302] hover:bg-[#58CC02]' : ''
              }`}
            >
              {checkins.length > 0 ? '✓ VOLTOOID' : 'MARKEER ALS DONE'}
            </button>
          </div>
        </div>
      ) : (
        <div className="duo-card p-20 text-center border-dashed border-4 border-gray-100 grayscale opacity-40">
          <span className="text-6xl mb-6 block">⚡</span>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Batterij Opladen</h2>
          <p className="text-gray-400 font-bold mt-2">Geen actieve uitdaging voor deze week.</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;