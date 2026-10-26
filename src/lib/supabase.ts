import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID =
  (import.meta.env?.VITE_SUPABASE_PROJECT_ID as string) || 'vlymkuvaswvvwsogownq';
export const SUPABASE_URL =
  (import.meta.env?.VITE_SUPABASE_URL as string) || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_WJWlcvnbJZBKaaic-Dkylw_j_39nSpW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
