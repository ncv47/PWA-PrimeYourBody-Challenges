import React, { useEffect, useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { getSupabase } from './lib/supabase.ts';

import LoginPage from './pages/LoginPage.tsx';
import HomePage from './pages/HomePage.tsx';
import CommunityPage from './pages/CommunityPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import AdminPage from './pages/AdminPage.tsx';

console.log(process.env);

const App: React.FC = () => {
  return (
    <Router>
      <AppInner />
    </Router>
  );
};

const AppInner: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = async (userId: string) => {
    const supabase = getSupabase();
    const { data } = await supabase.from('users').select('admin').eq('id', userId).maybeSingle();
    setIsAdmin(!!data?.admin);
  };

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) checkAdmin(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-pulse text-[#55CDFC] text-4xl font-black italic">
          PRIME YOUR BODY...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {session && <Sidebar isAdmin={isAdmin} />}

      <main className={`flex-grow flex justify-center w-full ${session ? 'pb-24 md:pb-10 md:pl-[320px]' : ''}`}>
        <div className="w-full max-w-[1400px] px-4 md:px-10 py-10">
          <Routes>
            <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/" element={session ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/community" element={session ? <CommunityPage /> : <Navigate to="/login" />} />
            <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/admin" element={session && isAdmin ? <AdminPage /> : <Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {session && <BottomNav isAdmin={isAdmin} />}
    </div>
  );
};

const Sidebar: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[320px] border-r-2 border-gray-200 p-8 bg-white z-50">
      <div className="mb-16 px-4">
        <h1 className="text-[#55CDFC] text-3xl font-black tracking-tighter uppercase leading-none">
          Prime Your<br /><span className="text-gray-800">Body</span>
        </h1>
      </div>

      <nav className="flex flex-col gap-4 flex-grow">
        <SidebarLink to="/" label="Challenges" icon="🎯" />
        <SidebarLink to="/community" label="Community" icon="👥" />
        <SidebarLink to="/profile" label="Profiel" icon="👤" />
        {isAdmin && <SidebarLink to="/admin" label="Coach Panel" icon="⚙️" />}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto p-4 text-[#AFAFAF] font-black uppercase text-xs hover:text-red-500 rounded-2xl hover:bg-red-50 text-left transition-all"
      >
        🚪 Uitloggen
      </button>
    </aside>
  );
};

const SidebarLink: React.FC<{ to: string; label: string; icon: string }> = ({ to, label, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-5 px-8 py-5 rounded-[24px] font-black uppercase tracking-[0.15em] text-sm transition-all border-2 ${
        isActive
          ? 'nav-item-active shadow-sm'
          : 'text-[#777777] border-transparent hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      {label}
    </Link>
  );
};

const BottomNav: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-gray-200 flex items-center justify-around px-2 z-50">
      <BottomLink to="/" icon="🎯" />
      <BottomLink to="/community" icon="👥" />
      <BottomLink to="/profile" icon="👤" />
      {isAdmin && <BottomLink to="/admin" icon="⚙️" />}
    </nav>
  );
};

const BottomLink: React.FC<{ to: string; icon: string }> = ({ to, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all ${
        isActive ? 'nav-item-active shadow-sm' : 'text-[#777777] border-transparent'
      }`}
    >
      <span className="text-2xl">{icon}</span>
    </Link>
  );
};

export default App;
