import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.REACT_APP_SUPABASE_URL;
  const anon = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      'Missing env vars: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY'
    );
  }

  client = createClient(url, anon);
  return client;
}

/* =========================
   Challenge completion
========================= */

export async function completeChallenge(
  challengeId: number,
  level: string
) {
  const supabase = getSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('challenge_completions') // ✅ CORRECT TABLE
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      level,
      completed_at: new Date().toISOString(),
    });

  if (error) throw error;
}


export async function uncompleteChallenge(challengeId: number) {
  const supabase = getSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw authError;

  const { error } = await supabase
    .from('challenge_completions')
    .delete()
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getMyCompletedChallengeIds(): Promise<number[]> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('challenge_completions')
    .select('challenge_id')
    .eq('user_id', user.id);

  if (error) throw error;

  return (data ?? []).map((r: any) => r.challenge_id);
}

/* =========================
   Progress & badges
========================= */

function monthStartISO(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function nextMonthStartISO(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
}

export async function getMonthlyProgress(): Promise<number> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from('challenge_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('completed_at', monthStartISO())
    .lt('completed_at', nextMonthStartISO());

  if (error) throw error;

  return Math.min(count ?? 0, 4);
}


export async function getLifetimeProgress(): Promise<number> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from('challenge_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) throw error;

  return count ?? 0;
}

export async function getUserBadges() {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}
