import { createBrowserClient } from '@supabase/ssr';
import { hasSupabaseCreds } from './mockDb';

export const createClient = () => {
  if (!hasSupabaseCreds()) {
    // Return null or a mock client if credentials are not configured
    return null as any;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
