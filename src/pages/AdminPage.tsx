  import React, { useCallback, useEffect, useState, useMemo } from 'react';
  import { Navigate } from 'react-router-dom';
  import { getSupabase } from '../lib/supabase.ts';

  const NOTIFICATION_TAG = 'challenge-update';
  let registration: ServiceWorkerRegistration | null = null;

  // Verbeterde interfaces met betere typing
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

  interface ChallengeOption {
    label: string;
    description: string;
  }

  interface Challenge {
    id: number;
    title: string;
    description: string | null;
    video_url: string | null;
    start_date: string;
    deadline_date: string | null;
    week: number;
    active: boolean;
    options: ChallengeOption[];
  }

  interface CommunityChallenge {
    id: string;
    title: string;
    description: string | null;
    target_count: number;
    active: boolean;
    created_at: string;
  }

  const AdminPage: React.FC = () => {
    // Core state
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Record<number, number>>({});
    
    // Tab management
    const [activeTab, setActiveTab] = useState<'challenges' | 'community' | 'users'>('challenges');
    
    // Challenge form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [startDate, setStartDate] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [options, setOptions] = useState<ChallengeOption[]>([{ label: '', description: '' }]);

    // User editing state
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editAdminStatus, setEditAdminStatus] = useState(false);

    // Community challenges state
    const [communityChallenges, setCommunityChallenges] = useState<CommunityChallenge[]>([]);
    const [communityTitle, setCommunityTitle] = useState('');
    const [communityDescription, setCommunityDescription] = useState('');
    const [communityTarget, setCommunityTarget] = useState(100);
    const [notifUsers, setNotifUsers] = useState<string[]>([]);
    const [editingCommunityId, setEditingCommunityId] = useState<string | null>(null);

    // Computed values voor performance
    const totalCheckins = useMemo(() => 
      Object.values(stats).reduce((sum, count) => sum + count, 0), [stats]
    );

    const adminCount = useMemo(() => 
      userSummaries.filter(user => user.is_admin).length, [userSummaries]
    );

    console.log('AdminPage rendered - Active tab:', activeTab);

      // 🔄 Data fetching functies
    const fetchAdminData = useCallback(async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();

        // Fetch challenges
        const { data: chs } = await supabase
          .from('challenges')
          .select('*')
          .order('week', { ascending: false });

        const challengesData = (chs || []) as Challenge[];
        setChallenges(challengesData);

        // Fetch checkin stats voor challenge counts
        const { data: checkinStats } = await supabase
          .from('challenge_checkins')
          .select('challenge_id');

        // Community challenges
        const { data: communityData } = await supabase
          .from('community_challenges')
          .select('*')
          .order('created_at', { ascending: false });

        const communityChallengesData = (communityData || []) as CommunityChallenge[];
        setCommunityChallenges(communityChallengesData);

        // Bereken stats map
        const countMap: Record<number, number> = {};
        checkinStats?.forEach((c: any) => {
          countMap[c.challenge_id] = (countMap[c.challenge_id] || 0) + 1;
        });
        setStats(countMap);

        // Fetch users + checkins voor summaries
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

        // Bouw user summaries
        const summaries: UserSummary[] = (users || []).map((u: any) => ({
          user_uuid: u.id,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
          is_admin: u.admin || false,
          joined_date: new Date(u.created_at).toLocaleDateString('nl-NL'),
          total_checkins: 0,
          total_points: 0,
          latest_challenge: null,
        }));

        checkins?.forEach((checkin: any) => {
          const user = summaries.find((s) => s.user_uuid === checkin.user_id);
          if (user) {
            user.total_checkins += 1;
            if (!user.latest_challenge && checkin.challenges?.title) {
              user.latest_challenge = checkin.challenges.title;
            }
          }
        });

        setUserSummaries(summaries);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        globalThis.alert?.('Fout bij ophalen van data');
      } finally {
        setLoading(false);
      }
    }, []);

    // 🔄 Refresh functie
    const refreshAdminData = useCallback(async () => {
      await fetchAdminData();
    }, [fetchAdminData]);

    // 🔐 Admin status check
    const checkAdminStatus = useCallback(async () => {
      try {
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
      } catch (error) {
        console.error('Admin check failed:', error);
        setLoading(false);
      }
    }, [fetchAdminData]);

    // 📱 Responsive breakpoints voor Tailwind
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const isTablet = typeof window !== 'undefined' && window.innerWidth < 1280;

    // Effect voor admin check + window resize listener
    useEffect(() => {
      checkAdminStatus();

      const handleResize = () => {
        // Responsive state updates indien nodig
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [checkAdminStatus]);
    // 📝 Challenge form handlers
    const handleAddChallenge = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !startDate) {
        globalThis.alert?.('Titel en startdatum zijn verplicht');
        return;
      }

      try {
        const dateObj = new Date(startDate);
        const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
        const week = Math.ceil(
          (((dateObj.getTime() - startOfYear.getTime()) / 86400000) + 
          (startOfYear.getDay() + 1)) / 7
        );

        const validOptions = options.filter(opt => 
          opt.label.trim() && opt.description.trim()
        );

        const supabase = getSupabase();
        const { error } = await supabase.from('challenges').insert({
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim() || null,
          start_date: startDate,
          deadline_date: deadlineDate || null,
          week,
          active: false,
          options: validOptions.length > 0 ? validOptions : [],
        });

        if (error) throw error;

        // Reset form
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setStartDate('');
        setDeadlineDate('');
        setOptions([{ label: '', description: '' }]);
        
        await refreshAdminData();
        globalThis.alert?.('Challenge succesvol aangemaakt!');
      } catch (error: any) {
        console.error('Add challenge error:', error);
        globalThis.alert?.(`Fout: ${error.message}`);
      }
    };

    // ➕ Optie management
    const addOption = () => {
      if (options.length < 3) {
        setOptions([...options, { label: '', description: '' }]);
      }
    };

    const removeOption = (index: number) => {
      setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, field: 'label' | 'description', value: string) => {
      const newOptions = [...options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      setOptions(newOptions);
    };

    // ⏯️ Toggle active status
    const toggleActive = async (id: number, current: boolean) => {
  try {
    const supabase = getSupabase();
    const { error, data } = await supabase
      .from('challenges')
      .update({ active: !current })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    const challenge = data as Challenge;
    await refreshAdminData();
    
    // 🔔 NIEUWE NOTIFICATIE: Als nu ACTIEF gemaakt
    if (!current) { // Van inactief -> actief
      console.log(`🎉 Challenge ${challenge.title} geactiveerd - verstuur notificatie`);
      sendNotification(
        `🎉 Nieuwe Challenge: ${challenge.title}`,
        `Week ${challenge.week} is nu LIVE! Check de app.`,
        NOTIFICATION_TAG
      );
    }
    
    console.log(`✅ Toggle succes: ${challenge.title} -> ${challenge.active ? 'ACTIEF' : 'INACTIEF'}`);
  } catch (error: any) {
    console.error('Toggle error:', error);
    globalThis.alert?.('Fout bij status update');
  }
};

    // 📱 Notificatie helpers
const initServiceWorker = useCallback(async () => {
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready voor notificaties');
    } catch (e) {
      console.error('❌ Service Worker error:', e);
    }
  }
}, []);

const sendNotification = async (title: string, body: string, tag: string) => {
  if (!registration || !('showNotification' in registration)) {
    console.warn('⚠️ Geen Service Worker voor notificaties');
    return;
  }
  
  try {
    await registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag,
      data: { type: 'challenge' }
    });
    console.log(`📱 Notificatie verstuurd: ${title}`);
  } catch (e) {
    console.error('❌ Notificatie fout:', e);
  }
};

// 🔄 Haal users met notificatie toestemming (vereenvoudigd via users tabel)
const fetchNotifUsers = useCallback(async () => {
  try {
    const supabase = getSupabase();
    // Assumeer je hebt een 'notifications_enabled' boolean in users tabel (voeg toe als nodig)
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('notifications_enabled', true); // Voeg deze kolom toe in Supabase!
    
    const userIds = (data || []).map(u => u.id);
    setNotifUsers(userIds);
    console.log(`📊 ${userIds.length} users klaar voor notificaties`);
  } catch (e) {
    console.error('Notif users fetch error:', e);
  }
}, []);

// ⏰ Deadline checker interval
useEffect(() => {
  fetchNotifUsers();
  initServiceWorker();
  
  const interval = setInterval(async () => {
    const now = new Date();
    challenges.forEach(c => {
      if (c.deadline_date && c.active) {
        const deadline = new Date(c.deadline_date);
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours <= 1) {
          sendNotification(
            `🚨 URGENT: ${c.title}`,
            `Deadline over 1 uur! Doe je check-in nu.`,
            'challenge-deadline-urgent'
          );
        } else if (diffHours <= 24) {
          sendNotification(
            `⏰ ${c.title}`,
            `Deadline binnen 24 uur. Tijd om te checken!`,
            'challenge-deadline'
          );
        }
      }
    });
  }, 30 * 60 * 1000); // Elke 30 min checken
  
  return () => clearInterval(interval);
}, [challenges]);


    // 🗑️ Delete challenge
    const deleteChallenge = async (id: number) => {
      if (!globalThis.confirm?.('Weet je zeker dat je deze challenge wilt verwijderen?')) {
        return;
      }

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from('challenges')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await refreshAdminData();
      } catch (error: any) {
        console.error('Delete error:', error);
        globalThis.alert?.('Fout bij verwijderen');
      }
    };

    // 👥 User management functions
    const updateUser = async (userId: string) => {
      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from('users')
          .update({
            display_name: editDisplayName.trim() || null,
            admin: editAdminStatus,
          })
          .eq('id', userId);

        if (error) throw error;

        setEditingUser(null);
        setEditDisplayName('');
        setEditAdminStatus(false);
        await refreshAdminData();
      } catch (error: any) {
        console.error('Update user error:', error);
        globalThis.alert?.('Fout bij gebruikersupdate');
      }
    };

    const deleteUser = async (userId: string) => {
      if (!globalThis.confirm?.('GEBRUIKER VOLLEDIG VERWIJDEREN?')) {
        return;
      }

      try {
        const supabase = getSupabase();
        
        // Eerst checkins verwijderen
        await supabase.from('challenge_checkins').delete().eq('user_id', userId);
        // Dan gebruiker
        await supabase.from('users').delete().eq('id', userId);

        await refreshAdminData();
      } catch (error: any) {
        console.error('Delete user error:', error);
        globalThis.alert?.('Fout bij verwijderen gebruiker');
      }
    };

    // 🌍 Community challenge handlers
    const handleCommunityChallenge = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        const supabase = getSupabase();
        const { error } = await supabase.from('community_challenges').upsert({
          id: editingCommunityId ?? undefined,
          title: communityTitle.trim(),
          description: communityDescription.trim() || null,
          target_count: communityTarget,
          active: true,
        });

        if (error) throw error;

        // Reset form
        setEditingCommunityId(null);
        setCommunityTitle('');
        setCommunityDescription('');
        setCommunityTarget(100);
        
        await refreshAdminData();
      } catch (error: any) {
        console.error('Community challenge error:', error);
        globalThis.alert?.('Fout bij opslaan community challenge');
      }
    };
    // 🔄 Loading state
    if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center py-40 gap-4 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="animate-pulse space-y-4 text-center">
            <div className="animate-bounce text-[#55CDFC] text-3xl md:text-4xl font-black italic tracking-widest uppercase">
              Coach Access...
            </div>
            <div className="w-24 h-24 bg-gradient-to-r from-[#55CDFC] to-[#1C8ED9] rounded-3xl animate-pulse mx-auto" />
          </div>
        </div>
      );
    }

    // 🔐 Niet-admin redirect
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 lg:pb-16">
        {/* 📱 Header met stats - MOBIEL RESPONSIEF */}
        <header className="mb-8 md:mb-12 lg:mb-16 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-8">
          <div className="w-full lg:w-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-800 tracking-tight leading-tight">
              Coach Panel
            </h1>
            <p className="font-black text-[#55CDFC] uppercase tracking-[0.4em] text-[10px] md:text-xs mt-2 lg:mt-3">
              Beheer challenges & gebruikers
            </p>
          </div>

          {/* Stats cards - MOBIEL: 2 kolommen, DESKTOP: 3 kolommen */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full lg:w-auto">
            <div className="bg-white px-4 py-3 md:px-6 md:py-4 rounded-[1.5rem] lg:rounded-[2rem] border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                Challenges
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-800 mt-1">
                {challenges.length}
              </p>
            </div>
            
            <div className="bg-white px-4 py-3 md:px-6 md:py-4 rounded-[1.5rem] lg:rounded-[2rem] border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                Gebruikers
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-800 mt-1">
                {userSummaries.length}
              </p>
            </div>
            
            <div className="bg-white px-4 py-3 md:px-6 md:py-4 rounded-[1.5rem] lg:rounded-[2rem] border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                Checkins
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-800 mt-1">
                {totalCheckins}
              </p>
            </div>
          </div>
        </header>

        {/* 🧭 MOBILE VERTICAAL NAV - DESKTOP HORIZONTAAL + ORIGINELE STYLE */}
        <div className="w-full mb-8 lg:mb-12 max-w-full overflow-hidden">
          <div className="bg-white rounded-2xl lg:rounded-3xl p-1 shadow-sm border border-gray-200 flex flex-col lg:flex-row lg:divide-x divide-gray-200">
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex-1 py-3 px-3 lg:px-6 font-black uppercase text-xs lg:text-sm tracking-wider rounded-xl mx-0.5 lg:mx-0 transition-all text-center ${
                activeTab === 'challenges'
                  ? 'bg-gradient-to-r from-[#55CDFC] to-[#1C8ED9] text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              📋 Challenges
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex-1 py-3 px-3 lg:px-6 font-black uppercase text-xs lg:text-sm tracking-wider rounded-xl mx-0.5 lg:mx-0 transition-all text-center ${
                activeTab === 'community'
                  ? 'bg-gradient-to-r from-[#55CDFC] to-[#1C8ED9] text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              🌍 Community
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 px-3 lg:px-6 font-black uppercase text-xs lg:text-sm tracking-wider rounded-xl mx-0.5 lg:mx-0 transition-all text-center ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-[#55CDFC] to-[#1C8ED9] text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              👥 Gebruikers
            </button>
          </div>
        </div>

        {/* 📱 CHALLENGES - FORM BOVEN + ORIGINELE CARD STYLE MET RAINBOW */}
        {activeTab === 'challenges' && (
          <div className="space-y-6 lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-8 lg:space-y-0 w-full max-w-full">
            
            {/* 🆕 FORM BOVEN OP MOBIEL - ORIGINELE BLUE BOX */}
            <section className="w-full lg:order-2">
              <div className="bg-[#F1FBFF] rounded-3xl border-2 border-[#55CDFC] p-6 lg:p-8 shadow-sm hover:shadow-lg max-w-full">
                <div className="text-center space-y-2 mb-6">
                  <span className="text-3xl block">🆕</span>
                  <h2 className="font-black text-[#55CDFC] uppercase tracking-widest text-lg md:text-xl">Nieuwe Challenge</h2>
                  <p className="text-[10px] font-bold text-[#55CDFC]/70 uppercase tracking-widest">Creëer een nieuwe uitdaging</p>
                </div>
                <form onSubmit={handleAddChallenge} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest block">Titel</label>
                    <input type="text" placeholder="Bv. Squat To The Max" className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 font-bold text-sm focus:border-[#55CDFC]" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest">Startdatum</label>
                      <input type="date" className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-3 py-2.5 font-bold text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest">Deadline</label>
                      <input type="date" className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-3 py-2.5 font-bold text-sm" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest">Video URL</label>
                    <input type="url" placeholder="YouTube/Vimeo" className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-3 py-2.5 font-bold text-sm" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest">Beschrijving</label>
                    <textarea rows={3} placeholder="Wat moeten atleten doen?" className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-3 py-2.5 font-bold text-sm resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <button type="submit" disabled={!title.trim() || !startDate} className="w-full py-3.5 rounded-2xl font-black uppercase tracking-wide text-sm text-white bg-[#55CDFC] border-b-[4px] border-[#1C8ED9] hover:bg-[#1C8ED9] shadow-lg disabled:opacity-50">
                    OPSLAAN & PUBLICEREN
                  </button>
                </form>
              </div>
            </section>

            {/* 📋 BESTAANDE CHALLENGES - ONDER OP MOBIEL + RAINBOW + ORIGINELE STYLE */}
            <section className="w-full lg:order-1">
              <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-3 px-1 mb-6">
                <span className="text-xl">📋</span> Bestaande Challenges
              </h2>
              
              {challenges.length === 0 ? (
                <div className="bg-white p-10 text-center border-dashed border-2 border-gray-200 rounded-3xl">
                  <p className="font-black text-gray-400 uppercase text-xs tracking-widest">Nog geen challenges</p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[50vh] lg:max-h-none lg:space-y-6 overflow-y-auto">
                  {challenges.map((c) => (
                    <section key={c.id} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden max-w-full">
                      {/* 🌈 RAINBOW GRADIENT TOP BAR - ORIGINEEL! */}
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#55CDFC] via-[#58CC02] to-[#FFC800] rounded-t-3xl" />
                      
                      <div className="pt-4 px-5 pb-5 space-y-4 relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="bg-blue-50 text-[#55CDFC] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100">
                              Week {c.week}
                            </span>
                            <h3 className="font-black text-lg text-gray-800 tracking-tight flex-1 min-w-0 truncate">
                              {c.title}
                            </h3>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                            c.active ? 'bg-green-50 text-green-600 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'
                          }`}>
                            {c.active ? 'Actief' : 'Inactief'}
                          </span>
                        </div>

                        {c.description && (
                          <p className="text-gray-500 font-bold text-sm leading-relaxed italic break-words">
                            "{c.description}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-black text-gray-500">
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100">
                            <span className="text-green-500 text-lg font-bold">✓</span>
                            <span className="uppercase tracking-tighter">{stats[c.id] || 0} voltooid</span>
                          </div>
                          {c.start_date && (
                            <span className="bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100 uppercase tracking-widest text-xs">
                              Start: {new Date(c.start_date).toLocaleDateString('nl-NL')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                          {c.video_url && (
                            <a href={c.video_url} target="_blank" rel="noreferrer" className="text-[11px] font-black uppercase tracking-widest text-[#55CDFC] hover:text-[#1C8ED9]">
                              ▶ Video bekijken
                            </a>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleActive(c.id, c.active)}
                              className={`px-4 py-2 rounded-2xl font-black uppercase text-[10px] border-b-[4px] transition-all ${
                                c.active
                                  ? 'bg-[#58CC02] border-[#46A302] text-white hover:bg-[#46A302]'
                                  : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {c.active ? 'Pauze' : 'Actief'}
                            </button>
                            <button
                              onClick={() => deleteChallenge(c.id)}
                              className="px-3 py-2 rounded-2xl border-2 border-red-100 bg-red-50 text-red-400 hover:text-red-600 text-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}



        {/* Community + Users tabs */}
  {activeTab === 'community' && (
    <div className="space-y-6 lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-8 lg:space-y-0 w-full max-w-full">
      {/* 🌍 BESTAANDE COMMUNITY CHALLENGES - LINKERKANT MOBIEL/ONDER OP DESKTOP */}
      <section className="w-full lg:order-1">
        <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-3 px-1 mb-6">
          <span className="text-xl">🌍</span> Bestaande Community Challenges
        </h2>
        
        {communityChallenges.length === 0 ? (
          <div className="bg-white p-10 text-center border-dashed border-2 border-gray-200 rounded-3xl">
            <p className="font-black text-gray-400 uppercase text-xs tracking-widest">Nog geen community challenges</p>
          </div>
        ) : (
          <div className="space-y-5 max-h-[50vh] lg:max-h-none lg:space-y-6 overflow-y-auto">
            {communityChallenges.map((c) => (
              <section key={c.id} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden max-w-full">
                {/* 🌈 RAINBOW GRADIENT TOP BAR */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#55CDFC] via-[#58CC02] to-[#FFC800] rounded-t-3xl" />
                
                <div className="pt-4 px-5 pb-5 space-y-4 relative z-10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-blue-50 text-[#55CDFC] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100">
                        Community
                      </span>
                      <h3 className="font-black text-lg text-gray-800 tracking-tight flex-1 min-w-0 truncate">
                        {c.title}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      c.active ? 'bg-green-50 text-green-600 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'
                    }`}>
                      {c.active ? 'Actief' : 'Inactief'}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-gray-500 font-bold text-sm leading-relaxed italic break-words">
                      "{c.description}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-black text-gray-500">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100">
                      <span className="text-[#55CDFC] text-lg font-bold">🎯</span>
                      <span className="uppercase tracking-tighter">Target: {c.target_count}</span>
                    </div>
                    <span className="bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100 uppercase tracking-widest text-xs">
                      Gemaakt: {new Date(c.created_at).toLocaleDateString('nl-NL')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <div />
                    <div className="flex items-center gap-2">
                      {/* EDIT BUTTON - zet form in edit mode */}
                      <button
                        onClick={() => {
                          setEditingCommunityId(c.id);
                          setCommunityTitle(c.title);
                          setCommunityDescription(c.description || '');
                          setCommunityTarget(c.target_count || 100);
                        }}
                        className="px-4 py-2 rounded-2xl border-2 border-blue-100 bg-blue-50 text-blue-500 hover:text-blue-700 text-[10px] font-black uppercase tracking-wider"
                      >
                        ✏️ Bewerk
                      </button>
                      
                      {/* TOGGLE ACTIVE */}
                      <button
                        onClick={async () => {
                          try {
                            const supabase = getSupabase();
                            const { error } = await supabase
                              .from('community_challenges')
                              .update({ active: !c.active })
                              .eq('id', c.id);
                            if (error) throw error;
                            await refreshAdminData();
                          } catch (error: any) {
                            globalThis.alert?.('Fout bij status update');
                          }
                        }}
                        className={`px-4 py-2 rounded-2xl font-black uppercase text-[10px] border-b-[4px] transition-all ${
                          c.active
                            ? 'bg-[#58CC02] border-[#46A302] text-white hover:bg-[#46A302]'
                            : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {c.active ? 'Pauze' : 'Actief'}
                      </button>
                      
                      {/* DELETE */}
                      <button
                        onClick={async () => {
                          if (!globalThis.confirm?.('Weet je zeker dat je deze community challenge wilt verwijderen?')) {
                            return;
                          }
                          try {
                            const supabase = getSupabase();
                            const { error } = await supabase
                              .from('community_challenges')
                              .delete()
                              .eq('id', c.id);
                            if (error) throw error;
                            await refreshAdminData();
                          } catch (error: any) {
                            globalThis.alert?.('Fout bij verwijderen');
                          }
                        }}
                        className="px-3 py-2 rounded-2xl border-2 border-red-100 bg-red-50 text-red-400 hover:text-red-600 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
        </section>

          {/* 🆕 COMMUNITY CHALLENGE FORM - RECHTERKANT MOBIEL/BOVEN OP DESKTOP */}
          <section className="w-full lg:order-2">
            <div className="bg-[#F1FBFF] rounded-3xl border-2 border-[#55CDFC] p-6 lg:p-8 shadow-sm hover:shadow-lg max-w-full">
              <div className="text-center space-y-2 mb-6">
                <span className="text-3xl block">🆕</span>
                <h2 className="font-black text-[#55CDFC] uppercase tracking-widest text-lg md:text-xl">
                  {editingCommunityId ? 'Bewerk Community Challenge' : 'Nieuwe Community Challenge'}
                </h2>
                <p className="text-[10px] font-bold text-[#55CDFC]/70 uppercase tracking-widest">
                  {editingCommunityId ? 'Pas aan' : 'Creëer community uitdaging'}
                </p>
              </div>
              
              <form onSubmit={handleCommunityChallenge} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest block">Titel</label>
                  <input 
                    type="text" 
                    placeholder="Bv. 1000 Squats als team" 
                    className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 font-bold text-sm focus:border-[#55CDFC]" 
                    value={communityTitle} 
                    onChange={(e) => setCommunityTitle(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest block">Beschrijving</label>
                  <textarea 
                    rows={3} 
                    placeholder="Wat is de community challenge?" 
                    className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 font-bold text-sm resize-none focus:border-[#55CDFC]" 
                    value={communityDescription} 
                    onChange={(e) => setCommunityDescription(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#55CDFC] uppercase tracking-widest block">Doel (target)</label>
                  <input 
                    type="number" 
                    placeholder="100" 
                    className="w-full bg-white border-2 border-[#D0ECFF] rounded-2xl px-4 py-3 font-bold text-sm focus:border-[#55CDFC]" 
                    value={communityTarget} 
                    onChange={(e) => setCommunityTarget(Number(e.target.value))} 
                    min="1"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={!communityTitle.trim()} 
                  className="w-full py-3.5 rounded-2xl font-black uppercase tracking-wide text-sm text-white bg-[#55CDFC] border-b-[4px] border-[#1C8ED9] hover:bg-[#1C8ED9] shadow-lg disabled:opacity-50"
                >
                  {editingCommunityId ? 'UPDATE' : 'OPSLAAN'}
                </button>
                
                {editingCommunityId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommunityId(null);
                      setCommunityTitle('');
                      setCommunityDescription('');
                      setCommunityTarget(100);
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-700 bg-gray-100"
                  >
                    Annuleer bewerking
                  </button>
                )}
              </form>
            </div>
          </section>
        </div>
      )}

        {activeTab === 'users' && (
    <div className="space-y-6 lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-8 lg:space-y-0 w-full max-w-full">
      {/* 👥 BESTAANDE GEBRUIKERS - LINKS OP DESKTOP, BOVEN OP MOBIEL */}
      <section className="w-full lg:order-1">
        <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-3 px-1 mb-6">
          <span className="text-xl">👥</span> Alle Gebruikers
        </h2>
        
        {userSummaries.length === 0 ? (
          <div className="bg-white p-10 text-center border-dashed border-2 border-gray-200 rounded-3xl">
            <p className="font-black text-gray-400 uppercase text-xs tracking-widest">Nog geen gebruikers</p>
          </div>
        ) : (
          <div className="space-y-5 max-h-[50vh] lg:max-h-none lg:space-y-6 overflow-y-auto">
            {userSummaries.map((user) => (
              <section key={user.user_uuid} className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden max-w-full">
                {/* 🟠 ORANGE GRADIENT TOP BAR */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-400 via-yellow-400 to-pink-400 rounded-t-3xl" />
                
                <div className="pt-4 px-5 pb-5 space-y-4 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <span className="text-xl font-black text-gray-500">
                            {user.display_name?.[0]?.toUpperCase() || '👤'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-lg text-gray-800 truncate">
                          {user.display_name || 'Geen naam'}
                        </h3>
                        <p className="text-[11px] font-bold text-gray-500">
                          Aangemeld: {user.joined_date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 text-green-700 font-black text-[11px]">
                        {user.total_checkins} challenges
                      </div>
                      {user.is_admin && (
                        <div className="bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 font-black text-[11px]">
                          ADMIN
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-gray-600">
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border">
                      <div className="font-black text-gray-500 text-xs uppercase tracking-wider">Punten</div>
                      <div className="font-black text-xl text-gray-800">{user.total_points || 0}</div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border">
                      <div className="font-black text-gray-500 text-xs uppercase tracking-wider">Laatste</div>
                      <div className="font-bold text-sm truncate">{user.latest_challenge || 'Nog geen'}</div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border">
                      <div className="font-black text-gray-500 text-xs uppercase tracking-wider">Status</div>
                      <div className="font-black text-sm">{user.is_admin ? 'Admin' : 'Gebruiker'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    {editingUser === user.user_uuid ? (
                      <div className="flex flex-wrap items-end gap-3 w-full">
                        <div className="flex-1 min-w-[160px] space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Naam</label>
                          <input
                            type="text"
                            placeholder="Nieuwe naam"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-2xl text-sm font-bold focus:border-[#55CDFC] focus:outline-none"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm font-bold py-2">
                          <input
                            type="checkbox"
                            checked={editAdminStatus}
                            onChange={(e) => setEditAdminStatus(e.target.checked)}
                            className="w-4 h-4 text-[#55CDFC] rounded"
                          />
                          <span>Admin</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateUser(user.user_uuid)}
                            className="px-4 py-2 bg-[#55CDFC] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-[#1C8ED9] shadow-sm"
                          >
                            ✅ Opslaan
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setEditDisplayName('');
                              setEditAdminStatus(false);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-300"
                          >
                            ❌ Annuleer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user.user_uuid);
                            setEditDisplayName(user.display_name || '');
                            setEditAdminStatus(user.is_admin);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 shadow-sm"
                        >
                          ✏️ Bewerk
                        </button>
                        <button
                          onClick={() => deleteUser(user.user_uuid)}
                          className="px-3 py-2 rounded-2xl border-2 border-red-100 bg-red-50 text-red-400 hover:text-red-600 text-sm shadow-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {/* 📊 GEBRUIKERS STATS - RECHTS OP DESKTOP, ONDER OP MOBIEL */}
      <section className="w-full lg:order-2">
        <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm text-center max-w-full">
          <div className="text-center space-y-2 mb-8">
            <span className="text-4xl block">📊</span>
            <h2 className="font-black text-gray-800 uppercase tracking-widest text-xl">Gebruikers Stats</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between py-4 border-b border-gray-100">
              <span className="font-bold text-gray-600 uppercase tracking-wider text-sm">Totaal gebruikers</span>
              <span className="font-black text-3xl text-gray-800">{userSummaries.length}</span>
            </div>
            <div className="flex justify-between py-4 border-b border-gray-100">
              <span className="font-bold text-gray-600 uppercase tracking-wider text-sm">Admins</span>
              <span className="font-black text-2xl text-[#55CDFC]">{adminCount}</span>
            </div>
            <div className="flex justify-between py-4 border-b border-gray-100">
              <span className="font-bold text-gray-600 uppercase tracking-wider text-sm">Totaal checkins</span>
              <span className="font-black text-2xl text-gray-800">{totalCheckins}</span>
            </div>
            <div className="flex justify-between py-4">
              <span className="font-bold text-gray-600 uppercase tracking-wider text-sm">Actieve gebruikers</span>
              <span className="font-black text-xl text-green-600">
                {userSummaries.filter(u => u.total_checkins > 0).length}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )}

      </div>
    );
  };

  export default AdminPage;
