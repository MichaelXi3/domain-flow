import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;
let ssrBrowserInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Get or create Supabase client instance (legacy, uses localStorage)
 * Returns null if env vars are not configured (allows offline-only usage)
 * 
 * NOTE: This is kept for backward compatibility with database operations.
 * For auth operations, use getSupabaseBrowserClient() which stores auth in cookies.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Running in offline-only mode.');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't persist in localStorage
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseInstance;
};

/**
 * Get or create SSR-compatible Supabase browser client (singleton)
 * Stores auth state in cookies instead of localStorage
 * This is the recommended approach for Next.js App Router
 */
export const getSupabaseBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Running in offline-only mode.');
    return null;
  }

  if (!ssrBrowserInstance) {
    ssrBrowserInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return ssrBrowserInstance;
};

/**
 * Check if Supabase is configured and available
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

/**
 * Get current authenticated user
 * Uses SSR-compatible client to read auth from cookies
 */
export const getCurrentUser = async () => {
  // Use SSR client to properly read session from cookies
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Sign in with Google OAuth
 * Uses SSR-compatible client that stores code_verifier in cookies
 */
export const signInWithGoogle = async () => {
  // Use SSR browser client for OAuth flow
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // CRITICAL: Redirect to a client-side callback page where PKCE exchange happens
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
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
 * Uses SSR-compatible client to clear auth from cookies
 */
export const signOut = async () => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Listen to auth state changes
 * Uses SSR-compatible client to monitor session changes in cookies
 */
export const onAuthStateChange = (callback: (userId: string | null) => void) => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    callback(session?.user?.id || null);
  });

  return () => {
    subscription.unsubscribe();
  };
};
