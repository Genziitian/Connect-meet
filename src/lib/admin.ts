// ============================================================
// Admin helpers — server-side guards for /admin routes
// ============================================================
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSupabase, getServiceRoleSupabase } from '@/lib/supabase';

/**
 * Returns the current admin user, or redirects to /auth/login if not signed in
 * or to /dashboard if signed in but not an admin.
 */
export async function requireAdmin() {
  const cookieStore = cookies();
  const supabase = getServerSupabase(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/admin');
  }

  // role is stored in public.users
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, role, display_name')
    .eq('id', user.id)
    .maybeSingle<{ id: string; email: string; role: string; display_name: string | null }>();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return profile;
}

export async function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const allowed = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/**
 * Service-role queries for the admin dashboard.
 * Use ONLY in server contexts (route handlers / server components).
 */
export function getAdminDb() {
  return getServiceRoleSupabase();
}
