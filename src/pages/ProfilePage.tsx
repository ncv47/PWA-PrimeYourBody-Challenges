import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from 'react';
import { getSupabase } from '../lib/supabase.ts';
import { UserProfile, Badge } from '../types.ts';

const AVATAR_BUCKET = 'avatars';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = getSupabase();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching auth user', userError);
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      // Profiel
      const { data: prof, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile', profileError);
      }

      const castProfile = (prof || null) as UserProfile | null;
      setProfile(castProfile);
      setDisplayName(castProfile?.display_name ?? '');
      setAvatarPreview(castProfile?.avatar_url ?? null);

      // Badges
      const { data: badgeData, error: badgeError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (badgeError) {
        console.error('Error fetching badges', badgeError);
      }

      const badgeList = (badgeData || []) as Badge[];
      setBadges(badgeList);
      setTotalPoints(
        badgeList.reduce((sum, item) => sum + (item.points ?? 0), 0)
      );

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);

    // Local preview (alleen in deze sessie)
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const toggleEdit = () => {
    if (!profile) return;

    if (!isEditing) {
      // Edit mode in: sync velden met huidige profieldata
      setDisplayName(profile.display_name ?? '');
      setAvatarPreview(profile.avatar_url ?? null);
      setAvatarFile(null);
    }
    setIsEditing((prev) => !prev);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    const supabase = getSupabase();
    let newAvatarUrl = profile.avatar_url ?? null;

    try {
      // 1) Upload avatar als er een nieuwe file is gekozen
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop() || 'png';
        const filePath = `${profile.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading avatar', uploadError);
          throw uploadError;
        }

        // Public URL ophalen en in DB opslaan
        const { data: publicUrlData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(filePath);

        newAvatarUrl = publicUrlData.publicUrl;
      }

      // 2) Profiel updaten
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          display_name: displayName || null,
          avatar_url: newAvatarUrl,
        })
        .eq('id', profile.id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Error updating profile', updateError);
        throw updateError;
      }

      const updatedProfile = updated as UserProfile;
      setProfile(updatedProfile);
      setAvatarPreview(updatedProfile.avatar_url ?? null);
      setAvatarFile(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
      // TODO: UI toast tonen
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 font-black text-[#55CDFC] uppercase">
        Profiel laden...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="font-black text-gray-700 mb-4">
          Geen profiel gevonden.
        </p>
        <p className="text-sm text-gray-500">
          Log opnieuw in of neem contact op met je coach.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-[800px] mx-auto">
      {/* Profiel + edit toggle */}
      <section className="bg-white rounded-3xl p-10 duo-card relative flex flex-col items-center text-center">
        {/* Edit button rechtsboven */}
        <button
          type="button"
          onClick={toggleEdit}
          className="absolute top-4 right-4 text-xs font-black uppercase tracking-[0.18em] px-3 py-2 rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100"
        >
          {isEditing ? 'Annuleren' : 'Profiel wijzigen'}
        </button>

        <div className="relative mb-6 mt-4">
          <div className="w-32 h-32 bg-blue-50 rounded-3xl flex items-center justify-center border-4 border-blue-100 shadow-sm overflow-hidden">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profiel foto"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl">👤</span>
            )}
          </div>

          {isEditing && (
            <label className="absolute -bottom-3 right-0 bg-white border-2 border-blue-200 rounded-2xl px-3 py-1 text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm">
              Foto wijzigen
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <form
          onSubmit={handleSave}
          className="w-full max-w-xs flex flex-col items-center gap-4"
        >
          {isEditing ? (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jouw naam"
              className="w-full text-center border-2 border-gray-200 rounded-2xl px-4 py-2 font-black text-gray-800 focus:outline-none focus:border-[#55CDFC]"
            />
          ) : (
            <h1 className="text-4xl font-black text-gray-800 tracking-tight">
              {profile.display_name || 'Sporter'}
            </h1>
          )}

          <p className="text-[#55CDFC] font-black uppercase tracking-[0.2em] text-xs">
            {profile.admin ? 'Coach Status' : 'Atleet'}
          </p>

          <div className="mt-4 flex gap-12">
            <div className="text-center">
              <p className="text-3xl font-black text-gray-800">
                {totalPoints}
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                Punten
              </p>
            </div>

            <div className="w-px bg-gray-100 self-stretch" />

            <div className="text-center">
              <p className="text-3xl font-black text-gray-800">
                {badges.length}
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                Badges
              </p>
            </div>
          </div>

          {isEditing && (
            <button
              type="submit"
              disabled={saving}
              className="mt-6 px-6 py-2 rounded-2xl bg-[#55CDFC] text-white font-black uppercase text-xs tracking-[0.2em] hover:bg-[#3cb3df] disabled:opacity-60"
            >
              {saving ? 'Opslaan...' : 'Profiel opslaan'}
            </button>
          )}
        </form>
      </section>

      {/* Badges sectie blijft hetzelfde */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <span className="text-2xl">🏅</span>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
            Mijn Badges
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {badges.length > 0 ? (
            badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-3xl p-8 duo-card flex flex-col items-center text-center group hover:scale-[1.05] transition-all"
              >
                <div className="text-5xl mb-4 transform group-hover:rotate-12 transition-transform">
                  💎
                </div>
                <h4 className="font-black text-gray-800 text-sm leading-tight uppercase tracking-tighter">
                  {badge.badge_name === 'month_4x'
                    ? 'Maand Kampioen'
                    : badge.badge_name}
                </h4>
                <p className="text-[10px] font-black text-[#55CDFC] uppercase mt-3 tracking-widest">
                  +{badge.points} XP
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">
                Begin een challenge om je
                <br />
                eerste badge te verdienen!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
