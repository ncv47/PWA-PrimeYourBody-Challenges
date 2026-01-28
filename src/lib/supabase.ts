import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.REACT_APP_SUPABASE_URL;
  const anon = process.env.REACT_APP_SUPABASE_ANON_KEY;

    console.log('SUPABASE_URL loaded?', !!process.env.REACT_APP_SUPABASE_URL);
    console.log('SUPABASE_ANON loaded?', !!process.env.REACT_APP_SUPABASE_ANON_KEY);

  if (!url || !anon) {
    throw new Error(
      'Missing env vars: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY. Put them in .env at project root and restart npm start.'
    );
  }

  client = createClient(url, anon);
  return client;
}
