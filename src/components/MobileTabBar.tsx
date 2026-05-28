'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Home, Zap, MessageSquare, Hash, Users } from 'lucide-react';

const TABS = [
  { href: '/dashboard',     label: 'Home',    icon: Home,          match: ['/dashboard'] },
  { href: '/feed',          label: 'Feed',    icon: MessageSquare, match: ['/feed'] },
  { href: '/connect/start', label: 'Connect', icon: Zap,           primary: true, match: ['/connect'] },
  { href: '/spaces',        label: 'Spaces',  icon: Hash,          match: ['/spaces', '/communities', '/community'] },
  { href: '/friends',       label: 'Friends', icon: Users,         match: ['/friends'], badge: true },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);

  // Subscribe to friends activity for the badge
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Incoming friend requests + unread DMs
      const [{ count: reqCount }, { data: friends }] = await Promise.all([
        supabase
          .from('friendships')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('status', 'pending'),
        supabase
          .from('v_my_friends')
          .select('unread_count')
          .eq('status', 'accepted'),
      ]);
      const dmUnread = (friends || []).reduce(
        (s: number, f: { unread_count: number }) => s + (f.unread_count || 0),
        0
      );
      setUnread((reqCount ?? 0) + dmUnread);
    };
    load();

    const channel = supabase
      .channel(`tabbar-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!isAuthenticated) return null;
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) return null;
  if (pathname.startsWith('/community/') && pathname.split('/').length > 2) return null;
  if (pathname.startsWith('/friends/') && pathname.split('/').length > 2) return null;
  if (pathname === '/connect') return null;
  if (pathname.startsWith('/feed/') && pathname.split('/').length > 2 && pathname !== '/feed/new') return null;
  if (pathname.startsWith('/communities/') && pathname.split('/').length > 2 && pathname !== '/communities/new') return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-[#111] bg-white flex justify-around items-end px-3 pt-2 pb-4">
      {TABS.map((t, i) => {
        const active = t.match.some((m) => pathname.startsWith(m));
        const Icon = t.icon;
        if (t.primary) {
          return (
            <Link
              key={i}
              href={t.href}
              className="flex h-14 w-14 -mt-5 items-center justify-center rounded-full border-[3px] border-[#111] bg-[#00D09C] text-white shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        }
        return (
          <Link
            key={i}
            href={t.href}
            className={`relative flex flex-col items-center gap-0.5 text-[10px] font-black ${
              active ? 'text-[#111]' : 'text-[#888]'
            }`}
          >
            <Icon className="h-5 w-5" />
            {t.label}
            {t.badge && unread > 0 && (
              <span className="absolute -top-1 -right-2 rounded-full bg-[#FF3B3B] text-white text-[9px] font-black border border-[#111] px-1.5 min-w-[16px] text-center leading-4">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
