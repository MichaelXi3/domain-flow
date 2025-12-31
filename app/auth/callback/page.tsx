'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Use SSR-compatible browser client that stores auth in cookies
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError('Supabase not configured');
        return;
      }

      try {
        // Get the code from URL params
        const code = new URL(window.location.href).searchParams.get('code');
        
        if (!code) {
          setError('No authorization code found');
          return;
        }

        // Exchange the code for a session
        // @supabase/ssr stores code_verifier in cookies, not localStorage
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('PKCE exchange error:', exchangeError);
          setError(exchangeError.message);
          return;
        }

        // Success! Redirect to home
        router.push('/');
        router.refresh(); // Refresh to update server components with new session
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

