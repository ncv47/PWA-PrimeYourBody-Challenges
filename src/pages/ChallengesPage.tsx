import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase.ts';
import { Challenge, CheckIn, ChallengeComment } from '../types.ts';

type ChallengeWithData = Challenge & {
  checkins: CheckIn[];
  my_comments: ChallengeComment[];
};

const ChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<ChallengeWithData[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Record<number, string>>({});
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [proofFiles, setProofFiles] = useState<Record<number, File | null>>({});
  const [visibilities, setVisibilities] = useState<Record<number, 'public' | 'coach'>>({});
  const [confirming, setConfirming] = useState<Record<number, boolean>>({});

const fetchData = async () => {
  setLoading(true);
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    setLoading(false);
    return;
  }

  const { data: activeChallenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('active', true)
    .order('week', { ascending: false });

  const { data: userCheckins } = await supabase
    .from('challenge_checkins')
    .select('*')
    .eq('user_id', user.id);

  const { data: userComments } = await supabase
    .from('challenge_comments')
    .select(`
      id,
      challenge_id,
      user_id,
      text,
      proof_url,
      visibility,
      created_at,
      updated_at,
      parent_id,
      users:users!inner(display_name, admin, avatar_url)
    `)
    .eq('user_id', user.id);

  const challengesWithData: ChallengeWithData[] = (activeChallenges || []).map((challenge: Challenge) => ({
    ...challenge,
    checkins: (userCheckins || []).filter((ci: CheckIn) => ci.challenge_id === challenge.id),
    my_comments: (userComments || [])
      .map((c: any) => ({
        ...c,
        parent_id: c.parent_id || null,
        users: Array.isArray(c.users) ? c.users : []
      }))
      .filter((c: ChallengeComment) => c.challenge_id === challenge.id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }));

  setChallenges(challengesWithData);

  // Monthly count
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data: monthRows } = await supabase
    .from('challenge_checkins')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString());
  
  setMonthlyCount(monthRows?.length || 0);
  setLoading(false);
};


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLevelSelect = (challengeId: number, level: string) => {
    setSelectedLevels(prev => ({ ...prev, [challengeId]: level }));
  };

  const handleDone = async (challenge: ChallengeWithData) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const level = selectedLevels[challenge.id] || 'Standard';

    const { error } = await supabase.from('challenge_checkins').insert({
      challenge_id: challenge.id,
      user_id: user.id,
      level,
    });

    if (!error) {
      await fetchData();
    } else {
      alert('Je hebt deze challenge al voltooid!');
    }
  };

  const handleCommentSubmit = async (challengeId: number) => {
    if (!confirming[challengeId]) {
      setConfirming(prev => ({ ...prev, [challengeId]: true }));
      return;
    }

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.my_comments.length > 0) return;

    const text = commentTexts[challengeId]?.trim();
    const proofFile = proofFiles[challengeId];

    if (!text && !proofFile) {
      alert('Voeg tekst of foto toe!');
      setConfirming(prev => ({ ...prev, [challengeId]: false }));
      return;
    }

    setUploading(prev => ({ ...prev, [challengeId]: true }));

    let proofUrl = null;

    if (proofFile) {
      const ext = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${challengeId}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from('challenge_proof')
        .upload(fileName, proofFile, { upsert: false });

      if (error) {
        alert(error.message);
        setUploading(prev => ({ ...prev, [challengeId]: false }));
        setConfirming(prev => ({ ...prev, [challengeId]: false }));
        return;
      }

      proofUrl = supabase.storage
        .from('challenge_proof')
        .getPublicUrl(fileName).data.publicUrl;
    }

    await supabase.from('challenge_comments').insert({
      challenge_id: challengeId,
      user_id: user.id,
      text: text || null,
      proof_url: proofUrl,
      visibility: visibilities[challengeId] || 'public'
    });

    setUploading(prev => ({ ...prev, [challengeId]: false }));
    setConfirming(prev => ({ ...prev, [challengeId]: false }));
    setCommentTexts(prev => ({ ...prev, [challengeId]: '' }));
    setProofFiles(prev => ({ ...prev, [challengeId]: null }));
    setVisibilities(prev => ({ ...prev, [challengeId]: 'public' }));

    await fetchData();
  };

  const handleProofSelect = (challengeId: number, file: File | null) => {
    setProofFiles(prev => ({ ...prev, [challengeId]: file }));
  };

  const isDone = (challenge: ChallengeWithData) => challenge.checkins.length > 0;

  const hasPosted = (challenge: ChallengeWithData) =>
    challenge.my_comments.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#55CDFC]"></div>
        <p className="font-black text-[#55CDFC] uppercase tracking-widest text-[10px]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-0 space-y-8">
      <section className="bg-gradient-to-r from-[#E1F5FE] to-[#B3E5FC] rounded-3xl p-6 border-2 border-[#55CDFC]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <h3 className="font-black text-lg text-gray-800">Push Reminders</h3>
              <p className="text-sm text-gray-600 font-bold">✅ Actief</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8">
        <div className="space-y-6">
          {challenges.length > 0 ? challenges.map(challenge => {
            const challengeDone = isDone(challenge);
            const selectedLevel = selectedLevels[challenge.id] || 'Standard';

            return (
              <section key={challenge.id} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#55CDFC] via-[#58CC02] to-[#FFC800]" />
                <div className="pt-4 px-5 md:px-6 pb-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-[#55CDFC] text-white font-black uppercase tracking-[0.2em] text-[9px] px-3 py-1 rounded-full">
                      Week {challenge.week}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      challengeDone ? 'bg-[#E1F5FE] text-[#55CDFC] border-[#55CDFC]' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {challengeDone ? '✓ Voltooid' : 'Nog niet geprobeerd'}
                    </span>
                  </div>

                  <div className="text-center space-y-1">
                    <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">{challenge.title}</h2>
                    <p className="text-[#777777] font-bold text-sm md:text-base leading-relaxed max-w-lg mx-auto italic">
                      "{challenge.description}"
                    </p>
                  </div>

                  {challenge.video_url && (
                    <a href={challenge.video_url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-gray-50 aspect-[16/10] relative flex items-center justify-center mx-auto max-w-[92%]">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-[#55CDFC] text-xl ml-1">▶</span>
                      </div>
                    </a>
                  )}

                  {!challengeDone ? (
                    <>
                      <div className="space-y-3 pt-3 border-t-2 border-gray-50">
                        <p className="text-center font-black text-gray-400 uppercase text-[10px]">Kies niveau</p>
                        <div className="grid grid-cols-3 gap-2">
                          {['Light', 'Standard', 'Pro'].map(lvl => (
                            <button
                              key={lvl}
                              onClick={() => handleLevelSelect(challenge.id, lvl)}
                              className={`py-3 rounded-2xl font-black uppercase text-[9px] border-2 transition-all ${
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
                        onClick={() => handleDone(challenge)}
                        className="w-full py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-sm bg-[#55CDFC] border-b-[5px] border-[#1C8ED9] text-white hover:bg-[#1C8ED9]"
                      >
                        MARKEER ALS DONE
                      </button>
                    </>
                  ) : (
                    <div className="pt-4 border-t-2 border-gray-50 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[#58CC02] text-xl">💬</span>
                        <h4 className="font-black text-lg text-gray-800">Deel ervaring</h4>
                      </div>
                      {!hasPosted(challenge) && (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Hoe ging het? Tips voor anderen?"
                          className="w-full bg-[#F8FAFC] border-2 border-gray-200 rounded-2xl p-4 focus:border-[#55CDFC] font-bold"
                          rows={3}
                          value={commentTexts[challenge.id] || ''}
                          onChange={(e) => setCommentTexts(prev => ({ ...prev, [challenge.id]: e.target.value }))}
                        />
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleProofSelect(challenge.id, e.target.files?.[0] || null)}
                            className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:bg-[#55CDFC] file:text-white"
                          />
                          <div className="flex gap-2">
                            <label className="flex items-center gap-1 px-4 py-2 bg-green-50 border rounded-xl text-xs font-black cursor-pointer">
                              <input type="radio" name={`vis-${challenge.id}`} value="public" 
                                checked={visibilities[challenge.id] !== 'coach'}
                                onChange={() => setVisibilities(prev => ({ ...prev, [challenge.id]: 'public' }))}
                                className="w-4 h-4 text-[#55CDFC]" />
                              🌐 Publiek
                            </label>
                            <label className="flex items-center gap-1 px-4 py-2 bg-yellow-50 border rounded-xl text-xs font-black cursor-pointer">
                              <input type="radio" name={`vis-${challenge.id}`} value="coach" 
                                checked={visibilities[challenge.id] === 'coach'}
                                onChange={() => setVisibilities(prev => ({ ...prev, [challenge.id]: 'coach' }))}
                                className="w-4 h-4 text-[#55CDFC]" />
                              👨‍🏫 Coach
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCommentSubmit(challenge.id)}
                          disabled={uploading[challenge.id] || hasPosted(challenge)}
                          className={`w-full py-3 rounded-2xl font-black uppercase text-sm border-b-4 transition-all ${
                            uploading[challenge.id] || hasPosted(challenge)
                              ? 'bg-gray-400 border-gray-300 text-white cursor-not-allowed'
                              : 'bg-[#58CC02] border-[#46A302] text-white hover:bg-[#46A302]'
                          }`}
                        >
                          {hasPosted(challenge)
                            ? '✓ GEPLAATST'
                            : confirming[challenge.id]
                              ? '✔ BEVESTIG POST'
                              : uploading[challenge.id]
                                ? '📤 Uploaden...'
                                : '💬 POST'}
                        </button>
                      </div>
                      )}

                      {challenge.my_comments?.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="font-black text-gray-500 text-[11px] uppercase mb-3">
                            Jouw reacties ({challenge.my_comments.length})
                          </p>
                          <div className="space-y-3 max-h-48 overflow-y-auto">
                            {challenge.my_comments.map((comment: ChallengeComment) => (
                              <div key={comment.id} className="p-4 bg-gray-50 rounded-xl text-sm">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center">
                                    {comment.users?.[0]?.avatar_url ? (
                                        <img src={comment.users[0].avatar_url} className="w-7 h-7 rounded-lg object-cover" alt="Avatar" />
                                      ) : (
                                        <span className="font-bold text-gray-500">👤</span>
                                      )}
                                      <p className="font-bold text-gray-800 text-xs">{comment.users?.[0]?.display_name || 'Jij'}</p>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                                      comment.visibility === 'coach' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {comment.visibility === 'coach' ? 'Coach only' : 'Publiek'}
                                    </span>
                                  </div>
                                </div>
                                {comment.text && <p className="font-semibold text-gray-700 mb-2">{comment.text}</p>}
                                {comment.proof_url && (
                                  <img src={comment.proof_url} alt="Proof" className="w-full max-w-xs h-24 object-cover rounded-lg" />
                                )}
                                <p className="text-[10px] text-gray-500 mt-1">
                                  {new Date(comment.created_at).toLocaleDateString('nl-NL')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            );
          }) : (
            <div className="p-16 text-center border-dashed border-4 border-gray-100 rounded-3xl opacity-40">
              <span className="text-6xl mb-6">⚡</span>
              <h2 className="text-3xl font-black text-gray-800">Geen challenges</h2>
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:space-y-8">
          <section className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Maand</p>
                <p className="mt-1 text-xl font-black text-gray-800">{monthlyCount}/4</p>
              </div>
              <span className="text-2xl">📅</span>
            </div>
            <div className="h-3 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
              <div className="h-full bg-[#55CDFC]" style={{ width: `${(monthlyCount / 4) * 100}%` }} />
            </div>
          </section>
          <section className="bg-[#F1FBFF] rounded-3xl border-2 border-[#55CDFC] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest">Punten</p>
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

export default ChallengesPage;