import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from 'react';
import { getSupabase, getUserBadges } from '../lib/supabase.ts';
import { UserProfile } from '../types.ts';

const AVATAR_BUCKET = 'avatars';

/* =========================
   Badge display mapping
========================= */

type UserBadge = {
  id: number;
  badge_key: string;
  earned_at: string;
};

const BADGE_META: Record<
  string,
  { title: string; icon: string }
> = {
  challenge_completed_key: {
    title: 'Challenge Voltooid',
    icon: '🏅',
  },
  lifetime_10: {
    title: 'Doorzetter',
    icon: '🔥',
  },
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
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

      if (userError || !user) {
        setLoading(false);
        return;
      }

      const { data: prof } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const castProfile = (prof || null) as UserProfile | null;
      setProfile(castProfile);
      setDisplayName(castProfile?.display_name ?? '');
      setAvatarPreview(castProfile?.avatar_url ?? null);

      const badgeData = await getUserBadges();
      setBadges(badgeData as UserBadge[]);

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const toggleEdit = () => {
    if (!profile) return;

    if (!isEditing) {
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
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'png';
        const path = `${profile.id}.${ext}`;

        await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(path, avatarFile, { upsert: true });

        const { data } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(path);

        newAvatarUrl = data.publicUrl;
      }

      const { data: updated } = await supabase
        .from('users')
        .update({
          display_name: displayName || null,
          avatar_url: newAvatarUrl,
        })
        .eq('id', profile.id)
        .select()
        .maybeSingle();

      setProfile(updated as UserProfile);
      setAvatarPreview(updated?.avatar_url ?? null);
      setAvatarFile(null);
      setIsEditing(false);
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
        <p className="font-black text-gray-700">
          Geen profiel gevonden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-[800px] mx-auto">

      {/* Profile card */}
      <section className="bg-white rounded-3xl p-10 duo-card relative flex flex-col items-center text-center">
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
                alt="Avatar"
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
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-center border-2 border-gray-200 rounded-2xl px-4 py-2 font-black"
            />
          ) : (
            <h1 className="text-4xl font-black">
              {profile.display_name || 'Sporter'}
            </h1>
          )}

          <p className="text-[#55CDFC] font-black uppercase tracking-[0.2em] text-xs">
            {profile.admin ? 'Coach Status' : 'Atleet'}
          </p>

          <div className="mt-4 text-center">
            <p className="text-3xl font-black">{badges.length}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Badges
            </p>
          </div>

          {isEditing && (
            <button
              type="submit"
              disabled={saving}
              className="mt-6 px-6 py-2 rounded-2xl bg-[#55CDFC] text-white font-black uppercase text-xs tracking-[0.2em]"
            >
              {saving ? 'Opslaan...' : 'Profiel opslaan'}
            </button>
          )}
        </form>
      </section>

      {/* Badges */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <span className="text-2xl">🏅</span>
          <h2 className="text-xl font-black uppercase">
            Mijn Badges
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {badges.length > 0 ? (
            badges.map((badge) => {
              const meta =
                BADGE_META[badge.badge_key] ?? {
                  title: badge.badge_key,
                  icon: '🎖️',
                };

              return (
                <div
                  key={badge.id}
                  className="bg-white rounded-3xl p-8 duo-card flex flex-col items-center text-center"
                >
                  <div className="text-5xl mb-4">
                    {meta.icon}
                  </div>
                  <h4 className="font-black text-sm uppercase">
                    {meta.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(badge.earned_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">
                Begin een challenge om je eerste badge te verdienen!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
