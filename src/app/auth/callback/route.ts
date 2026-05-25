// ============================================================
// OAuth callback — exchanges Supabase auth code for a session cookie
// then routes the user based on profile completion.
// ============================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const explicitNext = url.searchParams.get('next');

  const cookieStore = cookies();
  const supabase = getServerSupabase(cookieStore);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL('/auth/login?error=oauth', url.origin));
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
