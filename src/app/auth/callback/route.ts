// ============================================================
// OAuth callback — exchanges Supabase auth code for a session cookie
// then routes the user based on profile completion.
// ============================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  // Build a URL that respects the public-facing host (Nginx forwards via X-Forwarded-*)
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'http';
  const incoming = new URL(req.url);
  const url = forwardedHost
    ? new URL(`${forwardedProto}://${forwardedHost}${incoming.pathname}${incoming.search}`)
    : incoming;

  const code = url.searchParams.get('code');
  const explicitNext = url.searchParams.get('next');

  const cookieStore = cookies();
  const supabase = getServerSupabase(cookieStore);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession failed:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: code.slice(0, 8) + '...',
        host: req.headers.get('host'),
        proto: req.headers.get('x-forwarded-proto'),
      });
      return NextResponse.redirect(
        new URL(`/auth/login?error=oauth&reason=${encodeURIComponent(error.message)}`, url.origin)
      );
    }
  }

  // Decide where to send the user
  if (explicitNext) {
    return NextResponse.redirect(new URL(explicitNext, url.origin));
  }

  // Default: profile-complete → /dashboard, else → /auth/complete-profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', url.origin));
  }

  const { data: profile } = await supabase
    .from('users')
    .select('profile_complete')
    .eq('id', user.id)
    .maybeSingle<{ profile_complete: boolean }>();

  const target = profile?.profile_complete ? '/dashboard' : '/auth/complete-profile';
  return NextResponse.redirect(new URL(target, url.origin));
}
