import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase.ts';
import { Challenge, CheckIn } from '../types.ts';

type ChallengeWithStatus = Challenge & {
  checkins: CheckIn[];
};

const useNotifications = () => {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notifications niet ondersteund');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as any);
    } catch (err) {
      console.error('Permission error:', err);
    }
  };

  const showTestNotification = () => {
    if (permission !== 'granted') {
      alert('Eerst toestemming!');
      return;
    }
    new Notification('🔔 Test Reminder!', {
      body: 'Dit is een test notificatie!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'reminder-test',
    });
  };

  return { permission, requestPermission, showTestNotification };
};

const HomePage: React.FC = () => {
  const [challenges, setChallenges] = useState<ChallengeWithStatus[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Record<number, string>>({});
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { permission, requestPermission, showTestNotification } = useNotifications();

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setChallenges([]);
        setLoading(false);
        return;
      }

      // Rest van je fetch logic...
      const { data: activeChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('active', true)
        .order('week', { ascending: false });

      setChallenges(activeChallenges || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Kon challenges niet laden');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-800 font-bold">{error}</p>
          <p className="text-sm text-red-600 mt-1">Check .env vars en restart</p>
        </div>
      )}

      {/* Notification test buttons */}
      <section className="bg-white rounded-3xl p-8 duo-card shadow-sm border-2 border-gray-100">
        <h3 className="text-xl font-black text-gray-800 mb-4 uppercase tracking-tight flex items-center gap-3">
          🔔 Reminder Test
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={requestPermission}
            className="px-6 py-3 rounded-2xl bg-gray-200 text-gray-800 font-black uppercase tracking-wider text-sm hover:bg-gray-300"
          >
            {permission === 'default' && 'Vraag toestemming'}
            {permission === 'granted' && '✅ Toestemming OK'}
            {permission === 'denied' && '❌ Toestemming geweigerd'}
          </button>
          {permission === 'granted' && (
            <button
              onClick={showTestNotification}
              className="px-8 py-3 rounded-2xl bg-[#55CDFC] text-white font-black uppercase tracking-wider text-sm hover:bg-[#3cb3df]"
            >
              🚀 Test Notificatie
            </button>
          )}
        </div>
      </section>

      {/* Rest van je challenges UI hier... (same as before) */}
      <div>No challenges loaded yet</div>
    </div>
  );
};

export default HomePage;