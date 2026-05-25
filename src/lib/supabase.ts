// ============================================================
// Supabase Configuration — GenZ IITian Connect
// Browser client uses anon key + user session (RLS enforced).
// Server client (service role) bypasses RLS — only use server-side.
// ============================================================
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getServerSupabase(cookieStore: {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: CookieOptions): void;
}) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // ignore — called from Server Component
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        } catch {
          // ignore
        }
      },
    },
  });
}

export function getServiceRoleSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
