import React, { useEffect, useState } from 'react';
import { getSupabase, completeChallenge, getMonthlyProgress, getMyCompletedChallengeIds } from '../lib/supabase.ts';
import { Challenge, CheckIn, ChallengeComment } from '../types.ts';

// Interface uitbreiden voor de dynamische opties uit het admin panel
type ChallengeWithData = Challenge & {
  checkins: CheckIn[];
  my_comments: ChallengeComment[];
  options?: { label: string; description: string }[];
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const [completedIds, setCompletedIds] = useState<number[]>([]); 

    const fetchData = async () => {
    setLoading(true);

    try {
      const supabase = getSupabase();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: activeChallenges, error: chErr } = await supabase
        .from('challenges')
        .select('*')
        .eq('active', true)
        .order('week', { ascending: false });

      if (chErr) throw chErr;

      const { data: userComments, error: comErr } = await supabase
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

      if (comErr) throw comErr;

      const completed = await getMyCompletedChallengeIds();
      setCompletedIds(completed);

      const monthCount = await getMonthlyProgress();
      setMonthlyCount(monthCount);

      const challengesWithData: ChallengeWithData[] = (activeChallenges || []).map((challenge: any) => ({
        ...challenge,
        checkins: completed.includes(challenge.id)
          ? [{ id: 0, user_id: user.id, challenge_id: challenge.id, level: '', created_at: '' }]
          : [],
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
    } catch (err: any) {
      console.error('fetchData error:', err);
      console.error('fetchData error JSON:', JSON.stringify(err, null, 2));
      alert(`fetchData error: ${err?.message || err?.error_description || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
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
    const level = selectedLevels[challenge.id];
    if (!level) {
      alert("Kies eerst een niveau!");
      return;
    }

    try {
      await completeChallenge(challenge.id, level);

      setSuccessMessage(`✅ Challenge "${challenge.title}" voltooid!`);
      setTimeout(() => setSuccessMessage(null), 4000);

      await fetchData();
    } catch (err: any) {
      console.error('handleDone error:', err);
      console.error('handleDone error JSON:', JSON.stringify(err, null, 2));

      const msg =
        err?.message ||
        err?.error_description ||
        err?.details ||
        err?.hint ||
        `Unknown error (code: ${err?.code || 'n/a'})`;

      alert(`Done failed: ${msg}`);
    }
  };


  const handleCommentSubmit = async (challengeId: number) => {
    if (!confirming[challengeId]) {
      setConfirming(prev => ({ ...prev, [challengeId]: true }));
      setTimeout(() => {
        setConfirming(prev => ({ ...prev, [challengeId]: false }));
      }, 3000);
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

    const { error: insertError } = await supabase.from('challenge_comments').insert({
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

    if (!insertError) {
      setSuccessMessage(`💬 Post geplaatst voor "${challenge?.title}"!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchData();
    }
  };

  const handleEditStart = (challengeId: number) => {
    const challenge = challenges.find(c => c.id === challengeId);
    const comment = challenge?.my_comments[0];
    
    if (comment) {
      setCommentTexts(prev => ({ ...prev, [challengeId]: comment.text || '' }));
      setVisibilities(prev => ({ ...prev, [challengeId]: comment.visibility as 'public' | 'coach' }));
      setEditing(prev => ({ ...prev, [challengeId]: true }));
    }
  };

  const handleEditCancel = (challengeId: number) => {
    setEditing(prev => ({ ...prev, [challengeId]: false }));
    setCommentTexts(prev => ({ ...prev, [challengeId]: '' }));
    setProofFiles(prev => ({ ...prev, [challengeId]: null }));
  };

  const handleEditSubmit = async (challengeId: number) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const challenge = challenges.find(c => c.id === challengeId);
    const comment = challenge?.my_comments[0];
    if (!comment) return;

    const text = commentTexts[challengeId]?.trim();
    const proofFile = proofFiles[challengeId];

    if (!text && !proofFile && !comment.proof_url) {
      alert('Voeg tekst of foto toe!');
      return;
    }

    setUploading(prev => ({ ...prev, [challengeId]: true }));

    let proofUrl = comment.proof_url;

    if (proofFile) {
      const ext = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${challengeId}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from('challenge_proof')
        .upload(fileName, proofFile, { upsert: false });

      if (error) {
        alert(error.message);
        setUploading(prev => ({ ...prev, [challengeId]: false }));
        return;
      }

      proofUrl = supabase.storage
        .from('challenge_proof')
        .getPublicUrl(fileName).data.publicUrl;
    }

    const { error: updateError } = await supabase
      .from('challenge_comments')
      .update({
        text: text || null,
        proof_url: proofUrl,
        visibility: visibilities[challengeId] || 'public',
        updated_at: new Date().toISOString()
      })
      .eq('id', comment.id);

    setUploading(prev => ({ ...prev, [challengeId]: false }));
    setEditing(prev => ({ ...prev, [challengeId]: false }));
    setCommentTexts(prev => ({ ...prev, [challengeId]: '' }));
    setProofFiles(prev => ({ ...prev, [challengeId]: null }));

    if (!updateError) {
      setSuccessMessage(`💾 Post bijgewerkt voor "${challenge?.title}"!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchData();
    }
  };

  const handleDelete = async (challengeId: number) => {
    if (!deleting[challengeId]) {
      setDeleting(prev => ({ ...prev, [challengeId]: true }));
      setTimeout(() => {
        setDeleting(prev => ({ ...prev, [challengeId]: false }));
      }, 3000);
      return;
    }

    const supabase = getSupabase();
    const challenge = challenges.find(c => c.id === challengeId);
    const comment = challenge?.my_comments[0];
    if (!comment) return;

    const { error } = await supabase
      .from('challenge_comments')
      .delete()
      .eq('id', comment.id)
      .eq('user_id', comment.user_id);

    if (!error) {
      setSuccessMessage(`🗑️ Post verwijderd voor "${challenge?.title}"!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeleting(prev => ({ ...prev, [challengeId]: false }));
      await fetchData();
    } else {
      alert('Fout bij verwijderen: ' + error.message);
      setDeleting(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const handleProofSelect = (challengeId: number, file: File | null) => {
    setProofFiles(prev => ({ ...prev, [challengeId]: file }));
  };

  const isDone = (challenge: ChallengeWithData) =>
    completedIds.includes(challenge.id);
  const hasPosted = (challenge: ChallengeWithData) => challenge.my_comments.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#55CDFC]"></div>
        <p className="font-black text-[#55CDFC] uppercase tracking-widest text-[10px]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-0 space-y-8 pb-12">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-3xl shadow-2xl max-w-sm animate-in slide-in-from-top-4 duration-300 border-2 border-green-400">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {successMessage.includes('🗑️') ? '🗑️' : successMessage.includes('💾') ? '💾' : successMessage.includes('💬') ? '💬' : '✅'}
            </span>
            <p className="font-bold text-lg">{successMessage}</p>
          </div>
        </div>
      )}

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
            
            // Haal de opties op of gebruik de standaard als er niets is opgegeven
            const levelOptions = (challenge.options && challenge.options.length > 0)
              ? challenge.options
              : [
                  { label: 'Light', description: 'Begin rustig aan met deze variant.' },
                  { label: 'Standard', description: 'De volledige challenge zoals bedoeld.' },
                  { label: 'Pro', description: 'Voor als je een extra uitdaging wilt!' }
                ];
            
            const currentSelectedLevel = selectedLevels[challenge.id];
            const currentOptionObj = levelOptions.find(o => o.label === currentSelectedLevel);
            
            const comment = challenge.my_comments[0];
            const user = comment?.users?.[0] || { display_name: 'Jij', admin: false, avatar_url: null };
            const isEditing = editing[challenge.id];

            return (
              <section key={challenge.id} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#55CDFC] via-[#58CC02] to-[#FFC800] rounded-t-3xl" />
                
                <div className="pt-6 px-5 md:px-6 pb-6 space-y-4">
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
                      <div className="space-y-4 pt-3 border-t-2 border-gray-50">
                        <p className="text-center font-black text-gray-400 uppercase text-[10px]">Kies niveau</p>
                        
                        <div className={`grid gap-2 ${levelOptions.length === 1 ? 'grid-cols-1' : levelOptions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {levelOptions.map((opt) => (
                            <button
                              key={opt.label}
                              onClick={() => handleLevelSelect(challenge.id, opt.label)}
                              className={`py-3 px-2 rounded-2xl font-black uppercase text-[9px] border-2 transition-all ${
                                currentSelectedLevel === opt.label
                                  ? 'bg-[#E1F5FE] border-[#55CDFC] text-[#55CDFC] shadow-[0_3px_0_#55CDFC]'
                                  : 'bg-white border-gray-200 text-gray-400 border-b-4 active:translate-y-1 active:border-b-2'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Dynamische beschrijving van het geselecteerde niveau */}
                        {currentOptionObj && (
                          <div className="px-5 py-4 bg-[#F1FBFF] rounded-2xl border-2 border-dashed border-[#55CDFC]/30 animate-in fade-in slide-in-from-top-2">
                            <p className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest mb-1 text-center">
                              Jouw opdracht:
                            </p>
                            <p className="text-sm text-gray-600 font-bold text-center leading-relaxed">
                              {currentOptionObj.description}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDone(challenge)}
                        className="w-full py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-sm bg-[#55CDFC] border-b-[5px] border-[#1C8ED9] text-white hover:bg-[#1C8ED9] transition-all active:border-b-2 active:translate-y-1"
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
                      
                      {!hasPosted(challenge) || isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            placeholder="Hoe ging het? Tips voor anderen?"
                            className="w-full bg-[#F8FAFC] border-2 border-gray-200 rounded-2xl p-4 focus:border-[#55CDFC] focus:outline-none font-bold min-h-[80px] resize-none"
                            rows={3}
                            value={commentTexts[challenge.id] || ''}
                            onChange={(e) => setCommentTexts(prev => ({ ...prev, [challenge.id]: e.target.value }))}
                          />
                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleProofSelect(challenge.id, e.target.files?.[0] || null)}
                              className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:bg-[#55CDFC] file:text-white file:font-bold file:border-0 hover:border-[#55CDFC] transition-colors cursor-pointer"
                            />
                            <div className="flex gap-2 flex-wrap">
                              <label className="flex items-center gap-1 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-xl text-xs font-black cursor-pointer hover:bg-green-100 transition-colors">
                                <input 
                                  type="radio" 
                                  name={`vis-${challenge.id}`} 
                                  value="public" 
                                  checked={visibilities[challenge.id] !== 'coach'}
                                  onChange={() => setVisibilities(prev => ({ ...prev, [challenge.id]: 'public' }))}
                                  className="w-4 h-4 text-[#58CC02]" 
                                />
                                🌐 Publiek
                              </label>
                              <label className="flex items-center gap-1 px-4 py-2 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-xs font-black cursor-pointer hover:bg-yellow-100 transition-colors">
                                <input 
                                  type="radio" 
                                  name={`vis-${challenge.id}`} 
                                  value="coach" 
                                  checked={visibilities[challenge.id] === 'coach'}
                                  onChange={() => setVisibilities(prev => ({ ...prev, [challenge.id]: 'coach' }))}
                                  className="w-4 h-4 text-yellow-500" 
                                />
                                👨‍🏫 Coach
                              </label>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {isEditing && (
                              <button
                                onClick={() => handleEditCancel(challenge.id)}
                                className="flex-1 py-3 rounded-2xl font-black uppercase tracking-wider text-sm bg-gray-200 border-b-[4px] border-gray-400 text-gray-700 hover:bg-gray-300 transition-all active:border-b-2 active:translate-y-1"
                              >
                                ❌ ANNULEER
                              </button>
                            )}
                            <button
                              onClick={() => isEditing ? handleEditSubmit(challenge.id) : handleCommentSubmit(challenge.id)}
                              disabled={uploading[challenge.id]}
                              className={`${isEditing ? 'flex-1' : 'w-full'} py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-sm border-b-[5px] transition-all ${
                                confirming[challenge.id] && !isEditing
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-700 text-white shadow-lg shadow-orange-500/50 animate-pulse font-extrabold'
                                  : uploading[challenge.id]
                                  ? 'bg-gray-400 border-gray-500 text-white cursor-not-allowed'
                                  : isEditing
                                  ? 'bg-blue-500 border-blue-700 text-white hover:bg-blue-600 shadow-lg active:border-b-2 active:translate-y-1'
                                  : 'bg-[#58CC02] border-[#46A302] text-white hover:bg-[#46A302] shadow-lg active:border-b-2 active:translate-y-1'
                              }`}
                            >
                              {uploading[challenge.id]
                                ? '📤 Uploaden...'
                                : isEditing
                                ? '💾 OPSLAAN'
                                : confirming[challenge.id]
                                ? '🔥 BEVESTIG (2x KLIK!)'
                                : '💬 POST'}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {challenge.my_comments?.length > 0 && !isEditing && (
                        <div className="pt-4 border-t border-gray-100 space-y-3">
                          <p className="font-black text-gray-500 text-[11px] uppercase mb-3 tracking-widest">
                            Jouw reactie
                          </p>
                          <div className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex-shrink-0 border-2 border-gray-200 overflow-hidden">
                                {user.avatar_url ? (
                                  <img 
                                    src={user.avatar_url} 
                                    alt="Jouw avatar"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg font-bold text-gray-500">
                                    👤
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-gray-800 text-sm truncate">{user.display_name || 'Jij'}</p>
                                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                                    comment?.visibility === 'coach' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {comment?.visibility === 'coach' ? 'Coach only' : 'Publiek'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {comment?.text && (
                              <p className="font-semibold text-gray-700 mb-3 text-sm leading-relaxed">
                                "{comment.text}"
                              </p>
                            )}
                            {comment?.proof_url && (
                              <div className="w-full max-w-md mb-3">
                                <img 
                                  src={comment.proof_url} 
                                  alt="Jouw bewijs" 
                                  className="w-full h-auto object-cover rounded-xl shadow-sm"
                                />
                              </div>
                            )}
                            <p className="text-[10px] text-gray-500 mb-4 font-medium">
                              {new Date(comment?.created_at).toLocaleDateString('nl-NL')}
                            </p>

                            <div className="flex gap-2 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => handleEditStart(challenge.id)}
                                className="flex-1 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 transition-all"
                              >
                                ✏️ BEWERK
                              </button>
                              <button
                                onClick={() => handleDelete(challenge.id)}
                                className={`flex-1 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs border-2 transition-all ${
                                  deleting[challenge.id]
                                    ? 'bg-red-500 border-red-700 text-white animate-pulse shadow-lg'
                                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                {deleting[challenge.id] ? '⚠️ BEVESTIG!' : '🗑️ VERWIJDER'}
                              </button>
                            </div>
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
              <span className="text-6xl mb-6 block">⚡</span>
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
              <div className="h-full bg-[#55CDFC] transition-all duration-500" style={{ width: `${Math.min((monthlyCount / 4) * 100, 100)}%` }} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ChallengesPage;