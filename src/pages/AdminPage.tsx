import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase.ts';

interface UserSummary {
  user_uuid: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  joined_date: string;
  total_checkins: number;
  total_points: number;
  latest_challenge: string | null;
}

const AdminPage: React.FC = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<number, number>>({});
  const [activeTab, setActiveTab] = useState<'challenges' | 'users'>('challenges');
  const [editingUser, setEditingUser] = useState<string | null>(null);

  // Form state challenges (ORIGINEEL)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');

  // Form state users
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAdminStatus, setEditAdminStatus] = useState(false);

  const fetchAdminData = useCallback(async () => {
    const supabase = getSupabase();

    // ORIGINELE Challenges fetch
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

    // Users fetch + checkins
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, admin, created_at');

    const { data: checkins } = await supabase
      .from('challenge_checkins')
      .select(`
        user_id,
        challenge_id,
        challenges!inner(title)
      `);

    // Transform naar UserSummary
    const summaries: UserSummary[] = (users || []).map((u: any) => ({
      user_uuid: u.id,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      is_admin: u.admin,
      joined_date: new Date(u.created_at).toLocaleDateString('nl-NL'),
      total_checkins: 0,
      total_points: 0,
      latest_challenge: null
    }));

    // Checkins per user tellen + laatste challenge
    checkins?.forEach((checkin: any) => {
      const user = summaries.find(s => s.user_uuid === checkin.user_id);
      if (user) {
        user.total_checkins++;
        if (!user.latest_challenge && checkin.challenges?.title) {
          user.latest_challenge = checkin.challenges.title;
        }
      }
    });

    setUserSummaries(summaries);
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

  // ORIGINELE challenge functies
  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) return;

    const dateObj = new Date(startDate);
    const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const week = Math.ceil((((dateObj.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);

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
      setTitle(''); setDescription(''); setVideoUrl(''); setStartDate(''); setDeadlineDate('');
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

  // USER ACTIONS
  const updateUser = async (userId: string) => {
    const supabase = getSupabase();
    await supabase
      .from('users')
      .update({ 
        display_name: editDisplayName || null,
        admin: editAdminStatus 
      })
      .eq('id', userId);
    
    setEditingUser(null);
    fetchAdminData();
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('GEBRUIKER VOLLEDIG VERWIJDEREN?')) return;
    const supabase = getSupabase();
    
    await supabase.from('challenge_checkins').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);
    
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
    <div className="max-w-[1400px] mx-auto px-4 md:px-0">
      {/* HEADER - ORIGINEEL + stats */}
      <header className="mb-10 md:mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">
            Coach Panel
          </h1>
          <p className="font-black text-[#55CDFC] uppercase tracking-[0.4em] text-[10px] mt-3">
            Beheer challenges & gebruikers
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white px-6 py-4 rounded-[2rem] border-2 border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Challenges</span>
            <span className="text-2xl font-black text-gray-800">{challenges.length}</span>
          </div>
          <div className="bg-white px-6 py-4 rounded-[2rem] border-2 border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gebruikers</span>
            <span className="text-2xl font-black text-gray-800">{userSummaries.length}</span>
          </div>
          <div className="bg-white px-6 py-4 rounded-[2rem] border-2 border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Checkins</span>
            <span className="text-2xl font-black text-gray-800">{Object.values(stats).reduce((a, b) => a + b, 0)}</span>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="flex bg-white rounded-3xl p-1 shadow-sm border border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-4 px-6 font-black uppercase text-sm tracking-wider rounded-2xl transition-all ${
            activeTab === 'challenges'
              ? 'bg-gradient-to-r from-[#55CDFC] to-[#1C8ED9] text-white shadow-lg'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Challenges
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-4 px-6 font-black uppercase text-sm tracking-wider rounded-2xl transition-all ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-[#55CDFC] to-[#1C8ED9] text-white shadow-lg'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 Gebruikers
        </button>
      </div>

      {/* CHALLENGES TAB - 100% ORIGINEEL */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8">
          {/* LEFT: Challenges lijst - ORIGINEEL */}
          <div className="space-y-5">
            <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-3 px-1">
              <span className="text-xl">📋</span> Bestaande Challenges
            </h2>

            {challenges.length === 0 && (
              <div className="bg-white p-10 text-center border-dashed border-2 border-gray-200 rounded-3xl">
                <p className="font-black text-gray-400 uppercase text-xs tracking-widest">
                  Nog geen challenges aangemaakt.
                </p>
              </div>
            )}

            {challenges.map((c: any) => (
              <section key={c.id} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
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
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      c.active ? 'bg-green-50 text-green-600 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'
                    }`}>
                      {c.active ? 'Actief' : 'Inactief'}
                    </span>
                  </div>

                  <p className="text-gray-500 font-bold text-sm leading-relaxed italic">
                    "{c.description || 'Geen instructies beschikbaar'}"
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-black text-gray-500">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100">
                      <span className="text-green-500 text-lg font-bold">✓</span>
                      <span className="uppercase tracking-tighter">{stats[c.id] || 0} gebruikers voltooid</span>
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
                      <a href={c.video_url} target="_blank" rel="noreferrer" className="text-[11px] font-black uppercase tracking-widest text-[#55CDFC] hover:text-[#1C8ED9]">
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

          {/* RIGHT: NIEUWE CHALLENGE FORM - 100% ORIGINEEL */}
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
      )}

      {/* GEBRUIKERS TAB - COMPLEET */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
          {/* LEFT: Gebruikers lijst */}
          <div className="space-y-5">
            <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-3 px-1">
              <span className="text-xl">👥</span> Alle Gebruikers
            </h2>

            {userSummaries.length === 0 ? (
              <div className="bg-white p-10 text-center border-dashed border-2 border-gray-200 rounded-3xl">
                <p className="font-black text-gray-400 uppercase text-xs tracking-widest">
                  Nog geen gebruikers
                </p>
              </div>
            ) : (
              userSummaries.map((user) => (
                <section key={user.user_uuid} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-400 via-yellow-400 to-pink-400" />
                  <div className="pt-4 px-5 md:px-6 pb-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <span className="text-xl font-black text-gray-500">
                              {user.display_name?.[0]?.toUpperCase() || '👤'}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-gray-800">{user.display_name || 'Geen naam'}</h3>
                          <p className="text-[11px] font-bold text-gray-500">Aangemeld: {user.joined_date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <div className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 text-green-700 font-black">
                          {user.total_checkins} challenges
                        </div>
                        {user.is_admin && (
                          <div className="bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 font-black">
                            ADMIN
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px] text-gray-600">
                      <div className="bg-gray-50 px-4 py-3 rounded-xl border">
                        <div className="font-black text-gray-500 text-xs uppercase tracking-wider">Punten</div>
                        <div className="font-black text-xl text-gray-800">{user.total_points || 0}</div>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 rounded-xl border">
                        <div className="font-black text-gray-500 text-xs uppercase tracking-wider">Laatste</div>
                        <div className="font-bold text-sm">{user.latest_challenge || 'Nog geen'}</div>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 rounded-xl border">
                        <div className="font-black text-gray-500 text-xs uppercase tracking-wider">Status</div>
                        <div className="font-black text-sm">{user.is_admin ? 'Admin' : 'Gebruiker'}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {editingUser === user.user_uuid ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            placeholder="Nieuwe naam"
                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-[#55CDFC] focus:outline-none"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editAdminStatus}
                              onChange={(e) => setEditAdminStatus(e.target.checked)}
                              className="w-4 h-4 text-[#55CDFC]"
                            />
                            Admin
                          </label>
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateUser(user.user_uuid)}
                              className="px-4 py-2 bg-[#55CDFC] text-white rounded-xl text-xs font-black uppercase tracking-wider"
                            >
                              ✅ Opslaan
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider"
                            >
                              ❌ Annuleer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => {
                              setEditingUser(user.user_uuid);
                              setEditDisplayName(user.display_name || '');
                              setEditAdminStatus(user.is_admin);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-600"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user.user_uuid)}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-600"
                          >
                            🗑️ Verwijder
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ))
            )}
          </div>

          {/* RIGHT: USER STATS SIDEBAR */}
          <aside className="space-y-6">
            <section className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm text-center">
              <span className="text-4xl mb-4 block">📊</span>
              <h3 className="font-black text-xl text-gray-800 mb-2">Gebruikers Stats</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-bold text-gray-600">Totaal gebruikers</span>
                  <span className="font-black text-2xl text-gray-800">{userSummaries.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-bold text-gray-600">Admins</span>
                  <span className="font-black text-[#55CDFC] text-xl">
                    {userSummaries.filter(u => u.is_admin).length}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-bold text-gray-600">Totaal checkins</span>
                  <span className="font-black text-xl text-gray-800">
                    {userSummaries.reduce((a, u) => a + u.total_checkins, 0)}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
