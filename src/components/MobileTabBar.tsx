'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Globe, Zap, Hash, Users } from 'lucide-react';

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: string[];
  primary?: boolean;
  comingSoon?: boolean;
};

const TABS: Tab[] = [
  { href: '/dashboard', label: 'Home', icon: Globe, match: ['/dashboard'] },
  { href: '/connect/start', label: 'Connect', icon: Zap, primary: true, match: ['/connect'] },
  { href: '/community', label: 'Rooms', icon: Hash, match: ['/community'] },
  { href: '#', label: 'Friends', icon: Users, match: [], comingSoon: true },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;
  // Hide on auth/login etc.
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) return null;
  // Hide while inside an active room (chat takes full height)
  if (pathname.startsWith('/community/') && pathname.split('/').length > 2) return null;
  // Hide during 1-on-1 connect chat (immersive video / text full screen)
  if (pathname === '/connect') return null;

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
        if (t.comingSoon) {
          return (
            <button
              key={i}
              type="button"
              disabled
              aria-label={`${t.label} — coming soon`}
              className="relative flex flex-col items-center gap-0.5 text-[10px] font-black text-[#bbb] cursor-not-allowed"
            >
              <Icon className="h-5 w-5" />
              {t.label}
              <span className="absolute -top-1.5 -right-3 rounded-full border border-[#111] bg-[#FBBF24] px-1 py-px text-[7px] font-black text-[#111] leading-none">
                SOON
              </span>
            </button>
          );
        }
        return (
          <Link
            key={i}
            href={t.href}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-black ${
              active ? 'text-[#111]' : 'text-[#888]'
            }`}
          >
            <Icon className="h-5 w-5" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
