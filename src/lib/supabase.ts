import { createClient } from '@/lib/supabase/client';

export const supabase = createClient();

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return url.length > 0 && key.length > 0;
}
