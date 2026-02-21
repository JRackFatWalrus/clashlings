import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function createClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // During static build (prerender), env vars may not exist.
    // Return a dummy proxy that won't crash but won't work either.
    return new Proxy({} as SupabaseClient, {
      get: (_target, prop) => {
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithOAuth: async () => ({ data: null, error: new Error('Not configured') }),
            signOut: async () => ({ error: null }),
            exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
          };
        }
        if (prop === 'from') return () => ({ select: () => ({ data: null, error: null }) });
        return () => {};
      },
    });
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
