import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase.ts';

const AdminPage: React.FC = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<number, number>>({});

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');

  const fetchAdminData = useCallback(async () => {
    const supabase = getSupabase();

    const { data: chs } = await supabase
      .from('challenges')
      .select('*')
      .order('week', { ascending: false });

    setChallenges(chs || []);

    const { data: checkinStats } = await supabase
      .from('challenge_checkins')
      .select('challenge_id');

    const countMap: Record<number, number> = {};
    checkinStats?.forEach((c: any) => {
      countMap[c.challenge_id] = (countMap[c.challenge_id] || 0) + 1;
    });
    setStats(countMap);

    setLoading(false);
  }, []);

  const checkAdminStatus = useCallback(async () => {
    const supabase = getSupabase();

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
    const week = Math.ceil(
      (((dateObj.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7
    );

    const supabase = getSupabase();
    const { error } = await supabase.from('challenges').insert({
      title,
      description,
      video_url: videoUrl,
      start_date: startDate,
      deadline_date: deadlineDate || null,
      week,
      active: false,
      levels: ['Light', 'Standard', 'Pro'],
    });

    if (!error) {
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setStartDate('');
      setDeadlineDate('');
      fetchAdminData();
    } else {
      alert(error.message);
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    const supabase = getSupabase();
    await supabase.from('challenges').update({ active: !current }).eq('id', id);
    fetchAdminData();
  };

  const deleteChallenge = async (id: number) => {
    if (!window.confirm('Weet je zeker dat je deze challenge wilt verwijderen?')) return;
    const supabase = getSupabase();
    await supabase.from('challenges').delete().eq('id', id);
    fetchAdminData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="animate-bounce text-[#55CDFC] text-3xl font-black italic tracking-widest uppercase">
          Coach Access...
        </div>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-0">
      {/* Header */}
      <header className="mb-10 md:mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">
            Coach Panel
          </h1>
          <p className="font-black text-[#55CDFC] uppercase tracking-[0.4em] text-[10px] mt-3">
            Beheer de Prime Your Body ervaring
          </p>
        </div>

        <div className="bg-white px-6 py-4 rounded-[2rem] border-2 border-gray-100 shadow-sm flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            Totaal Challenges
          </span>
          <span className="text-2xl font-black text-gray-800">{challenges.length}</span>
        </div>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8">
        {/* LEFT: lijst */}
        <div className="space-y-5">
          <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-3 px-1">
            <span className="text-xl">📋</span> Bestaande Challenges
          </h2>

          {challenges.length === 0 && (
            <div className="duo-card bg-white p-10 text-center border-dashed border-2 border-gray-200">
              <p className="font-black text-gray-400 uppercase text-xs tracking-widest">
                Nog geen challenges aangemaakt.
              </p>
            </div>
          )}

          {challenges.map((c) => (
            <section
              key={c.id}
              className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#55CDFC] via-[#58CC02] to-[#FFC800]" />

              <div className="pt-4 px-5 md:px-6 pb-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-blue-50 text-[#55CDFC] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100">
                      Week {c.week}
                    </span>
                    <h3 className="font-black text-lg md:text-xl text-gray-800 tracking-tight">
                      {c.title}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      c.active
                        ? 'bg-green-50 text-green-600 border-green-300'
                        : 'bg-gray-100 text-gray-500 border-gray-300'
                    }`}
                  >
                    {c.active ? 'Actief' : 'Inactief'}
                  </span>
                </div>

                <p className="text-gray-500 font-bold text-sm leading-relaxed italic">
                  “{c.description || 'Geen instructies beschikbaar'}”
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-black text-gray-500">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100">
                    <span className="text-green-500 text-lg font-bold">✓</span>
                    <span className="uppercase tracking-tighter">
                      {stats[c.id] || 0} gebruikers voltooid
                    </span>
                  </div>
                  {c.start_date && (
                    <span className="bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100 uppercase tracking-widest">
                      Start: {new Date(c.start_date).toLocaleDateString()}
                    </span>
                  )}
                  {c.deadline_date && (
                    <span className="bg-[#FFF7ED] px-3 py-1.5 rounded-2xl border border-orange-200 text-orange-600 uppercase tracking-widest">
                      Deadline: {new Date(c.deadline_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  {c.video_url && (
                    <a
                      href={c.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-black uppercase tracking-widest text-[#55CDFC] hover:text-[#1C8ED9]"
                    >
                      ▶ Video bekijken
                    </a>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => toggleActive(c.id, c.active)}
                      className={`px-6 py-2 rounded-2xl font-black uppercase text-[10px] border-b-[4px] transition-all ${
                        c.active
                          ? 'bg-[#58CC02] border-[#46A302] text-white hover:bg-[#46A302]'
                          : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {c.active ? 'Zet op pauze' : 'Zet actief'}
                    </button>
                    <button
                      onClick={() => deleteChallenge(c.id)}
                      className="px-4 py-2 rounded-2xl border-2 border-red-100 bg-red-50 text-red-400 hover:text-red-600 hover:border-red-200 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* RIGHT: Nieuwe challenge */}
        <aside className="space-y-6 lg:space-y-8">
          <section className="bg-[#F1FBFF] rounded-3xl border-2 border-[#55CDFC] p-7 md:p-8 shadow-sm">
            <div className="text-center space-y-1 mb-6">
              <span className="text-3xl">🆕</span>
              <h2 className="font-black text-[#55CDFC] uppercase tracking-widest text-lg md:text-xl">
                Nieuwe Challenge
              </h2>
              <p className="text-[10px] font-bold text-[#55CDFC]/70 uppercase tracking-widest">
                Creëer een nieuwe uitdaging
              </p>
            </div>

            <form onSubmit={handleAddChallenge} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#55CDFC] uppercase ml-1 tracking-widest">
                  Titel van de uitdaging
                </label>
                <input
                  type="text"
                  placeholder="Bv. Squat To The Max"
                  className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 text-sm md:text-base font-bold text-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#55CDFC]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#55CDFC] uppercase ml-1 tracking-widest">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#55CDFC]"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#55CDFC] uppercase ml-1 tracking-widest">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#55CDFC]"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#55CDFC] uppercase ml-1 tracking-widest">
                  Video URL
                </label>
                <input
                  type="text"
                  placeholder="YouTube/Vimeo"
                  className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#55CDFC]"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#55CDFC] uppercase ml-1 tracking-widest">
                  Beschrijving & Regels
                </label>
                <textarea
                  placeholder="Wat moeten de atleten precies doen?"
                  className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#55CDFC] resize-none"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-4 rounded-3xl font-black uppercase tracking-[0.25em] text-xs md:text-sm text-white bg-[#55CDFC] border-b-[5px] border-[#1C8ED9] shadow-lg hover:bg-[#1C8ED9] active:translate-y-[2px] active:border-b-[3px] transition-all"
              >
                OPSLAAN & PUBLICEREN
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AdminPage;
