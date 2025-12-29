import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create Supabase client instance
 * Returns null if env vars are not configured (allows offline-only usage)
 */
export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Running in offline-only mode.');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  return supabaseInstance;
};

/**
 * Check if Supabase is configured and available
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Sign out
 */
export const signOut = async () => {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (userId: string | null) => void) => {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user?.id || null);
  });

  return () => {
    subscription.unsubscribe();
  };
};
