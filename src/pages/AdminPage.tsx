import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.ts';

const AdminPage: React.FC = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<number, number>>({});

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [startDate, setStartDate] = useState('');

const fetchAdminData = useCallback(async () => {
  const { data: chs } = await supabase
    .from('challenges')
    .select('*')
    .order('week', { ascending: false });

  setChallenges(chs || []);

  const { data: checkinStats } = await supabase
    .from('challenge_checkins')
    .select('challenge_id');

  const countMap: Record<number, number> = {};
  checkinStats?.forEach((c) => {
    countMap[c.challenge_id] = (countMap[c.challenge_id] || 0) + 1;
  });
  setStats(countMap);

  setLoading(false);
}, []);

const checkAdminStatus = useCallback(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setLoading(false);
    return;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.admin) {
    setIsAdmin(true);
    await fetchAdminData();
  } else {
    setLoading(false);
  }
}, [fetchAdminData]);

useEffect(() => {
  checkAdminStatus();
}, [checkAdminStatus]);

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) return;

    const dateObj = new Date(startDate);
    const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const week = Math.ceil((((dateObj.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);

    const { error } = await supabase.from('challenges').insert({
      title, 
      description, 
      video_url: videoUrl, 
      start_date: startDate, 
      week, 
      active: false,
      levels: ['Light', 'Standard', 'Pro']
    });

    if (!error) {
      setTitle(''); setDescription(''); setVideoUrl(''); setStartDate('');
      fetchAdminData();
    } else {
      alert(error.message);
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    await supabase.from('challenges').update({ active: !current }).eq('id', id);
    fetchAdminData();
  };

  const deleteChallenge = async (id: number) => {
    if (!window.confirm("Weet je zeker dat je deze challenge wilt verwijderen?")) return;
    await supabase.from('challenges').delete().eq('id', id);
    fetchAdminData();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="animate-bounce text-[#55CDFC] text-3xl font-black italic tracking-widest uppercase">Coach Access...</div>
    </div>
  );
  
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="w-full">
      <header className="mb-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-6xl font-black text-gray-800 tracking-tighter">Coach Panel</h1>
          <p className="font-black text-[#55CDFC] uppercase tracking-[0.5em] text-xs mt-3">Beheer de Prime Your Body ervaring</p>
        </div>
        <div className="bg-white px-8 py-4 rounded-[2rem] border-2 border-gray-100 shadow-sm hidden lg:block">
           <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Totaal Challenges</span>
           <span className="text-2xl font-black text-gray-800">{challenges.length}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: List */}
        <div className="xl:col-span-7 space-y-8">
          <h2 className="font-black text-gray-800 uppercase tracking-widest text-sm flex items-center gap-3 px-4">
            <span className="text-2xl">📋</span> Bestaande Challenges
          </h2>
          
          <div className="space-y-6">
            {challenges.map((c) => (
              <div key={c.id} className="duo-card bg-white p-10 flex flex-col md:flex-row justify-between items-center gap-8 transition-all hover:border-[#55CDFC] hover:shadow-xl">
                <div className="flex-grow space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-50 text-[#55CDFC] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider border-2 border-blue-100">Week {c.week}</span>
                    <h3 className="font-black text-2xl text-gray-800 tracking-tight">{c.title}</h3>
                  </div>
                  <p className="text-gray-500 font-bold text-base leading-relaxed line-clamp-2 italic">"{c.description || 'Geen instructies beschikbaar'}"</p>
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border-2 border-gray-100">
                      <span className="text-green-500 text-xl font-bold">✓</span>
                      <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">{stats[c.id] || 0} Gebruikers voltooid</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto border-t-2 md:border-t-0 border-gray-50 pt-6 md:pt-0">
                  <button 
                    onClick={() => toggleActive(c.id, c.active)}
                    className={`flex-grow md:flex-grow-0 px-8 py-4 rounded-[20px] font-black uppercase text-xs border-2 transition-all ${
                      c.active 
                      ? 'bg-green-50 border-green-400 text-green-600 shadow-[0_4px_0_#46A302]' 
                      : 'bg-gray-50 border-gray-300 text-gray-400'
                    }`}
                  >
                    {c.active ? 'Actief' : 'Zet Actief'}
                  </button>
                  <button 
                    onClick={() => deleteChallenge(c.id)}
                    className="p-4 bg-red-50 text-red-300 hover:text-red-500 rounded-[20px] border-2 border-transparent hover:border-red-200 transition-all text-xl"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: New Challenge Form */}
        <aside className="xl:col-span-5 xl:sticky xl:top-10">
          <div className="duo-card bg-[#F1FBFF] border-[#55CDFC] p-12 space-y-10 shadow-lg">
            <div className="text-center space-y-2">
              <span className="text-4xl">🆕</span>
              <h2 className="font-black text-[#55CDFC] uppercase tracking-widest text-2xl">
                Nieuwe Challenge
              </h2>
              <p className="text-xs font-bold text-[#55CDFC]/60 uppercase tracking-widest">Creëer een nieuwe uitdaging</p>
            </div>
            
            <form onSubmit={handleAddChallenge} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-[#55CDFC] uppercase ml-2 tracking-widest">Titel van de uitdaging</label>
                <input 
                  type="text" 
                  placeholder="Bv. Squat To The Max" 
                  className="w-full duo-input text-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" 
                  value={title} 
                  onChange={(e)=>setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-[#55CDFC] uppercase ml-2 tracking-widest">Startdatum</label>
                  <input 
                    type="date" 
                    className="w-full duo-input shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" 
                    value={startDate} 
                    onChange={(e)=>setStartDate(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-[#55CDFC] uppercase ml-2 tracking-widest">Video URL</label>
                  <input 
                    type="text" 
                    placeholder="YouTube/Vimeo" 
                    className="w-full duo-input shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" 
                    value={videoUrl} 
                    onChange={(e)=>setVideoUrl(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[#55CDFC] uppercase ml-2 tracking-widest">Beschrijving & Regels</label>
                <textarea 
                  placeholder="Wat moeten de atleten precies doen?" 
                  className="w-full duo-input resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" 
                  rows={6}
                  value={description} 
                  onChange={(e)=>setDescription(e.target.value)} 
                />
              </div>

              <button type="submit" className="w-full py-8 duo-btn-primary text-xl tracking-[0.3em] shadow-xl hover:scale-[1.02]">
                OPSLAAN & PUBLICEREN
              </button>
            </form>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default AdminPage;
